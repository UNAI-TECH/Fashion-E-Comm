import hmac
import hashlib
from config import settings

def hash_otp(destination: str, otp: str, purpose: str = "login") -> str:
    """
    Produce a cryptographically secure HMAC SHA-256 hash of the OTP
    bound strictly to destination and purpose.
    """
    message = f"{destination.strip().lower()}:{purpose}:{otp}".encode("utf-8")
    key = settings.SECRET_KEY.encode("utf-8")
    return hmac.new(key, message, hashlib.sha256).hexdigest()

def verify_otp_hash(destination: str, otp: str, stored_hash: str, purpose: str = "login") -> bool:
    """
    Constant-time comparison to prevent timing attacks.
    """
    candidate_hash = hash_otp(destination, otp, purpose)
    return hmac.compare_digest(candidate_hash, stored_hash)
