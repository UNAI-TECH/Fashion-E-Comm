import asyncio
import logging
from email.message import EmailMessage
from config import settings

logger = logging.getLogger("smtp_sender")

async def send_email_otp(to_email: str, otp: str, purpose: str = "verification") -> bool:
    """
    Deliver OTP directly via SMTP without any third-party intermediaries.
    Connects with SSL/TLS (port 465) and fallback to STARTTLS (port 587).
    """
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        logger.error(f"Cannot dispatch OTP: SMTP_USERNAME or SMTP_PASSWORD is not configured in environment.")
        return False

    msg = EmailMessage()
    msg["Subject"] = f"Your Aanya Fashions Security Code: {otp}"
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fdfbf7; padding: 24px; margin: 0; }}
    .card {{ max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e7ded3; padding: 36px 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }}
    .brand {{ text-align: center; font-family: serif; font-size: 26px; font-weight: bold; color: #1a1a1a; letter-spacing: 2px; }}
    .subtitle {{ text-align: center; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; color: #888; margin-top: 4px; }}
    .otp-badge {{ margin: 28px auto; text-align: center; background: #f4f6f2; border: 2px dashed #698156; padding: 18px 24px; border-radius: 14px; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #698156; }}
    .desc {{ font-size: 13px; color: #555; text-align: center; line-height: 1.6; margin: 0 0 16px 0; }}
    .warning {{ font-size: 12px; color: #888; text-align: center; margin-top: 16px; }}
    .footer {{ font-size: 11px; color: #aaa; text-align: center; margin-top: 28px; border-top: 1px solid #f0f0f0; padding-top: 16px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">AANYA FASHIONS</div>
    <div class="subtitle">Luxury Indian Couture</div>
    <p class="desc" style="margin-top: 24px;">Your One-Time Password to authorize your {purpose}:</p>
    <div class="otp-badge">{otp}</div>
    <p class="desc"><strong>Valid for 30 seconds only.</strong></p>
    <p class="warning">Do not share this code with anyone. Aanya representatives will never ask for your code.</p>
    <div class="footer">© 2026 Aanya Fashion Site. Direct Customer Notification System.</div>
  </div>
</body>
</html>"""

    msg.set_content(f"Your Aanya Fashions verification code is: {otp}. Valid for 30 seconds.")
    msg.add_alternative(html_content, subtype="html")

    import aiosmtplib

    # Attempt 1: Direct SSL (Port 465) - Standard for cloud servers / Render
    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=465,
            username=settings.SMTP_USERNAME,
            password=settings.SMTP_PASSWORD,
            use_tls=True,
            timeout=12,
        )
        logger.info(f"Direct OTP successfully delivered via SMTP (SSL 465) to {to_email}")
        return True
    except Exception as ssl_err:
        logger.warning(f"SSL 465 attempt encountered issue ({ssl_err}); trying STARTTLS on port 587...")

    # Attempt 2: STARTTLS (Port 587)
    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=587,
            username=settings.SMTP_USERNAME,
            password=settings.SMTP_PASSWORD,
            use_tls=False,
            start_tls=True,
            timeout=12,
        )
        logger.info(f"Direct OTP successfully delivered via SMTP (STARTTLS 587) to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to deliver email OTP to {to_email}: {e}")
        return False
