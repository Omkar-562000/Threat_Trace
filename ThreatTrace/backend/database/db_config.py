from pymongo import MongoClient
from urllib.parse import urlparse


def init_db(app):
    """
    Initialize MongoDB connection using the URI from config.
    Safe for MongoDB Atlas and local MongoDB installations.
    """

    mongo_uri = app.config.get("MONGO_URI")

    if not mongo_uri:
        raise Exception("CRITICAL: MONGO_URI missing in environment (.env)")

    try:
        client = MongoClient(
            mongo_uri,
            serverSelectionTimeoutMS=5000,
            socketTimeoutMS=5000,
            connectTimeoutMS=5000,
        )

        parsed = urlparse(mongo_uri)
        db_name = parsed.path.lstrip("/")

        if not db_name or db_name.strip() == "":
            db_name = "threattrace"

        db = client[db_name]

        client.admin.command("ping")
        print(f"MongoDB connected successfully | database={db_name}")

        return db

    except Exception as e:
        print("MongoDB connection failed:")
        print(f"  Error: {e}")
        print("  Check MONGO_URI, Atlas network access, DNS resolution, and database credentials.")
        raise
