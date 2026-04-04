from pathlib import Path
from dotenv import load_dotenv
import os

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env", override=True)


def _parse_bool(value, default=False):
    if value is None:
        return default
    return str(value).strip().lower() in {"1", "true", "yes", "on"}


def _parse_origins(value):
    default_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    if not value:
        return default_origins

    origins = []
    for item in value.split(","):
        normalized = item.strip().rstrip("/")
        if normalized:
            origins.append(normalized)
    return origins or default_origins


class Config:
    DEBUG = _parse_bool(os.getenv("DEBUG"), default=True)
    ENV = "development" if DEBUG else "production"

    SECRET_KEY = os.getenv("SECRET_KEY", "change_this_secret_in_production")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change_this_jwt_secret")

    MONGO_URI = os.getenv("MONGO_URI")
    if not MONGO_URI:
        raise Exception("MONGO_URI missing in backend/.env. Backend cannot run without DB.")

    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
    MAIL_USE_TLS = _parse_bool(os.getenv("MAIL_USE_TLS"), default=True)
    MAIL_USE_SSL = _parse_bool(os.getenv("MAIL_USE_SSL"), default=False)

    SOCKET_CHANNEL = os.getenv("SOCKET_CHANNEL", "alerts")
    SOCKET_ASYNC_MODE = os.getenv("SOCKET_ASYNC_MODE", "eventlet")

    HOST = os.getenv("HOST", "0.0.0.0")
    PORT = int(os.getenv("PORT", "5000"))
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    BACKEND_PUBLIC_URL = os.getenv("BACKEND_PUBLIC_URL", f"http://127.0.0.1:{PORT}").rstrip("/")
    CORS_ALLOWED_ORIGINS = _parse_origins(os.getenv("CORS_ALLOWED_ORIGINS"))

    if not MAIL_USERNAME or not MAIL_PASSWORD:
        print("WARNING: Email credentials missing. Password reset and alert emails will fail.")

    print(f"Loaded Config | DEBUG={DEBUG} | MAIL_TLS={MAIL_USE_TLS} | MAIL_SSL={MAIL_USE_SSL}")
