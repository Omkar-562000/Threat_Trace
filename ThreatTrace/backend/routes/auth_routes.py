from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta

auth_bp = Blueprint("auth_bp", __name__)

# --- User Registration Route ---
@auth_bp.route("/register", methods=["POST"])
def register_user():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    db = current_app.config["DB"]
    users_collection = db["users"]

    if users_collection.find_one({"username": username}):
        return jsonify({"error": "User already exists"}), 409

    hashed_pw = generate_password_hash(password)
    users_collection.insert_one({
        "username": username,
        "password": hashed_pw
    })
    return jsonify({"message": "User registered successfully"}), 201

# --- Login Route ---
@auth_bp.route("/login", methods=["POST"])
def login_user():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    db = current_app.config["DB"]
    users_collection = db["users"]
    user = users_collection.find_one({"username": username})

    if not user or not check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid username or password"}), 401

    access_token = create_access_token(identity=username, expires_delta=timedelta(hours=1))
    return jsonify({"message": "Login successful", "token": access_token}), 200

# --- Test Route ---
@auth_bp.route("/test", methods=["GET"])
def test_auth():
    return jsonify({"message": "Auth module active"})
