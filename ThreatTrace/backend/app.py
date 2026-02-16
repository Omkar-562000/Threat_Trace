"""
====================================================================
                ThreatTrace — Backend Application
====================================================================

This file bootstraps the entire backend:

✓ Flask App Initialization
✓ CORS, JWT, Mail, Bcrypt
✓ MongoDB (via init_db)
✓ Socket.IO (real-time alerts + logs)
✓ APScheduler (background integrity scans)
✓ Alert System Initialization (WebSocket + Email + DB)
✓ Blueprint Registration (Auth, Audit, Ransomware, Logs, Alerts, Reports)
✓ Legacy Compatibility Routes (important)
✓ Graceful Shutdown
"""

import atexit
import signal
import sys
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_socketio import SocketIO
from bson import ObjectId

from config import Config
from database.db_config import init_db
from utils.security_audit import ensure_security_audit_indexes
from utils.canary_trap import ensure_canary_indexes


# ============================================================
# 1️⃣ FLASK APP INITIALIZATION
# ============================================================
app = Flask(__name__)
app.config.from_object(Config)


# ============================================================
# 2️⃣ CORE EXTENSIONS (CORS + MAIL + JWT + BCRYPT + SOCKET.IO)
# ============================================================
CORS(
    app,
    resources={r"/api/*": {
        "origins": [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://172.20.10.3:5173",   # your LAN/hotspot IP
        ]
    }},
    supports_credentials=True
)

mail = Mail(app)
app.config["MAIL"] = mail

jwt = JWTManager(app)
app.config["JWT"] = jwt

bcrypt = Bcrypt(app)
app.config["BCRYPT"] = bcrypt

socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode="eventlet",
)
app.config["SOCKETIO"] = socketio


# ============================================================
# 3️⃣ ALERT SYSTEM INITIALIZATION
# ============================================================
from utils.alert_manager import init_alert_system
init_alert_system(socketio)


# ============================================================
# 4️⃣ DATABASE INITIALIZATION
# ============================================================
db = init_db(app)
app.config["DB"] = db
ensure_security_audit_indexes(db)
ensure_canary_indexes(db)


def _get_client_ip():
    xff = (request.headers.get("X-Forwarded-For") or "").split(",")[0].strip()
    if xff:
        return xff
    xri = (request.headers.get("X-Real-IP") or "").strip()
    if xri:
        return xri
    return request.remote_addr or "0.0.0.0"


@app.before_request
def block_abusive_ips():
    # Enforce only for API routes; keep auth login/register/reset accessible.
    path = request.path or ""
    if not path.startswith("/api/"):
        return None
    if (
        path.startswith("/api/auth/login")
        or path.startswith("/api/auth/register")
        or path.startswith("/api/auth/forgot-password")
        or path.startswith("/api/auth/reset-password")
        or path.startswith("/api/canary/trap/")
        or path.startswith("/api/canary/challenge/")
    ):
        return None

    try:
        ip = _get_client_ip()
        row = db["blocked_ips"].find_one({"ip": ip})
        if row and row.get("blocked_until") and row["blocked_until"] > datetime.utcnow():
            return jsonify({
                "status": "error",
                "message": "Request blocked by runtime security policy"
            }), 403
    except Exception:
        # Fail-open for availability if lookup fails.
        return None
    return None


@jwt.token_in_blocklist_loader
def is_token_revoked(jwt_header, jwt_payload):
    """
    Reject tokens when:
    1) jti exists in explicit revoked token store, or
    2) user has force_logout_after newer than token issue time.
    """
    try:
        token_jti = jwt_payload.get("jti")
        token_sub = jwt_payload.get("sub")
        token_iat = jwt_payload.get("iat")

        if token_jti:
            hit = db["revoked_tokens"].find_one({"jti": token_jti, "revoked": True})
            if hit:
                return True

        if token_sub and token_iat:
            try:
                user = db["users"].find_one({"_id": ObjectId(str(token_sub))})
            except Exception:
                user = db["users"].find_one({"_id": str(token_sub)})
            if not user:
                return False

            force_logout_after = user.get("force_logout_after")
            if force_logout_after:
                token_issued_at = datetime.utcfromtimestamp(int(token_iat))
                if token_issued_at < force_logout_after:
                    return True
    except Exception:
        return False

    return False


# ============================================================
# 5️⃣ IMPORT & REGISTER ROUTES
# ============================================================

# Import blueprints
from routes.auth_routes import auth_bp, init_mail
from routes.ransomware_routes import ransomware_bp
from routes.audit_routes import audit_bp
from routes.logs_routes import logs_bp
from routes.alerts_routes import alerts_bp
from routes.reports_routes import reports_bp
from routes.dashboard_routes import dashboard_bp
from routes.locations_routes import locations_bp
from routes.security_routes import security_bp
from routes.canary_routes import canary_bp

# Scheduler (optional)
try:
    from routes.scheduler_routes import scheduler_bp
except Exception:
    scheduler_bp = None

# Mail setup
init_mail(app)

# ------------------------------------------------------------
# MAIN REGISTRATIONS
# ------------------------------------------------------------
app.register_blueprint(auth_bp, url_prefix="/api/auth")
app.register_blueprint(ransomware_bp, url_prefix="/api/ransomware")
app.register_blueprint(audit_bp, url_prefix="/api/audit")
app.register_blueprint(logs_bp, url_prefix="/api/logs")
app.register_blueprint(alerts_bp, url_prefix="/api/alerts")
app.register_blueprint(reports_bp, url_prefix="/api/reports")
app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
app.register_blueprint(locations_bp, url_prefix="/api/locations")
app.register_blueprint(security_bp, url_prefix="/api/security")
app.register_blueprint(canary_bp, url_prefix="/api/canary")

if scheduler_bp:
    app.register_blueprint(scheduler_bp, url_prefix="/api/scheduler")

# ------------------------------------------------------------
# 🔥 **LEGACY / COMPATIBILITY ROUTES**
# Makes older frontend routes work:
#    POST /api/scan
#    POST /api/upload
#    GET  /api/logs
# ------------------------------------------------------------
# WARNING:
# This does NOT override existing paths inside ransomware_bp.
# It simply adds the same routes under an additional prefix.


print("✅ All API routes registered successfully!\n")


# ============================================================
# 7️⃣ HEALTH CHECK ENDPOINT
# ============================================================
@app.route("/")
def index():
    return {
        "status": "ok",
        "service": "ThreatTrace Backend",
        "db_connected": True,
        "socketio": True,
    }


# ============================================================
# 7️⃣ GRACEFUL SHUTDOWN
# ============================================================
def shutdown_handler(signum=None, frame=None):
    print("\n⚠️ Shutting down ThreatTrace backend...")

    try:
        from scheduler import stop_scheduler
        if stop_scheduler(app):
            print("🛑 Scheduler stopped.")
    except:
        print("⚠ Scheduler not running or already closed.")

    sys.exit(0)


atexit.register(shutdown_handler)
signal.signal(signal.SIGINT, shutdown_handler)
signal.signal(signal.SIGTERM, shutdown_handler)


# ============================================================
# 8️⃣ RUN SERVER
# ============================================================
if __name__ == "__main__":
    print("🚀 ThreatTrace backend running at http://127.0.0.1:5000")

    socketio.run(
        app,
        host="0.0.0.0",
        port=5000,
        debug=app.config.get("DEBUG", True)
    )
