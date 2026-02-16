from flask import Blueprint, request, jsonify, current_app, send_file
from datetime import datetime
import io
import csv
from utils.role_guard import role_required

reports_bp = Blueprint('reports', __name__)


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


def get_collection_safely(db, collection_name):
    try:
        if collection_name in db.list_collection_names():
            return db[collection_name]
        return None
    except Exception:
        return None


def build_date_filter(date_from, date_to):
    """Safely build MongoDB datetime filter"""
    date_filter = {}

    if date_from or date_to:
        date_filter["timestamp"] = {}

        if date_from:
            try:
                date_filter["timestamp"]["$gte"] = datetime.fromisoformat(
                    date_from + "T00:00:00"
                )
            except ValueError:
                pass

        if date_to:
            try:
                date_filter["timestamp"]["$lte"] = datetime.fromisoformat(
                    date_to + "T23:59:59"
                )
            except ValueError:
                pass

        # Remove empty timestamp filter if both failed
        if not date_filter["timestamp"]:
            date_filter.pop("timestamp")

    return date_filter


def safe_sort_key(x):
    ts = x.get("timestamp")
    if isinstance(ts, datetime):
        return ts
    return datetime.min


# ============================================================
# 1️⃣ GENERATE SUMMARY REPORT
# ============================================================

@reports_bp.route("/summary", methods=["POST"])
def generate_summary_report():
    try:
        db = current_app.config["DB"]

        data = request.get_json(silent=True) or {}
        date_from = data.get("date_from", "")
        date_to = data.get("date_to", "")

        date_filter = build_date_filter(date_from, date_to)

        alerts_col = get_collection_safely(db, "alerts") or \
                     get_collection_safely(db, "system_alerts")

        ransomware_col = get_collection_safely(db, "ransomware_logs")
        audit_col = get_collection_safely(db, "audit_logs")
        logs_col = get_collection_safely(db, "logs") or \
                   get_collection_safely(db, "system_logs")

        total_alerts = alerts_col.count_documents(date_filter) if alerts_col else 0
        total_scans = ransomware_col.count_documents(date_filter) if ransomware_col else 0
        total_audits = audit_col.count_documents(date_filter) if audit_col else 0
        total_logs = logs_col.count_documents(date_filter) if logs_col else 0

        # Alerts breakdown
        alerts_by_severity = {}
        alerts_by_source = {}
        top_threats = []

        if alerts_col:
            severity_pipeline = [
                {"$match": date_filter} if date_filter else {"$match": {}},
                {"$group": {"_id": "$severity", "count": {"$sum": 1}}},
            ]

            for item in alerts_col.aggregate(severity_pipeline):
                if item.get("_id"):
                    alerts_by_severity[item["_id"]] = item["count"]

            source_pipeline = [
                {"$match": date_filter} if date_filter else {"$match": {}},
                {"$group": {"_id": "$source", "count": {"$sum": 1}}},
            ]

            for item in alerts_col.aggregate(source_pipeline):
                if item.get("_id"):
                    alerts_by_source[item["_id"]] = item["count"]

            top_cursor = alerts_col.find(
                {**date_filter, "severity": {"$in": ["critical", "high"]}}
            ).sort("timestamp", -1).limit(10)

            top_threats = [serialize_doc(alert) for alert in top_cursor]

        # Recent activities
        recent_activities = []

        if alerts_col:
            for alert in alerts_col.find(date_filter).sort("timestamp", -1).limit(5):
                recent_activities.append({
                    "message": f"{alert.get('title', 'Alert')}: {alert.get('message', '')}",
                    "timestamp": alert.get("timestamp"),
                    "source": "alerts",
                    "severity": alert.get("severity")
                })

        if audit_col:
            for audit in audit_col.find(date_filter).sort("last_verified", -1).limit(3):
                recent_activities.append({
                    "message": f"File integrity check: {audit.get('file_path', 'Unknown')}",
                    "timestamp": audit.get("last_verified"),
                    "source": "audit"
                })

        if ransomware_col:
            for scan in ransomware_col.find(date_filter).sort("scan_time", -1).limit(3):
                recent_activities.append({
                    "message": f"Ransomware scan: {scan.get('filename', 'Unknown')}",
                    "timestamp": scan.get("scan_time"),
                    "source": "ransomware"
                })

        # Safe sort (NO crash risk)
        recent_activities.sort(key=safe_sort_key, reverse=True)
        recent_activities = recent_activities[:20]

        report = {
            "generated_at": datetime.utcnow().isoformat() + "Z",
            "date_range": {"from": date_from, "to": date_to},
            "summary": {
                "total_alerts": total_alerts,
                "total_scans": total_scans,
                "total_audits": total_audits,
                "total_logs": total_logs,
            },
            "alerts_by_severity": alerts_by_severity,
            "alerts_by_source": alerts_by_source,
            "top_threats": top_threats,
            "recent_activities": recent_activities,
        }

        return jsonify({"status": "success", "report": report}), 200

    except Exception as e:
        print("❌ generate_summary_report error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================================
# 2️⃣ EXPORT ALERTS CSV
# ============================================================

@reports_bp.route("/export/alerts/csv", methods=["GET"])
@role_required("corporate", "technical")
def export_alerts_csv():
    try:
        db = current_app.config["DB"]
        alerts_col = get_collection_safely(db, "alerts") or \
                     get_collection_safely(db, "system_alerts")

        if not alerts_col:
            return jsonify({"status": "error", "message": "No alerts data"}), 404

        severity = request.args.get("severity", "").strip()
        status = request.args.get("status", "").strip()
        source = request.args.get("source", "").strip()
        date_from = request.args.get("date_from", "").strip()
        date_to = request.args.get("date_to", "").strip()

        query = build_date_filter(date_from, date_to)

        if severity:
            query["severity"] = severity.lower()
        if status:
            query["status"] = status.lower()
        if source:
            query["source"] = {"$regex": source, "$options": "i"}

        alerts = list(
            alerts_col.find(query).sort("timestamp", -1).limit(10000)
        )

        if not alerts:
            return jsonify({"status": "error", "message": "No alerts found"}), 404

        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow([
            "Timestamp", "Title", "Message", "Severity",
            "Source", "Status", "Acknowledged At",
            "Acknowledged By", "Resolved At", "Resolved By"
        ])

        for alert in alerts:
            writer.writerow([
                alert.get("timestamp", ""),
                alert.get("title", ""),
                alert.get("message", ""),
                alert.get("severity", ""),
                alert.get("source", ""),
                alert.get("status", "active"),
                alert.get("acknowledged_at", ""),
                alert.get("acknowledged_by", ""),
                alert.get("resolved_at", ""),
                alert.get("resolved_by", "")
            ])

        output.seek(0)

        return send_file(
            io.BytesIO(output.getvalue().encode("utf-8")),
            mimetype="text/csv",
            as_attachment=True,
            download_name=f"alerts_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        )

    except Exception as e:
        print("❌ export_alerts_csv error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================================
# 3️⃣ PING
# ============================================================

@reports_bp.route("/ping", methods=["GET"])
def ping():
    return jsonify({"ok": True, "msg": "reports route alive"}), 200