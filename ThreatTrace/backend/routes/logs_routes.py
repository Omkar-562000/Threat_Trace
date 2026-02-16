from flask import Blueprint, request, jsonify, current_app, send_file
from datetime import datetime, timedelta
import io
import csv
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from utils.role_guard import role_required
from flask_jwt_extended import get_jwt_identity, get_jwt
from utils.security_audit import log_security_event

logs_bp = Blueprint("logs_bp", __name__)


# ---------------------------------------------------------
# Helpers
# ---------------------------------------------------------
def parse_date(d):
    """
    Safely parse YYYY-MM-DD or ISO datetime string.
    Returns datetime or None.
    """
    if not d:
        return None

    try:
        return datetime.fromisoformat(d)
    except:
        try:
            return datetime.strptime(d, "%Y-%m-%d")
        except:
            return None


def serialize_log(entry):
    """Convert MongoDB timestamp to clean ISO string."""
    ts = entry.get("timestamp")
    if isinstance(ts, datetime):
        ts = ts.isoformat()

    return {
        "timestamp": ts,
        "level": entry.get("level", "INFO"),
        "source": entry.get("source", "system"),
        "message": entry.get("message", "")
    }


# ---------------------------------------------------------
# 1️⃣ GET LOGS WITH FILTERS + PAGINATION
# ---------------------------------------------------------
@logs_bp.route("/", methods=["GET"])
def get_logs():
    try:
        db = current_app.config["DB"]
        coll = db["system_logs"]

        # Query parameters
        q = request.args.get("q", "").lower()
        level = request.args.get("level")
        source = request.args.get("source")
        date_from = parse_date(request.args.get("date_from"))
        date_to = parse_date(request.args.get("date_to"))
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", 100))

        query = {}

        # Text search (message, source, level)
        if q:
            query["$or"] = [
                {"message": {"$regex": q, "$options": "i"}},
                {"source": {"$regex": q, "$options": "i"}},
                {"level": {"$regex": q, "$options": "i"}},
            ]

        # Level filter
        if level and level != "ALL":
            query["level"] = level

        # Source filter
        if source:
            query["source"] = {"$regex": source, "$options": "i"}

        # Date filtering
        if date_from or date_to:
            tf = {}
            if date_from:
                tf["$gte"] = date_from
            if date_to:
                # include whole last day
                tf["$lte"] = date_to + timedelta(hours=23, minutes=59, seconds=59)
            query["timestamp"] = tf

        skip = (page - 1) * per_page

        cursor = (
            coll.find(query)
            .sort("timestamp", -1)
            .skip(skip)
            .limit(per_page)
        )

        logs = [serialize_log(x) for x in cursor]
        total = coll.count_documents(query)

        return jsonify({
            "status": "success",
            "logs": logs,
            "total": total,
            "page": page,
            "per_page": per_page
        }), 200

    except Exception as e:
        print("get_logs error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500


# ---------------------------------------------------------
# 2️⃣ GET DISTINCT LOG LEVELS
# ---------------------------------------------------------
@logs_bp.route("/levels", methods=["GET"])
def get_levels():
    try:
        db = current_app.config["DB"]
        coll = db["system_logs"]

        levels = coll.distinct("level")
        return jsonify({"status": "success", "levels": levels}), 200

    except Exception:
        return jsonify({
            "status": "error",
            "levels": ["INFO", "WARNING", "ERROR", "CRITICAL"]
        })


# ---------------------------------------------------------
# 3️⃣ INGEST LOG (Used internally)
# ---------------------------------------------------------
@logs_bp.route("/ingest", methods=["POST"])
def ingest_log():
    try:
        data = request.json

        db = current_app.config["DB"]
        coll = db["system_logs"]

        entry = {
            "timestamp": datetime.utcnow(),
            "level": data.get("level", "INFO"),
            "source": data.get("source", "system"),
            "message": data.get("message", "")
        }

        coll.insert_one(entry)

        # Realtime streaming → SystemLogs.jsx
        sio = current_app.config["SOCKETIO"]
        sio.emit("system_log", serialize_log(entry))

        return jsonify({"status": "success"}), 200

    except Exception as e:
        print("ingest_log error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500


# ---------------------------------------------------------
# 4️⃣ EXPORT LOGS (CSV / PDF) - Corporate & Technical Only
# ---------------------------------------------------------
@logs_bp.route("/export", methods=["GET"])
@role_required("corporate", "technical")
def export_logs():
    try:
        fmt = request.args.get("format", "csv")

        q = request.args.get("q", "").lower()
        level = request.args.get("level")
        source = request.args.get("source")

        db = current_app.config["DB"]
        coll = db["system_logs"]

        query = {}

        # Text search
        if q:
            query["$or"] = [
                {"message": {"$regex": q, "$options": "i"}},
                {"source": {"$regex": q, "$options": "i"}},
                {"level": {"$regex": q, "$options": "i"}},
            ]

        if level and level != "ALL":
            query["level"] = level

        if source:
            query["source"] = {"$regex": source, "$options": "i"}

        logs = [serialize_log(l) for l in coll.find(query).sort("timestamp", -1)]
        claims = get_jwt() or {}
        identity = get_jwt_identity()
        actor_role = claims.get("role")

        # -------------------------------------------------
        # CSV EXPORT
        # -------------------------------------------------
        if fmt == "csv":
            output = io.StringIO()
            writer = csv.writer(output)

            writer.writerow(["timestamp", "level", "source", "message"])
            for l in logs:
                writer.writerow([
                    l["timestamp"],
                    l["level"],
                    l["source"],
                    l["message"]
                ])

            output.seek(0)
            log_security_event(
                action="export_system_logs",
                status="success",
                severity="info",
                details={"format": "csv", "filters": {"q": q, "level": level, "source": source}, "rows": len(logs)},
                target="system_logs",
                user_id=str(identity) if identity is not None else None,
                role=actor_role,
                source="logs_api",
            )
            return send_file(
                io.BytesIO(output.getvalue().encode()),
                mimetype="text/csv",
                as_attachment=True,
                download_name="system_logs.csv"
            )

        # -------------------------------------------------
        # PDF EXPORT
        # -------------------------------------------------
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        c.setFont("Helvetica", 10)

        y = 750
        c.drawString(40, y, "ThreatTrace System Logs Report")
        y -= 20

        for l in logs:
            if y < 40:
                c.showPage()
                y = 750

            c.drawString(
                40, y,
                f"{l['timestamp']} | {l['level']} | {l['source']} | {l['message']}"
            )
            y -= 12

        c.save()
        buffer.seek(0)

        log_security_event(
            action="export_system_logs",
            status="success",
            severity="info",
            details={"format": "pdf", "filters": {"q": q, "level": level, "source": source}, "rows": len(logs)},
            target="system_logs",
            user_id=str(identity) if identity is not None else None,
            role=actor_role,
            source="logs_api",
        )

        return send_file(
            buffer,
            mimetype="application/pdf",
            as_attachment=True,
            download_name="system_logs.pdf"
        )

    except Exception as e:
        print("export_logs error:", e)
        log_security_event(
            action="export_system_logs",
            status="failed",
            severity="medium",
            details={"error": str(e)},
            target="system_logs",
            source="logs_api",
        )
        return jsonify({"status": "error", "message": str(e)}), 500
