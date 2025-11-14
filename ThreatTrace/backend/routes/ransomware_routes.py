# backend/routes/ransomware_routes.py

from flask import Blueprint, request, jsonify, current_app
import os
import math
from datetime import datetime
from werkzeug.utils import secure_filename
import pathlib
import uuid

# ALERT SYSTEM
from utils.alert_manager import send_alert

ransomware_bp = Blueprint("ransomware_bp", __name__)

UPLOAD_DIR = pathlib.Path(__file__).resolve().parents[1] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_FILE_SIZE_MB = 50  # Limit file size


# ----------- Entropy Calculation -----------
def calculate_entropy(data):
    if not data:
        return 0
    entropy = 0
    for x in range(256):
        p_x = data.count(bytes([x])) / len(data)
        if p_x > 0:
            entropy += -p_x * math.log2(p_x)
    return entropy


# ----------- Ransomware Analysis -----------
def analyze_file_for_ransomware(file_path):
    suspicious_extensions = [".lock", ".enc", ".crypt", ".ransom", ".encrypted"]

    result = {"path": file_path, "suspicious": False, "reason": []}

    if not os.path.exists(file_path):
        result["reason"].append("File not found")
        return result

    ext = os.path.splitext(file_path)[1].lower()
    if ext in suspicious_extensions:
        result["suspicious"] = True
        result["reason"].append(f"Suspicious extension detected: {ext}")

    try:
        with open(file_path, "rb") as f:
            data = f.read(2048)
            entropy = calculate_entropy(data)
            result["entropy"] = round(entropy, 3)

            if entropy > 7.5:
                result["suspicious"] = True
                result["reason"].append("High entropy indicates encryption.")
    except Exception as e:
        result["reason"].append(str(e))

    return result


# ----------- File Path Scan -----------
@ransomware_bp.route("/scan", methods=["POST"])
def scan_file():
    data = request.get_json()
    file_path = data.get("file_path")

    if not file_path:
        return jsonify({"status": "error", "message": "File path is required"}), 400

    result = analyze_file_for_ransomware(file_path)

    db = current_app.config["DB"]
    db["ransomware_logs"].insert_one({
        "path": result.get("path"),
        "entropy": result.get("entropy", 0),
        "suspicious": result.get("suspicious", False),
        "reason": result.get("reason", []),
        "scan_time": datetime.utcnow()
    })

    # Trigger ALERT if suspicious
    if result["suspicious"]:
        send_alert(
            title="Ransomware Alert",
            message=f"Suspicious file detected: {file_path}",
            severity="high"
        )

    return jsonify({"status": "success", "result": result}), 200


# ----------- Upload + Scan -----------

@ransomware_bp.route("/upload", methods=["POST"])
def upload_and_scan():
    try:
        if 'file' not in request.files:
            return jsonify({"status": "error", "message": "No file uploaded"}), 400

        file = request.files['file']
        filename = secure_filename(file.filename)

        unique_name = f"{uuid.uuid4().hex}_{filename}"
        save_path = UPLOAD_DIR / unique_name

        # Save file
        file.save(save_path)

        # Scan
        result = analyze_file_for_ransomware(str(save_path))

        db = current_app.config["DB"]
        db["ransomware_logs"].insert_one({
            "path": result.get("path"),
            "entropy": result.get("entropy", 0),
            "suspicious": result.get("suspicious", False),
            "reason": result.get("reason", []),
            "scan_time": datetime.utcnow()
        })

        # Delete temporary file
        os.remove(save_path)

        # Send ALERT
        if result["suspicious"]:
            send_alert(
                title="Ransomware Detected",
                message=f"Uploaded file shows ransomware signs: {filename}",
                severity="critical"
            )

        return jsonify({"status": "success", "result": result}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ----------- Test Route -----------
@ransomware_bp.route("/test", methods=["GET"])
def test_ransomware():
    return jsonify({"message": "Ransomware detection module active"}), 200


# ----------- Get All Logs -----------
@ransomware_bp.route("/logs", methods=["GET"])
def get_ransomware_logs():
    db = current_app.config["DB"]
    logs = list(db["ransomware_logs"].find({}, {"_id": 0}))
    return jsonify({"status": "success", "logs": logs}), 200
