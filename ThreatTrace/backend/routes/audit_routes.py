# backend/routes/audit_routes.py
from flask import Blueprint, jsonify

audit_bp = Blueprint('audit', __name__)

@audit_bp.route('/test', methods=['GET'])
def test_audit():
    return jsonify({"message": "Audit module active"}), 200
