import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PORT: int = 8000
    ENVIRONMENT: str = "production"
    
    # OTP Configuration (Strict 30-sec expiry window, 6 digits)
    OTP_TTL_SECONDS: int = 30
    OTP_LENGTH: int = 6
    MAX_VERIFY_ATTEMPTS: int = 5
    RESEND_COOLDOWN_SECONDS: int = 30
    SECRET_KEY: str = os.getenv("OTP_SECRET_KEY", "aanya-fashion-otp-secret-key-32-bytes-secure")

    # Redis Configuration
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")

    # Self-Hosted Direct SMTP Mail Delivery
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "465"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM: str = os.getenv("SMTP_FROM", "Aanya Fashion <no-reply@aanyafashions.com>")
    SMTP_USE_TLS: bool = True

    # Self-Hosted Direct SMS/Device Gateway (Android SMS Gateway / Local GSM Modem / Custom Webhook)
    SMS_GATEWAY_WEBHOOK_URL: str = os.getenv("SMS_GATEWAY_WEBHOOK_URL", "")
    SMS_GATEWAY_AUTH_TOKEN: str = os.getenv("SMS_GATEWAY_AUTH_TOKEN", "")

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
