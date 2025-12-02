"""
===========================================================
   ThreatTrace — Enterprise Unified Alert Manager
===========================================================

This module provides a single standardized alert pipeline:

    🔥 1. WebSocket real-time alerts  → frontend (Toast + Alerts UI)
    ✉️ 2. Email notifications         → Admin mailbox
    🗄️ 3. MongoDB persistent storage   → Alerts dashboard

Used by:
    • Ransomware detection engine
    • Audit file-integrity checker
    • System logs anomaly streams
    • Future ML threat-detection module

All alerts flow through send_alert().
"""

from datetime import datetime
from flask import current_app
from utils.email_alerts import send_security_email

# Global SocketIO instance set from app.py
socketio_instance = None


# -------------------------------------------------------------
# INITIALIZE ALERT SYSTEM (Called from app.py)
# -------------------------------------------------------------
def init_alert_system(socketio):
    """
    Stores a reference to the SocketIO instance for global alert broadcasting.
    """
    global socketio_instance
    socketio_instance = socketio
    print("✅ Alert system initialized (WebSocket ready).")


# -------------------------------------------------------------
# UNIFIED ALERT DISPATCHER
# -------------------------------------------------------------
def send_alert(title, message, severity="info", source="system"):
    """
    Sends a complete alert packet through:
        1️⃣ WebSocket (real-time popups)
        2️⃣ Email (high severity only)
        3️⃣ MongoDB alerts collection

    Args:
        title: short alert title
        message: human-readable explanation
        severity: "info" | "warning" | "high" | "critical"
        source: module ("audit", "ransomware", "system", ...)
    """

    alert = {
        "title": title,
        "message": message,
        "severity": severity,
        "source": source,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }

    # ---------------------------------------------------------
    # 1️⃣ SAVE TO DATABASE
    # ---------------------------------------------------------
    try:
        db = current_app.config["DB"]
        db["system_alerts"].insert_one(alert)
    except Exception as e:
        print(f"⚠️ Failed to store alert in DB: {e}")

    # ---------------------------------------------------------
    # 2️⃣ EMAIL NOTIFICATION (High severity only)
    # ---------------------------------------------------------
    try:
        if severity in ["high", "critical"]:
            send_security_email(title, message)
    except Exception as e:
        print(f"⚠️ Email alert failed: {e}")

    # ---------------------------------------------------------
    # 3️⃣ REAL-TIME WEBSOCKET EMIT
    # ---------------------------------------------------------
    try:
        if socketio_instance:
            socketio_instance.emit("new_alert", alert, broadcast=True)
            print(f"🚨 REAL-TIME ALERT SENT → {alert}")
        else:
            print("⚠️ WebSocket not initialized. (Skipping realtime alert)")
    except Exception as e:
        print(f"⚠️ SocketIO broadcast failed: {e}")

    return alert
