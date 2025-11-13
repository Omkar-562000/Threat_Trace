import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "threattrace-secret")
    JWT_SECRET_KEY = SECRET_KEY
    MONGO_URI = os.getenv("MONGO_URI")
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"
