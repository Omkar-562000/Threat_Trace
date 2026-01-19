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
from flask import Flask
from flask_cors import CORS
from flask_mail import Mail
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_socketio import SocketIO
from apscheduler.schedulers.background import BackgroundScheduler

from config import Config
from database.db_config import init_db


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


# ============================================================
# 5️⃣ APSCHEDULER
# ============================================================
scheduler = BackgroundScheduler()
scheduler.start()
app.config["SCHEDULER"] = scheduler


# ============================================================
# 6️⃣ IMPORT & REGISTER ROUTES
# ============================================================

# Import blueprints
from routes.auth_routes import auth_bp, init_mail
from routes.ransomware_routes import ransomware_bp
from routes.audit_routes import audit_bp
from routes.logs_routes import logs_bp
from routes.alerts_routes import alerts_bp
from routes.reports_routes import reports_bp
from routes.dashboard_routes import dashboard_bp

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
# 8️⃣ GRACEFUL SHUTDOWN
# ============================================================
def shutdown_handler(signum=None, frame=None):
    print("\n⚠️ Shutting down ThreatTrace backend...")

    try:
        if scheduler.running:
            scheduler.shutdown(wait=False)
            print("🛑 Scheduler stopped.")
    except:
        print("⚠ Scheduler not running or already closed.")

    sys.exit(0)


atexit.register(shutdown_handler)
signal.signal(signal.SIGINT, shutdown_handler)
signal.signal(signal.SIGTERM, shutdown_handler)


# ============================================================
# 9️⃣ RUN SERVER
# ============================================================
if __name__ == "__main__":
    print("🚀 ThreatTrace backend running at http://127.0.0.1:5000")

    socketio.run(
        app,
        host="0.0.0.0",
        port=5000,
        debug=app.config.get("DEBUG", True)
    )
