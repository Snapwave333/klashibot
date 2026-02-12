
import pytest
from websocket_bridge import WebSocketBridge
from unittest.mock import MagicMock

def test_websocket_bridge_initialization():
    # WebSocketBridge imports mcp_server_kalshi.server, which imports config.
    # We need to make sure env vars are set if config requires them.
    # But usually conftest logic handles path.
    
    # We might need to mock some things if __init__ does too much.
    # __init__ calls os.getenv and initializes portfolio.
    
    bridge = WebSocketBridge()
    assert bridge.portfolio["balance"] == 100.0
    assert bridge.bot_state == "STOPPED"
    assert bridge.tts_enabled is False
