# backend/routes/audit_routes.py
from flask import Blueprint, request, jsonify, current_app, send_file
import os
import hashlib
from datetime import datetime
import difflib
import io
import csv

from utils.email_alerts import send_tamper_email

audit_bp = Blueprint("audit_bp", __name__)

def calculate_file_hash(file_path):
    try:
        with open(file_path, "rb") as f:
            return hashlib.sha256(f.read()).hexdigest()
    except Exception:
        return None

# VERIFY via path (POST: log_path)
@audit_bp.route("/verify", methods=["POST"])
def verify_log():
    try:
        data = request.get_json()
        log_path = data.get("log_path")
        if not log_path or not os.path.exists(log_path):
            return jsonify({"status":"error","message":"Log file not found"}), 404

        db = current_app.config["DB"]
        coll = db["audit_logs"]

        current_hash = calculate_file_hash(log_path)
        if not current_hash:
            return jsonify({"status":"error","message":"Unable to calculate hash"}), 500

        now = datetime.utcnow()
        existing = coll.find_one({"file_path": log_path})

        diff_lines = []
        tampered = False

        if not existing:
            coll.insert_one({
                "file_path": log_path,
                "last_hash": current_hash,
                "last_verified": now,
                "tampered": False,
                "history": []
            })
            status = "new"
            message = "Log registered and verified first time."
        else:
            prev_hash = existing.get("last_hash")
            if prev_hash == current_hash:
                coll.update_one({"_id": existing["_id"]}, {"$set":{"last_verified": now, "tampered": False}})
                status = "clean"
                message = "No tampering detected."
            else:
                tampered = True
                # attempt to compute a short diff (best-effort)
                try:
                    with open(existing["file_path"], "r", errors="ignore") as oldf:
                        old_lines = oldf.readlines()
                except Exception:
                    old_lines = []

                try:
                    with open(log_path, "r", errors="ignore") as newf:
                        new_lines = newf.readlines()
                except Exception:
                    new_lines = []

                diff_lines = list(difflib.unified_diff(old_lines, new_lines, lineterm=""))
                coll.update_one({"_id": existing["_id"]}, {"$set":{"last_verified": now, "tampered": True, "last_hash": current_hash},
                                                           "$push":{"history": {"timestamp": now, "tampered": True}}})
                status = "tampered"
                message = "Log file has been modified!"

                # emit socket and email
                sio = current_app.config.get("SOCKETIO")
                if sio:
                    sio.emit("tamper_alert", {"file_path": log_path, "hash": current_hash, "timestamp": now.isoformat(), "tampered": True}, broadcast=True)
                try:
                    send_tamper_email(log_path, current_hash, now.isoformat())
                except Exception as e:
                    print("Email send error:", e)

        response = {"status": status, "message": message, "hash": current_hash}
        if diff_lines:
            response["diff"] = diff_lines[:1000]  # cap size
        return jsonify(response), 200
    except Exception as e:
        print("verify_log error:", e)
        return jsonify({"status":"error","message":str(e)}), 500

# UPLOAD + SCAN
@audit_bp.route("/upload-scan", methods=["POST"])
def upload_and_verify():
    try:
        if 'file' not in request.files:
            return jsonify({"status":"error","message":"No file uploaded"}), 400
        file = request.files['file']
        if file.filename == '':
            return jsonify({"status":"error","message":"Empty filename"}), 400

        uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
        os.makedirs(uploads_dir, exist_ok=True)
        save_name = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{file.filename}"
        save_path = os.path.join(uploads_dir, save_name)
        file.save(save_path)

        current_hash = calculate_file_hash(save_path)
        now = datetime.utcnow()

        db = current_app.config["DB"]
        coll = db["audit_logs"]
        existing = coll.find_one({"file_path": save_path})

        tampered = False
        diff_lines = []

        if not existing:
            coll.insert_one({
                "file_path": save_path,
                "last_hash": current_hash,
                "last_verified": now,
                "tampered": False,
                "history": []
            })
            status = "new"
            message = "File uploaded and registered."
        else:
            prev_hash = existing.get("last_hash")
            if prev_hash == current_hash:
                coll.update_one({"_id": existing["_id"]}, {"$set":{"last_verified": now, "tampered": False}})
                status = "clean"
                message = "No tampering detected."
            else:
                tampered = True
                try:
                    with open(existing["file_path"], "r", errors="ignore") as oldf:
                        old_lines = oldf.readlines()
                except Exception:
                    old_lines = []
                try:
                    with open(save_path, "r", errors="ignore") as newf:
                        new_lines = newf.readlines()
                except Exception:
                    new_lines = []

                diff_lines = list(difflib.unified_diff(old_lines, new_lines, lineterm=""))
                coll.update_one({"_id": existing["_id"]}, {"$set":{"last_verified": now, "tampered": True, "last_hash": current_hash},
                                                           "$push":{"history": {"timestamp": now, "tampered": True}}})
                status = "tampered"
                message = "Uploaded file differs from previous record."

        # emit and email if tampered
        if tampered:
            sio = current_app.config.get("SOCKETIO")
            if sio:
                sio.emit("tamper_alert", {"file_path": save_path, "hash": current_hash, "timestamp": now.isoformat(), "tampered": True}, broadcast=True)
            try:
                send_tamper_email(save_path, current_hash, now.isoformat())
            except Exception as e:
                print("Email send error:", e)

        # clean up uploaded file (optional)
        try:
            os.remove(save_path)
        except Exception:
            pass

        res = {"status":"success","result":{"path": save_path, "entropy": None, "suspicious": False, "reason":[]}, "message": message}
        if diff_lines:
            res["result"]["diff"] = diff_lines[:1000]
        return jsonify(res), 200
    except Exception as e:
        print("upload_and_verify error:", e)
        return jsonify({"status":"error","message":str(e)}), 500

