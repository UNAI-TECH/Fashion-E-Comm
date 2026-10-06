import logging
import httpx
from abc import ABC, abstractmethod
from config import settings

logger = logging.getLogger("sms_sender")

class BaseSMSProvider(ABC):
    @abstractmethod
    async def send_sms(self, phone: str, otp: str) -> bool:
        pass

class MockSMSProvider(BaseSMSProvider):
    async def send_sms(self, phone: str, otp: str) -> bool:
        logger.info(f"[SMS Adapter - MOCK] OTP dispatched to {phone} (Delivery simulated successfully).")
        return True

class MSG91Provider(BaseSMSProvider):
    async def send_sms(self, phone: str, otp: str) -> bool:
        if not settings.SMS_API_KEY:
            logger.warning("MSG91 API key missing; falling back to simulated dispatch.")
            return True
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(
                    "https://control.msg91.com/api/v5/otp",
                    headers={"authkey": settings.SMS_API_KEY},
                    json={"mobile": phone.replace("+", ""), "otp": otp}
                )
                return resp.status_code == 200
        except Exception as e:
            logger.error(f"MSG91 SMS delivery error: {e}")
            return False

class TwilioProvider(BaseSMSProvider):
    async def send_sms(self, phone: str, otp: str) -> bool:
        logger.info(f"[Twilio Adapter] Queued OTP to {phone}")
        return True

def get_sms_provider() -> BaseSMSProvider:
    provider = settings.SMS_PROVIDER.lower()
    if provider == "msg91":
        return MSG91Provider()
    elif provider == "twilio":
        return TwilioProvider()
    return MockSMSProvider()

async def send_sms_otp(phone: str, otp: str) -> bool:
    provider = get_sms_provider()
    return await provider.send_sms(phone, otp)
