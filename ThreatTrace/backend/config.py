# backend/config.py

from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

class Config:
    DEBUG = True

    # ---------------------- FLASK SECRETS ----------------------
    SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey123")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwtsecret123")

    # ---------------------- MONGODB CONFIG ----------------------
    MONGO_URI = os.getenv("MONGO_URI")  # required

    # ---------------------- EMAIL CONFIG ------------------------
    # Gmail SMTP recommended
    MAIL_SERVER = os.getenv("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.getenv("MAIL_PORT", 587))

    # Gmail address & Gmail App Password
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")

    # TLS / SSL setup
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "True") == "True"
    MAIL_USE_SSL = os.getenv("MAIL_USE_SSL", "False") == "True"

    # Ensures mail only runs when credentials exist
    if not MAIL_USERNAME or not MAIL_PASSWORD:
        print("⚠ WARNING: MAIL_USERNAME or MAIL_PASSWORD missing → Email functions may fail")
