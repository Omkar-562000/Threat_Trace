from flask import Blueprint, request, jsonify
reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/ping', methods=['GET'])
def ping():
    return jsonify({"ok": True, "msg": "reports route alive"})
