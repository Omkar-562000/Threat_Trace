from datetime import datetime
import ipaddress
import uuid

from flask import Blueprint, jsonify, request, current_app, Response
from flask_jwt_extended import get_jwt_identity, get_jwt
from bson import ObjectId

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
    for key in [
        "created_at",
        "triggered_at",
        "updated_at",
        "submitted_at",
    ]:
        if isinstance(out.get(key), datetime):
            out[key] = out[key].isoformat() + "Z"
    return out


def _generate_challenge_token():
    return f"CHL-{uuid.uuid4().hex[:16].upper()}"


def _is_ip_allowlisted(db, ip):
    try:
        ip_obj = ipaddress.ip_address(ip)
    except Exception:
        return False

    rows = list(db["canary_ip_allowlist"].find({"active": True}))
    for row in rows:
        cidr = row.get("cidr")
        if not cidr:
            continue
        try:
            net = ipaddress.ip_network(cidr, strict=False)
            if ip_obj in net:
                return True
        except Exception:
            continue
    return False


def _challenge_html(challenge_token):
    action_url = f"/api/canary/challenge/{challenge_token}/respond"
    return f"""<!doctype html>
<html>
<head><meta charset="utf-8"><title>Document Recovery</title></head>
<body style="font-family:Arial,sans-serif;background:#0f172a;color:#e2e8f0;padding:24px;">
  <div style="max-width:680px;margin:auto;background:#111827;border:1px solid #334155;border-radius:10px;padding:20px;">
    <h2 style="margin-top:0;color:#f8fafc;">Document Access Issue</h2>
    <p>The file appears to be unsafely transferred and cannot be opened in this environment.</p>
    <p>To recover access, verify recipient details below:</p>
    <form method="post" action="{action_url}">
      <label>Name</label><br/>
      <input name="name" style="width:100%;padding:8px;margin:6px 0 12px 0;background:#020617;color:#e2e8f0;border:1px solid #334155;"><br/>
      <label>Work Email</label><br/>
      <input name="email" type="email" style="width:100%;padding:8px;margin:6px 0 12px 0;background:#020617;color:#e2e8f0;border:1px solid #334155;"><br/>
      <label>Reason for Access</label><br/>
      <textarea name="reason" rows="4" style="width:100%;padding:8px;margin:6px 0 12px 0;background:#020617;color:#e2e8f0;border:1px solid #334155;"></textarea><br/>
      <button type="submit" style="background:#f59e0b;color:#111827;border:0;padding:10px 16px;border-radius:8px;font-weight:700;">Recover Document</button>
    </form>
  </div>
</body>
</html>"""


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


