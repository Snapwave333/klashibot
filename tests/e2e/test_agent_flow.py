import pytest
import httpx
import time

def test_agent_start_and_run():
    """
    Verify that the agent starts correctly and enters the RUNNING state.
    This ensures the 'Play' button functionality triggers the trading loop.
    """
    base_url = "http://localhost:8001"
    
    # 1. Send START command
    print(f"Sending START command to {base_url}...")
    try:
        resp = httpx.post(f"{base_url}/control/command", json={"command": "START"}, timeout=5.0)
        assert resp.status_code == 200, f"Failed to start agent: {resp.text}"
        assert resp.json()["status"] == "success"
        print("✅ START command accepted.")
    except httpx.RequestError as e:
        pytest.fail(f"Could not connect to backend: {e}")

    # 2. Poll for RUNNING state
    print("Polling for RUNNING state...")
    is_running = False
    for i in range(10):
        try:
            resp = httpx.get(f"{base_url}/status", timeout=2.0)
            data = resp.json()
            state = data.get("bot_state")
            print(f"   State: {state}")
            if state == "RUNNING":
                is_running = True
                break
        except httpx.RequestError:
            pass
        time.sleep(1)
        
    assert is_running, "Agent did not enter RUNNING state after 10 seconds."
    print("✅ Agent is RUNNING.")

    # 3. Allow time for one iteration (optional, but good for log checking later)
    print("Waiting 5 seconds for trading loop iteration...")
    time.sleep(5)
    
    # Check status again to ensure it didn't crash back to STOPPED
    resp = httpx.get(f"{base_url}/status")
    final_state = resp.json().get("bot_state")
    assert final_state == "RUNNING", f"Agent crashed or stopped unexpectedly! State: {final_state}"
    print("✅ Agent stable in RUNNING state.")
