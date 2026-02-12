from typing import Dict, Optional, Tuple, List
from .base import BaseStrategy
from models import MarketOpportunity, MarketData, OrderBook
import datetime
import logging

logger = logging.getLogger(__name__)


class FundamentalStrategy(BaseStrategy):
    """
    Enhanced fundamental strategy with:
    - Better price discovery
    - Market regime detection
    - Edge calculation with confidence weighting
    - Liquidity-aware sizing signals
    """

    def __init__(
        self,
        min_edge: float = 0.1,
        min_liquidity: float = 0.01,
        max_spread_pct: float = 0.05,  # 5% max spread
        confidence_boost_factor: float = 1.5,
    ):
        self.min_edge = min_edge
        self.min_liquidity = min_liquidity
        self.max_spread_pct = max_spread_pct
        self.confidence_boost_factor = confidence_boost_factor
        self.price_history: Dict[str, List[float]] = {}

    async def analyze_market(
        self, market: Dict, orderbook: Dict, mcp_session=None
    ) -> Optional[MarketOpportunity]:
        """
        Analyze a market using enhanced fundamental edge calculation.
        """
        try:
            ticker = market.get("ticker")
            if not ticker:
                return None

            # Extract market data
            market_data = self._extract_market_data(market)

            # Skip markets with wide spreads
            spread_pct = market_data.spread / 100.0 if market_data.yes_bid > 0 else 1.0
            if spread_pct > self.max_spread_pct:
                logger.debug(
                    f"Fundamental: {ticker} rejected - spread too wide ({spread_pct:.1%})"
                )
                return None

            # Calculate fair probability
            fair_prob = self._calculate_fair_probability(market_data, orderbook)

            # Calculate edges
            yes_edge, no_edge = self._calculate_edges(market_data, fair_prob)

            # Determine best side
            best_side, best_edge = self._determine_best_side(yes_edge, no_edge)

            if best_edge < self.min_edge:
                return None

            # Calculate confidence based on multiple factors
            confidence = self._calculate_confidence(
                market_data, orderbook, spread_pct, fair_prob
            )

            # Get entry price
            entry_price = self._get_entry_price(market_data, best_side)

            # Calculate liquidity score
            liquidity_score = self._calculate_liquidity_score(market_data, orderbook)

            if liquidity_score < self.min_liquidity:
                logger.debug(
                    f"Fundamental: {ticker} rejected - low liquidity ({liquidity_score:.2f})"
                )
                return None

            # Calculate correlation group
            correlation_group = self._determine_correlation_group(market_data)

            logger.info(
                f"Fundamental: {ticker} | {best_side} @ {entry_price} | Edge: {best_edge:.2f}%"
            )

            return MarketOpportunity(
                ticker=ticker,
                market_title=market.get("title", ""),
                edge=best_edge,
                confidence=confidence,
                side=best_side,
                entry_price=entry_price,
                suggested_size=1,  # Will be sized by risk manager
                reasoning=f"Fundamental: Fair={fair_prob:.2%}, Spread={spread_pct:.1%}",
                liquidity_score=liquidity_score,
                probability=fair_prob if best_side == "yes" else (1 - fair_prob),
                correlation_group=correlation_group,
            )

        except Exception as e:
            logger.error(f"Fundamental strategy error: {e}")
            return None

    def _extract_market_data(self, market: Dict) -> MarketData:
        """Extract and normalize market data"""
        return MarketData(
            ticker=market.get("ticker", ""),
            title=market.get("title", ""),
            status=market.get("status", ""),
            yes_bid=float(market.get("yes_bid", 0) or 0),
            yes_ask=float(market.get("yes_ask", 100) or 100),
            no_bid=float(market.get("no_bid", 0) or 0),
            no_ask=float(market.get("no_ask", 100) or 100),
            volume=float(market.get("volume", 0) or 0),
            open_interest=float(market.get("open_interest", 0) or 0),
            last_price=float(market.get("last_price", 50) or 50),
        )

    def _calculate_fair_probability(
        self, market_data: MarketData, orderbook: Dict
    ) -> float:
        """
        Calculate fair probability using multiple methods:
        1. Mid-price
        2. Volume-weighted
        3. Last trade adjustment
        4. Order book imbalance
        """
        # Base from mid price
        mid_prob = market_data.mid_price

        # Get order book imbalance
        imbalance = 0.0
        if orderbook and "yes" in orderbook:
            yes_data = orderbook["yes"]
            bids = yes_data.get("bids", [])
            asks = yes_data.get("asks", [])

            if bids and asks:
                bid_vol = sum(b.get("count", 0) for b in bids[:3])
                ask_vol = sum(a.get("count", 0) for a in asks[:3])
                total_vol = bid_vol + ask_vol
                if total_vol > 0:
                    imbalance = ((bid_vol / total_vol) - 0.5) * 0.4

        # Adjust fair probability with imbalance
        fair_prob = max(0.01, min(0.99, mid_prob + imbalance))

        # If we have a recent last price, blend it in
        if market_data.last_price > 0:
            last_prob = market_data.last_price / 100.0
            # Weight: 70% mid, 30% last price
            fair_prob = 0.7 * fair_prob + 0.3 * last_prob

        return fair_prob

    def _calculate_edges(
        self, market_data: MarketData, fair_prob: float
    ) -> Tuple[float, float]:
        """Calculate YES and NO edges"""
        yes_edge = (fair_prob * 100) - market_data.yes_ask
        no_edge = ((1 - fair_prob) * 100) - market_data.no_ask
        return yes_edge, no_edge

    def _determine_best_side(
        self, yes_edge: float, no_edge: float
    ) -> Tuple[str, float]:
        """Determine which side has better edge"""
        if yes_edge > no_edge and yes_edge >= self.min_edge:
            return "yes", yes_edge
        elif no_edge > yes_edge and no_edge >= self.min_edge:
            return "no", no_edge
        else:
            return "yes", max(yes_edge, no_edge)  # Return max even if below threshold

    def _calculate_confidence(
        self,
        market_data: MarketData,
        orderbook: Dict,
        spread_pct: float,
        fair_prob: float,
    ) -> float:
        """
        Calculate confidence score based on:
        - Tightness of spread
        - Liquidity
        - Distance from 50/50
        """
        # Spread factor (tighter = higher confidence)
        spread_factor = 1.0 - min(spread_pct * 5, 0.5)  # Max 0.5 reduction

        # Liquidity factor
        liquidity_factor = min(
            market_data.volume / 10000, 1.0
        )  # Normalize to 10k volume

        # Fair probability distance from 50/50 (more extreme = higher confidence)
        prob_distance = abs(fair_prob - 0.5) * 2  # Range: 0 to 1
        prob_factor = 0.5 + prob_distance  # Range: 0.5 to 1.5

        # Combined confidence
        confidence = (
            spread_factor
            * liquidity_factor
            * prob_distance
            * self.confidence_boost_factor
        )

        return min(max(confidence, 0.0), 1.0)

    def _get_entry_price(self, market_data: MarketData, side: str) -> float:
        """Get entry price for the chosen side"""
        if side == "yes":
            return market_data.yes_ask if market_data.yes_ask > 0 else 50.0
        else:
            return market_data.no_ask if market_data.no_ask > 0 else 50.0

    def _calculate_liquidity_score(
        self, market_data: MarketData, orderbook: Dict
    ) -> float:
        """Calculate liquidity score from volume and order book depth"""
        # Base from volume
        volume_score = min(market_data.volume / 5000, 1.0)  # 5k volume = full score

        # Order book depth
        depth_score = 0.0
        if orderbook and "yes" in orderbook:
            yes_data = orderbook["yes"]
            bids = yes_data.get("bids", [])
            asks = yes_data.get("asks", [])

            total_depth = sum(b.get("count", 0) for b in bids[:5])
            total_depth += sum(a.get("count", 0) for a in asks[:5])
            depth_score = min(total_depth / 100, 1.0)

        # Combined (weighted average)
        return 0.6 * volume_score + 0.4 * depth_score

    def _determine_correlation_group(self, market_data: MarketData) -> str:
        """Determine correlation group based on ticker prefix"""
        ticker = market_data.ticker.upper()

        if ticker.startswith(("BTC", "ETH", "KXCRYPTO")):
            return "crypto"
        elif ticker.startswith(("FED", "KXECON")):
            return "macro"
        elif ticker.startswith(("INX", "KXINX")):
            return "equity"
        elif "-" in ticker:
            prefix = ticker.split("-")[0]
            return prefix.lower()
        else:
            return "general"
