
import pytest
from trading_engine import TradingEngine
from unittest.mock import MagicMock

@pytest.mark.asyncio
async def test_calculate_opportunity(trading_engine):
    """Test the opportunity calculation logic."""
    market = {
        "ticker": "TEST",
        "title": "Test Market",
        "yes_bid": 40,
        "yes_ask": 42,
        "probability": 0.60,
        "status": "active"
    }
    
    orderbook = {
        "yes": {"bids": [{"price": 40, "count": 100}], "asks": [{"price": 42, "count": 100}]},
        "no": {"bids": [{"price": 55, "count": 100}], "asks": [{"price": 58, "count": 100}]}
    }
    
    # Use Strategy Manager
    opps = trading_engine.strategy_manager.analyze_market(market, orderbook)
    
    assert len(opps) > 0
    opp = opps[0]
    assert opp.ticker == "TEST"
    assert opp.side in ["yes", "no"]

@pytest.mark.asyncio
async def test_position_sizing(trading_engine):
    """Test Kelly Criterion position sizing via RiskManager."""
    # Create a dummy opportunity
    # Win Prob 0.6, Price 0.5 -> Edge exists
    from models import MarketOpportunity
    opp = MarketOpportunity(
        ticker="TEST", market_title="Test", edge=10.0, confidence=1.0, 
        side="yes", entry_price=0.50, suggested_size=0, reasoning="", liquidity_score=1.0,
        probability=0.6
    )
    
    # Balance 100.
    portfolio = {"balance": 100.0, "active_value": 0.0}
    
    size = trading_engine.risk_manager.check_trade_risk(opp, portfolio)
    # Expected: Kelly > 0, limited by max allocation
    assert size > 0
    assert size <= 50 # Max position size limit

@pytest.mark.asyncio
async def test_paper_trade_execution(trading_engine):
    """Test that paper trades execute and update state."""
    opp = MagicMock()
    opp.ticker = "TEST-MARKET"
    opp.side = "yes"
    opp.entry_price = 50
    opp.suggested_size = 10
    opp.edge = 5.0
    opp.reasoning = "Test"
    
    # Mock MCP call for create_order
    trading_engine.mcp_session.call_tool.return_value = MagicMock(
        content=[MagicMock(text='{"order_id": "123", "fill_price": 50}')]
    )
    
    result = await trading_engine.execute_trade_fast(opp)
    
    assert result is True
    assert len(trading_engine.trade_history) == 1
    assert trading_engine.trade_history[0]["ticker"] == "TEST-MARKET"
