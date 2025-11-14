# backend/app.py

from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from database.db_config import init_db
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS
CORS(app)

# Initialize core extensions
socketio = SocketIO(app, cors_allowed_origins="*")
jwt = JWTManager(app)
bcrypt = Bcrypt(app)

# Initialize database and store reference
db = init_db(app)
app.config["DB"] = db  # global access for routes

# ----------------- BASIC HEALTH CHECK -----------------
@app.route('/')
def index():
    return {"message": "ThreatTrace Backend Running!"}


# ----------------- BLUEPRINT REGISTRATION -----------------
try:
    from routes.auth_routes import auth_bp
    from routes.ransomware_routes import ransomware_bp
    from routes.audit_routes import audit_bp
    from routes.logs_routes import logs_bp
    from routes.alerts_routes import alerts_bp
    from routes.reports_routes import reports_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(ransomware_bp, url_prefix="/api/ransomware")
    app.register_blueprint(audit_bp, url_prefix="/api/audit")
    app.register_blueprint(logs_bp, url_prefix="/api/logs")
    app.register_blueprint(alerts_bp, url_prefix="/api/alerts")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")

    print("✅ All blueprints registered successfully!")

except Exception as e:
    print("❌ Blueprint Registration Error:", e)


# ----------------- START SERVER -----------------
if __name__ == "__main__":
    socketio.run(
        app,
        host="0.0.0.0",
        port=5000,
        debug=app.config.get("DEBUG", True)
    )
