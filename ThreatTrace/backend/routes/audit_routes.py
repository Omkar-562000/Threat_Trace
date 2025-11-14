# backend/routes/audit_routes.py

from flask import Blueprint, request, jsonify, current_app
import os
import hashlib
from datetime import datetime
from utils.alert_manager import send_alert

audit_bp = Blueprint("audit_bp", __name__)


# ------------ Hash Calculator ------------
def calculate_file_hash(file_path):
    try:
        with open(file_path, "rb") as f:
            return hashlib.sha256(f.read()).hexdigest()
    except Exception as e:
        return None


# ------------ Verify Log Integrity ------------
@audit_bp.route("/verify", methods=["POST"])
def verify_log():
    data = request.get_json()
    log_path = data.get("log_path")

    if not log_path or not os.path.exists(log_path):
        return jsonify({"status": "error", "message": "Log file not found"}), 404

    db = current_app.config["DB"]
    coll = db["audit_logs"]

    current_hash = calculate_file_hash(log_path)

    existing = coll.find_one({"file_path": log_path})

    if not existing:
        coll.insert_one({
            "file_path": log_path,
            "last_hash": current_hash,
            "last_verified": datetime.utcnow(),
            "tampered": False
        })
        return jsonify({"status": "new", "message": "Log registered first time", "hash": current_hash})

    if existing["last_hash"] == current_hash:
        coll.update_one({"_id": existing["_id"]}, {"$set": {
            "last_verified": datetime.utcnow(),
            "tampered": False
        }})
        return jsonify({"status": "clean", "message": "No tampering detected", "hash": current_hash})

    else:
        coll.update_one({"_id": existing["_id"]}, {"$set": {
            "last_verified": datetime.utcnow(),
            "tampered": True,
            "last_hash": current_hash
        }})

        # 🔥 Send ALERT to frontend
        send_alert(
            title="Log Tampering Alert",
            message=f"Log file modified: {log_path}",
            severity="critical"
        )

        return jsonify({"status": "tampered", "message": "Log file modified!", "hash": current_hash})


@audit_bp.route("/test", methods=["GET"])
def test_audit():
    return jsonify({"message": "Audit module active"})
