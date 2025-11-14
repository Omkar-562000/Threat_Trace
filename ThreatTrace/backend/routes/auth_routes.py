# backend/routes/auth_routes.py

from flask import Blueprint, request, jsonify, current_app
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token
from datetime import datetime, timedelta
from bson import ObjectId
import uuid
import smtplib
from email.mime.text import MIMEText

auth_bp = Blueprint("auth_bp", __name__)
bcrypt = Bcrypt()

# ------------------------------------------------------------
# Helper: Send Email (Gmail SMTP)
# ------------------------------------------------------------
def send_reset_email(to_email, reset_token):
    try:
        sender = current_app.config["MAIL_USERNAME"]
        password = current_app.config["MAIL_PASSWORD"]

        reset_link = f"http://localhost:5173/reset-password/{reset_token}"

        msg = MIMEText(f"""
        Hello,

        You requested a password reset for your ThreatTrace account.

        Click the link below to reset your password:
        {reset_link}

        If you did not request this, ignore this email.

        Regards,
        ThreatTrace Security Team
        """)
        msg["Subject"] = "ThreatTrace Password Reset"
        msg["From"] = sender
        msg["To"] = to_email

        server = smtplib.SMTP(current_app.config["MAIL_SERVER"], current_app.config["MAIL_PORT"])
        server.starttls()
        server.login(sender, password)
        server.sendmail(sender, to_email, msg.as_string())
        server.quit()

        print("📨 Reset email sent successfully!")
        return True

    except Exception as e:
        print("❌ Email sending failed:", e)
        return False


# ------------------------------------------------------------
# REGISTER USER
# ------------------------------------------------------------
@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()

        name = data.get("name")
        email = data.get("email")
        password = data.get("password")

        if not name or not email or not password:
            return jsonify({"status": "error", "message": "All fields required"}), 400

        db = current_app.config["DB"]
        users = db["users"]

        if users.find_one({"email": email}):
            return jsonify({"status": "error", "message": "Email already registered"}), 409

        hashed_pw = bcrypt.generate_password_hash(password).decode("utf-8")

        users.insert_one({
            "name": name,
            "email": email,
            "password": hashed_pw,
            "created_at": datetime.utcnow()
        })

        return jsonify({"status": "success", "message": "Account created successfully"}), 201

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ------------------------------------------------------------
# LOGIN USER
# ------------------------------------------------------------
@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        email = data.get("email")
        password = data.get("password")

        db = current_app.config["DB"]
        users = db["users"]

        user = users.find_one({"email": email})

        if not user:
            return jsonify({"status": "error", "message": "Invalid email or password"}), 401

        if not bcrypt.check_password_hash(user["password"], password):
            return jsonify({"status": "error", "message": "Invalid email or password"}), 401

        # Create JWT token
        token = create_access_token(
            identity=str(user["_id"]),
            expires_delta=timedelta(hours=12)
        )

        return jsonify({
            "status": "success",
            "token": token,
            "user": {
                "id": str(user["_id"]),
                "name": user["name"],
                "email": user["email"]
            }
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ------------------------------------------------------------
# FORGOT PASSWORD (EMAIL LINK)
# ------------------------------------------------------------
@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    try:
        data = request.get_json()
        email = data.get("email")

        db = current_app.config["DB"]
        users = db["users"]

        user = users.find_one({"email": email})

        if not user:
            return jsonify({"status": "error", "message": "Email not registered"}), 404

        reset_token = str(uuid.uuid4())

        users.update_one(
            {"_id": user["_id"]},
            {"$set": {
                "reset_token": reset_token,
                "reset_token_expiry": datetime.utcnow() + timedelta(minutes=30)
            }}
        )

        email_sent = send_reset_email(email, reset_token)

        if not email_sent:
            return jsonify({"status": "error", "message": "Email sending failed"}), 500

        return jsonify({"status": "success", "message": "Reset link sent to your email"}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# ------------------------------------------------------------
# RESET PASSWORD
# ------------------------------------------------------------
@auth_bp.route("/reset-password/<token>", methods=["POST"])
def reset_password(token):
    try:
        data = request.get_json()
        new_password = data.get("new_password")

        if not new_password:
            return jsonify({"status": "error", "message": "New password required"}), 400

        db = current_app.config["DB"]
        users = db["users"]

        user = users.find_one({"reset_token": token})

        if not user:
            return jsonify({"status": "error", "message": "Invalid or expired token"}), 400

        if user.get("reset_token_expiry") < datetime.utcnow():
            return jsonify({"status": "error", "message": "Reset link expired"}), 400

        hashed_pw = bcrypt.generate_password_hash(new_password).decode("utf-8")

        users.update_one(
            {"_id": user["_id"]},
            {"$set": {"password": hashed_pw}, "$unset": {"reset_token": "", "reset_token_expiry": ""}}
        )

        return jsonify({"status": "success", "message": "Password reset successfully"}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
