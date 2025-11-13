from pymongo import MongoClient

def init_db(app):
    uri = app.config.get('MONGO_URI')
    client = MongoClient(uri)

    # Fix: Use explicit None check instead of truth value
    db = client.get_default_database()
    if db is None:
        db = client["threattrace"]

    try:
        client.admin.command('ping')
        print(f"✅ MongoDB Connected Successfully: {db.name}")
    except Exception as e:
        print("❌ MongoDB Connection Failed:", e)

    return db
