from typing import Dict, Optional, List
from .base import BaseStrategy
from models import MarketOpportunity, MarketData
import datetime
import logging
from collections import deque

logger = logging.getLogger(__name__)


class MomentumStrategy(BaseStrategy):
    """
    Momentum-based trading strategy that detects:
    - Price trends
    - Volume momentum
    - Order flow imbalance
    - Breakout patterns
    """

    def __init__(
        self,
        lookback_periods: int = 10,
        momentum_threshold: float = 0.02,  # 2% move
        volume_threshold: float = 1.5,  # 1.5x average volume
        min_confidence: float = 0.4,
    ):
        self.lookback_periods = lookback_periods
        self.momentum_threshold = momentum_threshold
        self.volume_threshold = volume_threshold
        self.min_confidence = min_confidence

        # Price history for momentum calculation
        self.price_history: Dict[str, deque] = {}
        self.volume_history: Dict[str, deque] = {}

    async def analyze_market(
        self, market: Dict, orderbook: Dict, mcp_session=None
    ) -> Optional[MarketOpportunity]:
        """
        Analyze market for momentum signals.
        """
        try:
            ticker = market.get("ticker")
            if not ticker:
                return None

            # Extract current market data
            current_price = self._get_current_price(market, orderbook)
            current_volume = float(market.get("volume", 0) or 0)

            # Update history
            self._update_history(ticker, current_price, current_volume)

            # Need enough history
            if len(self.price_history.get(ticker, [])) < self.lookback_periods:
                return None

            # Calculate momentum signals
            price_momentum = self._calculate_price_momentum(ticker)
            volume_momentum = self._calculate_volume_momentum(ticker)
            flow_signal = self._calculate_flow_signal(orderbook)

            # Combine signals
            combined_signal = self._combine_signals(
                price_momentum, volume_momentum, flow_signal
            )

            if abs(combined_signal) < self.momentum_threshold:
                return None

            # Determine direction
            side = "yes" if combined_signal > 0 else "no"

            # Calculate edge based on momentum strength
            edge = abs(combined_signal) * 100  # Convert to percentage

            # Calculate confidence
            confidence = self._calculate_confidence(
                price_momentum, volume_momentum, flow_signal
            )

            if confidence < self.min_confidence:
                return None

            # Get entry price
            entry_price = self._get_entry_price(market, orderbook, side)

            # Calculate probability based on momentum
            base_prob = 0.5 + (combined_signal * 0.5)  # Scale signal to probability
            probability = max(0.05, min(0.95, base_prob))

            # Calculate liquidity score
            liquidity_score = self._calculate_liquidity_score(market, orderbook)

            # Determine correlation group
            correlation_group = self._get_correlation_group(ticker)

            logger.info(
                f"Momentum: {ticker} | {side.upper()} | Signal: {combined_signal:.3f} | Edge: {edge:.2f}%"
            )

            return MarketOpportunity(
                ticker=ticker,
                market_title=market.get("title", ""),
                edge=edge,
                confidence=confidence,
                side=side,
                entry_price=entry_price,
                suggested_size=1,
                reasoning=f"Momentum: Price={price_momentum:.3f}, Vol={volume_momentum:.2f}x, Flow={flow_signal:.3f}",
                liquidity_score=liquidity_score,
                probability=probability if side == "yes" else (1 - probability),
                correlation_group=correlation_group,
            )

        except Exception as e:
            logger.error(f"Momentum strategy error: {e}")
            return None

    def _get_current_price(self, market: Dict, orderbook: Dict) -> float:
        """Get current mid price"""
        # Try orderbook first
        if orderbook and "yes" in orderbook:
            yes_data = orderbook["yes"]
            bids = yes_data.get("bids", [])
            asks = yes_data.get("asks", [])

            if bids and asks:
                best_bid = float(bids[0].get("price", 0))
                best_ask = float(asks[0].get("price", 100))
                return (best_bid + best_ask) / 200.0

        # Fall back to market data
        yes_bid = float(market.get("yes_bid", 0) or 0)
        yes_ask = float(market.get("yes_ask", 100) or 100)

        if yes_bid > 0 and yes_ask > 0:
            return (yes_bid + yes_ask) / 200.0

        # Last resort
        last_price = float(market.get("last_price", 50) or 50)
        return last_price / 100.0

    def _update_history(self, ticker: str, price: float, volume: float):
        """Update price and volume history"""
        if ticker not in self.price_history:
            self.price_history[ticker] = deque(maxlen=self.lookback_periods * 2)
            self.volume_history[ticker] = deque(maxlen=self.lookback_periods * 2)

        self.price_history[ticker].append(price)
        self.volume_history[ticker].append(volume)

    def _calculate_price_momentum(self, ticker: str) -> float:
        """Calculate price momentum using multiple timeframes"""
        prices = list(self.price_history[ticker])
        if len(prices) < 3:
            return 0.0

        # Short-term momentum (last 3 periods)
        st_momentum = (prices[-1] - prices[-3]) / prices[-3] if prices[-3] != 0 else 0

        # Medium-term momentum (lookback periods)
        mt_momentum = (prices[-1] - prices[0]) / len(prices) if prices[0] != 0 else 0

        # Weighted combination (more weight to recent)
        return 0.7 * st_momentum + 0.3 * mt_momentum

    def _calculate_volume_momentum(self, ticker: str) -> float:
        """Calculate volume momentum relative to average"""
        volumes = list(self.volume_history[ticker])
        if len(volumes) < self.lookback_periods:
            return 1.0

        current_vol = volumes[-1]
        avg_vol = sum(volumes[:-1]) / len(volumes[:-1])

        if avg_vol == 0:
            return 1.0

        return current_vol / avg_vol

    def _calculate_flow_signal(self, orderbook: Dict) -> float:
        """Calculate order flow signal from order book"""
        if not orderbook or "yes" not in orderbook:
            return 0.0

        yes_data = orderbook["yes"]
        bids = yes_data.get("bids", [])
        asks = yes_data.get("asks", [])

        if not bids or not asks:
            return 0.0

        # Calculate bid/ask imbalance
        bid_vol = sum(b.get("count", 0) for b in bids[:5])
        ask_vol = sum(a.get("count", 0) for a in asks[:5])

        total_vol = bid_vol + ask_vol
        if total_vol == 0:
            return 0.0

        # Normalize to -1 to 1 range
        imbalance = (bid_vol - ask_vol) / total_vol

        # Check for large orders (whale detection)
        whale_bid = max((b.get("count", 0) for b in bids[:3]), default=0)
        whale_ask = max((a.get("count", 0) for a in asks[:3]), default=0)

        whale_signal = 0
        if whale_bid > whale_ask * 2:
            whale_signal = 0.2  # Bullish whale
        elif whale_ask > whale_bid * 2:
            whale_signal = -0.2  # Bearish whale

        return imbalance * 0.8 + whale_signal * 0.2

    def _combine_signals(
        self, price_momentum: float, volume_momentum: float, flow_signal: float
    ) -> float:
        """Combine multiple momentum signals"""
        # Require volume confirmation for strong signals
        if volume_momentum < self.volume_threshold:
            # Reduce signal strength if volume is low
            volume_adj = volume_momentum / self.volume_threshold
            price_momentum *= volume_adj

        # Weighted combination
        combined = (
            0.5 * price_momentum
            + 0.3 * flow_signal
            + 0.2 * (volume_momentum - 1.0) * 0.1
        )  # Volume boost

        return max(-0.5, min(0.5, combined))  # Cap at +/- 50%

    def _calculate_confidence(
        self, price_momentum: float, volume_momentum: float, flow_signal: float
    ) -> float:
        """Calculate confidence based on signal consistency"""
        # Check if all signals agree
        signals_agree = (price_momentum > 0 and flow_signal > 0) or (
            price_momentum < 0 and flow_signal < 0
        )

        # Base confidence from signal strength
        base_conf = abs(price_momentum) * 2  # Scale up

        # Boost if signals agree
        if signals_agree:
            base_conf *= 1.3

        # Volume confirmation boost
        if volume_momentum >= self.volume_threshold:
            base_conf *= 1.2

        return min(base_conf, 1.0)

    def _get_entry_price(self, market: Dict, orderbook: Dict, side: str) -> float:
        """Get entry price"""
        if side == "yes":
            if orderbook and "yes" in orderbook:
                asks = orderbook["yes"].get("asks", [])
                if asks:
                    return float(asks[0].get("price", market.get("yes_ask", 50)))
            return float(market.get("yes_ask", 50) or 50)
        else:
            if orderbook and "no" in orderbook:
                asks = orderbook["no"].get("asks", [])
                if asks:
                    return float(asks[0].get("price", market.get("no_ask", 50)))
            return float(market.get("no_ask", 50) or 50)

    def _calculate_liquidity_score(self, market: Dict, orderbook: Dict) -> float:
        """Calculate liquidity score"""
        volume = float(market.get("volume", 0) or 0)

        # Base from volume
        vol_score = min(volume / 5000, 1.0)

        # Add order book depth
        depth_score = 0.0
        if orderbook and "yes" in orderbook:
            yes_data = orderbook["yes"]
            bids = yes_data.get("bids", [])
            asks = yes_data.get("asks", [])
            depth = sum(b.get("count", 0) for b in bids[:5])
            depth += sum(a.get("count", 0) for a in asks[:5])
            depth_score = min(depth / 100, 1.0)

        return 0.6 * vol_score + 0.4 * depth_score

    def _get_correlation_group(self, ticker: str) -> str:
        """Determine correlation group from ticker"""
        ticker_upper = ticker.upper()

        if ticker_upper.startswith(("BTC", "ETH", "KXCRYPTO")):
            return "crypto"
        elif ticker_upper.startswith(("FED", "KXECON")):
            return "macro"
        elif ticker_upper.startswith(("INX", "KXINX")):
            return "equity"
        elif "-" in ticker_upper:
            return ticker_upper.split("-")[0].lower()
        return "general"

    def clear_history(self, ticker: Optional[str] = None):
        """Clear price history (useful for memory management)"""
        if ticker:
            self.price_history.pop(ticker, None)
            self.volume_history.pop(ticker, None)
        else:
            self.price_history.clear()
            self.volume_history.clear()
