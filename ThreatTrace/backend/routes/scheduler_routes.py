# backend/routes/scheduler_routes.py
from flask import Blueprint, jsonify, current_app, request
from scheduler import init_scheduler, stop_scheduler, run_now, scheduler_status
from utils.role_guard import role_required

scheduler_bp = Blueprint("scheduler_bp", __name__)
MIN_INTERVAL_SECONDS = 60
MAX_INTERVAL_SECONDS = 86400

@scheduler_bp.route("/start", methods=["POST"])
@role_required("technical")
def start_scheduler():
    try:
        data = request.get_json() or {}
        interval = int(data.get("interval_seconds", 300))
        if interval < MIN_INTERVAL_SECONDS or interval > MAX_INTERVAL_SECONDS:
            return jsonify({
                "status": "error",
                "message": f"interval_seconds must be between {MIN_INTERVAL_SECONDS} and {MAX_INTERVAL_SECONDS}"
            }), 400

        init_scheduler(current_app, interval_seconds=interval)
        return jsonify({"status":"success","message":"Scheduler started","interval_seconds":interval}), 200
    except Exception as e:
        print("start scheduler error:", e)
        return jsonify({"status":"error","message":str(e)}), 500

@scheduler_bp.route("/stop", methods=["POST"])
@role_required("technical")
def stop():
    try:
        ok = stop_scheduler(current_app)
        if ok:
            return jsonify({"status":"success","message":"Scheduler stopped"}), 200
        return jsonify({"status":"error","message":"Scheduler not running"}), 400
    except Exception as e:
        print("stop scheduler error:", e)
        return jsonify({"status":"error","message":str(e)}), 500

@scheduler_bp.route("/run-now", methods=["POST"])
@role_required("technical")
def trigger_now():
    try:
        ok = run_now(current_app)
        if ok:
            return jsonify({"status":"success","message":"Run executed"}), 200
        return jsonify({"status":"error","message":"Run failed"}), 500
    except Exception as e:
        print("run now error:", e)
        return jsonify({"status":"error","message":str(e)}), 500

@scheduler_bp.route("/status", methods=["GET"])
def status():
    try:
        s = scheduler_status(current_app)
        return jsonify({"status":"success","scheduler":s}), 200
    except Exception as e:
        print("status error:", e)
        return jsonify({"status":"error","message":str(e)}), 500
