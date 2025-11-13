# backend/routes/ransomware_routes.py
from flask import Blueprint, request, jsonify, current_app
import os
import math
from datetime import datetime

ransomware_bp = Blueprint("ransomware_bp", __name__)

# --- Helper Function to Calculate File Entropy ---
def calculate_entropy(data):
    if not data:
        return 0
    entropy = 0
    for x in range(256):
        p_x = data.count(bytes([x])) / len(data)
        if p_x > 0:
            entropy += -p_x * math.log2(p_x)
    return entropy

# --- Analyze file for ransomware behavior ---
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

    # Entropy check
    try:
        with open(file_path, "rb") as f:
            data = f.read(2048)
            entropy = calculate_entropy(data)
            result["entropy"] = round(entropy, 3)
            if entropy > 7.5:
                result["suspicious"] = True
                result["reason"].append("High entropy indicates encryption or obfuscation.")
    except Exception as e:
        result["reason"].append(str(e))

    return result


@ransomware_bp.route("/scan", methods=["POST"])
def scan_file():
    data = request.get_json()
    file_path = data.get("file_path")

    if not file_path:
        return jsonify({"status": "error", "message": "File path is required"}), 400

    result = analyze_file_for_ransomware(file_path)

    # Save results to DB
    db = current_app.config["DB"]
    db["ransomware_logs"].insert_one({
        "file_path": file_path,
        "analysis": result,
        "timestamp": datetime.utcnow()
    })

    return jsonify({"status": "success", "result": result}), 200


# --- Test Endpoint ---
@ransomware_bp.route("/test", methods=["GET"])
def test_ransomware():
    return jsonify({"message": "Ransomware detection module active"}), 200
