# backend/database/db_config.py

from pymongo import MongoClient
from urllib.parse import urlparse


def init_db(app):
    """
    Initialize MongoDB connection using the URI from config.
    Safe for MongoDB Atlas and Local MongoDB installations.
    """

    mongo_uri = app.config.get("MONGO_URI")

    if not mongo_uri:
        raise Exception("❌ CRITICAL: MONGO_URI missing in environment (.env)")

    try:
        # -------------------------------
        # 1. Create MongoDB client
        # -------------------------------
        client = MongoClient(
            mongo_uri,
            serverSelectionTimeoutMS=5000,  # fail fast if DB unreachable
            socketTimeoutMS=5000
        )

        # -------------------------------
        # 2. Parse DB name from URI
        # -------------------------------
        parsed = urlparse(mongo_uri)
        db_name = parsed.path.lstrip("/")  # remove leading '/'

        if not db_name or db_name.strip() == "":
            # No DB name provided → fallback
            db_name = "threattrace"

        db = client[db_name]

        # -------------------------------
        # 3. Ping database server
        # -------------------------------
        client.admin.command("ping")
        print(f"✅ MongoDB Connected Successfully → Database: {db_name}")

        # Return the database object to Flask
        return db

    except Exception as e:
        print("❌ MongoDB Connection Failed:")
        print(f"   Error → {e}")
        print("   Ensure your MongoDB Atlas network access + password are correct.")
        raise e  # critical → stop backend from running
