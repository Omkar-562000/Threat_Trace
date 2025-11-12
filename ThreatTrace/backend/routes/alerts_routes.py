from flask import Blueprint, request, jsonify
alerts_bp = Blueprint('alerts', __name__)

@alerts_bp.route('/ping', methods=['GET'])
def ping():
    return jsonify({"ok": True, "msg": "alerts route alive"})
