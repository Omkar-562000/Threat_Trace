import hashlib
import json
import uuid
from datetime import datetime, timedelta

from flask import current_app, request
from bson import ObjectId

from utils.alert_manager import send_alert

_anomaly_cooldowns = {}
_ANOMALY_COOLDOWN_MINUTES = 10
_AUTO_BLOCK_MINUTES = 30
_AUTO_QUARANTINE_MINUTES = 30


def _get_client_ip():
    xff = (request.headers.get("X-Forwarded-For") or "").split(",")[0].strip()
    if xff:
        return xff
    xri = (request.headers.get("X-Real-IP") or "").strip()
    if xri:
        return xri
    return request.remote_addr or "0.0.0.0"


def _stable_json(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), default=str)


def _hash_event(prev_hash, payload):
    base = f"{prev_hash}|{_stable_json(payload)}"
    return hashlib.sha256(base.encode("utf-8")).hexdigest()


def _cooldown_ok(key):
    now = datetime.utcnow()
    last_seen = _anomaly_cooldowns.get(key)
    if last_seen and (now - last_seen) < timedelta(minutes=_ANOMALY_COOLDOWN_MINUTES):
        return False
    _anomaly_cooldowns[key] = now
    return True


def _emit_anomaly_alert(title, message, severity="high"):
    try:
        send_alert(title=title, message=message, severity=severity, source="security_audit")
    except Exception as e:
        print(f"security anomaly alert emit failed: {e}")


def _block_ip(db, ip, reason, minutes=_AUTO_BLOCK_MINUTES):
    try:
        if not ip:
            return False
        until = datetime.utcnow() + timedelta(minutes=minutes)
        db["blocked_ips"].update_one(
            {"ip": ip},
            {
                "$set": {
                    "ip": ip,
                    "reason": reason,
                    "blocked_until": until,
                    "updated_at": datetime.utcnow(),
                },
                "$setOnInsert": {"created_at": datetime.utcnow()},
            },
            upsert=True,
        )
        return True
    except Exception as e:
        print(f"ip block failed: {e}")
        return False


def _quarantine_user(db, user_id, reason, minutes=_AUTO_QUARANTINE_MINUTES):
    try:
        if not user_id:
            return False
        until = datetime.utcnow() + timedelta(minutes=minutes)
        try:
            oid = ObjectId(str(user_id))
            q = {"_id": oid}
        except Exception:
            q = {"_id": user_id}

        db["users"].update_one(
            q,
            {
                "$set": {
                    "locked_until": until,
                    "force_logout_after": datetime.utcnow(),
                    "security_quarantine_reason": reason,
                    "security_quarantine_updated_at": datetime.utcnow(),
                }
            },
        )
        return True
    except Exception as e:
        print(f"user quarantine failed: {e}")
        return False


