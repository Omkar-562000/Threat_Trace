# backend/routes/system_logs_routes.py
from flask import Blueprint, request, jsonify, current_app, send_file
from datetime import datetime
import io
import csv
import os
import uuid

# If you want PDF export, install reportlab: pip install reportlab
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    REPORTLAB_AVAILABLE = True
except Exception:
    REPORTLAB_AVAILABLE = False

system_logs_bp = Blueprint("system_logs_bp", __name__)

# GET: list logs (with optional pagination)
@system_logs_bp.route("/", methods=["GET"])
def list_logs():
    db = current_app.config["DB"]
    collection = db["system_logs"]

    # optional query params
    q = request.args.get("q", "")
    page = int(request.args.get("page", 1))
    per_page = int(request.args.get("per_page", 100))

    query = {}
    if q:
        # simple text search across fields
        query["$or"] = [
            {"message": {"$regex": q, "$options": "i"}},
            {"source": {"$regex": q, "$options": "i"}},
            {"level": {"$regex": q, "$options": "i"}}
        ]

    total = collection.count_documents(query)
    cursor = collection.find(query).sort("timestamp", -1).skip((page - 1) * per_page).limit(per_page)

    logs = []
    for d in cursor:
        d["id"] = str(d.get("_id"))
        d.pop("_id", None)
        # ensure timestamp is iso string
        if isinstance(d.get("timestamp"), datetime):
            d["timestamp"] = d["timestamp"].isoformat()
        logs.append(d)

    return jsonify({"status": "success", "logs": logs, "total": total}), 200


# POST: ingest single or multiple log entries (used by system_monitor)
@system_logs_bp.route("/ingest", methods=["POST"])
def ingest_logs():
    db = current_app.config["DB"]
    collection = db["system_logs"]
    data = request.get_json() or {}

    # Accept either a list of logs or single log
    entries = data.get("logs") or [data]
    saved = []
    for entry in entries:
        # Normalize fields
        message = entry.get("message") or entry.get("msg") or ""
        level = (entry.get("level") or "INFO").upper()
        source = entry.get("source") or entry.get("source_module") or "system"
        timestamp = entry.get("timestamp")
        if timestamp:
            try:
                timestamp = datetime.fromisoformat(timestamp)
            except Exception:
                timestamp = datetime.utcnow()
        else:
            timestamp = datetime.utcnow()

        doc = {
            "message": message,
            "level": level,
            "source": source,
            "timestamp": timestamp,
            "meta": entry.get("meta", {})
        }
        res = collection.insert_one(doc)
        doc["id"] = str(res.inserted_id)
        saved.append(doc)

        # Emit socket alert for critical levels
        try:
            from utils.log_streamer import emit_log_event
            emit_log_event(current_app, doc)
        except Exception:
            # non-fatal
            pass

    # return saved list (serialize timestamps)
    for s in saved:
        s["timestamp"] = s["timestamp"].isoformat()

    return jsonify({"status": "success", "saved": saved}), 201


# GET: export (csv or pdf)
@system_logs_bp.route("/export", methods=["GET"])
def export_logs():
    db = current_app.config["DB"]
    collection = db["system_logs"]

    fmt = request.args.get("format", "csv").lower()
    q = request.args.get("q", "")

    query = {}
    if q:
        query["$or"] = [
            {"message": {"$regex": q, "$options": "i"}},
            {"source": {"$regex": q, "$options": "i"}},
            {"level": {"$regex": q, "$options": "i"}}
        ]

    cursor = collection.find(query).sort("timestamp", -1).limit(10000)

    rows = []
    for d in cursor:
        ts = d.get("timestamp")
        if isinstance(ts, datetime):
            ts = ts.isoformat()
        rows.append({
            "timestamp": ts,
            "level": d.get("level"),
            "source": d.get("source"),
            "message": d.get("message")
        })

    if fmt == "csv":
        out = io.StringIO()
        writer = csv.DictWriter(out, fieldnames=["timestamp", "level", "source", "message"])
        writer.writeheader()
        for r in rows:
            writer.writerow(r)
        out.seek(0)
        return send_file(io.BytesIO(out.getvalue().encode("utf-8")),
                         mimetype="text/csv",
                         as_attachment=True,
                         download_name=f"system_logs_{uuid.uuid4().hex[:8]}.csv")

    elif fmt == "pdf":
        if not REPORTLAB_AVAILABLE:
            return jsonify({"status": "error", "message": "PDF export requires reportlab. pip install reportlab"}), 501

        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        y = height - 40
        c.setFont("Helvetica", 10)
        c.drawString(40, y, "ThreatTrace — System Logs Export")
        y -= 20
        for r in rows:
            line = f"{r['timestamp']}  [{r['level']}] {r['source']} - {r['message']}"
            if y < 60:
                c.showPage()
                y = height - 40
                c.setFont("Helvetica", 10)
            c.drawString(40, y, line[:200])
            y -= 14
        c.save()
        buffer.seek(0)
        return send_file(buffer, mimetype="application/pdf", as_attachment=True,
                         download_name=f"system_logs_{uuid.uuid4().hex[:8]}.pdf")
    else:
        return jsonify({"status": "error", "message": "Unsupported format"}), 400
