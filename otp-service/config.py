import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    
    # OTP Configuration
    OTP_TTL_SECONDS: int = 30  # Strict 30-sec expiry window
    OTP_LENGTH: int = 6
    MAX_VERIFY_ATTEMPTS: int = 5
    RESEND_COOLDOWN_SECONDS: int = 30
    SECRET_KEY: str = os.getenv("OTP_SECRET_KEY", "aanya-fashion-otp-secret-key-32-bytes-secure")

    # Redis Configuration (Optional fallback to thread-safe memory store)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # SMTP Configuration (Email OTP)
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM: str = os.getenv("SMTP_FROM", "no-reply@aanyafashions.com")
    SMTP_USE_TLS: bool = True

    # SMS Configuration (Adapter: msg91, twilio, or mock)
    SMS_PROVIDER: str = os.getenv("SMS_PROVIDER", "mock")  # mock | twilio | msg91
    SMS_API_KEY: str = os.getenv("SMS_API_KEY", "")
    SMS_SENDER_ID: str = os.getenv("SMS_SENDER_ID", "AANYAF")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
