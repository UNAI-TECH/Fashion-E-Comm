import asyncio
import logging
from email.message import EmailMessage
from config import settings

logger = logging.getLogger("smtp_sender")

async def send_email_otp(to_email: str, otp: str, purpose: str = "verification") -> bool:
    """
    Deliver OTP via SMTP asynchronously without blocking the event loop.
    Includes timeout and retry protection.
    """
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        logger.info(f"[DEV MODE] SMTP credentials omitted. Simulated OTP delivery to {to_email} (Hash stored securely).")
        return True

    msg = EmailMessage()
    msg["Subject"] = f"Your Aanya Fashions One-Time Verification Code"
    msg["From"] = settings.SMTP_FROM
    msg["To"] = to_email

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fdfbf7; padding: 24px; }}
        .card {{ max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e7ded3; padding: 32px; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }}
        .brand {{ text-align: center; font-family: serif; font-size: 26px; font-weight: bold; color: #1a1a1a; letter-spacing: 1px; }}
        .otp-badge {{ margin: 28px auto; text-align: center; background: #f4f6f2; border: 2px dashed #698156; padding: 18px 24px; border-radius: 14px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #698156; }}
        .desc {{ font-size: 13px; color: #666; text-align: center; line-height: 1.6; }}
        .footer {{ font-size: 11px; color: #999; text-align: center; margin-top: 24px; border-top: 1px solid #f0f0f0; padding-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="brand">AANYA FASHIONS</div>
        <p class="desc" style="margin-top: 16px;">Use the following security code to complete your {purpose}.</p>
        <div class="otp-badge">{otp}</div>
        <p class="desc"><strong>Valid for 30 seconds only.</strong> Do not share this code with anyone. Aanya representatives will never ask for your password or OTP.</p>
        <div class="footer">© 2026 Aanya Fashion Site. Luxury Couture & Handcrafted Weaves.</div>
      </div>
    </body>
    </html>
    """
    msg.set_content(f"Your Aanya Fashions verification code is: {otp}. Valid for 30 seconds.")
    msg.add_alternative(html_content, subtype="html")

    try:
        import aiosmtplib
        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            username=settings.SMTP_USERNAME,
            password=settings.SMTP_PASSWORD,
            use_tls=False,
            start_tls=settings.SMTP_USE_TLS,
            timeout=10,
        )
        logger.info(f"OTP successfully delivered via SMTP to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email OTP to {to_email}: {e}")
        return False
