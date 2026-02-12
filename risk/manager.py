import math
import logging
from typing import Dict, Optional, List, Set, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from collections import deque, defaultdict
from enum import Enum

logger = logging.getLogger(__name__)


class RiskLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class RiskConfig:
    # Position sizing
    max_position_size_usd: float = 100.0
    max_portfolio_allocation: float = 0.25
    max_single_trade_allocation: float = 0.10  # Max 10% per single trade

    # Loss limits
    max_daily_loss_usd: float = 30.0
    max_daily_loss_pct: float = 0.10  # 10% of portfolio
    max_weekly_loss_usd: float = 100.0

    # Drawdown limits
    max_drawdown_limit: float = 0.20
    max_intraday_drawdown: float = 0.15

    # Kelly Criterion
    kelly_multiplier: float = 0.5  # Half Kelly for safety
    min_kelly_fraction: float = 0.01  # Minimum 1% allocation
    max_kelly_fraction: float = 0.50  # Maximum 50% allocation

    # Risk-adjusted sizing
    volatility_adjustment: bool = True
    max_volatility_threshold: float = 0.40  # 40% volatility threshold

    # Concentration limits
    max_concentration: float = 0.30  # Max 30% in correlated group
    max_correlation_threshold: float = 0.70  # Correlation threshold

    # Trade filters
    min_edge: float = 0.5
    min_confidence: float = 0.3
    min_liquidity_score: float = 0.1

    # Time-based limits
    max_trades_per_hour: int = 10
    max_trades_per_day: int = 50
    cooldown_period_minutes: int = 5  # Between trades on same ticker

    # Market conditions
    trading_halt_on_volatility: bool = True
    volatility_spike_threshold: float = 2.0  # 2x normal volatility


@dataclass
class Position:
    ticker: str
    side: str
    size: int
    entry_price: float
    entry_time: datetime
    current_price: Optional[float] = None
    unrealized_pnl: float = 0.0
    market_correlation_group: str = "general"


@dataclass
class TradeRecord:
    ticker: str
    side: str
    size: int
    entry_price: float
    exit_price: Optional[float] = None
    pnl: float = 0.0
    timestamp: datetime = field(default_factory=datetime.now)
    risk_level: RiskLevel = RiskLevel.MEDIUM


