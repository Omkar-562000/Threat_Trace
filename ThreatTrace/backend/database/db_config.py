# backend/database/db_config.py

from pymongo import MongoClient
from urllib.parse import urlparse

def init_db(app):
    mongo_uri = app.config.get("MONGO_URI")

    if not mongo_uri:
        raise Exception("❌ ERROR: MONGO_URI missing from environment variables (.env)")

    try:
        # Connect to MongoDB
        client = MongoClient(mongo_uri)

        # Parse DB name from URI
        parsed = urlparse(mongo_uri)
        db_name = parsed.path.lstrip("/")  # remove leading '/'

        # Fallback DB name
        if not db_name:
            db_name = "threattrace"

        db = client[db_name]

        # Ping MongoDB server
        client.admin.command("ping")
        print(f"⚡ MongoDB Connected Successfully → Database: {db_name}")

        return db

    except Exception as e:
        print("❌ MongoDB Connection Failed:", e)
        raise e
