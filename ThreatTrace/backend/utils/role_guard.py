from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt, get_jwt_identity
from flask import jsonify
from utils.security_audit import log_security_event

def role_required(*allowed_roles):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()

            claims = get_jwt() or {}
            identity = get_jwt_identity()
            role = claims.get("role")

            # Backward compatibility for older tokens where role was placed in identity.
            if role is None and isinstance(identity, dict):
                role = identity.get("role")

            if role not in allowed_roles:
                log_security_event(
                    action="authorization_denied",
                    status="denied",
                    severity="medium",
                    details={
                        "required_roles": list(allowed_roles),
                        "provided_role": role,
                        "endpoint": fn.__name__,
                    },
                    user_id=str(identity) if identity is not None else None,
                    role=role,
                    source="authz",
                )
                return jsonify({
                    "status": "error",
                    "message": "Access denied: insufficient permissions"
                }), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator
