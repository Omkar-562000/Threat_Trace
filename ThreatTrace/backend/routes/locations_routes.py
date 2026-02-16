from datetime import datetime, timedelta
import uuid

from flask import Blueprint, jsonify, request, current_app

from utils.geoip_service import geolocate_ip
from utils.role_guard import role_required

locations_bp = Blueprint("locations_bp", __name__)


def _safe_int(value, default):
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def _safe_float(value, default):
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _parse_iso_or_none(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
    except ValueError:
        return None


def _serialize_event(event):
    if not event:
        return event
    event = dict(event)
    if "_id" in event:
        event["_id"] = str(event["_id"])
    ts = event.get("timestamp")
    if isinstance(ts, datetime):
        event["timestamp"] = ts.isoformat() + "Z"
    return event


def _get_source_ip(req):
    # If app is behind a trusted reverse proxy, first XFF entry is original client.
    xff = (req.headers.get("X-Forwarded-For") or "").split(",")[0].strip()
    if xff:
        return xff
    xri = (req.headers.get("X-Real-IP") or "").strip()
    if xri:
        return xri
    return req.remote_addr or "0.0.0.0"


def _confidence_score(severity, is_proxy, is_hosting, is_tor, fail_count):
    score = 30

    sev = (severity or "").lower()
    if sev == "critical":
        score += 25
    elif sev == "high":
        score += 15
    elif sev == "medium":
        score += 8
    else:
        score += 3

    if is_proxy:
        score += 20
    if is_hosting:
        score += 15
    if is_tor:
        score += 25

    score += min(20, max(0, fail_count) * 2)
    return min(100, score)


@locations_bp.route("/ingest", methods=["POST"])
@role_required("personal", "corporate", "technical")
def ingest_location_event():
    try:
        db = current_app.config["DB"]
        sio = current_app.config.get("SOCKETIO")

        payload = request.get_json(silent=True) or {}
        source_ip = payload.get("source_ip") or _get_source_ip(request)
        event_type = payload.get("event_type", "suspicious_activity")
        severity = payload.get("severity", "medium").lower()
        title = payload.get("title", "Security event")
        message = payload.get("message", "Potential attacker activity detected")
        source = payload.get("source", "system")
        user_id = payload.get("user_id")
        fail_count = _safe_int(payload.get("fail_count"), 0)

        geo = geolocate_ip(source_ip) or {}

        is_proxy = bool(payload.get("is_proxy", False))
        is_hosting = bool(payload.get("is_hosting", False))
        is_tor = bool(payload.get("is_tor", False))

        confidence = _safe_int(
            payload.get("confidence"),
            _confidence_score(severity, is_proxy, is_hosting, is_tor, fail_count),
        )

        event_id = payload.get("event_id") or f"LOC-{uuid.uuid4().hex[:12].upper()}"

        doc = {
            "event_id": event_id,
            "event_type": event_type,
            "severity": severity,
            "title": title,
            "message": message,
            "source": source,
            "user_id": user_id,
            "source_ip": source_ip,
            "country": geo.get("country", "Unknown"),
            "city": geo.get("city", "Unknown"),
            "region": geo.get("region", ""),
            "lat": _safe_float(payload.get("lat"), geo.get("lat", 0.0)),
            "lng": _safe_float(payload.get("lng"), geo.get("lng", 0.0)),
            "isp": payload.get("isp") or geo.get("isp", ""),
            "org": payload.get("org") or geo.get("org", ""),
            "asn": payload.get("asn", ""),
            "is_proxy": is_proxy,
            "is_hosting": is_hosting,
            "is_tor": is_tor,
            "user_agent": payload.get("user_agent") or request.headers.get("User-Agent", ""),
            "confidence": max(0, min(100, confidence)),
            "meta": payload.get("meta") or {},
            "timestamp": datetime.utcnow(),
        }

        db["tracked_locations"].insert_one(doc)

        if sio:
            sio.emit(
                "threat_location",
                {
                    "id": event_id,
                    "event_id": event_id,
                    "lat": doc["lat"],
                    "lng": doc["lng"],
                    "city": doc["city"],
                    "country": doc["country"],
                    "severity": doc["severity"],
                    "type": doc["event_type"],
                    "count": 1,
                    "timestamp": doc["timestamp"].isoformat() + "Z",
                },
            )
            sio.emit(
                "location_event",
                {
                    "event_id": event_id,
                    "title": title,
                    "message": message,
                    "severity": severity,
                    "source_ip": source_ip,
                    "city": doc["city"],
                    "country": doc["country"],
                    "timestamp": doc["timestamp"].isoformat() + "Z",
                },
            )

        return jsonify(
            {
                "status": "success",
                "message": "Location event tracked",
                "event": _serialize_event(doc),
            }
        ), 201
    except Exception as e:
        print("ingest_location_event error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500


@locations_bp.route("/", methods=["GET"])
@role_required("personal", "corporate", "technical")
def list_location_events():
    try:
        db = current_app.config["DB"]
        coll = db["tracked_locations"]

        severity = (request.args.get("severity") or "").strip().lower()
        source = (request.args.get("source") or "").strip()
        event_type = (request.args.get("event_type") or "").strip()
        date_from = _parse_iso_or_none(request.args.get("date_from"))
        date_to = _parse_iso_or_none(request.args.get("date_to"))
        page = max(1, _safe_int(request.args.get("page"), 1))
        per_page = min(100, max(1, _safe_int(request.args.get("per_page"), 25)))

        query = {}
        if severity:
            query["severity"] = severity
        if source:
            query["source"] = {"$regex": source, "$options": "i"}
        if event_type:
            query["event_type"] = {"$regex": event_type, "$options": "i"}

        if date_from or date_to:
            ts_filter = {}
            if date_from:
                ts_filter["$gte"] = date_from
            if date_to:
                ts_filter["$lte"] = date_to
            query["timestamp"] = ts_filter

        skip = (page - 1) * per_page
        rows = list(coll.find(query).sort("timestamp", -1).skip(skip).limit(per_page))
        total = coll.count_documents(query)

        return jsonify(
            {
                "status": "success",
                "events": [_serialize_event(r) for r in rows],
                "pagination": {
                    "page": page,
                    "per_page": per_page,
                    "total": total,
                    "pages": (total + per_page - 1) // per_page,
                },
            }
        ), 200
    except Exception as e:
        print("list_location_events error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500


@locations_bp.route("/recent", methods=["GET"])
@role_required("personal", "corporate", "technical")
def recent_location_points():
    try:
        db = current_app.config["DB"]
        coll = db["tracked_locations"]

        hours = min(168, max(1, _safe_int(request.args.get("hours"), 24)))
        since = datetime.utcnow() - timedelta(hours=hours)
        rows = list(coll.find({"timestamp": {"$gte": since}}).sort("timestamp", -1).limit(500))

        points = []
        for row in rows:
            row = _serialize_event(row)
            points.append(
                {
                    "id": row.get("event_id"),
                    "event_id": row.get("event_id"),
                    "lat": row.get("lat", 0),
                    "lng": row.get("lng", 0),
                    "city": row.get("city", "Unknown"),
                    "country": row.get("country", "Unknown"),
                    "severity": row.get("severity", "medium"),
                    "type": row.get("event_type", "security_event"),
                    "count": 1,
                    "timestamp": row.get("timestamp"),
                    "confidence": row.get("confidence", 0),
                    "source_ip": row.get("source_ip", ""),
                }
            )

        return jsonify({"status": "success", "points": points, "hours": hours}), 200
    except Exception as e:
        print("recent_location_points error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500


@locations_bp.route("/<event_id>", methods=["GET"])
@role_required("personal", "corporate", "technical")
def get_location_event(event_id):
    try:
        db = current_app.config["DB"]
        row = db["tracked_locations"].find_one({"event_id": event_id})
        if not row:
            return jsonify({"status": "error", "message": "Event not found"}), 404
        return jsonify({"status": "success", "event": _serialize_event(row)}), 200
    except Exception as e:
        print("get_location_event error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500
