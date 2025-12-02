from flask import Blueprint, request, jsonify, current_app
import os
import math
import uuid
from datetime import datetime
from pathlib import Path
from werkzeug.utils import secure_filename

from utils.alert_manager import send_alert

ransomware_bp = Blueprint("ransomware_bp", __name__)

# Upload directory (project-root/uploads)
UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed file types for scanning
ALLOWED_EXTENSIONS = {".exe", ".dll", ".bin", ".dat", ".txt", ".log", ".lock", ".enc"}
MAX_FILE_SIZE_MB = 50
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


# ---------------------------------------------------------
# ENTROPY CALCULATION (Shannon)
# ---------------------------------------------------------
def calculate_entropy(data: bytes) -> float:
    if not data:
        return 0.0
    # count occurrences
    freq = [0] * 256
    for b in data:
        freq[b] += 1
    entropy = 0.0
    length = len(data)
    for count in freq:
        if count == 0:
            continue
        p = count / length
        entropy -= p * math.log2(p)
    return entropy


# ---------------------------------------------------------
# SUSPICIOUS FILE ANALYZER
# ---------------------------------------------------------
def analyze_file_for_ransomware(file_path: str) -> dict:
    SUSPICIOUS_EXTENSIONS = {".lock", ".enc", ".crypt", ".ransom", ".encrypted"}

    result = {
        "path": file_path,
        "suspicious": False,
        "reason": [],
        "entropy": 0.0,
    }

    p = Path(file_path)
    if not p.exists():
        result["reason"].append("File not found")
        return result

    ext = p.suffix.lower()
    if ext in SUSPICIOUS_EXTENSIONS:
        result["suspicious"] = True
        result["reason"].append(f"Suspicious extension: {ext}")

    try:
        # read a sample window for entropy (first 64KB gives a good estimate)
        with p.open("rb") as fh:
            sample = fh.read(64 * 1024)
            entropy = calculate_entropy(sample)
            result["entropy"] = round(entropy, 3)
            if entropy >= 7.5:
                result["suspicious"] = True
                result["reason"].append("High entropy (looks encrypted)")
    except Exception as e:
        result["reason"].append(f"Read error: {str(e)}")

    return result


# ---------------------------------------------------------
# 1) PATH-BASED SCAN
# POST JSON: { "file_path": "/abs/path/to/file" }
# ---------------------------------------------------------
@ransomware_bp.route("/scan", methods=["POST"])
def scan_file_path():
    try:
        data = request.get_json(force=True, silent=True) or {}
        file_path = data.get("file_path") or data.get("path")

        if not file_path:
            return jsonify({"status": "error", "message": "file_path required"}), 400

        p = Path(file_path)
        if not p.exists():
            return jsonify({"status": "error", "message": "File not found"}), 404

        result = analyze_file_for_ransomware(str(p))

        # Save to DB (best-effort)
        try:
            db = current_app.config["DB"]
            db["ransomware_logs"].insert_one({
                "path": result["path"],
                "entropy": result["entropy"],
                "suspicious": result["suspicious"],
                "reason": result["reason"],
                "scan_time": datetime.utcnow(),
            })
        except Exception as e:
            print("⚠ Failed to store ransomware log:", e)

        # Real-time alert if suspicious
        if result["suspicious"]:
            try:
                send_alert(
                    title="Ransomware Alert",
                    message=f"Suspicious file detected: {str(p)}",
                    severity="critical",
                    source="ransomware",
                )
            except Exception as e:
                print("⚠ send_alert failed:", e)

        return jsonify({"status": "success", "result": result}), 200

    except Exception as e:
        print("scan_file_path error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500


# ---------------------------------------------------------
# 2) UPLOAD + SCAN (Dashboard Upload)
# Multipart form: file -> file
# ---------------------------------------------------------
@ransomware_bp.route("/upload", methods=["POST"])
def upload_and_scan():
    saved_path = None
    try:
        if "file" not in request.files:
            return jsonify({"status": "error", "message": "No file provided"}), 400

        file = request.files["file"]
        filename = secure_filename(file.filename or "")

        if filename == "":
            return jsonify({"status": "error", "message": "Invalid filename"}), 400

        _, ext = os.path.splitext(filename)
        if ext.lower() not in ALLOWED_EXTENSIONS:
            return jsonify({
                "status": "error",
                "message": f"File type not allowed: {ext}"
            }), 400

        # Size check — content_length may be None for some clients
        content_length = request.content_length or file.content_length or None
        if content_length and content_length > MAX_FILE_SIZE_BYTES:
            return jsonify({
                "status": "error",
                "message": f"File exceeds {MAX_FILE_SIZE_MB}MB"
            }), 400

        # Save uploaded file to uploads dir
        unique_name = f"{uuid.uuid4().hex}_{filename}"
        saved_path = UPLOAD_DIR / unique_name
        file.save(saved_path)

        # Analyze file
        result = analyze_file_for_ransomware(str(saved_path))

        # Save to DB
        try:
            db = current_app.config["DB"]
            db["ransomware_logs"].insert_one({
                "path": result["path"],
                "entropy": result["entropy"],
                "suspicious": result["suspicious"],
                "reason": result["reason"],
                "scan_time": datetime.utcnow(),
            })
        except Exception as e:
            print("⚠ Failed to store ransomware log:", e)

        # Real-time alert
        if result["suspicious"]:
            try:
                send_alert(
                    title="Ransomware Detected",
                    message=f"Uploaded suspicious file: {filename}",
                    severity="critical",
                    source="ransomware",
                )
            except Exception as e:
                print("⚠ send_alert failed:", e)

        # Return result
        return jsonify({"status": "success", "result": result}), 200

    except Exception as e:
        print("upload_and_scan error:", e)
        return jsonify({"status": "error", "message": "Upload scan failed"}), 500

    finally:
        # Always attempt to cleanup saved file (best-effort)
        if saved_path and saved_path.exists():
            try:
                saved_path.unlink()
            except Exception:
                pass


# ---------------------------------------------------------
# 3) GET ALL RANSOMWARE LOGS
# ---------------------------------------------------------
@ransomware_bp.route("/logs", methods=["GET"])
def get_ransomware_logs():
    try:
        db = current_app.config["DB"]
        logs = list(db["ransomware_logs"].find({}, {"_id": 0}).sort("scan_time", -1))
        # Convert any datetime to isoformat for frontend safety
        for l in logs:
            if isinstance(l.get("scan_time"), datetime):
                l["scan_time"] = l["scan_time"].isoformat() + "Z"
        return jsonify({"status": "success", "logs": logs}), 200
    except Exception as e:
        print("get_ransomware_logs error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500


# ---------------------------------------------------------
# NOTE on compatibility:
#
# If your frontend still calls POST /api/scan (root), you'll get 404.
# Recommended fixes:
#  - Update frontend to call POST /api/ransomware/scan
#  OR
#  - In app.py, also register this blueprint at url_prefix="/api" in addition
#    to "/api/ransomware" (so both /api/scan and /api/ransomware/scan work).
# Example:
#    app.register_blueprint(ransomware_bp, url_prefix="/api/ransomware")
#    app.register_blueprint(ransomware_bp, url_prefix="/api")   # compatibility
#
# The latter registers same routes twice — that is acceptable for dev/testing compatibility.
# ---------------------------------------------------------
