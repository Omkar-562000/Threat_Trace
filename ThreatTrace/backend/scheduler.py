# backend/scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime
import traceback

_scheduler = None

from utils.audit_service import verify_file_integrity

def run_periodic_checks(app):
    with app.app_context():
        try:
            db = app.config["DB"]
            sio = app.config.get("SOCKETIO")
            
            # Find all registered files to check
            all_entries = list(db["audit_logs"].find({}, {"file_path": 1}))
            
            for entry in all_entries:
                file_path = entry.get("file_path")
                if not file_path:
                    continue
                
                print(f"Scheduler: Verifying {file_path}")
                try:
                    # Use the centralized service
                    verify_file_integrity(file_path, db, sio)
                except Exception as e:
                    print(f"Error verifying {file_path} in scheduler: {e}")
                    traceback.print_exc()

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
