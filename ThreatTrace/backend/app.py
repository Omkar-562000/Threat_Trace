from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager
from database.db_config import init_db

app = Flask(__name__)
app.config.from_object('config.Config')
CORS(app)

socketio = SocketIO(app, cors_allowed_origins="*")
jwt = JWTManager(app)

# Initialize DB
db = init_db(app)

# Simple health route
@app.route('/')
def index():
    return {"message":"ThreatTrace Backend Running"}

# Register blueprints (placeholders)
try:
    from routes.logs_routes import logs_bp
    from routes.alerts_routes import alerts_bp
    from routes.auth_routes import auth_bp
    from routes.reports_routes import reports_bp

    app.register_blueprint(logs_bp, url_prefix="/api/logs")
    app.register_blueprint(alerts_bp, url_prefix="/api/alerts")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")
except Exception as e:
    print("Blueprints not fully implemented yet:", e)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000, debug=app.config.get('DEBUG', True))
