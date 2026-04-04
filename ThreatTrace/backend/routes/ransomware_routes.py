from flask import Blueprint, request, jsonify, current_app
import os
import math
import uuid
from datetime import datetime
from pathlib import Path
from werkzeug.utils import secure_filename

from utils.alert_manager import send_alert

ransomware_bp = Blueprint("ransomware_bp", __name__)

# Upload directory (project-root/uploads)
UPLOAD_DIR = Path(__file__).resolve().parents[1] / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed file types for scanning
ALLOWED_EXTENSIONS = {".exe", ".dll", ".bin", ".dat", ".txt", ".log", ".lock", ".enc"}
MAX_FILE_SIZE_MB = 50
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024


def calculate_entropy(data: bytes) -> float:
    if not data:
        return 0.0

    freq = [0] * 256
    for b in data:
        freq[b] += 1

    entropy = 0.0
    length = len(data)
    for count in freq:
        if count == 0:
            continue
        p = count / length
        entropy -= p * math.log2(p)
    return entropy


def analyze_file_for_ransomware(file_path: str) -> dict:
    suspicious_extensions = {".lock", ".enc", ".crypt", ".ransom", ".encrypted"}

    result = {
        "path": file_path,
        "suspicious": False,
        "reason": [],
        "entropy": 0.0,
    }

    p = Path(file_path)
    if not p.exists():
        result["reason"].append("File not found")
        return result

    ext = p.suffix.lower()
    if ext in suspicious_extensions:
        result["suspicious"] = True
        result["reason"].append(f"Suspicious extension: {ext}")

    try:
        with p.open("rb") as fh:
            sample = fh.read(64 * 1024)
            entropy = calculate_entropy(sample)
            result["entropy"] = round(entropy, 3)
            if entropy >= 7.5:
                result["suspicious"] = True
                result["reason"].append("High entropy (looks encrypted)")
    except Exception as e:
        result["reason"].append(f"Read error: {str(e)}")

    return result


def normalize_scan_payload(payload: dict) -> dict:
    path_value = (payload.get("path") or payload.get("file_path") or "").strip()
    filename = payload.get("filename") or (Path(path_value).name if path_value else "unknown")

    reason = payload.get("reason") or []
    if isinstance(reason, str):
        reason = [reason]

    scan_time = payload.get("scan_time") or payload.get("scanned_at") or datetime.utcnow()
    if isinstance(scan_time, str):
        try:
            scan_time = datetime.fromisoformat(scan_time.replace("Z", "+00:00")).replace(tzinfo=None)
        except ValueError:
            scan_time = datetime.utcnow()

    return {
        "path": path_value,
        "file_path": path_value,
        "filename": filename,
        "entropy": float(payload.get("entropy", 0.0) or 0.0),
        "suspicious": bool(payload.get("suspicious")),
        "reason": reason,
        "scan_time": scan_time,
        "source": payload.get("source", "api"),
    }


def persist_scan_result(result: dict) -> None:
    db = current_app.config["DB"]
    db["ransomware_logs"].insert_one(dict(result))
    db["ransomware_scans"].insert_one(dict(result))


@ransomware_bp.route("/scan", methods=["POST"])
def scan_file_path():
    try:
        data = request.get_json(force=True, silent=True) or {}
        file_path = data.get("file_path") or data.get("path")

        # Hosted backend mode: local automation sends scan metadata so the cloud
        # backend does not need access to the user's filesystem.
        if data.get("suspicious") is not None and ("entropy" in data or "reason" in data):
            result = normalize_scan_payload({**data, "source": data.get("source", "automation")})

            try:
                persist_scan_result(result)
            except Exception as e:
                print("WARNING: Failed to store ransomware scan metadata:", e)

            if result["suspicious"]:
                try:
                    send_alert(
                        title="Ransomware Alert",
                        message=f"Suspicious file detected on endpoint: {result['file_path']}",
                        severity="critical",
                        source="ransomware",
                    )
                except Exception as e:
                    print("WARNING: send_alert failed:", e)

            response_result = dict(result)
            response_result["scan_time"] = result["scan_time"].isoformat() + "Z"
            return jsonify({"status": "success", "result": response_result, "ingested": True}), 200

        if not file_path:
            return jsonify({"status": "error", "message": "file_path required"}), 400

        p = Path(file_path)
        if not p.exists():
            return jsonify({"status": "error", "message": "File not found"}), 404

        result = analyze_file_for_ransomware(str(p))
        stored_result = normalize_scan_payload(
            {**result, "scan_time": datetime.utcnow(), "source": "backend_path_scan"}
        )

        try:
            persist_scan_result(stored_result)
        except Exception as e:
            print("WARNING: Failed to store ransomware log:", e)

        if result["suspicious"]:
            try:
                send_alert(
                    title="Ransomware Alert",
                    message=f"Suspicious file detected: {str(p)}",
                    severity="critical",
                    source="ransomware",
                )
            except Exception as e:
                print("WARNING: send_alert failed:", e)

        return jsonify({"status": "success", "result": result}), 200

    except Exception as e:
        print("scan_file_path error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500


@ransomware_bp.route("/upload", methods=["POST"])
def upload_and_scan():
    saved_path = None
    try:
        if "file" not in request.files:
            return jsonify({"status": "error", "message": "No file provided"}), 400

        file = request.files["file"]
        filename = secure_filename(file.filename or "")

        if filename == "":
            return jsonify({"status": "error", "message": "Invalid filename"}), 400

        _, ext = os.path.splitext(filename)
        if ext.lower() not in ALLOWED_EXTENSIONS:
            return jsonify({"status": "error", "message": f"File type not allowed: {ext}"}), 400

        content_length = request.content_length or file.content_length or None
        if content_length and content_length > MAX_FILE_SIZE_BYTES:
            return jsonify({"status": "error", "message": f"File exceeds {MAX_FILE_SIZE_MB}MB"}), 400

        unique_name = f"{uuid.uuid4().hex}_{filename}"
        saved_path = UPLOAD_DIR / unique_name
        file.save(saved_path)

        result = analyze_file_for_ransomware(str(saved_path))
        stored_result = normalize_scan_payload(
            {**result, "filename": filename, "scan_time": datetime.utcnow(), "source": "uploaded_file"}
        )

        try:
            persist_scan_result(stored_result)
        except Exception as e:
            print("WARNING: Failed to store ransomware log:", e)

        if result["suspicious"]:
            try:
                send_alert(
                    title="Ransomware Detected",
                    message=f"Uploaded suspicious file: {filename}",
                    severity="critical",
                    source="ransomware",
                )
            except Exception as e:
                print("WARNING: send_alert failed:", e)

        return jsonify({"status": "success", "result": result}), 200

    except Exception as e:
        print("upload_and_scan error:", e)
        return jsonify({"status": "error", "message": "Upload scan failed"}), 500

    finally:
        if saved_path and saved_path.exists():
            try:
                saved_path.unlink()
            except Exception:
                pass


@ransomware_bp.route("/logs", methods=["GET"])
def get_ransomware_logs():
    try:
        db = current_app.config["DB"]
        logs = list(db["ransomware_logs"].find({}, {"_id": 0}).sort("scan_time", -1))
        for log in logs:
            if isinstance(log.get("scan_time"), datetime):
                log["scan_time"] = log["scan_time"].isoformat() + "Z"
        return jsonify({"status": "success", "logs": logs}), 200
    except Exception as e:
        print("get_ransomware_logs error:", e)
        return jsonify({"status": "error", "message": str(e)}), 500
