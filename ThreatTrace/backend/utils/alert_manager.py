# utils/alert_manager.py

from flask_socketio import emit

socketio_instance = None


def init_alert_system(socketio):
    global socketio_instance
    socketio_instance = socketio
    print("✅ Alert system initialized")


def send_alert(title, message, severity="info"):
    if not socketio_instance:
        print("⚠️ SocketIO not ready, alert not sent")
        return

    data = {
        "title": title,
        "message": message,
        "severity": severity
    }

    socketio_instance.emit("new_alert", data, broadcast=True)
    print(f"🚨 ALERT SENT: {data}")
