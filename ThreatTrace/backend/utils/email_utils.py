import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app

def send_email(to_email, subject, body):
    try:
        msg = MIMEMultipart()
        msg["From"] = current_app.config["MAIL_USERNAME"]
        msg["To"] = to_email
        msg["Subject"] = subject

        msg.attach(MIMEText(body, "html"))

        server = smtplib.SMTP(current_app.config["MAIL_SERVER"], current_app.config["MAIL_PORT"])
        server.starttls()
        server.login(
            current_app.config["MAIL_USERNAME"],
            current_app.config["MAIL_PASSWORD"]
        )
        server.sendmail(
            current_app.config["MAIL_USERNAME"],
            to_email,
            msg.as_string()
        )
        server.quit()

        return True
    except Exception as e:
        print("❌ Email error:", e)
        return False
