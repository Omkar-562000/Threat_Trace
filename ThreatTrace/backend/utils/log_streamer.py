# backend/utils/log_streamer.py
from flask_socketio import emit
import json

def emit_log_event(app, log_doc):
    """Emit a socket event to connected clients when a log is created."""
    try:
        # Ensure we use the app context to access socketio
        socketio = app.extensions.get("socketio")
        if socketio:
            payload = {
                "id": log_doc.get("id"),
                "timestamp": log_doc.get("timestamp").isoformat() if hasattr(log_doc.get("timestamp"), "isoformat") else str(log_doc.get("timestamp")),
                "level": log_doc.get("level"),
                "source": log_doc.get("source"),
                "message": log_doc.get("message"),
            }
            # emit to "system_log" channel
            socketio.emit("system_log", payload)
    except Exception as e:
        print("log_streamer.emit_log_event error:", e)