class RiskManager:
    """
    Advanced risk management with:
    - Kelly Criterion position sizing
    - Volatility-adjusted sizing
    - Correlation tracking
    - Time-based circuit breakers
    - Comprehensive risk metrics
    """

    def __init__(self, config: Optional[RiskConfig] = None):
        self.config = config or RiskConfig()

        # Portfolio tracking
        self.daily_pnl = 0.0
        self.weekly_pnl = 0.0
        self.peak_balance = 0.0
        self.current_drawdown = 0.0
        self.intraday_drawdown = 0.0
        self.active_positions_value = 0.0

        # Position tracking
        self.active_positions: Dict[str, Position] = {}
        self.trade_history: deque = deque(maxlen=1000)
        self.hourly_trades: deque = deque(maxlen=100)
        self.daily_trades: deque = deque(maxlen=200)
        self.ticker_last_trade: Dict[str, datetime] = {}

        # Risk metrics
        self.volatility_estimate = 0.15  # 15% baseline volatility
        self.var_95 = 0.0  # Value at Risk (95%)
        self.expected_shortfall = 0.0

        # Correlation tracking
        self.correlation_groups: Dict[str, Set[str]] = defaultdict(set)
        self.price_history: Dict[str, deque] = defaultdict(lambda: deque(maxlen=50))

        # Circuit breakers
        self.circuit_breakers = {
            "daily_loss": False,
            "drawdown": False,
            "volatility": False,
            "trade_frequency": False,
        }

        logger.info("Risk Manager initialized")

    def update_portfolio_state(self, portfolio: Dict):
        """Update internal state based on latest portfolio data"""
        balance = portfolio.get("balance", 0.0)
        self.active_positions_value = portfolio.get("active_value", 0.0)

        total_equity = balance + self.active_positions_value

        # Track drawdown
        if total_equity > self.peak_balance:
            self.peak_balance = total_equity
            self.intraday_drawdown = 0.0

        if self.peak_balance > 0:
            self.current_drawdown = (
                self.peak_balance - total_equity
            ) / self.peak_balance
            self.intraday_drawdown = max(self.intraday_drawdown, self.current_drawdown)

        # Update circuit breakers
        self._update_circuit_breakers()

    def _update_circuit_breakers(self):
        """Update circuit breaker states based on current conditions"""
        # Daily loss circuit breaker
        daily_loss_pct = abs(self.daily_pnl) / max(self.peak_balance, 1)
        self.circuit_breakers["daily_loss"] = (
            self.daily_pnl < -self.config.max_daily_loss_usd
            or daily_loss_pct > self.config.max_daily_loss_pct
        )

        # Drawdown circuit breaker
        self.circuit_breakers["drawdown"] = (
            self.current_drawdown > self.config.max_drawdown_limit
            or self.intraday_drawdown > self.config.max_intraday_drawdown
        )

        # Trade frequency circuit breaker
        now = datetime.now()
        hour_ago = now - timedelta(hours=1)
        day_ago = now - timedelta(days=1)

        recent_hourly = sum(1 for t in self.hourly_trades if t > hour_ago)
        recent_daily = sum(1 for t in self.daily_trades if t > day_ago)

        self.circuit_breakers["trade_frequency"] = (
            recent_hourly >= self.config.max_trades_per_hour
            or recent_daily >= self.config.max_trades_per_day
        )

    def check_trade_risk(self, opportunity, portfolio: Dict) -> int:
        """
        Comprehensive risk check with Kelly Criterion sizing
        Returns: number of contracts (0 if rejected)
        """
        ticker = getattr(opportunity, "ticker", None)
        if not ticker:
            logger.warning("Risk Reject: No ticker provided")
            return 0

        balance = portfolio.get("balance", 0.0)

        # 1. Circuit Breakers
        if self.circuit_breakers["daily_loss"]:
            logger.warning(f"Risk Reject: Daily loss limit hit ({self.daily_pnl:.2f})")
            return 0

        if self.circuit_breakers["drawdown"]:
            logger.warning(
                f"Risk Reject: Drawdown limit hit ({self.current_drawdown:.1%})"
            )
            return 0

        if self.circuit_breakers["trade_frequency"]:
            logger.warning("Risk Reject: Trade frequency limit reached")
            return 0

        # 2. Basic filters
        if opportunity.edge < self.config.min_edge:
            logger.debug(f"Risk Reject: Edge too low ({opportunity.edge:.2f})")
            return 0

        if opportunity.confidence < self.config.min_confidence:
            logger.debug(
                f"Risk Reject: Confidence too low ({opportunity.confidence:.2f})"
            )
            return 0

        if opportunity.liquidity_score < self.config.min_liquidity_score:
            logger.debug(
                f"Risk Reject: Liquidity too low ({opportunity.liquidity_score:.2f})"
            )
            return 0

        # 3. Cooldown check
        now = datetime.now()
        if ticker in self.ticker_last_trade:
            time_since_last = (
                now - self.ticker_last_trade[ticker]
            ).total_seconds() / 60
            if time_since_last < self.config.cooldown_period_minutes:
                logger.debug(f"Risk Reject: Cooldown active for {ticker}")
                return 0

        # 4. Position concentration check
        entry_price = opportunity.entry_price
        if entry_price <= 0 or entry_price >= 100:
            logger.warning(f"Risk Reject: Invalid entry price ({entry_price})")
            return 0

        # Calculate position value
        win_prob = opportunity.probability
        net_odds = (100.0 - entry_price) / entry_price

        # 5. Kelly Criterion calculation
        kelly_fraction = win_prob - ((1.0 - win_prob) / net_odds)

        if kelly_fraction <= 0:
            logger.debug(
                f"Risk Reject: Kelly fraction non-positive ({kelly_fraction:.4f})"
            )
            return 0

        # Apply fractional Kelly
        target_fraction = kelly_fraction * self.config.kelly_multiplier
        target_fraction = max(
            self.config.min_kelly_fraction,
            min(target_fraction, self.config.max_kelly_fraction),
        )

        # 6. Volatility adjustment
        if self.config.volatility_adjustment:
            vol_adjustment = self._calculate_volatility_adjustment()
            target_fraction *= vol_adjustment

        # 7. Apply position limits
        max_alloc_fraction = min(target_fraction, self.config.max_portfolio_allocation)
        max_alloc_fraction = min(
            max_alloc_fraction, self.config.max_single_trade_allocation
        )

        # 8. Calculate dollar amount and contracts
        trade_amount_usd = balance * max_alloc_fraction
        trade_amount_usd = min(trade_amount_usd, self.config.max_position_size_usd)

        # Convert to contracts
        trade_amount_cents = trade_amount_usd * 100
        num_contracts = int(trade_amount_cents / entry_price)

        # 9. Correlation check
        correlation_group = getattr(opportunity, "correlation_group", "general")
        current_exposure = self._get_correlation_exposure(correlation_group)
        potential_exposure = current_exposure + (num_contracts * entry_price / 100)
        max_exposure = balance * self.config.max_concentration

        if potential_exposure > max_exposure:
            # Reduce position to fit concentration limit
            available_exposure = max_exposure - current_exposure
            if available_exposure <= 0:
                logger.warning(
                    f"Risk Reject: Max concentration reached for {correlation_group}"
                )
                return 0
            num_contracts = int((available_exposure * 100) / entry_price)

        # Safety check for minimum reasonable size
        if num_contracts < 1:
            logger.debug(
                f"Risk Reject: Position size too small ({num_contracts} contracts)"
            )
            return 0

        logger.info(
            f"Risk Approve: {ticker} | {num_contracts} contracts | "
            f"${trade_amount_usd:.2f} ({max_alloc_fraction:.1%} of portfolio)"
        )

        return num_contracts

    def _calculate_volatility_adjustment(self) -> float:
        """Calculate position size adjustment based on market volatility"""
        if self.volatility_estimate <= 0:
            return 1.0

        # Reduce position size in high volatility
        if self.volatility_estimate > self.config.max_volatility_threshold:
            return self.config.max_volatility_threshold / self.volatility_estimate

        return 1.0

    def _get_correlation_exposure(self, group: str) -> float:
        """Get current dollar exposure for a correlation group"""
        exposure = 0.0
        for position in self.active_positions.values():
            if position.market_correlation_group == group:
                exposure += position.size * position.entry_price / 100
        return exposure

    def record_trade(self, opportunity, num_contracts: int, portfolio: Dict):
        """Record a new trade for tracking"""
        ticker = opportunity.ticker
        now = datetime.now()

        position = Position(
            ticker=ticker,
            side=opportunity.side,
            size=num_contracts,
            entry_price=opportunity.entry_price,
            entry_time=now,
            market_correlation_group=getattr(
                opportunity, "correlation_group", "general"
            ),
        )

        self.active_positions[ticker] = position
        self.ticker_last_trade[ticker] = now
        self.hourly_trades.append(now)
        self.daily_trades.append(now)

        # Update trade history
        trade = TradeRecord(
            ticker=ticker,
            side=opportunity.side,
            size=num_contracts,
            entry_price=opportunity.entry_price,
            risk_level=self._assess_risk_level(opportunity, portfolio),
        )
        self.trade_history.append(trade)

        logger.info(
            f"Trade recorded: {ticker} {opportunity.side} {num_contracts} @ {opportunity.entry_price}"
        )

    def _assess_risk_level(self, opportunity, portfolio: Dict) -> RiskLevel:
        """Assess risk level of a trade"""
        balance = portfolio.get("balance", 1.0)
        position_value = (opportunity.suggested_size * opportunity.entry_price) / 100
        allocation_pct = position_value / balance

        if allocation_pct > 0.20 or opportunity.edge < 1.0:
            return RiskLevel.CRITICAL
        elif allocation_pct > 0.10 or opportunity.edge < 2.0:
            return RiskLevel.HIGH
        elif allocation_pct > 0.05:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.LOW

    def record_trade_result(
        self, ticker: str, pnl: float, exit_price: Optional[float] = None
    ):
        """Record the result of a closed trade"""
        self.daily_pnl += pnl
        self.weekly_pnl += pnl

        # Remove from active positions
        if ticker in self.active_positions:
            del self.active_positions[ticker]

        # Update trade history
        for trade in reversed(self.trade_history):
            if trade.ticker == ticker and trade.exit_price is None:
                trade.exit_price = exit_price
                trade.pnl = pnl
                break

        logger.info(
            f"Trade result: {ticker} PnL=${pnl:.2f} | Daily PnL=${self.daily_pnl:.2f}"
        )

    def update_position_price(self, ticker: str, current_price: float):
        """Update current price and unrealized PnL for a position"""
        if ticker in self.active_positions:
            position = self.active_positions[ticker]
            position.current_price = current_price

            if position.side == "yes":
                position.unrealized_pnl = (
                    (current_price - position.entry_price) * position.size / 100
                )
            else:
                position.unrealized_pnl = (
                    (position.entry_price - current_price) * position.size / 100
                )

            # Update price history for volatility calculation
            self.price_history[ticker].append(current_price)
            self._update_volatility_estimate()

    def _update_volatility_estimate(self):
        """Update volatility estimate from price history"""
        returns = []
        for ticker, prices in self.price_history.items():
            if len(prices) >= 2:
                price_list = list(prices)
                for i in range(1, len(price_list)):
                    ret = (
                        (price_list[i] - price_list[i - 1]) / price_list[i - 1]
                        if price_list[i - 1] != 0
                        else 0
                    )
                    returns.append(ret)

        if len(returns) >= 10:
            mean_ret = sum(returns) / len(returns)
            variance = sum((r - mean_ret) ** 2 for r in returns) / len(returns)
            self.volatility_estimate = math.sqrt(variance) * math.sqrt(
                252
            )  # Annualized

    def get_risk_report(self) -> Dict:
        """Generate comprehensive risk report"""
        return {
            "circuit_breakers": self.circuit_breakers,
            "daily_pnl": self.daily_pnl,
            "weekly_pnl": self.weekly_pnl,
            "current_drawdown": self.current_drawdown,
            "intraday_drawdown": self.intraday_drawdown,
            "volatility_estimate": self.volatility_estimate,
            "active_positions": len(self.active_positions),
            "active_exposure": self.active_positions_value,
            "trade_counts": {
                "hourly": len(
                    [
                        t
                        for t in self.hourly_trades
                        if t > datetime.now() - timedelta(hours=1)
                    ]
                ),
                "daily": len(
                    [
                        t
                        for t in self.daily_trades
                        if t > datetime.now() - timedelta(days=1)
                    ]
                ),
                "total_history": len(self.trade_history),
            },
            "concentration": {
                group: self._get_correlation_exposure(group)
                for group in self.correlation_groups.keys()
            },
        }

    def reset_daily_metrics(self):
        """Reset daily metrics (call at start of trading day)"""
        self.daily_pnl = 0.0
        self.intraday_drawdown = 0.0
        self.hourly_trades.clear()
        # Keep daily trades but they'll age out naturally
        logger.info("Daily risk metrics reset")

    def reset_weekly_metrics(self):
        """Reset weekly metrics (call at start of trading week)"""
        self.weekly_pnl = 0.0
        self.daily_trades.clear()
        logger.info("Weekly risk metrics reset")
