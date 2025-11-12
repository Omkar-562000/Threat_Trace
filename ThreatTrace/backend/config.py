import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "threattrace-secret")
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/threattrace")
    ABUSEIPDB_KEY = os.getenv("ABUSEIPDB_KEY", "")
    VT_KEY = os.getenv("VIRUSTOTAL_KEY", "")
    DEBUG = os.getenv("DEBUG", "True") == "True"
