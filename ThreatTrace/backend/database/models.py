from datetime import datetime

def get_user_collection(db):
    return db["users"]

def serialize_user(user):
    return {
        "id": str(user["_id"]),
        "username": user["username"],
        "email": user["email"],
        "created_at": user.get("created_at", datetime.utcnow())
    }