@canary_bp.route("/allowlist", methods=["GET"])
@role_required("technical")
def list_allowlist():
    try:
        db = current_app.config["DB"]
        rows = list(db["canary_ip_allowlist"].find({}).sort("created_at", -1).limit(500))
        return jsonify({"status": "success", "entries": [_serialize(r) for r in rows]}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@canary_bp.route("/allowlist", methods=["POST"])
@role_required("technical")
def add_allowlist():
    try:
        db = current_app.config["DB"]
        claims = get_jwt() or {}
        identity = get_jwt_identity()
        data = request.get_json(silent=True) or {}
        cidr = (data.get("cidr") or "").strip()
        label = (data.get("label") or "").strip() or "Trusted Source"
        if not cidr:
            return jsonify({"status": "error", "message": "cidr is required"}), 400

        # Validate network syntax early.
        ipaddress.ip_network(cidr, strict=False)

        doc = {
            "cidr": cidr,
            "label": label,
            "active": True,
            "created_at": datetime.utcnow(),
            "created_by": str(identity) if identity is not None else None,
        }
        db["canary_ip_allowlist"].insert_one(doc)

        log_security_event(
            action="add_canary_allowlist_entry",
            status="success",
            severity="info",
            details={"cidr": cidr, "label": label},
            target="canary_ip_allowlist",
            user_id=str(identity) if identity is not None else None,
            role=claims.get("role"),
            source="canary_api",
        )
        return jsonify({"status": "success", "entry": _serialize(doc)}), 201
    except ValueError:
        return jsonify({"status": "error", "message": "Invalid CIDR/IP format"}), 400
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@canary_bp.route("/allowlist/<entry_id>", methods=["DELETE"])
@role_required("technical")
def delete_allowlist(entry_id):
    try:
        db = current_app.config["DB"]
        claims = get_jwt() or {}
        identity = get_jwt_identity()
        try:
            q = {"_id": ObjectId(entry_id)}
        except Exception:
            return jsonify({"status": "error", "message": "Invalid entry id"}), 400

        row = db["canary_ip_allowlist"].find_one(q)
        if not row:
            return jsonify({"status": "error", "message": "Entry not found"}), 404
        db["canary_ip_allowlist"].delete_one(q)

        log_security_event(
            action="delete_canary_allowlist_entry",
            status="success",
            severity="info",
            details={"cidr": row.get("cidr"), "label": row.get("label")},
            target="canary_ip_allowlist",
            user_id=str(identity) if identity is not None else None,
            role=claims.get("role"),
            source="canary_api",
        )
        return jsonify({"status": "success", "message": "Allowlist entry removed"}), 200
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


@canary_bp.route("/challenge-responses", methods=["GET"])
@role_required("technical")
def list_challenge_responses():
    try:
        db = current_app.config["DB"]
        rows = list(db["canary_challenge_responses"].find({}).sort("submitted_at", -1).limit(500))
        return jsonify({"status": "success", "responses": [_serialize(r) for r in rows]}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@canary_bp.route("/challenge/<challenge_token>", methods=["GET"])
def challenge_page(challenge_token):
    try:
        db = current_app.config["DB"]
        row = db["canary_challenges"].find_one({"challenge_token": challenge_token, "status": "open"})
        if not row:
            return jsonify({"status": "error", "message": "Not found"}), 404
        return Response(_challenge_html(challenge_token), status=200, mimetype="text/html")
    except Exception:
        return jsonify({"status": "error", "message": "Not found"}), 404


@canary_bp.route("/challenge/<challenge_token>/respond", methods=["POST"])
def challenge_respond(challenge_token):
    try:
        db = current_app.config["DB"]
        ip = _get_client_ip()
        ua = request.headers.get("User-Agent", "")

        challenge = db["canary_challenges"].find_one({"challenge_token": challenge_token})
        if not challenge:
            return jsonify({"status": "error", "message": "Not found"}), 404

        data = request.get_json(silent=True)
        if data is None:
            data = {
                "name": request.form.get("name", ""),
                "email": request.form.get("email", ""),
                "reason": request.form.get("reason", ""),
            }

        response_doc = {
            "challenge_token": challenge_token,
            "token": challenge.get("canary_token"),
            "ip": ip,
            "user_agent": ua,
            "submitted_at": datetime.utcnow(),
            "response": {
                "name": data.get("name", ""),
                "email": data.get("email", ""),
                "reason": data.get("reason", ""),
            },
        }
        db["canary_challenge_responses"].insert_one(response_doc)
        db["canary_challenges"].update_one(
            {"challenge_token": challenge_token},
            {"$set": {"status": "completed", "updated_at": datetime.utcnow()}},
        )

        send_alert(
            title="Canary Challenge Response Captured",
            message=(
                f"Challenge {challenge_token} response captured from IP {ip} "
                f"for token {challenge.get('canary_token')}"
            ),
            severity="high",
            source="canary",
        )
        log_security_event(
            action="canary_challenge_response",
            status="success",
            severity="high",
            details={
                "challenge_token": challenge_token,
                "token": challenge.get("canary_token"),
                "ip": ip,
                "provided_email": response_doc["response"]["email"],
            },
            target="canary_challenge_responses",
            source="canary_api",
        )

        return Response(
            "<html><body><p>Recovery request submitted. Please wait for verification.</p></body></html>",
            status=200,
            mimetype="text/html",
        )
    except Exception:
        return jsonify({"status": "error", "message": "Failed"}), 500


@canary_bp.route("/trap/<token>", methods=["GET"])
def trigger_canary(token):
    """
    Public-facing trap endpoint.
    Trusted IP -> generic 404 stealth.
    Untrusted IP -> deceptive recovery challenge page.
    """
    try:
        db = current_app.config["DB"]
        ip = _get_client_ip()
        ua = request.headers.get("User-Agent", "")
        referrer = request.headers.get("Referer", "")
        path = request.path

        asset = db["canary_assets"].find_one({"token": token, "active": True})
        geo = geolocate_ip(ip) or {}
        trusted = _is_ip_allowlisted(db, ip)

        trigger_doc = {
            "token": token,
            "asset_name": asset.get("name") if asset else "unknown",
            "asset_type": asset.get("asset_type") if asset else "unknown",
            "ip": ip,
            "trusted_ip": trusted,
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

        # Location intel correlation
        db["tracked_locations"].insert_one(
            {
                "event_id": f"CAN-{token[-8:]}-{int(datetime.utcnow().timestamp())}",
                "event_type": "canary_trigger",
                "severity": "critical" if not trusted else "high",
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
                "confidence": 90 if not trusted else 70,
                "meta": {"token": token, "path": path, "referrer": referrer, "trusted_ip": trusted},
                "timestamp": datetime.utcnow(),
            }
        )

        send_alert(
            title="Canary Data Trap Triggered",
            message=(
                f"Canary token {token} accessed from IP {ip} "
                f"({trigger_doc['city']}, {trigger_doc['country']}) | trusted={trusted}"
            ),
            severity="critical" if not trusted else "high",
            source="canary",
        )

        log_security_event(
            action="canary_triggered",
            status="success",
            severity="critical" if not trusted else "high",
            details={
                "token": token,
                "ip": ip,
                "country": trigger_doc["country"],
                "city": trigger_doc["city"],
                "trusted_ip": trusted,
            },
            target="canary_assets",
            source="canary_api",
        )

        if not trusted:
            challenge_token = _generate_challenge_token()
            db["canary_challenges"].insert_one(
                {
                    "challenge_token": challenge_token,
                    "canary_token": token,
                    "ip": ip,
                    "status": "open",
                    "created_at": datetime.utcnow(),
                }
            )
            return Response(_challenge_html(challenge_token), status=200, mimetype="text/html")
    except Exception as e:
        print(f"canary trigger error: {e}")

    # Trusted/failed path: keep stealth with generic not-found.
    return jsonify({"status": "error", "message": "Not found"}), 404
