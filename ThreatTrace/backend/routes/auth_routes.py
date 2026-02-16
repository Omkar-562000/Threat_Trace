# backend/routes/auth_routes.py

from flask import Blueprint, request, jsonify, current_app
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, verify_jwt_in_request, get_jwt_identity, get_jwt
from flask_mail import Message
from datetime import datetime, timedelta
import uuid
from utils.alert_manager import send_alert
from utils.security_audit import log_security_event

auth_bp = Blueprint("auth_bp", __name__)
bcrypt = Bcrypt()

mail = None   # Will be initialized from app.py

socketio = None  # Placeholder if socketio integration is needed later
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 15


def _get_client_ip():
    xff = (request.headers.get("X-Forwarded-For") or "").split(",")[0].strip()
    if xff:
        return xff
    xri = (request.headers.get("X-Real-IP") or "").strip()
    if xri:
        return xri
    return request.remote_addr or "0.0.0.0"
# ------------------------------------------------------------
# INITIALIZE MAIL (called from app.py)
# ------------------------------------------------------------
def init_mail(app):
    global mail , socketio
    from flask_mail import Mail
    mail = Mail(app)
    socketio = app.extensions.get("socketio")


# ------------------------------------------------------------
# REGISTER USER
# ------------------------------------------------------------
@auth_bp.route("/register", methods=["POST"])
def register():
    try:
        data = request.get_json()

        name = data.get("name")
        email = data.get("email", "").lower()
        password = data.get("password")
        role = data.get("role", "personal").lower()

        if not name or not email or not password:
            return jsonify({"status": "error", "message": "All fields are required"}), 400

        # Validate role
        valid_roles = ["personal", "corporate", "technical"]
        if role not in valid_roles:
            return jsonify({"status": "error", "message": "Invalid role selected"}), 400

        db = current_app.config["DB"]
        users = db["users"]

        # Duplicate user?
        if users.find_one({"email": email}):
            return jsonify({"status": "error", "message": "Email already registered"}), 409

        # Hash password
        hashed_pw = bcrypt.generate_password_hash(password).decode("utf-8")

        users.insert_one({
            "name": name,
            "email": email,
            "password": hashed_pw,
            "role": role,
            "created_at": datetime.utcnow(),
            "failed_login_attempts": 0,
            "locked_until": None,
            "last_login_at": None,
            "last_login_ip": None,
            "profile": {
                "display_name": name,
                "phone": "",
                "organization": "",
                "job_title": "",
                "timezone": "",
                "bio": "",
                "avatar_url": "",
                "updated_at": datetime.utcnow(),
            },
        })

        return jsonify({"status": "success", "message": "Account created successfully"}), 201

    except Exception as e:
        print("❌ REGISTER ERROR:", e)
        return jsonify({"status": "error", "message": "Registration failed"}), 500


