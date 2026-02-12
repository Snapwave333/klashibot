
import pytest
import asyncio
from trading_engine import TradingEngine
from models import MarketOpportunity
from unittest.mock import AsyncMock, MagicMock
import json

@pytest.fixture
def complex_trading_engine():
    session = AsyncMock()
    # Mock get_markets response with probability
    markets_data = {"markets": [{"ticker": f"MKT-{i}", "title": f"Market {i}", "status": "active", "volume": 1000, "probability": 0.6} for i in range(50)]}
    
    # Mock get_market and get_orderbook responses
    async def mock_call_tool(tool, args):
        if tool == "get_markets":
            return MagicMock(content=[MagicMock(text=json.dumps(markets_data))])
        elif tool == "get_market":
            ticker = args.get("ticker", "MKT-0")
            return MagicMock(content=[MagicMock(text=json.dumps({"ticker": ticker, "title": f"Title for {ticker}"}))])
        elif tool == "get_orderbook":
            return MagicMock(content=[MagicMock(text=json.dumps({
                "yes": {"bids": [{"price": 40, "count": 100}], "asks": [{"price": 42, "count": 100}]},
                "no": {"bids": [{"price": 55, "count": 100}], "asks": [{"price": 58, "count": 100}]}
            }))])
        return MagicMock(content=[MagicMock(text="{}")])

    session.call_tool = AsyncMock(side_effect=mock_call_tool)
    return TradingEngine(session, paper_mode=True)

def test_benchmark_find_opportunities(benchmark, complex_trading_engine):
    """Benchmark the full find_best_opportunities pipeline."""
    
    # Create a new event loop for this benchmark iteration
    # Since pytest-benchmark runs the function multiple times, we need to be careful.
    # But asyncio.run() creates a new loop each time, which is fine if no other loop is running.
    # By NOT marking this test as async, pytest-asyncio won't create a loop for us.
    
    async def run_pipeline():
        await complex_trading_engine.find_best_opportunities(top_n=5)
        
    def run_sync_wrapper():
        asyncio.run(run_pipeline())

    benchmark(run_sync_wrapper)

def test_benchmark_json_parsing(benchmark):
    """Benchmark JSON parsing performance."""
    data = '{"markets": ' + json.dumps([{"ticker": f"MKT-{i}", "val": i} for i in range(1000)]) + '}'
    
    def parse_json():
        json.loads(data)
        
    benchmark(parse_json)
