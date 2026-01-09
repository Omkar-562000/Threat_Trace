import hashlib
import difflib
import uuid
from datetime import datetime
from pathlib import Path
import threading
from typing import List, Optional, Dict, Any

from utils.email_alerts import send_tamper_email

# Prevent race-condition for same file path scan
file_lock = threading.Lock()

# Limits
MAX_SNAPSHOT_LINES = 2000
MAX_DIFF_LINES = 200
HASH_READ_CHUNK = 4 * 1024 * 1024  # 4MB


# ============================================================
# SHA256 STREAMING HASH
# ============================================================
def _streaming_sha256(file_path: str) -> Optional[str]:
    try:
        h = hashlib.sha256()
        with open(file_path, "rb") as fh:
            while True:
                chunk = fh.read(HASH_READ_CHUNK)
                if not chunk:
                    break
                h.update(chunk)
        return h.hexdigest()
    except Exception:
        return None


# ============================================================
# SAFE READ FILE LINES
# ============================================================
def read_file_lines(path: str, max_lines: Optional[int] = None) -> List[str]:
    lines = []
    p = Path(path)
    with p.open("r", encoding="utf-8", errors="ignore") as f:
        for i, line in enumerate(f):
            lines.append(line.rstrip("\n"))
            if max_lines and i + 1 >= max_lines:
                break
    return lines


# ============================================================
# REPORT ID GENERATOR
# ============================================================
def make_report_id() -> str:
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    short = uuid.uuid4().hex[:8]
    return f"TT-AUDIT-{ts}-{short}"


# ============================================================
# UNIFIED DIFF (TRIMMED)
# ============================================================
def compute_diff(prev: List[str], new: List[str], limit=MAX_DIFF_LINES) -> List[str]:
    diff = list(difflib.unified_diff(prev, new, lineterm=""))
    if len(diff) > limit:
        return diff[:limit] + ["...(diff truncated)"]
    return diff


# ============================================================
# RISK SCORE
# ============================================================
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


# ============================================================
# RECOMMENDATIONS ENGINE
# ============================================================
def generate_recommendations(status: str, risk: str):
    rec = []

    if status == "new":
        rec.append("Baseline snapshot recorded on first scan.")

    if status == "tampered":
        rec.append("Inspect system for unauthorized modifications.")
        rec.append("Review system logs near modification timestamp.")
        rec.append("Check entropy spikes indicating possible ransomware.")

    if risk in ("HIGH", "CRITICAL"):
        rec.append("Create a full forensic backup immediately.")

    rec.append("Maintain immutable audit logs for safety.")

    return rec


# ============================================================
# CREATE AUDIT REPORT (CORE LOGIC)
# ============================================================
def create_audit_report(path: str, prev_snapshot: Optional[Dict[str, Any]] = None):
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"File does not exist: {path}")

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
        message = "Initial baseline created."
    elif prev_hash == new_hash:
        status = "clean"
        message = "No changes detected."
    else:
        status = "tampered"
        message = "File content changed."

        diffs = compute_diff(old_lines, new_lines)
        diff_summary = diffs
        added = sum(1 for l in diffs if l.startswith("+") and not l.startswith("+++"))
        removed = sum(1 for l in diffs if l.startswith("-") and not l.startswith("---"))

    tampered = status == "tampered"
    risk_level, risk_score = risk_score_from_digest(tampered, added, removed, file_size)

    report = {
        "report_id": make_report_id(),
        "file_path": str(p.resolve()),

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

        "recommendations": generate_recommendations(status, risk_level),

        "file_size": file_size,
        "snapshot_lines": new_lines,

        "generated_at": datetime.utcnow().isoformat() + "Z",
    }

    return report


# ============================================================
# MAIN ENTRY FOR BLUEPRINT
# ============================================================
def verify_file_integrity(file_path: str, db, sio=None):
    with file_lock:
        coll = db["audit_logs"]

        abs_path = str(Path(file_path).resolve())
        existing = coll.find_one({"file_path": abs_path})

        prev_snapshot = None
        if existing:
            prev_snapshot = {
                "last_hash": existing.get("last_hash"),
                "snapshot": existing.get("snapshot_lines", [])[:MAX_SNAPSHOT_LINES],
            }

        try:
            report = create_audit_report(abs_path, prev_snapshot)
        except FileNotFoundError:
            return {"status": "error", "message": "File not found", "file_path": abs_path}

        now = datetime.utcnow()
        now_iso = now.isoformat() + "Z"
        snapshot_trimmed = report["snapshot_lines"][:MAX_SNAPSHOT_LINES]

        # ----------------------------------------------------
        # DB UPDATE / INSERT
        # ----------------------------------------------------
        if report["status"] == "new":
            coll.insert_one({
                "file_path": abs_path,
                "last_hash": report["last_hash"],
                "last_verified": now,
                "last_verified_iso": now_iso,
                "tampered": False,
                "snapshot_lines": snapshot_trimmed,
                "file_size": report["file_size"],
                "history": [],
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
                            "hash": report["last_hash"],
                        }
                    }
                },
                upsert=True,
            )

        # ----------------------------------------------------
        # REAL-TIME ALERT VIA WEBSOCKET
        # ----------------------------------------------------
        if report["tampered"] and sio:
            try:
                sio.emit(
                    "tamper_alert",
                    {
                        "file_path": abs_path,
                        "hash": report["last_hash"],
                        "timestamp": now_iso,
                        "severity": report["risk_level"],
                        "risk_score": report["risk_score"],
                    },
                )
            except Exception as e:
                print("⚠ Socket emit failed:", e)

        # ----------------------------------------------------
        # EMAIL ALERT
        # ----------------------------------------------------
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

        # ----------------------------------------------------
        # FINAL CLEAN OUTPUT FOR FRONTEND
        # ----------------------------------------------------
        out = dict(report)
        out["last_verified"] = now_iso
        out["snapshot_sample"] = snapshot_trimmed[:80]

        # Attach history (last 20 entries)
        try:
            doc = coll.find_one({"file_path": abs_path}, {"_id": 0, "history": 1})
            out["history"] = (doc.get("history") or [])[-20:]
        except:
            out["history"] = []

        return out
