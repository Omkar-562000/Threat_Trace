# backend/utils/email_alerts.py
from flask_mail import Message
from flask import current_app

def send_tamper_email(file_path, hash_value, timestamp):
    try:
        # Flask-Mail instance
        mail = current_app.extensions.get("mail")
        if not mail:
            print("❌ Mail instance missing")
            return

        admin_email = current_app.config.get("MAIL_USERNAME")
        recipients = [admin_email] if admin_email else []

        msg = Message(
            subject="🚨 ThreatTrace Tamper Alert Detected!",
            sender=admin_email,
            recipients=recipients,
        )

        msg.body = f"""
A log tampering event has been detected by ThreatTrace.

File Path  : {file_path}
SHA256 Hash: {hash_value}
Timestamp  : {timestamp}

Recommended Actions:
- Review the Audit Report in your ThreatTrace dashboard
- Check server processes and user activity
- Investigate potential unauthorized access

ThreatTrace — Automated Security Monitoring System
"""

        mail.send(msg)
        print(f"📧 Email alert sent for: {file_path}")
    except Exception as e:
        print("❌ Email alert send error:", e)
