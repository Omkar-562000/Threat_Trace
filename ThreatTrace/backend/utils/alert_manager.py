"""
Unified alert manager for ThreatTrace.
Dispatches alerts to DB, email, websocket, and optional location intelligence.
"""

from datetime import datetime
import uuid

from flask import current_app

from utils.email_alerts import send_security_email
from utils.geoip_service import extract_ips_from_text, geolocate_ip

# Global SocketIO instance set from app.py
socketio_instance = None


def init_alert_system(socketio):
    global socketio_instance
    socketio_instance = socketio
    print("Alert system initialized (WebSocket ready).")


def _track_location_from_alert(alert):
    """
    Best-effort IP extraction + geolocation from alert text.
    Creates a tracked location event only when a public IP is present.
    """
    try:
        db = current_app.config["DB"]
        text = f"{alert.get('title', '')} {alert.get('message', '')}"
        ips = extract_ips_from_text(text)
        if not ips:
            return

        source_ip = ips[0]
        geo = geolocate_ip(source_ip)
        if not geo:
            return

        event_id = f"LOC-{uuid.uuid4().hex[:12].upper()}"
        doc = {
            "event_id": event_id,
            "event_type": "alert_correlation",
            "severity": alert.get("severity", "medium"),
            "title": alert.get("title", "Security alert"),
            "message": alert.get("message", ""),
            "source": alert.get("source", "system"),
            "source_ip": source_ip,
            "country": geo.get("country", "Unknown"),
            "city": geo.get("city", "Unknown"),
            "region": geo.get("region", ""),
            "lat": geo.get("lat", 0.0),
            "lng": geo.get("lng", 0.0),
            "isp": geo.get("isp", ""),
            "org": geo.get("org", ""),
            "confidence": 70,
            "meta": {"auto_tracked_from_alert": True},
            "timestamp": datetime.utcnow(),
        }
        db["tracked_locations"].insert_one(doc)

        if socketio_instance:
            socketio_instance.emit(
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
            socketio_instance.emit(
                "location_event",
                {
                    "event_id": event_id,
                    "title": doc["title"],
                    "message": doc["message"],
                    "severity": doc["severity"],
                    "source_ip": doc["source_ip"],
                    "city": doc["city"],
                    "country": doc["country"],
                    "timestamp": doc["timestamp"].isoformat() + "Z",
                },
            )
    except Exception as e:
        print(f"Location tracking from alert failed: {e}")


def send_alert(title, message, severity="info", source="system"):
    alert = {
        "title": title,
        "message": message,
        "severity": severity,
        "source": source,
        "status": "active",
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

    # 1) Save to DB
    try:
        db = current_app.config["DB"]
        db["system_alerts"].insert_one(alert)
    except Exception as e:
        print(f"Failed to store alert in DB: {e}")

    # 2) Email for high/critical
    try:
        if severity in ["high", "critical"]:
            send_security_email(title, message)
    except Exception as e:
        print(f"Email alert failed: {e}")

    # 3) Realtime socket
    try:
        if socketio_instance:
            socketio_instance.emit("new_alert", alert)
            print(f"Realtime alert sent -> {alert}")
        else:
            print("WebSocket not initialized. Skipping realtime alert.")
    except Exception as e:
        print(f"SocketIO broadcast failed: {e}")

    # 4) Location enrichment from alert text
    _track_location_from_alert(alert)

    return alert
