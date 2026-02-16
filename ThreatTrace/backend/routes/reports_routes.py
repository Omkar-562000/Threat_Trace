from flask import Blueprint, request, jsonify, current_app, send_file
from datetime import datetime
import io
import csv
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
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


def first_available_collection(*collections):
    for collection in collections:
        if collection is not None:
            return collection
    return None


def parse_date_range(date_from: str, date_to: str):
    start_dt = None
    end_dt = None

    if date_from:
        start_dt = datetime.fromisoformat(f"{date_from}T00:00:00")
    if date_to:
        end_dt = datetime.fromisoformat(f"{date_to}T23:59:59")

    if start_dt and end_dt and start_dt > end_dt:
        raise ValueError("date_from must be earlier than or equal to date_to")

    return start_dt, end_dt


def build_datetime_filter(field, start_dt, end_dt):
    if not start_dt and not end_dt:
        return {}
    cond = {}
    if start_dt:
        cond["$gte"] = start_dt
    if end_dt:
        cond["$lte"] = end_dt
    return {field: cond}


def build_iso_filter(field, start_dt, end_dt):
    if not start_dt and not end_dt:
        return {}
    cond = {}
    if start_dt:
        cond["$gte"] = start_dt.isoformat() + "Z"
    if end_dt:
        cond["$lte"] = end_dt.isoformat() + "Z"
    return {field: cond}


def build_alerts_filters(start_dt, end_dt):
    """Support alerts timestamp stored either as ISO string or datetime."""
    return (
        build_iso_filter("timestamp", start_dt, end_dt),
        build_datetime_filter("timestamp", start_dt, end_dt),
    )


def safe_sort_key(x):
    ts = x.get("timestamp")
    if isinstance(ts, datetime):
        return ts.replace(tzinfo=None).timestamp()
    if isinstance(ts, str):
        try:
            return datetime.fromisoformat(ts.replace("Z", "+00:00")).replace(tzinfo=None).timestamp()
        except ValueError:
            return float("-inf")
    return float("-inf")


def as_iso(value):
    if isinstance(value, datetime):
        return value.isoformat() + "Z"
    return value


def safe_count(collection, primary_query, fallback_query=None):
    try:
        return collection.count_documents(primary_query)
    except Exception:
        if fallback_query is not None:
            return collection.count_documents(fallback_query)
        raise


