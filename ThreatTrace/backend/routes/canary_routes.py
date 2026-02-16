from datetime import datetime

from flask import Blueprint, jsonify, request, current_app
from flask_jwt_extended import get_jwt_identity, get_jwt

from utils.alert_manager import send_alert
from utils.canary_trap import create_canary_asset
from utils.geoip_service import geolocate_ip
from utils.role_guard import role_required
from utils.security_audit import log_security_event

canary_bp = Blueprint("canary_bp", __name__)


def _get_client_ip():
    xff = (request.headers.get("X-Forwarded-For") or "").split(",")[0].strip()
    if xff:
        return xff
    xri = (request.headers.get("X-Real-IP") or "").strip()
    if xri:
        return xri
    return request.remote_addr or "0.0.0.0"


def _serialize(doc):
    if not doc:
        return doc
    out = dict(doc)
    if "_id" in out:
        out["_id"] = str(out["_id"])
    for key in ["created_at", "triggered_at", "updated_at"]:
        if isinstance(out.get(key), datetime):
            out[key] = out[key].isoformat() + "Z"
    return out


@canary_bp.route("/assets", methods=["POST"])
@role_required("technical")
def create_asset():
    try:
        db = current_app.config["DB"]
        claims = get_jwt() or {}
        identity = get_jwt_identity()
        data = request.get_json(silent=True) or {}

        name = data.get("name", "Canary Asset")
        asset_type = data.get("asset_type", "link")
        metadata = data.get("metadata") or {}

        asset = create_canary_asset(
            db=db,
            name=name,
            created_by=str(identity) if identity is not None else None,
            asset_type=asset_type,
            metadata=metadata,
        )

        log_security_event(
            action="create_canary_asset",
            status="success",
            severity="info",
            details={"token": asset["token"], "asset_type": asset_type, "name": name},
            target="canary_assets",
            user_id=str(identity) if identity is not None else None,
            role=claims.get("role"),
            source="canary_api",
        )

        return jsonify({"status": "success", "asset": _serialize(asset)}), 201
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@canary_bp.route("/assets", methods=["GET"])
@role_required("technical")
def list_assets():
    try:
        db = current_app.config["DB"]
        rows = list(db["canary_assets"].find({}).sort("created_at", -1).limit(200))
        return jsonify({"status": "success", "assets": [_serialize(r) for r in rows]}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@canary_bp.route("/triggers", methods=["GET"])
@role_required("technical")
def list_triggers():
    try:
        db = current_app.config["DB"]
        rows = list(db["canary_triggers"].find({}).sort("triggered_at", -1).limit(500))
        return jsonify({"status": "success", "triggers": [_serialize(r) for r in rows]}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@canary_bp.route("/trap/<token>", methods=["GET"])
def trigger_canary(token):
    """
    Public-facing trap endpoint.
    It intentionally returns 404 to avoid exposing trap behavior.
    """
    try:
        db = current_app.config["DB"]
        ip = _get_client_ip()
        ua = request.headers.get("User-Agent", "")
        referrer = request.headers.get("Referer", "")
        path = request.path

        asset = db["canary_assets"].find_one({"token": token, "active": True})
        geo = geolocate_ip(ip) or {}

        trigger_doc = {
            "token": token,
            "asset_name": asset.get("name") if asset else "unknown",
            "asset_type": asset.get("asset_type") if asset else "unknown",
            "ip": ip,
            "user_agent": ua,
            "referrer": referrer,
            "path": path,
            "country": geo.get("country", "Unknown"),
            "city": geo.get("city", "Unknown"),
            "lat": geo.get("lat", 0.0),
            "lng": geo.get("lng", 0.0),
            "org": geo.get("org", ""),
            "isp": geo.get("isp", ""),
            "triggered_at": datetime.utcnow(),
        }
        db["canary_triggers"].insert_one(trigger_doc)

        # Optional location intel record for globe correlation
        db["tracked_locations"].insert_one(
            {
                "event_id": f"CAN-{token[-8:]}-{int(datetime.utcnow().timestamp())}",
                "event_type": "canary_trigger",
                "severity": "critical",
                "title": "Canary Trap Triggered",
                "message": f"Canary token {token} accessed from IP {ip}",
                "source": "canary",
                "source_ip": ip,
                "country": trigger_doc["country"],
                "city": trigger_doc["city"],
                "lat": trigger_doc["lat"],
                "lng": trigger_doc["lng"],
                "isp": trigger_doc["isp"],
                "org": trigger_doc["org"],
                "confidence": 90,
                "meta": {"token": token, "path": path, "referrer": referrer},
                "timestamp": datetime.utcnow(),
            }
        )

        send_alert(
            title="Canary Data Trap Triggered",
            message=(
                f"Canary token {token} was accessed from IP {ip} "
                f"({trigger_doc['city']}, {trigger_doc['country']})"
            ),
            severity="critical",
            source="canary",
        )

        log_security_event(
            action="canary_triggered",
            status="success",
            severity="critical",
            details={"token": token, "ip": ip, "country": trigger_doc["country"], "city": trigger_doc["city"]},
            target="canary_assets",
            source="canary_api",
        )
    except Exception as e:
        print(f"canary trigger error: {e}")

    # Always return generic not-found to avoid signaling trap details.
    return jsonify({"status": "error", "message": "Not found"}), 404
