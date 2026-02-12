from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import List, Dict, Optional, Any
import json


@dataclass(slots=True)
class MarketOpportunity:
    """
    Represents a trading opportunity with memory-efficient slots.
    """

    ticker: str
    market_title: str
    edge: float  # Expected edge in percentage
    confidence: float  # 0-1
    side: str  # "yes" or "no"
    entry_price: float
    suggested_size: int  # Number of contracts
    reasoning: str
    liquidity_score: float  # 0-1
    probability: float = 0.5
    timestamp: datetime = field(default_factory=datetime.now)
    correlation_group: str = "general"  # For risk correlation tracking

    def __post_init__(self):
        """Validate and normalize values after initialization"""
        # Ensure confidence is in [0, 1]
        self.confidence = max(0.0, min(1.0, float(self.confidence)))

        # Ensure probability is in [0, 1]
        self.probability = max(0.0, min(1.0, float(self.probability)))

        # Ensure liquidity_score is in [0, 1]
        self.liquidity_score = max(0.0, min(1.0, float(self.liquidity_score)))

        # Normalize side
        self.side = str(self.side).lower()
        if self.side not in ("yes", "no"):
            self.side = "yes"

        # Ensure positive values
        self.edge = max(0.0, float(self.edge))
        self.entry_price = max(0.0, min(100.0, float(self.entry_price)))
        self.suggested_size = max(0, int(self.suggested_size))

    @property
    def score(self) -> float:
        """Composite score for ranking opportunities"""
        return self.edge * self.confidence * self.liquidity_score

    @property
    def expected_value(self) -> float:
        """Calculate expected value of the trade"""
        if self.side == "yes":
            win_prob = self.probability
            payout = 100 - self.entry_price
        else:
            win_prob = 1 - self.probability
            payout = self.entry_price

        return (win_prob * payout) - ((1 - win_prob) * self.entry_price)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization"""
        data = asdict(self)
        # Convert datetime to ISO format string
        if isinstance(self.timestamp, datetime):
            data["timestamp"] = self.timestamp.isoformat()
        return data

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "MarketOpportunity":
        """Create instance from dictionary"""
        # Parse timestamp if it's a string
        if "timestamp" in data and isinstance(data["timestamp"], str):
            data["timestamp"] = datetime.fromisoformat(data["timestamp"])

        # Filter only valid fields
        valid_fields = {f for f in cls.__slots__}
        filtered_data = {k: v for k, v in data.items() if k in valid_fields}

        return cls(**filtered_data)

    def to_json(self) -> str:
        """Serialize to JSON string"""
        return json.dumps(self.to_dict())

    @classmethod
    def from_json(cls, json_str: str) -> "MarketOpportunity":
        """Deserialize from JSON string"""
        data = json.loads(json_str)
        return cls.from_dict(data)

    def __repr__(self) -> str:
        return (
            f"MarketOpportunity({self.ticker}, {self.side}, "
            f"edge={self.edge:.2f}, conf={self.confidence:.2f}, "
            f"size={self.suggested_size})"
        )

    def __hash__(self) -> int:
        """Make hashable for use in sets/dicts"""
        return hash((self.ticker, self.side, self.timestamp))

    def __eq__(self, other) -> bool:
        """Equality check"""
        if not isinstance(other, MarketOpportunity):
            return False
        return (
            self.ticker == other.ticker
            and self.side == other.side
            and self.timestamp == other.timestamp
        )


@dataclass(slots=True)
class TradePerformance:
    """
    Track trade performance metrics with memory-efficient slots.
    """

    wins: int = 0
    losses: int = 0
    total_pnl: float = 0.0
    consecutive_wins: int = 0
    consecutive_losses: int = 0
    max_drawdown: float = 0.0
    peak_balance: float = 0.0
    daily_pnl_pct: float = 0.0
    total_volume: float = 0.0
    avg_trade_size: float = 0.0

    def __post_init__(self):
        """Ensure non-negative values"""
        self.wins = max(0, int(self.wins))
        self.losses = max(0, int(self.losses))

    @property
    def win_rate(self) -> float:
        """Calculate win rate"""
        total = self.wins + self.losses
        return self.wins / total if total > 0 else 0.0

    @property
    def loss_rate(self) -> float:
        """Calculate loss rate"""
        total = self.wins + self.losses
        return self.losses / total if total > 0 else 0.0

    @property
    def avg_pnl_per_trade(self) -> float:
        """Calculate average PnL per trade"""
        total = self.wins + self.losses
        return self.total_pnl / total if total > 0 else 0.0

    @property
    def profit_factor(self) -> float:
        """Calculate profit factor (gross profit / gross loss)"""
        if self.losses == 0:
            return float("inf") if self.wins > 0 else 0.0
        # Approximation using average win * wins / average loss * losses
        avg_win = self.total_pnl / self.wins if self.wins > 0 else 0
        avg_loss = (
            -self.total_pnl / self.losses
            if self.losses > 0 and self.total_pnl < 0
            else 1
        )
        if avg_loss == 0:
            return float("inf")
        return (avg_win * self.wins) / (abs(avg_loss) * self.losses)

    @property
    def sharpe_ratio(self) -> float:
        """Approximate Sharpe ratio (simplified)"""
        # This is a simplified version - real Sharpe requires returns series
        if self.losses == 0:
            return float("inf") if self.wins > 0 else 0.0
        return self.total_pnl / (self.losses + 1)  # Simplified

    def record_win(self, pnl: float, trade_size: float = 0.0):
        """Record a winning trade"""
        self.wins += 1
        self.consecutive_wins += 1
        self.consecutive_losses = 0
        self.total_pnl += pnl
        self.total_volume += trade_size
        self._update_avg_trade_size(trade_size)

    def record_loss(self, pnl: float, trade_size: float = 0.0):
        """Record a losing trade"""
        self.losses += 1
        self.consecutive_losses += 1
        self.consecutive_wins = 0
        self.total_pnl += pnl
        self.total_volume += trade_size
        self._update_avg_trade_size(trade_size)

    def _update_avg_trade_size(self, trade_size: float):
        """Update average trade size"""
        total_trades = self.wins + self.losses
        if total_trades == 1:
            self.avg_trade_size = trade_size
        else:
            self.avg_trade_size = (
                (self.avg_trade_size * (total_trades - 1)) + trade_size
            ) / total_trades

    def update_drawdown(self, current_balance: float):
        """Update drawdown metrics"""
        if current_balance > self.peak_balance:
            self.peak_balance = current_balance

        if self.peak_balance > 0:
            drawdown = (self.peak_balance - current_balance) / self.peak_balance
            self.max_drawdown = max(self.max_drawdown, drawdown)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "wins": self.wins,
            "losses": self.losses,
            "win_rate": self.win_rate,
            "loss_rate": self.loss_rate,
            "total_pnl": self.total_pnl,
            "avg_pnl_per_trade": self.avg_pnl_per_trade,
            "profit_factor": self.profit_factor,
            "sharpe_ratio": self.sharpe_ratio,
            "consecutive_wins": self.consecutive_wins,
            "consecutive_losses": self.consecutive_losses,
            "max_drawdown": self.max_drawdown,
            "peak_balance": self.peak_balance,
            "total_volume": self.total_volume,
            "avg_trade_size": self.avg_trade_size,
        }

    def reset(self):
        """Reset all metrics"""
        self.wins = 0
        self.losses = 0
        self.total_pnl = 0.0
        self.consecutive_wins = 0
        self.consecutive_losses = 0
        self.max_drawdown = 0.0
        self.peak_balance = 0.0
        self.daily_pnl_pct = 0.0
        self.total_volume = 0.0
        self.avg_trade_size = 0.0

    def __repr__(self) -> str:
        return (
            f"TradePerformance(wins={self.wins}, losses={self.losses}, "
            f"win_rate={self.win_rate:.1%}, pnl=${self.total_pnl:.2f})"
        )


@dataclass(slots=True)
class MarketData:
    """Lightweight market data container"""

    ticker: str
    title: str
    status: str
    yes_bid: float = 0.0
    yes_ask: float = 0.0
    no_bid: float = 0.0
    no_ask: float = 0.0
    volume: float = 0.0
    open_interest: float = 0.0
    last_price: float = 0.0

    @property
    def mid_price(self) -> float:
        """Calculate mid price"""
        if self.yes_bid > 0 and self.yes_ask > 0:
            return (self.yes_bid + self.yes_ask) / 200.0
        return self.last_price / 100.0 if self.last_price > 0 else 0.5

    @property
    def spread(self) -> float:
        """Calculate bid-ask spread"""
        if self.yes_bid > 0 and self.yes_ask > 0:
            return self.yes_ask - self.yes_bid
        return 0.0

    @property
    def liquidity_score(self) -> float:
        """Calculate liquidity score"""
        return min(max(self.volume, 100) / 1000, 1.0)


@dataclass(slots=True)
class OrderBook:
    """Order book data container"""

    ticker: str
    yes_bids: List[Dict] = field(default_factory=list)
    yes_asks: List[Dict] = field(default_factory=list)
    no_bids: List[Dict] = field(default_factory=list)
    no_asks: List[Dict] = field(default_factory=list)

    def get_best_yes_bid(self) -> float:
        """Get best YES bid price"""
        if self.yes_bids:
            return float(self.yes_bids[0].get("price", 0))
        return 0.0

    def get_best_yes_ask(self) -> float:
        """Get best YES ask price"""
        if self.yes_asks:
            return float(self.yes_asks[0].get("price", 100))
        return 100.0

    def get_best_no_bid(self) -> float:
        """Get best NO bid price"""
        if self.no_bids:
            return float(self.no_bids[0].get("price", 0))
        return 0.0

    def get_best_no_ask(self) -> float:
        """Get best NO ask price"""
        if self.no_asks:
            return float(self.no_asks[0].get("price", 100))
        return 100.0

    def get_mid_price(self, side: str = "yes") -> float:
        """Get mid price for a side"""
        if side == "yes":
            return (self.get_best_yes_bid() + self.get_best_yes_ask()) / 200.0
        else:
            return (self.get_best_no_bid() + self.get_best_no_ask()) / 200.0

    def get_spread(self, side: str = "yes") -> float:
        """Get bid-ask spread"""
        if side == "yes":
            return self.get_best_yes_ask() - self.get_best_yes_bid()
        else:
            return self.get_best_no_ask() - self.get_best_no_bid()

    def get_imbalance(self, side: str = "yes", depth: int = 3) -> float:
        """Calculate order book imbalance"""
        if side == "yes":
            bid_vol = sum(level.get("count", 0) for level in self.yes_bids[:depth])
            ask_vol = sum(level.get("count", 0) for level in self.yes_asks[:depth])
        else:
            bid_vol = sum(level.get("count", 0) for level in self.no_bids[:depth])
            ask_vol = sum(level.get("count", 0) for level in self.no_asks[:depth])

        total_vol = bid_vol + ask_vol
        if total_vol == 0:
            return 0.0

        return ((bid_vol / total_vol) - 0.5) * 2  # Range: -1 to 1


@dataclass(slots=True)
class TradeExecution:
    """Trade execution record"""

    order_id: str
    ticker: str
    side: str
    size: int
    price: float
    status: str
    timestamp: datetime = field(default_factory=datetime.now)
    filled_size: int = 0
    avg_fill_price: float = 0.0
    commission: float = 0.0

    @property
    def is_filled(self) -> bool:
        """Check if order is completely filled"""
        return self.filled_size >= self.size

    @property
    def fill_rate(self) -> float:
        """Get fill rate"""
        return self.filled_size / self.size if self.size > 0 else 0.0

    @property
    def notional_value(self) -> float:
        """Get notional value of filled portion"""
        return (self.filled_size * self.avg_fill_price) / 100

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary"""
        return {
            "order_id": self.order_id,
            "ticker": self.ticker,
            "side": self.side,
            "size": self.size,
            "price": self.price,
            "status": self.status,
            "timestamp": self.timestamp.isoformat(),
            "filled_size": self.filled_size,
            "avg_fill_price": self.avg_fill_price,
            "commission": self.commission,
            "is_filled": self.is_filled,
            "fill_rate": self.fill_rate,
            "notional_value": self.notional_value,
        }