def safe_find(collection, primary_query, fallback_query=None, sort_field=None, limit=None):
    try:
        cursor = collection.find(primary_query)
        if sort_field:
            cursor = cursor.sort(sort_field, -1)
        if limit:
            cursor = cursor.limit(limit)
        return list(cursor)
    except Exception:
        if fallback_query is None:
            raise
        cursor = collection.find(fallback_query)
        if sort_field:
            cursor = cursor.sort(sort_field, -1)
        if limit:
            cursor = cursor.limit(limit)
        return list(cursor)


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

        try:
            start_dt, end_dt = parse_date_range(date_from, date_to)
        except ValueError as e:
            return jsonify({"status": "error", "message": str(e)}), 400

        alerts_filter, alerts_filter_dt = build_alerts_filters(start_dt, end_dt)
        ransomware_filter = build_datetime_filter("scan_time", start_dt, end_dt)
        audit_filter = build_datetime_filter("last_verified", start_dt, end_dt)
        logs_filter = build_datetime_filter("timestamp", start_dt, end_dt)

        alerts_col = first_available_collection(
            get_collection_safely(db, "alerts"),
            get_collection_safely(db, "system_alerts"),
        )

        ransomware_col = get_collection_safely(db, "ransomware_logs")
        audit_col = get_collection_safely(db, "audit_logs")
        logs_col = first_available_collection(
            get_collection_safely(db, "logs"),
            get_collection_safely(db, "system_logs"),
        )

        total_alerts = safe_count(alerts_col, alerts_filter, alerts_filter_dt) if alerts_col is not None else 0
        total_scans = safe_count(ransomware_col, ransomware_filter, {}) if ransomware_col is not None else 0
        total_audits = safe_count(audit_col, audit_filter, {}) if audit_col is not None else 0
        total_logs = safe_count(logs_col, logs_filter, {}) if logs_col is not None else 0

        # Alerts breakdown
        alerts_by_severity = {}
        alerts_by_source = {}
        top_threats = []

        if alerts_col is not None:
            try:
                severity_pipeline = [
                    {"$match": alerts_filter} if alerts_filter else {"$match": {}},
                    {"$group": {"_id": "$severity", "count": {"$sum": 1}}},
                ]
                for item in alerts_col.aggregate(severity_pipeline):
                    if item.get("_id"):
                        alerts_by_severity[item["_id"]] = item["count"]
            except Exception:
                severity_pipeline = [
                    {"$match": alerts_filter_dt} if alerts_filter_dt else {"$match": {}},
                    {"$group": {"_id": "$severity", "count": {"$sum": 1}}},
                ]
                for item in alerts_col.aggregate(severity_pipeline):
                    if item.get("_id"):
                        alerts_by_severity[item["_id"]] = item["count"]

            try:
                source_pipeline = [
                    {"$match": alerts_filter} if alerts_filter else {"$match": {}},
                    {"$group": {"_id": "$source", "count": {"$sum": 1}}},
                ]
                for item in alerts_col.aggregate(source_pipeline):
                    if item.get("_id"):
                        alerts_by_source[item["_id"]] = item["count"]
            except Exception:
                source_pipeline = [
                    {"$match": alerts_filter_dt} if alerts_filter_dt else {"$match": {}},
                    {"$group": {"_id": "$source", "count": {"$sum": 1}}},
                ]
                for item in alerts_col.aggregate(source_pipeline):
                    if item.get("_id"):
                        alerts_by_source[item["_id"]] = item["count"]

            top_alerts = safe_find(
                alerts_col,
                {**alerts_filter, "severity": {"$in": ["critical", "high"]}},
                {**alerts_filter_dt, "severity": {"$in": ["critical", "high"]}},
                sort_field="timestamp",
                limit=10,
            )
            for alert in top_alerts:
                alert = serialize_doc(alert)
                top_threats.append({
                    "_id": alert.get("_id"),
                    "title": alert.get("title"),
                    "message": alert.get("message"),
                    "severity": alert.get("severity"),
                    "source": alert.get("source"),
                    "status": alert.get("status"),
                    "timestamp": as_iso(alert.get("timestamp")),
                })

        # Recent activities
        recent_activities = []

        if alerts_col is not None:
            for alert in safe_find(
                alerts_col,
                alerts_filter,
                alerts_filter_dt,
                sort_field="timestamp",
                limit=5,
            ):
                recent_activities.append({
                    "message": f"{alert.get('title', 'Alert')}: {alert.get('message', '')}",
                    "timestamp": as_iso(alert.get("timestamp")),
                    "source": "alerts",
                    "severity": alert.get("severity")
                })

        if audit_col is not None:
            for audit in audit_col.find(audit_filter).sort("last_verified", -1).limit(3):
                recent_activities.append({
                    "message": f"File integrity check: {audit.get('file_path', 'Unknown')}",
                    "timestamp": as_iso(audit.get("last_verified")),
                    "source": "audit"
                })

        if ransomware_col is not None:
            for scan in ransomware_col.find(ransomware_filter).sort("scan_time", -1).limit(3):
                recent_activities.append({
                    "message": f"Ransomware scan: {scan.get('filename', 'Unknown')}",
                    "timestamp": as_iso(scan.get("scan_time")),
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
        alerts_col = first_available_collection(
            get_collection_safely(db, "alerts"),
            get_collection_safely(db, "system_alerts"),
        )

        if alerts_col is None:
            return jsonify({"status": "error", "message": "No alerts data"}), 404

        severity = request.args.get("severity", "").strip()
        status = request.args.get("status", "").strip()
        source = request.args.get("source", "").strip()
        date_from = request.args.get("date_from", "").strip()
        date_to = request.args.get("date_to", "").strip()

        try:
            start_dt, end_dt = parse_date_range(date_from, date_to)
        except ValueError as e:
            return jsonify({"status": "error", "message": str(e)}), 400

        query, query_dt = build_alerts_filters(start_dt, end_dt)

        if severity:
            query["severity"] = severity.lower()
            query_dt["severity"] = severity.lower()
        if status:
            query["status"] = status.lower()
            query_dt["status"] = status.lower()
        if source:
            query["source"] = {"$regex": source, "$options": "i"}
            query_dt["source"] = {"$regex": source, "$options": "i"}

        alerts = safe_find(
            alerts_col,
            query,
            query_dt,
            sort_field="timestamp",
            limit=10000,
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

@reports_bp.route("/export/summary/pdf", methods=["POST"])
@role_required("corporate", "technical")
def export_summary_pdf():
    try:
        db = current_app.config["DB"]
        data = request.get_json(silent=True) or {}
        date_from = data.get("date_from", "")
        date_to = data.get("date_to", "")

        try:
            start_dt, end_dt = parse_date_range(date_from, date_to)
        except ValueError as e:
            return jsonify({"status": "error", "message": str(e)}), 400

        alerts_col = first_available_collection(
            get_collection_safely(db, "alerts"),
            get_collection_safely(db, "system_alerts"),
        )
        ransomware_col = get_collection_safely(db, "ransomware_logs")
        audit_col = get_collection_safely(db, "audit_logs")
        logs_col = first_available_collection(
            get_collection_safely(db, "logs"),
            get_collection_safely(db, "system_logs"),
        )

        alerts_filter, alerts_filter_dt = build_alerts_filters(start_dt, end_dt)
        ransomware_filter = build_datetime_filter("scan_time", start_dt, end_dt)
        audit_filter = build_datetime_filter("last_verified", start_dt, end_dt)
        logs_filter = build_datetime_filter("timestamp", start_dt, end_dt)

        total_alerts = safe_count(alerts_col, alerts_filter, alerts_filter_dt) if alerts_col is not None else 0
        total_scans = safe_count(ransomware_col, ransomware_filter, {}) if ransomware_col is not None else 0
        total_audits = safe_count(audit_col, audit_filter, {}) if audit_col is not None else 0
        total_logs = safe_count(logs_col, logs_filter, {}) if logs_col is not None else 0

        by_severity = {}
        if alerts_col is not None:
            try:
                severity_pipeline = [
                    {"$match": alerts_filter} if alerts_filter else {"$match": {}},
                    {"$group": {"_id": "$severity", "count": {"$sum": 1}}},
                ]
                severity_rows = list(alerts_col.aggregate(severity_pipeline))
            except Exception:
                severity_pipeline = [
                    {"$match": alerts_filter_dt} if alerts_filter_dt else {"$match": {}},
                    {"$group": {"_id": "$severity", "count": {"$sum": 1}}},
                ]
                severity_rows = list(alerts_col.aggregate(severity_pipeline))
            by_severity = {row.get("_id", "unknown"): row.get("count", 0) for row in severity_rows if row.get("_id")}

        # Build PDF
        pdf_buffer = io.BytesIO()
        pdf = canvas.Canvas(pdf_buffer, pagesize=letter)
        width, height = letter
        y = height - 50

        def line(text, step=18):
            nonlocal y
            pdf.drawString(50, y, str(text))
            y -= step

        pdf.setFont("Helvetica-Bold", 16)
        line("ThreatTrace Security Summary Report", step=24)
        pdf.setFont("Helvetica", 10)
        line(f"Generated At: {datetime.utcnow().isoformat()}Z")
        line(f"Date Range: {date_from or '-'} to {date_to or '-'}")
        line("")

        pdf.setFont("Helvetica-Bold", 12)
        line("Overview", step=20)
        pdf.setFont("Helvetica", 11)
        line(f"Total Alerts: {total_alerts}")
        line(f"Ransomware Scans: {total_scans}")
        line(f"Integrity Audits: {total_audits}")
        line(f"System Logs: {total_logs}")
        line("")

        pdf.setFont("Helvetica-Bold", 12)
        line("Alerts By Severity", step=20)
        pdf.setFont("Helvetica", 11)
        if by_severity:
            for sev, count in by_severity.items():
                line(f"- {sev}: {count}")
        else:
            line("No alert severity data in selected range.")

        pdf.showPage()
        pdf.save()
        pdf_buffer.seek(0)

        return send_file(
            pdf_buffer,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"summary_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf",
        )

    except Exception as e:
        print("❌ export_summary_pdf error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================================
# 4️⃣ PING
# ============================================================

@reports_bp.route("/ping", methods=["GET"])
def ping():
    return jsonify({"ok": True, "msg": "reports route alive"}), 200
