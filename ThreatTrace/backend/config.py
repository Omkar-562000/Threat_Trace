# backend/config.py

from dotenv import load_dotenv
import os

# Load .env file variables
load_dotenv()


class Config:
    # ---------------------- GENERAL ----------------------
    DEBUG = os.getenv("DEBUG", "True") == "True"
    ENV = "development" if DEBUG else "production"

    # ---------------------- FLASK SECRETS ----------------------
    SECRET_KEY = os.getenv("SECRET_KEY", "change_this_secret_in_production")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change_this_jwt_secret")

    # ---------------------- MONGODB CONFIG ----------------------
    MONGO_URI = os.getenv("MONGO_URI")
    if not MONGO_URI:
        raise Exception("❌ MONGO_URI missing in .env → Backend cannot run without DB")

    # ---------------------- EMAIL CONFIG ------------------------
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))

    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")

    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "True") == "True"
    MAIL_USE_SSL = os.getenv("MAIL_USE_SSL", "False") == "True"

    # ---------------------- SOCKET / SCHEDULER ------------------
    SOCKET_CHANNEL = os.getenv("SOCKET_CHANNEL", "alerts")

    # ---------------------- WARNINGS ----------------------------
    if not MAIL_USERNAME or not MAIL_PASSWORD:
        print("⚠ WARNING: Email credentials missing → Password reset + alert emails will FAIL")

    print(f"🔧 Loaded Config | DEBUG={DEBUG} | MAIL_TLS={MAIL_USE_TLS} | MAIL_SSL={MAIL_USE_SSL}")
