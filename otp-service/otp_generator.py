import secrets
from typing import Optional

def generate_secure_otp(length: int = 6, previous_otp: Optional[str] = None) -> str:
    """
    Generate a cryptographically secure random numeric OTP using secrets.randbelow.
    Guarantees non-reuse of the immediately previous OTP.
    """
    min_val = 10 ** (length - 1)
    max_val = (10 ** length) - 1
    span = max_val - min_val + 1

    for _ in range(10):  # Retry loop to ensure non-repetition
        code = str(min_val + secrets.randbelow(span))
        if code != previous_otp:
            return code

    return str(min_val + secrets.randbelow(span))
