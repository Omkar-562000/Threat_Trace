from datetime import datetime

from flask import Blueprint, jsonify, request, current_app
from bson import ObjectId

from utils.role_guard import role_required
from utils.security_audit import log_security_event
from flask_jwt_extended import get_jwt_identity, get_jwt

security_bp = Blueprint("security_bp", __name__)


def _serialize_doc(doc):
    if not doc:
        return doc
    out = dict(doc)
    if "_id" in out:
        out["_id"] = str(out["_id"])
    for k in ["blocked_until", "created_at", "updated_at", "timestamp", "locked_until", "last_login_at", "force_logout_after", "security_quarantine_updated_at"]:
        if isinstance(out.get(k), datetime):
            out[k] = out[k].isoformat() + "Z"
    return out


def _safe_int(value, default):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


@security_bp.route("/blocked-ips", methods=["GET"])
@role_required("technical")
def list_blocked_ips():
    try:
        db = current_app.config["DB"]
        coll = db["blocked_ips"]
        now = datetime.utcnow()
        only_active = request.args.get("active", "true").lower() == "true"

        q = {}
        if only_active:
            q["blocked_until"] = {"$gt": now}

        rows = list(coll.find(q).sort("blocked_until", -1).limit(500))
        return jsonify({"status": "success", "blocked_ips": [_serialize_doc(r) for r in rows]}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@security_bp.route("/blocked-ips/<ip>/unblock", methods=["POST"])
@role_required("technical")
def unblock_ip(ip):
    try:
        db = current_app.config["DB"]
        claims = get_jwt() or {}
        identity = get_jwt_identity()

        result = db["blocked_ips"].delete_one({"ip": ip})
        if result.deleted_count == 0:
            return jsonify({"status": "error", "message": "IP not found"}), 404

        log_security_event(
            action="unblock_ip",
            status="success",
            severity="info",
            details={"ip": ip},
            target="blocked_ips",
            user_id=str(identity) if identity is not None else None,
            role=claims.get("role"),
            source="security_api",
        )

        return jsonify({"status": "success", "message": f"IP {ip} unblocked"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@security_bp.route("/quarantined-users", methods=["GET"])
@role_required("technical")
def list_quarantined_users():
    try:
        db = current_app.config["DB"]
        coll = db["users"]
        now = datetime.utcnow()

        rows = list(
            coll.find(
                {"locked_until": {"$gt": now}},
                {
                    "name": 1,
                    "email": 1,
                    "role": 1,
                    "locked_until": 1,
                    "security_quarantine_reason": 1,
                    "security_quarantine_updated_at": 1,
                    "last_login_at": 1,
                    "last_login_ip": 1,
                },
            ).sort("locked_until", -1)
        )

        users = []
        for row in rows:
            row = _serialize_doc(row)
            row["user_id"] = row.get("_id")
            users.append(row)
        return jsonify({"status": "success", "users": users}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@security_bp.route("/quarantined-users/<user_id>/release", methods=["POST"])
@role_required("technical")
def release_quarantined_user(user_id):
    try:
        db = current_app.config["DB"]
        claims = get_jwt() or {}
        identity = get_jwt_identity()

        try:
            q = {"_id": ObjectId(user_id)}
        except Exception:
            q = {"_id": user_id}

        result = db["users"].update_one(
            q,
            {
                "$set": {
                    "locked_until": None,
                    "security_quarantine_reason": None,
                    "security_quarantine_updated_at": datetime.utcnow(),
                }
            },
        )
        if result.matched_count == 0:
            return jsonify({"status": "error", "message": "User not found"}), 404

        log_security_event(
            action="release_quarantined_user",
            status="success",
            severity="info",
            details={"user_id": user_id},
            target="users",
            user_id=str(identity) if identity is not None else None,
            role=claims.get("role"),
            source="security_api",
        )

        return jsonify({"status": "success", "message": "User quarantine released"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@security_bp.route("/audit-trail", methods=["GET"])
@role_required("technical")
def get_security_audit_trail():
    try:
        db = current_app.config["DB"]
        coll = db["security_audit_trail"]

        action = (request.args.get("action") or "").strip()
        status = (request.args.get("status") or "").strip()
        user_id = (request.args.get("user_id") or "").strip()
        page = max(1, _safe_int(request.args.get("page"), 1))
        per_page = min(200, max(1, _safe_int(request.args.get("per_page"), 50)))
        skip = (page - 1) * per_page

        q = {}
        if action:
            q["action"] = action
        if status:
            q["status"] = status
        if user_id:
            q["user_id"] = user_id

        rows = list(coll.find(q).sort("timestamp", -1).skip(skip).limit(per_page))
        total = coll.count_documents(q)

        return jsonify(
            {
                "status": "success",
                "events": [_serialize_doc(r) for r in rows],
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "pages": (total + per_page - 1) // per_page,
                },
            }
        ), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
