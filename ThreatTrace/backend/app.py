from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager
from database.db_config import init_db
from config import Config
from flask_bcrypt import Bcrypt

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

# Initialize core extensions
socketio = SocketIO(app, cors_allowed_origins="*")
jwt = JWTManager(app)
bcrypt = Bcrypt(app)

# Initialize database
db = init_db(app)
app.config["DB"] = db  # Make DB accessible to blueprints

# Health check route
@app.route('/')
def index():
    return {"message": "ThreatTrace Backend Running"}

# Register all blueprints
try:
    # Core Modules
    from routes.logs_routes import logs_bp
    from routes.alerts_routes import alerts_bp
    from routes.auth_routes import auth_bp
    from routes.reports_routes import reports_bp

    # New Modules
    from routes.ransomware_routes import ransom_bp
    from routes.audit_routes import audit_bp

    # Register Blueprints with prefixes
    app.register_blueprint(logs_bp, url_prefix="/api/logs")
    app.register_blueprint(alerts_bp, url_prefix="/api/alerts")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")
    app.register_blueprint(ransom_bp, url_prefix="/api/ransomware")
    app.register_blueprint(audit_bp, url_prefix="/api/audit")

except Exception as e:
    print("⚠️ Blueprint registration warning:", e)

# Run Flask with SocketIO
if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=app.config.get('DEBUG', True))
