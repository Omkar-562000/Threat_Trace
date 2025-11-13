# backend/routes/audit_routes.py
from flask import Blueprint, request, jsonify, current_app
import os
import hashlib
from datetime import datetime

audit_bp = Blueprint("audit_bp", __name__)

# --- Helper Function to Calculate File Hash ---
def calculate_file_hash(file_path):
    try:
        with open(file_path, "rb") as f:
            file_data = f.read()
            return hashlib.sha256(file_data).hexdigest()
    except Exception as e:
        print(f"❌ Error calculating file hash: {e}")
        return None


# --- Route: Verify Log File Integrity ---
@audit_bp.route("/verify", methods=["POST"])
def verify_log():
    try:
        data = request.get_json()
        log_path = data.get("log_path")

        if not log_path or not os.path.exists(log_path):
            return jsonify({"status": "error", "message": "Log file not found"}), 404

        db = current_app.config["DB"]
        logs_collection = db["audit_logs"]

        # Calculate current hash
        current_hash = calculate_file_hash(log_path)
        if not current_hash:
            return jsonify({"status": "error", "message": "Unable to calculate hash"}), 500

        # Check if previously stored
        existing = logs_collection.find_one({"file_path": log_path})

        if not existing:
            # Store as new verified log
            logs_collection.insert_one({
                "file_path": log_path,
                "last_hash": current_hash,
                "last_verified": datetime.utcnow(),
                "tampered": False
            })
            return jsonify({
                "status": "new",
                "message": "Log registered and verified first time.",
                "hash": current_hash
            }), 200
        else:
            if existing["last_hash"] == current_hash:
                logs_collection.update_one(
                    {"_id": existing["_id"]},
                    {"$set": {"last_verified": datetime.utcnow(), "tampered": False}}
                )
                return jsonify({
                    "status": "clean",
                    "message": "No tampering detected.",
                    "hash": current_hash
                }), 200
            else:
                logs_collection.update_one(
                    {"_id": existing["_id"]},
                    {"$set": {"last_verified": datetime.utcnow(), "tampered": True, "last_hash": current_hash}}
                )
                return jsonify({
                    "status": "tampered",
                    "message": "Log file has been modified!",
                    "hash": current_hash
                }), 200
    except Exception as e:
        print(f"❌ Error in verify_log: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# --- Simple test route ---
@audit_bp.route("/test", methods=["GET"])
def test_audit():
    return jsonify({"message": "Audit module active"}), 200
