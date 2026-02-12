
import requests
import time

BASE_URL = "http://localhost:8001"

def test_api():
    print("🔍 Testing REST API...")
    
    # 1. Health Check
    try:
        resp = requests.get(f"{BASE_URL}/health")
        print(f"✅ /health: {resp.status_code} - {resp.json()}")
    except Exception as e:
        print(f"❌ /health FAILED: {e}")
        return

    # 2. Status
    try:
        resp = requests.get(f"{BASE_URL}/status")
        print(f"✅ /status: {resp.status_code} - State: {resp.json().get('bot_state')}")
    except Exception as e:
        print(f"❌ /status FAILED: {e}")

    # 3. Control: PAUSE
    print("⏸️ Sending PAUSE command...")
    try:
        resp = requests.post(f"{BASE_URL}/control/command", json={"command": "PAUSE"})
        print(f"✅ /control/command (PAUSE): {resp.status_code} - {resp.json()}")
    except Exception as e:
        print(f"❌ PAUSE command FAILED: {e}")

    # Wait a sec
    time.sleep(1)

    # 4. Verify PAUSED State
    try:
        resp = requests.get(f"{BASE_URL}/status")
        state = resp.json().get('bot_state')
        if state == "PAUSED":
             print(f"✅ State verified as PAUSED")
        else:
             print(f"❌ State verification FAILED. Expected PAUSED, got {state}")
    except Exception as e:
        print(f"❌ Status verification FAILED: {e}")

    # 5. Control: START
    print("▶️ Sending START command...")
    try:
        resp = requests.post(f"{BASE_URL}/control/command", json={"command": "START"})
        print(f"✅ /control/command (START): {resp.status_code} - {resp.json()}")
    except Exception as e:
        print(f"❌ START command FAILED: {e}")

if __name__ == "__main__":
    test_api()
