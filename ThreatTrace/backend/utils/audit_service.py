import hashlib
import difflib
import uuid
from datetime import datetime
from pathlib import Path
import threading
from typing import List, Optional, Dict, Any

from utils.email_alerts import send_tamper_email

# Lock to prevent race-condition when scanning same file path
file_lock = threading.Lock()

# Tunable constants
MAX_SNAPSHOT_LINES = 2000
MAX_DIFF_LINES = 200
HASH_READ_CHUNK = 4 * 1024 * 1024  # 4MB streaming reads


# ------------------------------------------------------------
#  SHA256 STREAMING HASH
# ------------------------------------------------------------
def _streaming_sha256(file_path: str) -> Optional[str]:
    try:
        h = hashlib.sha256()
        with open(file_path, "rb") as fh:
            while True:
                data = fh.read(HASH_READ_CHUNK)
                if not data:
                    break
                h.update(data)
        return h.hexdigest()
    except Exception:
        return None


# ------------------------------------------------------------
#  READ FILE LINES (SAFE)
# ------------------------------------------------------------
def read_file_lines(path: str, max_lines: Optional[int] = None) -> List[str]:
    lines = []
    p = Path(path)
    with p.open("r", encoding="utf-8", errors="ignore") as f:
        for i, line in enumerate(f):
            lines.append(line.rstrip("\n"))
            if max_lines and i + 1 >= max_lines:
                break
    return lines


# ------------------------------------------------------------
#  REPORT ID GENERATOR
# ------------------------------------------------------------
def make_report_id() -> str:
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    short = uuid.uuid4().hex[:8]
    return f"TT-AUDIT-{ts}-{short}"


# ------------------------------------------------------------
#  UNIFIED DIFF GENERATOR
# ------------------------------------------------------------
def compute_diff(prev: List[str], new: List[str], limit=MAX_DIFF_LINES) -> List[str]:
    diff = list(difflib.unified_diff(prev, new, lineterm=""))
    if len(diff) > limit:
        return diff[:limit] + ["... (truncated)"]
    return diff


