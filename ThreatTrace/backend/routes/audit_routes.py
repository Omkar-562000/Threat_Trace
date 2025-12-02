from flask import Blueprint, request, jsonify, current_app, send_file
import os
import io
import csv
from datetime import datetime
from werkzeug.utils import secure_filename

from utils.audit_service import verify_file_integrity
from utils.email_alerts import send_tamper_email

audit_bp = Blueprint("audit_bp", __name__)

# Allowed extensions & size limits
ALLOWED_EXTENSIONS = {".log", ".txt"}
MAX_FILE_SIZE_MB = 50
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


# ------------------------
# Helper
# ------------------------
def _is_allowed_file(filename: str) -> bool:
    _, ext = os.path.splitext(filename or "")
    return ext.lower() in ALLOWED_EXTENSIONS


# ============================================================
# 1. VERIFY BY SERVER FILE PATH
# Supports both: /verify and /verify-path (keeps frontend compatibility)
# POST payload: { "log_path": "<absolute-or-relative-path>" }
# ============================================================
@audit_bp.route("/verify", methods=["POST"])
@audit_bp.route("/verify-path", methods=["POST"])
def verify_path():
    try:
        data = request.get_json(force=True, silent=True) or {}
        log_path = data.get("log_path") or data.get("path")  # tolerant keys

        if not log_path:
            return jsonify({"status": "error", "message": "log_path required"}), 400

        # Ensure provided path exists
        if not os.path.exists(log_path):
            return jsonify({"status": "error", "message": "Log file not found"}), 404

        db = current_app.config["DB"]
        sio = current_app.config.get("SOCKETIO")

        report = verify_file_integrity(log_path, db, sio)

        # send email (best-effort) — function may accept different signatures
        if isinstance(report, dict) and report.get("tampered"):
            try:
                # attempt to call with expected args; tolerant to signature differences
                send_tamper_email(
                    report.get("file_path", log_path),
                    report.get("last_hash", ""),
                    report.get("generated_at", datetime.utcnow().isoformat() + "Z"),
                )
            except TypeError:
                # older/newer signature mismatch — try minimal call
                try:
                    send_tamper_email(report.get("file_path", log_path), report.get("last_hash", ""))
                except Exception:
                    pass
            except Exception:
                pass

        return jsonify(report), 200

    except Exception as e:
        print("verify_path error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================================
# 2. UPLOAD & VERIFY LOG FILE
# Supports both: /upload-scan and /upload-verify
# Multipart form: file -> file
# ============================================================
@audit_bp.route("/upload-scan", methods=["POST"])
@audit_bp.route("/upload-verify", methods=["POST"])
def upload_verify():
    save_path = None
    try:
        if "file" not in request.files:
            return jsonify({"status": "error", "message": "File missing"}), 400

        file = request.files["file"]
        filename = secure_filename(file.filename or "")

        if not filename:
            return jsonify({"status": "error", "message": "Invalid filename"}), 400

        if not _is_allowed_file(filename):
            return jsonify({
                "status": "error",
                "message": f"Invalid file type. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            }), 400

        # Content-length may be None for some clients; check stream size after saving if needed
        if file.content_length and file.content_length > MAX_FILE_SIZE_BYTES:
            return jsonify({
                "status": "error",
                "message": f"Max allowed file size: {MAX_FILE_SIZE_MB} MB"
            }), 400

        # Save uploaded file to temporary uploads directory
        uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
        os.makedirs(uploads_dir, exist_ok=True)

        unique_name = datetime.utcnow().strftime("%Y%m%d_%H%M%S_") + filename
        save_path = os.path.join(uploads_dir, unique_name)
        file.save(save_path)

        db = current_app.config["DB"]
        sio = current_app.config.get("SOCKETIO")

        report = verify_file_integrity(save_path, db, sio)

        # send email (best-effort)
        if isinstance(report, dict) and report.get("tampered"):
            try:
                send_tamper_email(
                    report.get("file_path", save_path),
                    report.get("last_hash", ""),
                    report.get("generated_at", datetime.utcnow().isoformat() + "Z"),
                )
            except TypeError:
                try:
                    send_tamper_email(report.get("file_path", save_path), report.get("last_hash", ""))
                except Exception:
                    pass
            except Exception:
                pass

        return jsonify(report), 200

    except Exception as e:
        print("upload_verify error:", e)
        return jsonify({"status": "error", "message": "Upload failed"}), 500

    finally:
        # Always attempt cleanup of saved uploaded file
        if save_path and os.path.exists(save_path):
            try:
                os.remove(save_path)
            except Exception:
                pass


# ============================================================
# 3. GET AUDIT HISTORY (FULL)
# ============================================================
@audit_bp.route("/history", methods=["GET"])
def history():
    try:
        db = current_app.config["DB"]
        coll = db["audit_logs"]

        records = list(coll.find({}, {"_id": 0}).sort("last_verified", -1))

        return jsonify({"status": "success", "history": records}), 200

    except Exception as e:
        print("history error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================================
# 4. GET DETAILED REPORT FOR A FILE
# Query param: file_path=<path>
# ============================================================
@audit_bp.route("/report", methods=["GET"])
def audit_report():
    try:
        file_path = request.args.get("file_path")
        if not file_path:
            return jsonify({"status": "error", "message": "file_path required"}), 400

        db = current_app.config["DB"]
        rec = db["audit_logs"].find_one({"file_path": file_path}, {"_id": 0})

        if not rec:
            return jsonify({"status": "error", "message": "Record not found"}), 404

        return jsonify({"status": "success", "report": rec}), 200

    except Exception as e:
        print("audit_report error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================================
# 5. EXPORT CSV
# Query param: file_path=<path>
# ============================================================
@audit_bp.route("/export/csv", methods=["GET"])
def export_csv():
    try:
        file_path = request.args.get("file_path")
        if not file_path:
            return jsonify({"status": "error", "message": "file_path required"}), 400

        db = current_app.config["DB"]
        rec = db["audit_logs"].find_one({"file_path": file_path}, {"_id": 0})
        if not rec:
            return jsonify({"status": "error", "message": "Record not found"}), 404

        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow(["FILE", rec.get("file_path")])
        writer.writerow(["Last Verified", rec.get("last_verified")])
        writer.writerow(["Last Hash", rec.get("last_hash")])
        writer.writerow(["Tampered", rec.get("tampered")])
        writer.writerow([])

        writer.writerow(["HISTORY"])
        writer.writerow(["Timestamp", "Tampered", "Hash"])
        for h in rec.get("history", []):
            # handle multiple timestamp formats (iso or field name)
            ts = h.get("timestamp_iso") or h.get("timestamp") or str(h.get("timestamp"))
            writer.writerow([ts, h.get("tampered"), h.get("hash")])

        output.seek(0)

        return send_file(
            io.BytesIO(output.getvalue().encode()),
            mimetype="text/csv",
            as_attachment=True,
            download_name="audit_report.csv"
        )
    except Exception as e:
        print("CSV export error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================================
# 6. EXPORT PDF (Enterprise report using reportlab if available)
# Query param: file_path=<path>
# ============================================================
@audit_bp.route("/export/pdf", methods=["GET"])
def export_pdf():
    try:
        file_path = request.args.get("file_path")
        if not file_path:
            return jsonify({"status": "error", "message": "file_path required"}), 400

        db = current_app.config["DB"]
        rec = db["audit_logs"].find_one({"file_path": file_path}, {"_id": 0})
        if not rec:
            return jsonify({"status": "error", "message": "Record not found"}), 404

        try:
            # prefer reportlab for nicer PDF
            from reportlab.lib.pagesizes import letter
            from reportlab.pdfgen import canvas

            buffer = io.BytesIO()
            c = canvas.Canvas(buffer, pagesize=letter)

            c.setFont("Helvetica-Bold", 16)
            c.drawString(40, 760, "ThreatTrace Enterprise Audit Report")

            c.setFont("Helvetica", 10)
            c.drawString(40, 740, f"File: {rec['file_path']}")
            c.drawString(40, 725, f"Last Verified: {rec.get('last_verified')}")
            c.drawString(40, 710, f"Tampered: {rec.get('tampered')}")

            y = 680
            c.drawString(40, y, "History (last 20 checks):")
            y -= 15

            for h in rec.get("history", [])[-20:]:
                if y < 40:
                    c.showPage()
                    y = 760
                ts = h.get("timestamp_iso") or h.get("timestamp") or str(h.get("timestamp"))
                c.drawString(40, y, f"{ts}  —  Tampered: {h.get('tampered')}  (Hash: {h.get('hash')})")
                y -= 12

            c.save()
            buffer.seek(0)
            return send_file(
                buffer,
                mimetype="application/pdf",
                as_attachment=True,
                download_name="audit_report.pdf"
            )
        except ImportError:
            # fallback: plain text rendered as bytes with PDF mimetype
            text = f"ThreatTrace Audit Report\n\nFile: {rec.get('file_path')}\nLast Verified: {rec.get('last_verified')}\nTampered: {rec.get('tampered')}\n\nHistory:\n"
            for h in rec.get("history", []):
                ts = h.get("timestamp_iso") or h.get("timestamp") or str(h.get("timestamp"))
                text += f"- {ts} — Tampered: {h.get('tampered')} (Hash: {h.get('hash')})\n"
            return send_file(
                io.BytesIO(text.encode("utf-8")),
                mimetype="application/pdf",
                as_attachment=True,
                download_name="audit_report.pdf"
            )

    except Exception as e:
        print("PDF export error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================================
# 7. TEST ENDPOINT
# ============================================================
@audit_bp.route("/test", methods=["GET"])
def test():
    return jsonify({"status": "success", "message": "Audit module active"}), 200
