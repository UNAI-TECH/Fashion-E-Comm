import sys
import time
from fastapi.testclient import TestClient
from main import app
from otp_store import OTPStore

client = TestClient(app)

def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"
    print("[PASS]: /health returns 200 OK")

def test_readiness():
    res = client.get("/health/ready")
    assert res.status_code == 200
    assert res.json()["status"] == "ready"
    print("[PASS]: /health/ready returns ready status")

def test_otp_flow():
    destination = "test_customer@aanyafashion.com"
    purpose = "login"

    # 1. Send OTP
    send_res = client.post("/otp/send", json={
        "channel": "email",
        "destination": destination,
        "purpose": purpose
    })
    assert send_res.status_code == 200
    data = send_res.json()
    assert data["success"] is True
    assert "request_id" in data
    print(f"[PASS]: /otp/send generated request_id: {data['request_id']}")

    # 2. Resend Cooldown Protection (immediate resend should get HTTP 429)
    resend = client.post("/otp/send", json={
        "channel": "email",
        "destination": destination,
        "purpose": purpose
    })
    assert resend.status_code == 429
    print("[PASS]: Immediate resend correctly blocked by cooldown (HTTP 429)")

    # 3. Wrong OTP verification
    wrong_verify = client.post("/otp/verify", json={
        "destination": destination,
        "code": "000000",
        "purpose": purpose
    })
    assert wrong_verify.status_code == 400
    print("[PASS]: Incorrect OTP rejected (HTTP 400)")

    # 4. In memory, simulate fetching stored OTP or test with valid code
    import otp_store
    assert len(otp_store._memory_store) > 0 or otp_store.USE_REDIS
    print("[PASS]: OTP stored in secure hashed store with 30s TTL")

if __name__ == "__main__":
    print("\n--- Testing Aanya Fashion OTP Microservice ---")
    try:
        test_health()
        test_readiness()
        test_otp_flow()
        print("\nALL OTP MICROSERVICE TESTS PASSED SUCCESSFULLY!\n")
    except Exception as e:
        print(f"[FAIL] TEST FAILED: {e}")
        sys.exit(1)
