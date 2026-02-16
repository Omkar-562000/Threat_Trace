import uuid
from datetime import datetime


def generate_canary_token():
    return f"CNR-{uuid.uuid4().hex[:18].upper()}"


def ensure_canary_indexes(db):
    try:
        assets = db["canary_assets"]
        triggers = db["canary_triggers"]
        allowlist = db["canary_ip_allowlist"]
        challenges = db["canary_challenges"]
        responses = db["canary_challenge_responses"]

        assets.create_index("token", unique=True)
        assets.create_index("created_at")
        assets.create_index("active")

        triggers.create_index("token")
        triggers.create_index("triggered_at")
        triggers.create_index("ip")

        allowlist.create_index("cidr")
        allowlist.create_index("active")
        allowlist.create_index("created_at")

        challenges.create_index("challenge_token", unique=True)
        challenges.create_index("canary_token")
        challenges.create_index("created_at")
        challenges.create_index("status")

        responses.create_index("challenge_token")
        responses.create_index("submitted_at")
        responses.create_index("ip")
        return True
    except Exception as e:
        print(f"canary index setup failed: {e}")
        return False


def create_canary_asset(db, name, created_by=None, asset_type="link", metadata=None):
    token = generate_canary_token()
    doc = {
        "token": token,
        "name": name or "Canary Asset",
        "asset_type": asset_type,
        "metadata": metadata or {},
        "active": True,
        "created_by": created_by,
        "created_at": datetime.utcnow(),
    }
    db["canary_assets"].insert_one(doc)
    return doc
