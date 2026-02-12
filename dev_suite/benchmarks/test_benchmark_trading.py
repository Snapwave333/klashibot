
import pytest
from trading_engine import TradingEngine
from unittest.mock import AsyncMock

@pytest.fixture
def benchmark_engine():
    session = AsyncMock()
    return TradingEngine(session, paper_mode=True)

def test_benchmark_risk_adjustment(benchmark, benchmark_engine):
    """Benchmark the risk adjustment calculation."""
    def run_risk_calc():
        benchmark_engine.adjust_risk_parameters()
        
    benchmark(run_risk_calc)

def test_benchmark_opportunity_sorting(benchmark, benchmark_engine):
    """Benchmark sorting of opportunities."""
    # Create dummy opportunities
    class Opp:
        def __init__(self, edge):
            self.edge = edge
            self.score = edge * 10
            
    opps = [Opp(i/100) for i in range(1000)]
    
    def sort_opps():
        return sorted(opps, key=lambda x: x.score, reverse=True)
        
    benchmark(sort_opps)