# HISTORY
@audit_bp.route("/history", methods=["GET"])
def history():
    try:
        db = current_app.config["DB"]
        coll = db["audit_logs"]
        rows = []
        for r in coll.find({}, {"_id":0, "history":0}):
            rows.append(r)
        return jsonify({"status":"success","history":rows}), 200
    except Exception as e:
        print("history error:", e)
        return jsonify({"status":"error","message":str(e)}), 500

# REPORT for a file_path (gives detailed record)
@audit_bp.route("/report", methods=["GET"])
def report():
    try:
        file_path = request.args.get("file_path")
        if not file_path:
            return jsonify({"status":"error","message":"file_path required"}), 400
        db = current_app.config["DB"]
        coll = db["audit_logs"]
        rec = coll.find_one({"file_path": file_path}, {"_id":0})
        if not rec:
            return jsonify({"status":"error","message":"No record found"}), 404
        # enrich rec with last few diff sample lines if possible
        history = rec.get("history", [])
        # try reading small diff sample (best-effort)
        rec["history"] = history
        return jsonify({"status":"success","report":rec}), 200
    except Exception as e:
        print("report error:", e)
        return jsonify({"status":"error","message":str(e)}), 500

# DOWNLOAD CSV
@audit_bp.route("/download/csv", methods=["GET"])
def download_csv():
    try:
        file_path = request.args.get("file_path")
        if not file_path:
            return jsonify({"status":"error","message":"file_path required"}), 400
        db = current_app.config["DB"]
        coll = db["audit_logs"]
        rec = coll.find_one({"file_path": file_path}, {"_id":0})
        if not rec:
            return jsonify({"status":"error","message":"No record found"}), 404

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["file_path", "last_hash", "last_verified", "tampered"])
        writer.writerow([rec.get("file_path"), rec.get("last_hash"), rec.get("last_verified"), rec.get("tampered")])

        # history rows
        writer.writerow([])
        writer.writerow(["history_timestamp", "tampered"])
        for h in rec.get("history", []):
            writer.writerow([h.get("timestamp"), h.get("tampered")])

        output.seek(0)
        return send_file(io.BytesIO(output.getvalue().encode("utf-8")), mimetype="text/csv", as_attachment=True, download_name="audit_report.csv")
    except Exception as e:
        print("download csv error:", e)
        return jsonify({"status":"error","message":str(e)}), 500

# DOWNLOAD PDF (uses reportlab if available)
@audit_bp.route("/download/pdf", methods=["GET"])
def download_pdf():
    try:
        file_path = request.args.get("file_path")
        if not file_path:
            return jsonify({"status":"error","message":"file_path required"}), 400
        db = current_app.config["DB"]
        coll = db["audit_logs"]
        rec = coll.find_one({"file_path": file_path}, {"_id":0})
        if not rec:
            return jsonify({"status":"error","message":"No record found"}), 404

        # Attempt to use reportlab to create a basic PDF
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.pdfgen import canvas
            buffer = io.BytesIO()
            c = canvas.Canvas(buffer, pagesize=letter)
            c.setFont("Helvetica-Bold", 14)
            c.drawString(40, 750, "ThreatTrace Audit Report")
            c.setFont("Helvetica", 10)
            c.drawString(40, 730, f"File: {rec.get('file_path')}")
            c.drawString(40, 715, f"Last Verified: {rec.get('last_verified')}")
            c.drawString(40, 700, f"Last Hash: {rec.get('last_hash')}")
            c.drawString(40, 685, f"Tampered: {rec.get('tampered')}")
            y = 660
            c.drawString(40, y, "History:")
            y -= 15
            for h in rec.get("history", [])[-20:]:
                if y < 60:
                    c.showPage()
                    y = 750
                c.drawString(48, y, f"- {h.get('timestamp')} — Tampered: {h.get('tampered')}")
                y -= 12
            c.showPage()
            c.save()
            buffer.seek(0)
            return send_file(buffer, mimetype="application/pdf", as_attachment=True, download_name="audit_report.pdf")
        except Exception:
            # fallback: plain text rendered as bytes and declared PDF (basic)
            text = f"ThreatTrace Audit Report\n\nFile: {rec.get('file_path')}\nLast Verified: {rec.get('last_verified')}\nLast Hash: {rec.get('last_hash')}\nTampered: {rec.get('tampered')}\n\nHistory:\n"
            for h in rec.get("history", []):
                text += f"- {h.get('timestamp')} — Tampered: {h.get('tampered')}\n"
            return send_file(io.BytesIO(text.encode("utf-8")), mimetype="application/pdf", as_attachment=True, download_name="audit_report.pdf")
    except Exception as e:
        print("download pdf error:", e)
        return jsonify({"status":"error","message":str(e)}), 500

# Test endpoint
@audit_bp.route("/test", methods=["GET"])
def test():
    return jsonify({"message":"Audit module active"}), 200
