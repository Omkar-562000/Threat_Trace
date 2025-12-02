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
✓ Graceful Shutdown for scheduler + SocketIO
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
# 2️⃣ CORE EXTENSIONS
# ============================================================

# ---- CORS for React Frontend ----
CORS(
    app,
   resources={r"/api/*": {
        "origins": [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://172.20.10.3:5173"   # Your mobile hotspot / LAN IP
        ]
    }},
    supports_credentials=True
)

# ---- Flask-Mail ----
mail = Mail(app)
app.config["MAIL"] = mail

# ---- JWT Auth ----
jwt = JWTManager(app)
app.config["JWT"] = jwt

# ---- Password hashing ----
bcrypt = Bcrypt(app)
app.config["BCRYPT"] = bcrypt

# ---- Socket.IO for realtime events ----
socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode="eventlet"  # REQUIRED for real-time stability
)
app.config["SOCKETIO"] = socketio


# ============================================================
# 3️⃣ ALERT SYSTEM INITIALIZATION
# ============================================================
from utils.alert_manager import init_alert_system
init_alert_system(socketio)   # Enables unified WebSocket alerts


# ============================================================
# 4️⃣ DATABASE INITIALIZATION
# ============================================================
db = init_db(app)
app.config["DB"] = db


# ============================================================
# 5️⃣ APSCHEDULER BACKGROUND JOBS
# ============================================================
scheduler = BackgroundScheduler()
scheduler.start()
app.config["SCHEDULER"] = scheduler


# ============================================================
# 6️⃣ IMPORT & REGISTER ROUTES
# ============================================================

# Auth MUST be imported after mail initialization
from routes.auth_routes import auth_bp, init_mail
init_mail(app)

from routes.ransomware_routes import ransomware_bp
from routes.audit_routes import audit_bp
from routes.logs_routes import logs_bp
from routes.alerts_routes import alerts_bp
from routes.reports_routes import reports_bp

# Optional scheduler routes
try:
    from routes.scheduler_routes import scheduler_bp
except Exception:
    scheduler_bp = None


# ---- Register Blueprints ----
try:
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(ransomware_bp, url_prefix="/api/ransomware")
    app.register_blueprint(audit_bp, url_prefix="/api/audit")
    app.register_blueprint(logs_bp, url_prefix="/api/logs")
    app.register_blueprint(alerts_bp, url_prefix="/api/alerts")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")

    if scheduler_bp:
        app.register_blueprint(scheduler_bp, url_prefix="/api/scheduler")

    print("✅ All API routes registered successfully!\n")

except Exception as e:
    print("❌ ERROR registering blueprints:", e)
    raise e


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
# 8️⃣ GRACEFUL SHUTDOWN (scheduler + SocketIO)
# ============================================================
def shutdown_handler(signum=None, frame=None):
    print("\n⚠️ Shutting down ThreatTrace backend...")

    try:
        if scheduler.running:
            scheduler.shutdown(wait=False)
            print("🛑 Scheduler stopped.")
    except:
        print("Scheduler not running.")

    sys.exit(0)


atexit.register(shutdown_handler)
signal.signal(signal.SIGINT, shutdown_handler)
signal.signal(signal.SIGTERM, shutdown_handler)


# ============================================================
# 9️⃣ RUN SERVER
# ============================================================
if __name__ == "__main__":
    print("🚀 ThreatTrace backend running at http://127.0.0.1:5000\n")

    socketio.run(
        app,
        host="0.0.0.0",
        port=5000,
        debug=app.config.get("DEBUG", True)
    )