def _evaluate_anomalies(db, entry):
    """
    Evaluate live anomaly patterns from append-only security audit events.
    """
    try:
        coll = db["security_audit_trail"]
        now = datetime.utcnow()

        action = entry.get("action")
        ip = entry.get("ip")
        user_id = entry.get("user_id")
        role = entry.get("role")

        # 1) Brute-force pattern: many failed login attempts from same IP in short window
        if action == "login_attempt" and entry.get("status") == "failed" and ip:
            since = now - timedelta(minutes=10)
            failed_count = coll.count_documents(
                {
                    "action": "login_attempt",
                    "status": "failed",
                    "ip": ip,
                    "timestamp": {"$gte": since},
                }
            )
            key = f"bf:{ip}"
            if failed_count >= 8 and _cooldown_ok(key):
                _emit_anomaly_alert(
                    title="Brute-force Pattern Detected",
                    message=f"{failed_count} failed login attempts from IP {ip} in 10 minutes",
                    severity="critical",
                )
                _block_ip(db, ip, "auto_containment_bruteforce")

        # 2) Mass export pattern by same account
        export_actions = {"export_system_logs", "export_alerts_report", "export_summary_report", "export_audit_report"}
        if action in export_actions and entry.get("status") == "success" and user_id:
            since = now - timedelta(minutes=15)
            export_count = coll.count_documents(
                {
                    "action": {"$in": list(export_actions)},
                    "status": "success",
                    "user_id": user_id,
                    "timestamp": {"$gte": since},
                }
            )
            key = f"export:{user_id}"
            if export_count >= 5 and _cooldown_ok(key):
                _emit_anomaly_alert(
                    title="Mass Data Export Activity",
                    message=(
                        f"User {user_id} ({role or 'unknown-role'}) executed "
                        f"{export_count} exports in 15 minutes"
                    ),
                    severity="high",
                )
                _quarantine_user(db, user_id, "auto_containment_mass_export")

        # 3) Repeated authorization denials from same IP (permission probing)
        if action == "authorization_denied" and ip:
            since = now - timedelta(minutes=10)
            denied_count = coll.count_documents(
                {
                    "action": "authorization_denied",
                    "ip": ip,
                    "timestamp": {"$gte": since},
                }
            )
            key = f"denied:{ip}"
            if denied_count >= 6 and _cooldown_ok(key):
                _emit_anomaly_alert(
                    title="Permission-Probing Activity",
                    message=f"{denied_count} authorization denials from IP {ip} in 10 minutes",
                    severity="high",
                )
                _block_ip(db, ip, "auto_containment_permission_probing")

        # 4) High-risk destructive operations clustering by account
        destructive_actions = {"delete_alert", "bulk_resolve_alerts"}
        if action in destructive_actions and entry.get("status") == "success" and user_id:
            since = now - timedelta(minutes=10)
            destructive_count = coll.count_documents(
                {
                    "action": {"$in": list(destructive_actions)},
                    "status": "success",
                    "user_id": user_id,
                    "timestamp": {"$gte": since},
                }
            )
            key = f"destructive:{user_id}"
            if destructive_count >= 3 and _cooldown_ok(key):
                _emit_anomaly_alert(
                    title="High-Risk Alert Manipulation Burst",
                    message=f"User {user_id} performed {destructive_count} destructive alert actions in 10 minutes",
                    severity="critical",
                )
                _quarantine_user(db, user_id, "auto_containment_destructive_burst")
    except Exception as e:
        print(f"security anomaly evaluation failed: {e}")


def log_security_event(
    action,
    status="success",
    severity="info",
    details=None,
    target=None,
    user_id=None,
    role=None,
    source="api",
):
    """
    Append-only, hash-chained security audit entry.
    Best effort: never raises to caller.
    """
    try:
        db = current_app.config["DB"]
        coll = db["security_audit_trail"]

        prev = coll.find_one(sort=[("timestamp", -1)])
        prev_hash = prev.get("event_hash", "GENESIS") if prev else "GENESIS"

        payload = {
            "event_id": f"AUD-{uuid.uuid4().hex[:14].upper()}",
            "timestamp": datetime.utcnow(),
            "action": action,
            "status": status,
            "severity": severity,
            "source": source,
            "target": target,
            "user_id": user_id,
            "role": role,
            "ip": _get_client_ip(),
            "user_agent": request.headers.get("User-Agent", ""),
            "details": details or {},
            "prev_hash": prev_hash,
        }
        payload["event_hash"] = _hash_event(prev_hash, payload)

        coll.insert_one(payload)
        _evaluate_anomalies(db, payload)
    except Exception as e:
        print(f"security audit log failed: {e}")


def ensure_security_audit_indexes(db):
    try:
        coll = db["security_audit_trail"]
        coll.create_index("timestamp")
        coll.create_index("action")
        coll.create_index("status")
        coll.create_index("user_id")
        coll.create_index("ip")
        coll.create_index([("action", 1), ("timestamp", -1)])
        coll.create_index([("user_id", 1), ("timestamp", -1)])
        coll.create_index("event_id", unique=True)

        # Runtime containment indexes
        blocked = db["blocked_ips"]
        blocked.create_index("ip", unique=True)
        blocked.create_index("blocked_until")
        blocked.create_index("updated_at")

        revoked = db["revoked_tokens"]
        revoked.create_index("jti", unique=True)
        revoked.create_index("revoked")
        revoked.create_index("updated_at")

        return True
    except Exception as e:
        print(f"security audit index setup failed: {e}")
        return False
