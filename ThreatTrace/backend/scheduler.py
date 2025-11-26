# backend/scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
import traceback

_scheduler = None

def run_periodic_checks(app):
    with app.app_context():
        try:
            db = app.config["DB"]
            collection = db["audit_logs"]
            socketio = app.config.get("SOCKETIO")

            all_logs = list(collection.find({}))
            for entry in all_logs:
                path = entry.get("file_path")
                if not path:
                    continue

                from routes.audit_routes import calculate_file_hash
                current_hash = calculate_file_hash(path)
                now = datetime.utcnow()

                if current_hash is None:
                    collection.update_one({"_id": entry["_id"]}, {"$set": {"last_checked": now, "file_missing": True}})
                    continue

                prev_hash = entry.get("last_hash")
                tampered = (prev_hash is not None and prev_hash != current_hash)

                collection.update_one(
                    {"_id": entry["_id"]},
                    {"$set": {
                        "last_hash": current_hash,
                        "last_verified": now,
                        "tampered": tampered,
                        "file_missing": False
                    },
                     "$push": {
                         "history": {
                             "timestamp": now,
                             "last_hash": current_hash,
                             "tampered": tampered
                         }
                     }
                    }
                )

                if tampered and socketio:
                    socketio.emit("tamper_alert", {
                        "file_path": path,
                        "last_hash": current_hash,
                        "timestamp": now.isoformat(),
                        "message": "Tamper detected"
                    }, broadcast=True)

                    try:
                        from utils.email_alerts import send_tamper_email
                        send_tamper_email(path, current_hash, now.isoformat())
                    except Exception as e:
                        print("Email alert error in scheduler:", e)

        except Exception as e:
            print("Scheduler run error:", e)
            traceback.print_exc()


def init_scheduler(app, interval_seconds: int = 300):
    global _scheduler
    if _scheduler is not None:
        return _scheduler
    _scheduler = BackgroundScheduler()
    _scheduler.add_job(func=lambda: run_periodic_checks(app),
                       trigger="interval", seconds=interval_seconds,
                       id="integrity_check", replace_existing=True)
    _scheduler.start()
    app.config["SCHEDULER"] = _scheduler
    app.config["SCHEDULER_INTERVAL"] = interval_seconds
    print(f"⚙️ Scheduler started: integrity checks every {interval_seconds} seconds.")
    return _scheduler


def stop_scheduler(app):
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None
        app.config.pop("SCHEDULER", None)
        print("⚠️ Scheduler stopped.")
        return True
    return False


def run_now(app):
    try:
        run_periodic_checks(app)
        return True
    except Exception as e:
        print("❌ run_now error:", e)
        return False


def scheduler_status(app):
    global _scheduler
    if _scheduler:
        return {"running": True, "interval_seconds": app.config.get("SCHEDULER_INTERVAL", None)}
    else:
        return {"running": False, "interval_seconds": None}
