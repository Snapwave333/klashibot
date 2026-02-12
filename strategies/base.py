from abc import ABC, abstractmethod
from typing import Dict, Optional, Tuple
from models import MarketOpportunity

class BaseStrategy(ABC):
    @abstractmethod
    async def analyze_market(self, market: Dict, orderbook: Dict, mcp_session=None) -> Optional[MarketOpportunity]:
        """
        Analyze a market and return an Opportunity if one exists.
        mcp_session allows async calls to tools like fetch_rss_feed.
        """
        pass

    def update_params(self, params: Dict):
        """Update strategy hyperparameters dynamicallly."""
        for key, value in params.items():
            if hasattr(self, key):
                setattr(self, key, value)
