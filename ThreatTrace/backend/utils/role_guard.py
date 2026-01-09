from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from flask import jsonify

def role_required(*allowed_roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()

            identity = get_jwt_identity()
            role = identity.get("role") if isinstance(identity, dict) else None

            if role not in allowed_roles:
                return jsonify({
                    "status": "error",
                    "message": "Access denied: insufficient permissions"
                }), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator
