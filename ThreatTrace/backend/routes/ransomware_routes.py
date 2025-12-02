from flask import Blueprint, request, jsonify, current_app
import os
import math
import uuid
from datetime import datetime
from pathlib import Path
from werkzeug.utils import secure_filename

from utils.alert_manager import send_alert

ransomware_bp = Blueprint("ransomware_bp", __name__)

# Upload directory
UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed file types for scanning
ALLOWED_EXTENSIONS = {".exe", ".dll", ".bin", ".dat", ".txt", ".log"}
MAX_FILE_SIZE_MB = 50
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


# ---------------------------------------------------------
#  ENTROPY CALCULATION
# ---------------------------------------------------------
def calculate_entropy(data: bytes):
    if not data:
        return 0.0
    entropy = 0
    for x in range(256):
        p = data.count(bytes([x])) / len(data)
        if p > 0:
            entropy += -p * math.log2(p)
    return entropy


# ---------------------------------------------------------
#  SUSPICIOUS FILE ANALYZER
# ---------------------------------------------------------
def analyze_file_for_ransomware(file_path: str) -> dict:
    SUSPICIOUS_EXTENSIONS = [
        ".lock", ".enc", ".crypt", ".ransom", ".encrypted"
    ]

    result = {
        "path": file_path,
        "suspicious": False,
        "reason": [],
        "entropy": 0.0,
    }

    if not os.path.exists(file_path):
        result["reason"].append("File not found")
        return result

    ext = os.path.splitext(file_path)[1].lower()

    if ext in SUSPICIOUS_EXTENSIONS:
        result["suspicious"] = True
        result["reason"].append(f"Suspicious extension detected: {ext}")

    try:
        with open(file_path, "rb") as f:
            data = f.read(4096)  # read first 4KB only
            entropy = calculate_entropy(data)
            result["entropy"] = round(entropy, 3)

            if entropy > 7.5:
                result["suspicious"] = True
                result["reason"].append("High entropy: file appears encrypted")
    except Exception as e:
        result["reason"].append(str(e))

    return result


# ---------------------------------------------------------
#  1️⃣ PATH-BASED SCAN (Called when user enters a file path)
# ---------------------------------------------------------
@ransomware_bp.route("/scan", methods=["POST"])
def scan_file_path():
    """
    POST JSON: { "file_path": "C:/path/to/file.exe" }
    """
    try:
        data = request.get_json()
        file_path = data.get("file_path")

        if not file_path:
            return jsonify({"status": "error", "message": "file_path required"}), 400

        if not os.path.exists(file_path):
            return jsonify({"status": "error", "message": "File not found"}), 404

        result = analyze_file_for_ransomware(file_path)

        # Save to DB
        db = current_app.config["DB"]
        db["ransomware_logs"].insert_one({
            "path": result["path"],
            "entropy": result["entropy"],
            "suspicious": result["suspicious"],
            "reason": result["reason"],
            "scan_time": datetime.utcnow(),
        })

        # Real-time alert if required
        if result["suspicious"]:
            send_alert(
                title="Ransomware Alert",
                message=f"Suspicious file detected: {file_path}",
                severity="critical",
                source="ransomware"
            )

        return jsonify({"status": "success", "result": result}), 200

    except Exception as e:
        print("scan_file_path error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500


# ---------------------------------------------------------
#  2️⃣ UPLOAD + SCAN (Dashboard Upload → Scan)
# ---------------------------------------------------------
@ransomware_bp.route("/upload", methods=["POST"])
def upload_and_scan():
    try:
        if "file" not in request.files:
            return jsonify({"status": "error", "message": "No file provided"}), 400

        file = request.files["file"]
        filename = secure_filename(file.filename)

        if filename == "":
            return jsonify({"status": "error", "message": "Invalid filename"}), 400

        _, ext = os.path.splitext(filename)
        if ext.lower() not in ALLOWED_EXTENSIONS:
            return jsonify({
                "status": "error",
                "message": f"File type not allowed: {ext}"
            }), 400

        # Size check
        if file.content_length and file.content_length > MAX_FILE_SIZE_BYTES:
            return jsonify({
                "status": "error",
                "message": f"File exceeds {MAX_FILE_SIZE_MB}MB"
            }), 400

        # Save uploaded file
        unique_name = f"{uuid.uuid4().hex}_{filename}"
        saved_path = UPLOAD_DIR / unique_name
        file.save(saved_path)

        # Analyze file
        result = analyze_file_for_ransomware(str(saved_path))

        # Save to DB
        db = current_app.config["DB"]
        db["ransomware_logs"].insert_one({
            "path": result["path"],
            "entropy": result["entropy"],
            "suspicious": result["suspicious"],
            "reason": result["reason"],
            "scan_time": datetime.utcnow(),
        })

        # Real-time alert
        if result["suspicious"]:
            send_alert(
                title="Ransomware Detected",
                message=f"Uploaded suspicious file: {filename}",
                severity="critical",
                source="ransomware"
            )

        # Clean temp file
        try:
            os.remove(saved_path)
        except:
            pass

        return jsonify({"status": "success", "result": result}), 200

    except Exception as e:
        print("upload_and_scan error:", e)
        return jsonify({"status": "error", "message": "Upload scan failed"}), 500


# ---------------------------------------------------------
#  3️⃣ GET ALL RANSOMWARE LOGS
# ---------------------------------------------------------
@ransomware_bp.route("/logs", methods=["GET"])
def get_ransomware_logs():
    try:
        db = current_app.config["DB"]
        logs = list(db["ransomware_logs"].find({}, {"_id": 0}).sort("scan_time", -1))

        return jsonify({"status": "success", "logs": logs}), 200

    except Exception as e:
        print("get_ransomware_logs error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500
