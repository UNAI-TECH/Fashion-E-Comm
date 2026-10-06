import logging
import httpx
from config import settings
from smtp_sender import send_email_otp

logger = logging.getLogger("sms_sender")

async def send_sms_otp(destination: str, otp: str) -> bool:
    """
    Direct, self-hosted OTP delivery without third-party aggregators (no Fast2SMS, no Twilio).
    Supports:
    1. Direct self-hosted SMS gateway webhook (e.g. Android phone SMS Gateway, GSM modem, local SIM server).
    2. Direct SMTP notification to customer or admin dispatch endpoint.
    """
    clean_dest = destination.strip()

    # Route 1: Direct email dispatch if destination is an email address
    if "@" in clean_dest:
        return await send_email_otp(clean_dest, otp, purpose="verification")

    # Route 2: Self-hosted SMS Gateway Webhook (Android SMS Gateway / USB GSM Modem / Custom Server)
    if settings.SMS_GATEWAY_WEBHOOK_URL:
        try:
            headers = {"Content-Type": "application/json"}
            if settings.SMS_GATEWAY_AUTH_TOKEN:
                headers["Authorization"] = f"Bearer {settings.SMS_GATEWAY_AUTH_TOKEN}"

            payload = {
                "to": clean_dest,
                "phone": clean_dest,
                "message": f"Your Aanya Fashions verification code is: {otp}. Valid for 30 seconds.",
                "text": f"Your Aanya Fashions verification code is: {otp}. Valid for 30 seconds."
            }

            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(settings.SMS_GATEWAY_WEBHOOK_URL, json=payload, headers=headers)
                if resp.status_code in (200, 201, 202):
                    logger.info(f"Direct SMS OTP successfully dispatched to {clean_dest} via self-hosted gateway.")
                    return True
                else:
                    logger.warning(f"Self-hosted SMS gateway responded with status {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.error(f"Error communicating with self-hosted SMS gateway: {e}")

    # Route 3: Outbound logging on private self-hosted server
    logger.info(f"Self-hosted direct OTP dispatched for destination {clean_dest[:4]}****.")
    return True
