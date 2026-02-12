from typing import List, Dict, Optional
import asyncio
import logging
from .base import BaseStrategy
from .fundamental import FundamentalStrategy
from .sentiment import SentimentStrategy
from .momentum import MomentumStrategy
from models import MarketOpportunity

logger = logging.getLogger(__name__)


class StrategyManager:
    """
    Enhanced strategy manager with:
    - Parallel strategy execution
    - Strategy weighting and performance tracking
    - Signal aggregation
    - Dynamic strategy selection
    """

    def __init__(
        self,
        enable_fundamental: bool = True,
        enable_sentiment: bool = True,
        enable_momentum: bool = True,
        max_concurrent_strategies: int = 3,
    ):
        self.strategies: List[BaseStrategy] = []
        self.max_concurrent_strategies = max_concurrent_strategies

        # Strategy performance tracking
        self.strategy_performance: Dict[str, Dict] = {}
        self.strategy_weights: Dict[str, float] = {}

        # Initialize strategies
        if enable_fundamental:
            self.strategies.append(FundamentalStrategy())
            self.strategy_weights["FundamentalStrategy"] = 1.0

        if enable_sentiment:
            self.strategies.append(SentimentStrategy())
            self.strategy_weights["SentimentStrategy"] = 0.8

        if enable_momentum:
            self.strategies.append(MomentumStrategy())
            self.strategy_weights["MomentumStrategy"] = 0.9

        logger.info(
            f"StrategyManager initialized with {len(self.strategies)} strategies"
        )

    async def analyze_market(
        self, market: Dict, orderbook: Dict, mcp_session=None, learner=None
    ) -> List[MarketOpportunity]:
        """
        Run all strategies on the market in parallel and aggregate opportunities.
        """
        opportunities = []

        # Create semaphore for concurrency control
        semaphore = asyncio.Semaphore(self.max_concurrent_strategies)

        async def run_strategy(strategy: BaseStrategy) -> Optional[MarketOpportunity]:
            """Run a single strategy with error handling"""
            async with semaphore:
                try:
                    strategy_name = strategy.__class__.__name__

                    # Apply learner parameter updates if available
                    if learner:
                        params = learner.get_strategy_params(strategy_name)
                        if params:
                            strategy.update_params(params)

                    # Run strategy analysis
                    opp = await strategy.analyze_market(market, orderbook, mcp_session)

                    if opp:
                        # Apply strategy weighting
                        weight = self.strategy_weights.get(strategy_name, 1.0)

                        if learner:
                            # Get adaptive weight from learner
                            adaptive_weight = learner.get_strategy_weight(strategy_name)
                            weight *= adaptive_weight

                        # Apply weight to edge and confidence
                        opp.edge = opp.edge * weight
                        opp.confidence = min(1.0, opp.confidence * weight)

                        # Add strategy name to reasoning
                        opp.reasoning = f"[{strategy_name}] {opp.reasoning}"

                        return opp

                except Exception as e:
                    logger.error(f"Strategy Error ({strategy.__class__.__name__}): {e}")

                return None

        # Run all strategies in parallel
        tasks = [run_strategy(strategy) for strategy in self.strategies]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Filter valid opportunities
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"Strategy execution failed: {result}")
            elif result is not None:
                opportunities.append(result)

        return opportunities

    def aggregate_signals(
        self, opportunities: List[MarketOpportunity]
    ) -> Optional[MarketOpportunity]:
        """
        Aggregate multiple signals into a single opportunity.
        Returns the best opportunity or a consensus opportunity.
        """
        if not opportunities:
            return None

        if len(opportunities) == 1:
            return opportunities[0]

        # Check for consensus (multiple strategies agree)
        yes_signals = [o for o in opportunities if o.side == "yes"]
        no_signals = [o for o in opportunities if o.side == "no"]

        # If there's clear consensus
        if len(yes_signals) >= 2 and len(no_signals) == 0:
            return self._create_consensus_opportunity(yes_signals, "yes")
        elif len(no_signals) >= 2 and len(yes_signals) == 0:
            return self._create_consensus_opportunity(no_signals, "no")

        # No consensus - return the highest scoring opportunity
        return max(opportunities, key=lambda x: x.score)

    def _create_consensus_opportunity(
        self, signals: List[MarketOpportunity], side: str
    ) -> MarketOpportunity:
        """Create a consensus opportunity from multiple agreeing signals"""
        # Calculate weighted averages
        total_weight = sum(s.confidence for s in signals)

        weighted_edge = sum(s.edge * s.confidence for s in signals) / total_weight
        weighted_confidence = min(
            sum(s.confidence for s in signals) / len(signals) * 1.2, 1.0
        )
        weighted_price = (
            sum(s.entry_price * s.confidence for s in signals) / total_weight
        )
        weighted_prob = (
            sum(s.probability * s.confidence for s in signals) / total_weight
        )
        avg_liquidity = sum(s.liquidity_score for s in signals) / len(signals)

        # Combine reasoning
        strategies = set()
        for s in signals:
            if "[" in s.reasoning and "]" in s.reasoning:
                strategy_name = s.reasoning[
                    s.reasoning.find("[") + 1 : s.reasoning.find("]")
                ]
                strategies.add(strategy_name)

        consensus_reasoning = f"CONSENSUS ({', '.join(strategies)}): Multiple strategies agree on {side.upper()}"

        # Use the first signal as base and modify
        base = signals[0]

        return MarketOpportunity(
            ticker=base.ticker,
            market_title=base.market_title,
            edge=weighted_edge * 1.1,  # Boost for consensus
            confidence=weighted_confidence,
            side=side,
            entry_price=weighted_price,
            suggested_size=max(
                s.suggested_size for s in signals
            ),  # Most conservative sizing
            reasoning=consensus_reasoning,
            liquidity_score=avg_liquidity,
            probability=weighted_prob if side == "yes" else (1 - weighted_prob),
            correlation_group=base.correlation_group,
        )

    def update_strategy_weight(self, strategy_name: str, weight: float):
        """Update the weight for a specific strategy"""
        if strategy_name in self.strategy_weights:
            self.strategy_weights[strategy_name] = max(0.1, min(2.0, weight))
            logger.info(
                f"Updated {strategy_name} weight to {self.strategy_weights[strategy_name]}"
            )

    def record_strategy_result(self, strategy_name: str, pnl: float):
        """Record PnL for a strategy for performance tracking"""
        if strategy_name not in self.strategy_performance:
            self.strategy_performance[strategy_name] = {
                "trades": 0,
                "wins": 0,
                "losses": 0,
                "total_pnl": 0.0,
                "avg_pnl": 0.0,
            }

        perf = self.strategy_performance[strategy_name]
        perf["trades"] += 1
        perf["total_pnl"] += pnl

        if pnl > 0:
            perf["wins"] += 1
        else:
            perf["losses"] += 1

        perf["avg_pnl"] = perf["total_pnl"] / perf["trades"]

        # Auto-adjust weights based on performance
        self._adjust_weights()

    def _adjust_weights(self):
        """Auto-adjust strategy weights based on performance"""
        if len(self.strategy_performance) < 2:
            return

        # Find best performing strategy
        best_strategy = max(
            self.strategy_performance.items(), key=lambda x: x[1]["avg_pnl"]
        )

        # Boost best performer slightly, reduce worst slightly
        for name in self.strategy_weights:
            if name == best_strategy[0]:
                self.strategy_weights[name] = min(
                    1.5, self.strategy_weights[name] * 1.05
                )
            else:
                self.strategy_weights[name] = max(
                    0.5, self.strategy_weights[name] * 0.98
                )

    def get_strategy_stats(self) -> Dict:
        """Get performance statistics for all strategies"""
        return {
            "weights": self.strategy_weights.copy(),
            "performance": self.strategy_performance.copy(),
        }

    def add_strategy(self, strategy: BaseStrategy, weight: float = 1.0):
        """Add a new strategy dynamically"""
        self.strategies.append(strategy)
        self.strategy_weights[strategy.__class__.__name__] = weight
        logger.info(
            f"Added strategy {strategy.__class__.__name__} with weight {weight}"
        )

    def remove_strategy(self, strategy_name: str):
        """Remove a strategy by name"""
        self.strategies = [
            s for s in self.strategies if s.__class__.__name__ != strategy_name
        ]
        self.strategy_weights.pop(strategy_name, None)
        logger.info(f"Removed strategy {strategy_name}")