# ------------------------------------------------------------
#  RISK SCORING ALGORITHM
# ------------------------------------------------------------
def risk_score_from_digest(tampered: bool, added: int, removed: int, size: int):
    score = 0

    if tampered:
        score += 50

    score += min(30, (added + removed) // 5)
    score += min(20, size // (1024 * 1024 * 10))

    if score >= 70:
        return "CRITICAL", score
    if score >= 40:
        return "HIGH", score
    if score >= 15:
        return "MEDIUM", score
    return "LOW", score


# ------------------------------------------------------------
#  RECOMMENDATIONS ENGINE
# ------------------------------------------------------------
def generate_recommendations(status: str, risk: str):
    recs = []

    if status == "new":
        recs.append("File registered for first time — baseline snapshot stored.")

    if status == "tampered":
        recs.append("Investigate related system audit logs immediately.")
        recs.append("Check user/process activity around change timestamp.")
        recs.append("Review system logs for unauthorized access or malware.")

    if risk in ("CRITICAL", "HIGH"):
        recs.append("Perform a full forensic backup before further system modifications.")

    recs.append("Maintain immutable backups of audit logs.")
    return recs


# ------------------------------------------------------------
#  CORE FUNCTION: CREATE REPORT FOR CURRENT FILE STATE
# ------------------------------------------------------------
def create_audit_report(path: str, prev_snapshot: Optional[Dict[str, Any]] = None):
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"File not found: {path}")

    file_size = p.stat().st_size
    new_hash = _streaming_sha256(str(p))

    new_lines = read_file_lines(str(p), MAX_SNAPSHOT_LINES)

    prev_hash = None
    old_lines = None

    if prev_snapshot:
        prev_hash = prev_snapshot.get("last_hash")
        old_lines = prev_snapshot.get("snapshot", [])

    added = removed = 0
    diff_summary = []

    # Determine status
    if prev_hash is None:
        status = "new"
        message = "File scanned for the first time."
    elif prev_hash == new_hash:
        status = "clean"
        message = "No tampering detected."
    else:
        status = "tampered"
        message = "File content changed since last verification."

        diffs = compute_diff(old_lines, new_lines)
        diff_summary = diffs

        added = sum(1 for l in diffs if l.startswith("+") and not l.startswith("+++"))
        removed = sum(1 for l in diffs if l.startswith("-") and not l.startswith("---"))

    tampered = status == "tampered"

    risk_level, risk_score = risk_score_from_digest(tampered, added, removed, file_size)

    report = {
        "report_id": make_report_id(),
        "file_path": str(p.resolve()),
        "file_size": file_size,

        "status": status,
        "message": message,

        "last_hash": new_hash,
        "previous_hash": prev_hash,

        "tampered": tampered,
        "added_lines": added,
        "removed_lines": removed,

        "diff_summary": diff_summary,

        "risk_level": risk_level,
        "risk_score": risk_score,

        "generated_at": datetime.utcnow().isoformat() + "Z",
        "snapshot_lines": new_lines,

        "recommendations": generate_recommendations(status, risk_level),
    }

    return report


# ------------------------------------------------------------
#  MAIN ENTRY CALLED BY ROUTES
# ------------------------------------------------------------
def verify_file_integrity(file_path: str, db, sio=None):
    with file_lock:
        coll = db["audit_logs"]

        abs_path = str(Path(file_path).resolve())
        existing = coll.find_one({"file_path": abs_path})

        # reconstruct previous snapshot
        prev_snapshot = None
        if existing:
            prev_snapshot = {
                "last_hash": existing.get("last_hash"),
                "snapshot": existing.get("snapshot_lines", [])[:MAX_SNAPSHOT_LINES]
            }

        try:
            report = create_audit_report(abs_path, prev_snapshot)
        except FileNotFoundError:
            return {"status": "error", "message": "File not found", "file_path": abs_path}

        now = datetime.utcnow()
        now_iso = now.isoformat() + "Z"

        snapshot_trimmed = report["snapshot_lines"][:MAX_SNAPSHOT_LINES]

        # ------------------------------------
        # Store to DB
        # ------------------------------------
        if report["status"] == "new":
            coll.insert_one({
                "file_path": abs_path,
                "last_hash": report["last_hash"],
                "last_verified": now,
                "last_verified_iso": now_iso,
                "tampered": False,
                "snapshot_lines": snapshot_trimmed,
                "file_size": report["file_size"],
                "history": []
            })
        else:
            coll.update_one(
                {"file_path": abs_path},
                {
                    "$set": {
                        "last_hash": report["last_hash"],
                        "last_verified": now,
                        "last_verified_iso": now_iso,
                        "tampered": report["tampered"],
                        "snapshot_lines": snapshot_trimmed,
                        "file_size": report["file_size"],
                    },
                    "$push": {
                        "history": {
                            "timestamp_iso": now_iso,
                            "tampered": report["tampered"],
                            "hash": report["last_hash"]
                        }
                    }
                },
                upsert=True
            )

        # ------------------------------------
        # Emit real-time alert via Socket.io
        # ------------------------------------
        if report["tampered"] and sio:
            payload = {
                "file_path": abs_path,
                "hash": report["last_hash"],
                "timestamp": now_iso,
                "severity": report["risk_level"],
                "risk_score": report["risk_score"],
                "tampered": True
            }
            try:
                sio.emit("tamper_alert", payload, broadcast=True)
            except Exception as e:
                print("⚠ Socket emit failed:", e)

        # ------------------------------------
        # Send Email Alert (best effort)
        # ------------------------------------
        if report["tampered"]:
            try:
                send_tamper_email(
                    abs_path,
                    report["last_hash"],
                    now_iso,
                    severity=report["risk_level"]
                )
            except Exception as e:
                print("⚠ Email alert failed:", e)

        # ------------------------------------
        # Prepare return report (trim large sections)
        # ------------------------------------
        out = dict(report)
        out["last_verified"] = now_iso
        out["snapshot_sample"] = snapshot_trimmed[:80]

        # fetch last 20 history entries
        try:
            doc = coll.find_one({"file_path": abs_path}, {"_id": 0, "history": 1})
            out["history"] = doc.get("history", [])[-20:]
        except Exception:
            out["history"] = []

        return out
