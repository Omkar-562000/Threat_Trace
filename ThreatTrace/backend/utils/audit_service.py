# backend/utils/audit_service.py
import hashlib
import difflib
import uuid
from datetime import datetime
from pathlib import Path

MAX_SNAPSHOT_LINES = 2000  # number of lines to keep in snapshot to compute diffs
MAX_DIFF_LINES = 200       # limit diff shown in report

def compute_sha256_bytes(data: bytes) -> str:
    h = hashlib.sha256()
    h.update(data)
    return h.hexdigest()

def read_file_bytes(path: str, max_bytes: int = None) -> bytes:
    p = Path(path)
    with p.open("rb") as f:
        if max_bytes:
            return f.read(max_bytes)
        return f.read()

def read_file_lines(path: str, max_lines: int = None):
    out = []
    p = Path(path)
    with p.open("r", encoding="utf-8", errors="ignore") as fh:
        for i, line in enumerate(fh):
            out.append(line.rstrip("\n"))
            if max_lines and i + 1 >= max_lines:
                break
    return out

def make_report_id() -> str:
    # Human-friendly id: TT-AUDIT-YYYYMMDD-HHMMSS-<shortuuid>
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    short = uuid.uuid4().hex[:8]
    return f"TT-AUDIT-{ts}-{short}"

def compute_diff(prev_lines, new_lines, max_lines=MAX_DIFF_LINES):
    # use difflib unified diff and limit to max_lines
    diff_iter = difflib.unified_diff(prev_lines, new_lines, lineterm='')
    diff_list = list(diff_iter)
    if len(diff_list) > max_lines:
        return diff_list[:max_lines] + ["... (diff truncated)"]
    return diff_list

def risk_score_from_digest(tampered: bool, added: int, removed: int, file_size_bytes: int) -> (str, int):
    # rudimentary scoring — tune as needed
    score = 0
    if tampered:
        score += 50
    # more added/removed lines increases score
    score += min(30, (added + removed) // 5)
    # big files slightly increase score
    score += min(20, file_size_bytes // (1024 * 1024 * 10))  # 10MB steps
    if score >= 70:
        return "CRITICAL", score
    if score >= 40:
        return "HIGH", score
    if score >= 15:
        return "MEDIUM", score
    return "LOW", score

def create_audit_report(file_path: str, db_prev_snapshot: dict | None = None) -> dict:
    """
    Generates an audit report object.
    db_prev_snapshot: optional dict from previous report { 'snapshot': [...lines], 'last_hash': '...' }
    """

    p = Path(file_path)
    if not p.exists():
        raise FileNotFoundError(f"File not found: {file_path}")

    # read bytes for hash and metadata
    file_bytes = read_file_bytes(str(p))
    file_size = p.stat().st_size
    new_hash = compute_sha256_bytes(file_bytes)

    # read snapshot lines (limited)
    new_lines = read_file_lines(str(p), max_lines=MAX_SNAPSHOT_LINES)

    # determine previous snapshot/hash if provided
    prev_lines = None
    prev_hash = None
    if db_prev_snapshot:
        prev_hash = db_prev_snapshot.get("last_hash")
        prev_lines = db_prev_snapshot.get("snapshot", [])
    else:
        # none => first time
        prev_hash = None
        prev_lines = None

    tampered = False
    diff_summary = []
    added = 0
    removed = 0

    if prev_hash is None:
        status = "new"
        message = "File registered-first time (no previous snapshot)."
    else:
        if prev_hash == new_hash:
            status = "clean"
            message = "No tampering detected."
        else:
            status = "tampered"
            message = "File content has changed since last verification."
            tampered = True
            # compute diff if we have previous lines
            if prev_lines is not None:
                diffs = compute_diff(prev_lines, new_lines)
                # count added/removed lines roughly
                added = sum(1 for l in diffs if l.startswith("+") and not l.startswith("+++"))
                removed = sum(1 for l in diffs if l.startswith("-") and not l.startswith("---"))
                diff_summary = diffs
            else:
                # prev hash changed but no snapshot available
                diff_summary = ["No previous snapshot available to compute diff."]

    risk_level, score = risk_score_from_digest(tampered, added, removed, file_size)

    report = {
        "report_id": make_report_id(),
        "file_path": str(p.resolve()),
        "file_size": file_size,
        "status": status,
        "message": message,
        "last_hash": new_hash,
        "previous_hash": prev_hash,
        "tampered": tampered,
        "diff_summary": diff_summary,
        "added_lines": added,
        "removed_lines": removed,
        "risk_level": risk_level,
        "risk_score": score,
        "snapshot_lines": new_lines,   # snapshot to store in DB (truncated)
        "generated_at": datetime.utcnow().isoformat() + "Z",
        # recommendations based on findings
        "recommendations": generate_recommendations(status, risk_level, added, removed, file_size),
    }

    return report

def generate_recommendations(status, risk_level, added, removed, file_size):
    recs = []
    if status == "new":
        recs.append("This file was registered for the first time; keep snapshots for future comparisons.")
    if status == "tampered":
        recs.append("Investigate recent changes: check user/process that modified the file.")
        recs.append("Collect system logs and audit trails around the modification timestamp.")
        recs.append("Isolate the host and examine for ransomware/encryption signs.")
    if risk_level in ("CRITICAL", "HIGH"):
        recs.append("Perform a full forensic image backup of the machine before further changes.")
    recs.append("Maintain immutable backups of critical logs.")
    return recs

