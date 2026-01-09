# backend/routes/scheduler_routes.py
from flask import Blueprint, jsonify, current_app, request
from scheduler import init_scheduler, stop_scheduler, run_now, scheduler_status
from utils.role_guard import role_required

scheduler_bp = Blueprint("scheduler_bp", __name__)

@scheduler_bp.route("/start", methods=["POST"])
def start_scheduler():
    try:
        data = request.get_json() or {}
        interval = int(data.get("interval_seconds", 300))
        init_scheduler(current_app, interval_seconds=interval)
        return jsonify({"status":"success","message":"Scheduler started","interval_seconds":interval}), 200
    except Exception as e:
        print("start scheduler error:", e)
        return jsonify({"status":"error","message":str(e)}), 500

@scheduler_bp.route("/stop", methods=["POST"])
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

@scheduler_bp.route("/start", methods=["POST"])
@role_required("corporate")
def start_scheduler():

@scheduler_bp.route("/stop", methods=["POST"])
@role_required("corporate")
def stop():

@scheduler_bp.route("/run-now", methods=["POST"])
@role_required("corporate")
def trigger_now():