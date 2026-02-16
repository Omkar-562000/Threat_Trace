from flask import Blueprint, request, jsonify, current_app, send_file
import os
import io
import csv
from datetime import datetime
from werkzeug.utils import secure_filename

from utils.audit_service import verify_file_integrity
from utils.role_guard import role_required
from flask_jwt_extended import get_jwt_identity, get_jwt
from utils.security_audit import log_security_event


audit_bp = Blueprint("audit_bp", __name__)

ALLOWED_EXTENSIONS = {".log", ".txt"}
MAX_FILE_SIZE_MB = 50
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


def _is_allowed_file(filename: str) -> bool:
    _, ext = os.path.splitext(filename or "")
    return ext.lower() in ALLOWED_EXTENSIONS


# ============================================================
# 1️⃣ VERIFY BY SERVER FILE PATH (POST /verify-path)
# ============================================================
@audit_bp.route("/verify-path", methods=["POST"])
@role_required("personal", "corporate", "technical")
def verify_path():
    try:
        data = request.get_json(force=True, silent=True) or {}
        log_path = data.get("log_path")

        if not log_path:
            return jsonify({"status": "error", "message": "log_path required"}), 400

        if not os.path.exists(log_path):
            return jsonify({"status": "error", "message": "File not found"}), 404

        db = current_app.config["DB"]
        sio = current_app.config["SOCKETIO"]

        report = verify_file_integrity(log_path, db, sio)

        return jsonify(report), 200

    except Exception as e:
        print("verify_path error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================================
# 2️⃣ UPLOAD → VERIFY (POST /upload-verify)
# ============================================================
@audit_bp.route("/upload-verify", methods=["POST"])
@role_required("personal", "corporate", "technical")
def upload_verify():
    saved_path = None
    try:
        if "file" not in request.files:
            return jsonify({"status": "error", "message": "file missing"}), 400

        file = request.files["file"]
        filename = secure_filename(file.filename)

        if not filename:
            return jsonify({"status": "error", "message": "Invalid filename"}), 400

        if not _is_allowed_file(filename):
            return jsonify({
                "status": "error",
                "message": "Invalid file type. Allowed: .log, .txt"
            }), 400

        # size check
        if file.content_length and file.content_length > MAX_FILE_SIZE_BYTES:
            return jsonify({
                "status": "error",
                "message": f"File exceeds {MAX_FILE_SIZE_MB}MB"
            }), 400

        # save temp file
        upload_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
        os.makedirs(upload_dir, exist_ok=True)

        unique = datetime.utcnow().strftime("%Y%m%d_%H%M%S_") + filename
        saved_path = os.path.join(upload_dir, unique)
        file.save(saved_path)

        db = current_app.config["DB"]
        sio = current_app.config["SOCKETIO"]
        report = verify_file_integrity(saved_path, db, sio)

        return jsonify(report), 200

    except Exception as e:
        print("upload_verify error:", e)
        return jsonify({"status": "error", "message": "Upload failed"}), 500

    finally:
        if saved_path and os.path.exists(saved_path):
            try:
                os.remove(saved_path)
            except Exception:
                pass


# ============================================================
# 3️⃣ AUDIT HISTORY (GET /history)
# ============================================================
@audit_bp.route("/history", methods=["GET"])
@role_required("personal", "corporate", "technical")
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
# 4️⃣ DETAILED REPORT (GET /report)
# ============================================================
@audit_bp.route("/report", methods=["GET"])
@role_required("personal", "corporate", "technical")
def audit_report():
    try:
        file_path = request.args.get("file_path")
        if not file_path:
            return jsonify({"status": "error", "message": "file_path required"}), 400

        db = current_app.config["DB"]
        rec = db["audit_logs"].find_one({"file_path": file_path}, {"_id": 0})

        if not rec:
            return jsonify({"status": "error", "message": "No record found"}), 404

        return jsonify({"status": "success", "report": rec}), 200

    except Exception as e:
        print("audit_report error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================================
# 5️⃣ EXPORT CSV (Corporate & Technical Only)
# ============================================================
@audit_bp.route("/export/csv", methods=["GET"])
@role_required("corporate", "technical")
def export_csv():
    try:
        claims = get_jwt() or {}
        identity = get_jwt_identity()
        file_path = request.args.get("file_path")
        if not file_path:
            return jsonify({"status": "error", "message": "file_path required"}), 400

        db = current_app.config["DB"]
        rec = db["audit_logs"].find_one({"file_path": file_path}, {"_id": 0})

        if not rec:
            return jsonify({"status": "error", "message": "No record found"}), 404

        output = io.StringIO()
        writer = csv.writer(output)

        writer.writerow(["FILE", rec.get("file_path")])
        writer.writerow(["LAST VERIFIED", rec.get("last_verified")])
        writer.writerow(["LAST HASH", rec.get("last_hash")])
        writer.writerow(["TAMPERED", rec.get("tampered")])
        writer.writerow([])
        writer.writerow(["HISTORY"])
        writer.writerow(["Timestamp", "Tampered", "Hash"])

        for h in rec.get("history", []):
            writer.writerow([
                h.get("timestamp_iso"),
                h.get("tampered"),
                h.get("hash"),
            ])

        output.seek(0)
        log_security_event(
            action="export_audit_report",
            status="success",
            severity="info",
            details={"file_path": file_path},
            target="audit_logs",
            user_id=str(identity) if identity is not None else None,
            role=claims.get("role"),
            source="audit_api",
        )
        return send_file(
            io.BytesIO(output.getvalue().encode()),
            mimetype="text/csv",
            as_attachment=True,
            download_name="audit_report.csv",
        )

    except Exception as e:
        print("export_csv error:", e)
        log_security_event(
            action="export_audit_report",
            status="failed",
            severity="medium",
            details={"error": str(e)},
            target="audit_logs",
            source="audit_api",
        )
        return jsonify({"status": "error", "message": str(e)}), 500


# ============================================================
# 6️⃣ TEST ENDPOINT
# ============================================================
@audit_bp.route("/test", methods=["GET"])
def test():
    return jsonify({"status": "success", "message": "Audit module active"}), 200
