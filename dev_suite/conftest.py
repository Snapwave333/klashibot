
import pytest
from unittest.mock import AsyncMock, MagicMock
import sys
import os

# Add project root to path
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.insert(0, PROJECT_ROOT)

# Add MCP server source to path
MCP_SRC = os.path.join(PROJECT_ROOT, "mcp-server-kalshi", "src")
sys.path.insert(0, MCP_SRC)

@pytest.fixture
def mock_mcp_session():
    session = AsyncMock()
    session.call_tool = AsyncMock()
    return session

@pytest.fixture
def trading_engine(mock_mcp_session):
    from trading_engine import TradingEngine
    engine = TradingEngine(mock_mcp_session, paper_mode=True)
    return engine
