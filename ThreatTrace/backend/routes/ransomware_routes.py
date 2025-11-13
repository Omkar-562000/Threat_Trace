# backend/routes/ransomware_routes.py
from flask import Blueprint, jsonify

ransom_bp = Blueprint('ransomware', __name__)

@ransom_bp.route('/test', methods=['GET'])
def test_ransomware():
    return jsonify({"message": "Ransomware module active"}), 200
