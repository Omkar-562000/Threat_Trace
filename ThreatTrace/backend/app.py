# backend/app.py

from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_mail import Mail

from config import Config
from database.db_config import init_db

# ----------------------------------------------------
# APP INITIALIZATION
# ----------------------------------------------------
app = Flask(__name__)
app.config.from_object(Config)

# Email System - must be initialized AFTER config is loaded
mail = Mail(app)

# CORS (Allow React Frontend on 3000 or 5173)
CORS(app, resources={r"/*": {"origins": "*"}})

# JWT Authentication
jwt = JWTManager(app)

# Password Hashing
bcrypt = Bcrypt(app)

# WebSocket Alerts (Live notifications)
socketio = SocketIO(app, cors_allowed_origins="*")

# MongoDB Initialization
db = init_db(app)
app.config["DB"] = db


# ----------------------------------------------------
# IMPORT ROUTES AFTER MAIL IS READY
# ----------------------------------------------------
from routes.auth_routes import auth_bp, init_mail
init_mail(app)   # connect mail instance to auth_routes

# Import other modules
from routes.ransomware_routes import ransomware_bp
from routes.audit_routes import audit_bp
from routes.logs_routes import logs_bp
from routes.alerts_routes import alerts_bp
from routes.reports_routes import reports_bp


# ----------------------------------------------------
# BLUEPRINT REGISTRATION
# ----------------------------------------------------
try:
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(ransomware_bp, url_prefix="/api/ransomware")
    app.register_blueprint(audit_bp, url_prefix="/api/audit")
    app.register_blueprint(logs_bp, url_prefix="/api/logs")
    app.register_blueprint(alerts_bp, url_prefix="/api/alerts")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")

    print("✅ All blueprints registered successfully!")

except Exception as e:
    print("❌ Blueprint Registration Error:", e)


# ----------------------------------------------------
# HEALTH CHECK
# ----------------------------------------------------
@app.route("/")
def home():
    return {"message": "ThreatTrace Backend Running Successfully!"}


# ----------------------------------------------------
# SERVER START
# ----------------------------------------------------
if __name__ == "__main__":
    socketio.run(
        app,
        host="0.0.0.0",
        port=5000,
        debug=app.config.get("DEBUG", True)
    )
