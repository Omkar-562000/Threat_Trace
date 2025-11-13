from flask import Blueprint, request, jsonify, current_app
logs_bp = Blueprint('logs', __name__)

@logs_bp.route('/ping', methods=['GET'])
def ping():
    return jsonify({"ok": True, "msg": "logs route alive"})

@logs_bp.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "db_connected": True})
