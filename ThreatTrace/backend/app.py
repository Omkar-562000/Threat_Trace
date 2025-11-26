# backend/app.py
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_mail import Mail
from database.db_config import init_db
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

# Initialize mail
mail = Mail(app)

# CORS
CORS(app)

# JWT & bcrypt
jwt = JWTManager(app)
bcrypt = Bcrypt(app)

# SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")
app.config["SOCKETIO"] = socketio  # make accessible to blueprints

# Database
db = init_db(app)
app.config["DB"] = db

# Import and initialize mail for auth routes (if needed)
from routes.auth_routes import auth_bp, init_mail
init_mail(app)

# Register blueprints
from routes.audit_routes import audit_bp
from routes.ransomware_routes import ransomware_bp
from routes.logs_routes import logs_bp
from routes.alerts_routes import alerts_bp
from routes.reports_routes import reports_bp
from routes.scheduler_routes import sched_bp

try:
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(audit_bp, url_prefix="/api/audit")
    app.register_blueprint(ransomware_bp, url_prefix="/api/ransomware")
    app.register_blueprint(logs_bp, url_prefix="/api/logs")
    app.register_blueprint(alerts_bp, url_prefix="/api/alerts")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")
    app.register_blueprint(sched_bp, url_prefix="/api/scheduler")
    print("✅ All blueprints registered successfully!")
except Exception as e:
    print("❌ Blueprint Registration Error:", e)

if __name__ == "__main__":
    # do NOT auto-start scheduler here (start via UI or keep commented)
    socketio.run(app, host="0.0.0.0", port=5000, debug=app.config.get("DEBUG", True))
