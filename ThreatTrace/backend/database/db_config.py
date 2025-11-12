from pymongo import MongoClient

def init_db(app):
    uri = app.config.get('MONGO_URI')
    client = MongoClient(uri)
    dbname = client.get_default_database().name if client.get_default_database() else 'threattrace'
    db = client[dbname]
    print("✅ MongoDB Connected:", dbname)
    return db
