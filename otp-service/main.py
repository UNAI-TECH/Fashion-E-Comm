import logging
import asyncio
from fastapi import FastAPI, HTTPException, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, Literal

from config import settings
from security import hash_otp
from otp_generator import generate_secure_otp
from otp_store import OTPStore
from smtp_sender import send_email_otp
from sms_sender import send_sms_otp

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("otp_service")

app = FastAPI(
    title="Aanya Fashions OTP Microservice",
    version="1.0.0",
    description="High-throughput, cryptographically secure OTP delivery with 30-second window, anti-replay, and multi-channel adapters."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Pydantic Schemas ───
class SendOTPRequest(BaseModel):
    channel: Literal["email", "sms"]
    destination: str = Field(..., min_length=3, max_length=120)
    purpose: Literal["login", "checkout", "password_reset", "verification"] = "login"

class SendOTPResponse(BaseModel):
    success: bool
    message: str
    request_id: str
    expires_in_seconds: int = 30

class VerifyOTPRequest(BaseModel):
    destination: str
    code: str = Field(..., min_length=4, max_length=8)
    purpose: Literal["login", "checkout", "password_reset", "verification"] = "login"

class VerifyOTPResponse(BaseModel):
    success: bool
    message: str

# ─── Endpoints ───
@app.get("/health")
def health_check():
    return {"status": "ok", "service": "otp-service", "version": "1.0.0"}

@app.get("/health/ready")
def readiness_check():
    return {
        "status": "ready",
        "redis_configured": settings.REDIS_URL is not None,
        "smtp_configured": bool(settings.SMTP_USERNAME),
        "sms_provider": settings.SMS_PROVIDER,
    }

@app.post("/otp/send", response_model=SendOTPResponse, status_code=status.HTTP_200_OK)
async def send_otp_endpoint(req: SendOTPRequest, background_tasks: BackgroundTasks):
    destination = req.destination.strip().lower()

    # 1. Generate cryptographically secure 6-digit random code
    raw_otp = generate_secure_otp(length=settings.OTP_LENGTH)

    # 2. Compute secure HMAC SHA-256 hash
    hashed = hash_otp(destination, raw_otp, req.purpose)

    # 3. Store in OTPStore with 30-second TTL & check resend cooldown
    request_id, error_msg = OTPStore.save_otp(destination, hashed, req.purpose)
    if error_msg:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail=error_msg)

    # 4. Asynchronous dispatch (non-blocking)
    if req.channel == "email":
        background_tasks.add_task(send_email_otp, destination, raw_otp, req.purpose)
    else:
        background_tasks.add_task(send_sms_otp, destination, raw_otp)

    logger.info(f"OTP request [{request_id}] processed for {destination[:3]}*** via {req.channel}")

    return SendOTPResponse(
        success=True,
        message=f"A 6-digit verification code has been dispatched. Valid for 30 seconds.",
        request_id=request_id,
        expires_in_seconds=settings.OTP_TTL_SECONDS
    )

@app.post("/otp/verify", response_model=VerifyOTPResponse, status_code=status.HTTP_200_OK)
async def verify_otp_endpoint(req: VerifyOTPRequest):
    destination = req.destination.strip().lower()

    # Verify against hash and validate attempts
    is_valid, msg = OTPStore.verify_otp(destination, req.code.strip(), req.purpose)

    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)

    logger.info(f"OTP successfully verified for {destination[:3]}*** [Purpose: {req.purpose}]")

    return VerifyOTPResponse(
        success=True,
        message="Code verified successfully."
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
