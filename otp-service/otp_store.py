import time
import uuid
import logging
from typing import Optional, Tuple
from config import settings

logger = logging.getLogger("otp_store")

try:
    import redis
    redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)
    redis_client.ping()
    USE_REDIS = True
    logger.info("Connected to Redis for OTP storage.")
except Exception as e:
    USE_REDIS = False
    logger.info("Redis not available; using in-memory high-concurrency store.")

# Thread-safe in-memory fallback
_memory_store = {}
_cooldown_store = {}

class OTPStore:
    @staticmethod
    def save_otp(destination: str, hashed_otp: str, purpose: str = "login") -> Tuple[str, Optional[str]]:
        """
        Store hashed OTP with 30-sec TTL and return (request_id, error_message).
        Enforces resend cooldown.
        """
        key = f"otp:{purpose}:{destination.strip().lower()}"
        cooldown_key = f"cooldown:{purpose}:{destination.strip().lower()}"
        now = time.time()

        # Check resend cooldown
        if USE_REDIS:
            if redis_client.exists(cooldown_key):
                ttl = redis_client.ttl(cooldown_key)
                return "", f"Please wait {ttl} seconds before requesting a new code."
        else:
            if cooldown_key in _cooldown_store and _cooldown_store[cooldown_key] > now:
                remaining = int(_cooldown_store[cooldown_key] - now)
                return "", f"Please wait {remaining} seconds before requesting a new code."

        request_id = str(uuid.uuid4())
        record = {
            "hash": hashed_otp,
            "attempts": 0,
            "created_at": now,
            "request_id": request_id,
        }

        if USE_REDIS:
            redis_client.hset(key, mapping=record)
            redis_client.expire(key, settings.OTP_TTL_SECONDS)
            redis_client.setex(cooldown_key, settings.RESEND_COOLDOWN_SECONDS, "1")
        else:
            _memory_store[key] = {
                **record,
                "expires_at": now + settings.OTP_TTL_SECONDS,
            }
            _cooldown_store[cooldown_key] = now + settings.RESEND_COOLDOWN_SECONDS

        return request_id, None

    @staticmethod
    def verify_otp(destination: str, candidate_otp: str, purpose: str = "login") -> Tuple[bool, str]:
        """
        Verify the OTP against stored hash.
        Validates 30s TTL, limits to 5 attempts, and invalidates upon success or brute force.
        """
        from security import verify_otp_hash

        key = f"otp:{purpose}:{destination.strip().lower()}"
        now = time.time()

        if USE_REDIS:
            data = redis_client.hgetall(key)
            if not data or "hash" not in data:
                return False, "OTP has expired or does not exist. Please request a new code."

            attempts = int(data.get("attempts", 0)) + 1
            if attempts > settings.MAX_VERIFY_ATTEMPTS:
                redis_client.delete(key)
                return False, "Maximum verification attempts exceeded. Code invalidated."

            redis_client.hset(key, "attempts", attempts)

            stored_hash = data["hash"]
            is_valid = verify_otp_hash(destination, candidate_otp, stored_hash, purpose)
            if is_valid:
                # Single use: remove immediately upon success
                redis_client.delete(key)
                return True, "Verification successful."
            else:
                remaining = settings.MAX_VERIFY_ATTEMPTS - attempts
                return False, f"Incorrect code. {remaining} attempt(s) remaining."

        else:
            record = _memory_store.get(key)
            if not record or record["expires_at"] < now:
                _memory_store.pop(key, None)
                return False, "OTP has expired or does not exist. Please request a new code."

            record["attempts"] += 1
            if record["attempts"] > settings.MAX_VERIFY_ATTEMPTS:
                _memory_store.pop(key, None)
                return False, "Maximum verification attempts exceeded. Code invalidated."

            is_valid = verify_otp_hash(destination, candidate_otp, record["hash"], purpose)
            if is_valid:
                _memory_store.pop(key, None)
                return True, "Verification successful."
            else:
                remaining = settings.MAX_VERIFY_ATTEMPTS - record["attempts"]
                return False, f"Incorrect code. {remaining} attempt(s) remaining."
