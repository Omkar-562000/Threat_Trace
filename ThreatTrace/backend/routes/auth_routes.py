from flask import Blueprint, request, jsonify
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token
from datetime import datetime
from database.models import get_user_collection, serialize_user

auth_bp = Blueprint("auth_bp", __name__)
bcrypt = Bcrypt()

@auth_bp.record
def record_params(setup_state):
    # Access the Flask app’s DB connection
    app = setup_state.app
    auth_bp.db = app.config.get("DB")

@auth_bp.route("/register", methods=["POST"])
def register():
    db = auth_bp.db
    users = get_user_collection(db)
    data = request.get_json()

    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not all([username, email, password]):
        return jsonify({"error": "All fields are required"}), 400

    if users.find_one({"email": email}):
        return jsonify({"error": "User already exists"}), 400

    hashed_pw = bcrypt.generate_password_hash(password).decode("utf-8")
    user = {
        "username": username,
        "email": email,
        "password": hashed_pw,
        "created_at": datetime.utcnow()
    }
    users.insert_one(user)
    return jsonify({"message": "User registered successfully"}), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    db = auth_bp.db
    users = get_user_collection(db)
    data = request.get_json()

    email = data.get("email")
    password = data.get("password")

    user = users.find_one({"email": email})
    if not user or not bcrypt.check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=str(user["_id"]))
    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": serialize_user(user)
    }), 200