# ------------------------------------------------------------
# LOGIN USER
# ------------------------------------------------------------
@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json(silent=True) or {}

        email = data.get("email", "").lower()
        password = data.get("password")
        client_ip = _get_client_ip()

        if not email or not password:
            return jsonify({"status": "error", "message": "Email and password are required"}), 400

        db = current_app.config["DB"]
        users = db["users"]

        user = users.find_one({"email": email})
        if not user:
            # Best-effort security telemetry for unknown-account probing
            send_alert(
                title="Suspicious Login Attempt",
                message=f"Unknown account login attempt for {email} from IP {client_ip}",
                severity="medium",
                source="auth",
            )
            log_security_event(
                action="login_attempt",
                status="failed",
                severity="medium",
                details={"email": email, "reason": "unknown_user"},
                target="auth",
                source="auth_api",
            )
            return jsonify({"status": "error", "message": "Invalid email or password"}), 401

        locked_until = user.get("locked_until")
        if locked_until and locked_until > datetime.utcnow():
            mins_left = max(1, int((locked_until - datetime.utcnow()).total_seconds() // 60))
            log_security_event(
                action="login_attempt",
                status="denied",
                severity="medium",
                details={"email": email, "reason": "account_locked", "minutes_remaining": mins_left},
                target="auth",
                user_id=str(user.get("_id")),
                role=user.get("role"),
                source="auth_api",
            )
            return jsonify({
                "status": "error",
                "message": f"Account temporarily locked due to failed attempts. Try again in {mins_left} minute(s)."
            }), 423

        if not bcrypt.check_password_hash(user["password"], password):
            failed_attempts = int(user.get("failed_login_attempts", 0)) + 1
            update_doc = {"$set": {"failed_login_attempts": failed_attempts}}

            if failed_attempts >= MAX_FAILED_ATTEMPTS:
                lock_until = datetime.utcnow() + timedelta(minutes=LOCKOUT_MINUTES)
                update_doc["$set"]["locked_until"] = lock_until
                send_alert(
                    title="Account Lockout Triggered",
                    message=f"Account {email} locked after repeated failed logins from IP {client_ip}",
                    severity="high",
                    source="auth",
                )
                log_security_event(
                    action="account_lockout",
                    status="success",
                    severity="high",
                    details={"email": email, "failed_attempts": failed_attempts},
                    target="auth",
                    user_id=str(user.get("_id")),
                    role=user.get("role"),
                    source="auth_api",
                )

            users.update_one({"_id": user["_id"]}, update_doc)
            log_security_event(
                action="login_attempt",
                status="failed",
                severity="info",
                details={"email": email, "reason": "invalid_password", "failed_attempts": failed_attempts},
                target="auth",
                user_id=str(user.get("_id")),
                role=user.get("role"),
                source="auth_api",
            )
            return jsonify({"status": "error", "message": "Invalid email or password"}), 401

        # Successful login -> clear lock state and failure counters
        users.update_one(
            {"_id": user["_id"]},
            {"$set": {
                "failed_login_attempts": 0,
                "locked_until": None,
                "last_login_at": datetime.utcnow(),
                "last_login_ip": client_ip,
            }}
        )
        log_security_event(
            action="login_attempt",
            status="success",
            severity="info",
            details={"email": email},
            target="auth",
            user_id=str(user.get("_id")),
            role=user.get("role"),
            source="auth_api",
        )

        # Create JWT
        token = create_access_token(
            identity=str(user["_id"]),
            additional_claims={
                "role": user.get("role", "personal")
            },
            expires_delta=timedelta(hours=12)
        )
        return jsonify({
            "status": "success",
            "token": token,
            "user": {
                "id": str(user["_id"]),
                "name": user["name"],
                "email": user["email"],
                "role": user.get("role", "personal"),
                "profile": {
                    "display_name": user.get("profile", {}).get("display_name", user.get("name", "")),
                    "phone": user.get("profile", {}).get("phone", ""),
                    "organization": user.get("profile", {}).get("organization", ""),
                    "job_title": user.get("profile", {}).get("job_title", ""),
                    "timezone": user.get("profile", {}).get("timezone", ""),
                    "bio": user.get("profile", {}).get("bio", ""),
                    "avatar_url": user.get("profile", {}).get("avatar_url", ""),
                },
            }
        }), 200


    except Exception as e:
        print("❌ LOGIN ERROR:", e)
        return jsonify({"status": "error", "message": "Login failed"}), 500


# ------------------------------------------------------------
# PROFILE (GET/UPDATE)
# ------------------------------------------------------------
@auth_bp.route("/profile", methods=["GET"])
def get_profile():
    try:
        verify_jwt_in_request()
        identity = get_jwt_identity()

        db = current_app.config["DB"]
        users = db["users"]
        try:
            from bson import ObjectId
            user = users.find_one({"_id": ObjectId(str(identity))})
        except Exception:
            user = users.find_one({"_id": str(identity)})

        if not user:
            return jsonify({"status": "error", "message": "User not found"}), 404

        return jsonify(
            {
                "status": "success",
                "profile": {
                    "id": str(user["_id"]),
                    "name": user.get("name", ""),
                    "email": user.get("email", ""),
                    "role": user.get("role", "personal"),
                    "display_name": user.get("profile", {}).get("display_name", user.get("name", "")),
                    "phone": user.get("profile", {}).get("phone", ""),
                    "organization": user.get("profile", {}).get("organization", ""),
                    "job_title": user.get("profile", {}).get("job_title", ""),
                    "timezone": user.get("profile", {}).get("timezone", ""),
                    "bio": user.get("profile", {}).get("bio", ""),
                    "avatar_url": user.get("profile", {}).get("avatar_url", ""),
                    "last_login_at": user.get("last_login_at").isoformat() + "Z" if isinstance(user.get("last_login_at"), datetime) else user.get("last_login_at"),
                    "last_login_ip": user.get("last_login_ip"),
                },
            }
        ), 200
    except Exception as e:
        print("❌ GET PROFILE ERROR:", e)
        return jsonify({"status": "error", "message": "Failed to fetch profile"}), 500


@auth_bp.route("/profile", methods=["PUT"])
def update_profile():
    try:
        verify_jwt_in_request()
        identity = get_jwt_identity()
        claims = get_jwt() or {}

        data = request.get_json(silent=True) or {}
        name = (data.get("name") or "").strip()
        avatar_url = (data.get("avatar_url") or "").strip()
        if avatar_url.startswith("data:image/") and len(avatar_url) > 1_000_000:
            return jsonify({"status": "error", "message": "Avatar image is too large"}), 400
        profile_fields = {
            "display_name": (data.get("display_name") or "").strip(),
            "phone": (data.get("phone") or "").strip(),
            "organization": (data.get("organization") or "").strip(),
            "job_title": (data.get("job_title") or "").strip(),
            "timezone": (data.get("timezone") or "").strip(),
            "bio": (data.get("bio") or "").strip(),
            "avatar_url": avatar_url,
            "updated_at": datetime.utcnow(),
        }

        db = current_app.config["DB"]
        users = db["users"]
        try:
            from bson import ObjectId
            q = {"_id": ObjectId(str(identity))}
        except Exception:
            q = {"_id": str(identity)}

        update_doc = {"$set": {"profile": profile_fields}}
        if name:
            update_doc["$set"]["name"] = name

        result = users.update_one(q, update_doc)
        if result.matched_count == 0:
            return jsonify({"status": "error", "message": "User not found"}), 404

        user = users.find_one(q)
        log_security_event(
            action="update_profile",
            status="success",
            severity="info",
            details={"fields_updated": [k for k, v in profile_fields.items() if k != "updated_at" and v != ""]},
            target="users",
            user_id=str(identity),
            role=claims.get("role"),
            source="auth_api",
        )

        return jsonify(
            {
                "status": "success",
                "message": "Profile updated",
                "profile": {
                    "id": str(user["_id"]),
                    "name": user.get("name", ""),
                    "email": user.get("email", ""),
                    "role": user.get("role", "personal"),
                    "display_name": user.get("profile", {}).get("display_name", user.get("name", "")),
                    "phone": user.get("profile", {}).get("phone", ""),
                    "organization": user.get("profile", {}).get("organization", ""),
                    "job_title": user.get("profile", {}).get("job_title", ""),
                    "timezone": user.get("profile", {}).get("timezone", ""),
                    "bio": user.get("profile", {}).get("bio", ""),
                    "avatar_url": user.get("profile", {}).get("avatar_url", ""),
                    "last_login_at": user.get("last_login_at").isoformat() + "Z" if isinstance(user.get("last_login_at"), datetime) else user.get("last_login_at"),
                    "last_login_ip": user.get("last_login_ip"),
                },
            }
        ), 200
    except Exception as e:
        print("❌ UPDATE PROFILE ERROR:", e)
        return jsonify({"status": "error", "message": "Failed to update profile"}), 500


# ------------------------------------------------------------
# SEND RESET EMAIL
# ------------------------------------------------------------
def send_reset_email(email, reset_token):
    try:
        reset_link = f"http://localhost:5173/reset-password?token={reset_token}"

        msg = Message(
            subject="ThreatTrace Password Reset",
            sender=current_app.config["MAIL_USERNAME"],
            recipients=[email]
        )

        msg.body = f"""
Hello,

We received a request to reset your password.

Click the link below to reset your password:
{reset_link}

This link expires in 30 minutes.

If this was not you, please ignore this email.

— ThreatTrace Security Team
"""

        mail.send(msg)
        print("📨 Reset email sent successfully.")
        return True

    except Exception as e:
        print("❌ EMAIL SENDING ERROR:", e)
        return False


# ------------------------------------------------------------
# FORGOT PASSWORD
# ------------------------------------------------------------
@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    try:
        email = request.json.get("email", "").lower()

        db = current_app.config["DB"]
        users = db["users"]

        user = users.find_one({"email": email})
        if not user:
            return jsonify({"status": "error", "message": "Email not registered"}), 404

        # Generate token
        reset_token = str(uuid.uuid4())
        expiry = datetime.utcnow() + timedelta(minutes=30)

        users.update_one(
            {"_id": user["_id"]},
            {"$set": {
                "reset_token": reset_token,
                "reset_token_expiry": expiry
            }}
        )

        if not send_reset_email(email, reset_token):
            return jsonify({"status": "error", "message": "Failed to send reset email"}), 500

        return jsonify({"status": "success", "message": "Reset link sent to your email"}), 200

    except Exception as e:
        print("❌ FORGOT PASSWORD ERROR:", e)
        return jsonify({"status": "error", "message": "Server Error"}), 500


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

        if user["reset_token_expiry"] < datetime.utcnow():
            return jsonify({"status": "error", "message": "Reset link expired"}), 400

        hashed_pw = bcrypt.generate_password_hash(new_password).decode("utf-8")

        users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {"password": hashed_pw},
                "$unset": {"reset_token": "", "reset_token_expiry": ""}
            }
        )

        return jsonify({"status": "success", "message": "Password reset successful"}), 200

    except Exception as e:
        print("❌ RESET PASSWORD ERROR:", e)
        return jsonify({"status": "error", "message": "Password reset failed"}), 500
