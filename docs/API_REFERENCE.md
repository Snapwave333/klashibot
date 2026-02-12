# API Reference

> **Version:** 3.0.0 | **Last Updated:** 2026-01-20

## Overview

This document provides technical reference for the Kalashi Trading Bot APIs, including internal Rust modules and external integration points.

---

## Rust Backend API

### Risk Guardian (`risk/guardian.rs`)

#### `RiskGuardian::new(initial_equity: f64) -> Self`
Creates a new risk guardian with specified starting equity.

```rust
let guardian = RiskGuardian::new(1000.0);
```

#### `evaluate_new_trade(...) -> RiskDecision`
Evaluates whether a new trade should be allowed.

| Parameter | Type | Description |
|-----------|------|-------------|
| `ticker` | `&str` | Market ticker |
| `side` | `&str` | "yes" or "no" |
| `price` | `f64` | Limit price (0.0-1.0) |
| `quantity` | `i32` | Number of contracts |
| `current_equity` | `f64` | Current portfolio value |
| `settlement_hours` | `i64` | Hours until settlement |

**Returns:** `RiskDecision` with action (Allow, HardStop, CircuitBreaker, etc.)

#### `evaluate_position(ticker: &str, current_price: f64) -> RiskDecision`
Monitors an existing position for stop conditions.

#### `register_position(ticker: String, entry_price: f64, quantity: i32)`
Registers a new position for tracking.

#### `record_trade(ticker: &str, pnl: f64, current_equity: f64)`
Records completed trade for learning and circuit breaker evaluation.

---

### Market Filter (`risk/market_filter.rs`)

#### `MarketFilter::with_defaults() -> Self`
Creates filter with default configuration.

| Default | Value |
|---------|-------|
| Max settlement | 24 hours |
| Min liquidity | 100 contracts |
| Max spread | 5 cents |
| Min edge | 1% |

#### `filter(market: &MarketData, estimated_edge: f64) -> FilterResult`
Filters a market for trading eligibility.

**Returns:** `FilterResult::Pass` or specific rejection reason.

#### `time_weight(hours_to_settlement: i64) -> f64`
Calculates position size multiplier based on time to settlement.

- 24h → 1.0x
- 12h → 1.5x  
- 6h → 2.0x
- 1h → 3.0x

---

### Autonomous Controller (`autonomous/mod.rs`)

#### `AutonomousController::new(config: AutonomyConfig) -> Self`
Creates controller with specified autonomy settings.

#### `evaluate_and_adapt(metrics: &RiskMetrics) -> Option<AutonomousDecision>`
Evaluates performance and makes autonomous adjustments.

**Triggers:**
- Win rate > 65%: Increase risk tolerance 10%
- Win rate < 40%: Decrease risk tolerance 20%
- Drawdown > 3%: Pause trading 30 minutes

#### `record_outcome(signal_id: String, pnl: f64)`
Records trade outcome for learning.

#### `force_strategy_change(reason: &str) -> AutonomousDecision`
Immediately adjusts strategy (AI can call unprompted).

---

### Order Router (`execution/router.rs`)

#### `OrderRouter::new(mode: TradingMode) -> Self`
Creates router for specified trading mode.

| Mode | Behavior |
|------|----------|
| `Paper` | Simulated fills, no real orders |
| `Live` | Real execution on Kalshi |

#### `process_signal(signal: TradeSignal, portfolio: &Portfolio) -> Result<OrderResult>`
Processes a trade signal through risk checks and execution.

---

## Kalshi REST API (`ingestion/kalshi_rest.rs`)

### Authentication
Uses RSA signature with timestamps:
```
POST /trade-api/v2/login
X-Signature: base64(sign(timestamp + method + path))
```

### Order Submission
```rust
submit_order(
    ticker: &str,
    action: &str,       // "buy" | "sell"
    side: &str,         // "yes" | "no"
    order_type: &str,   // "limit" | "market"
    quantity: i32,
    limit_price: Option<f64>,  // Cents (1-99)
) -> Result<serde_json::Value>
```

**Retry Logic:** 3 attempts with exponential backoff (100ms, 200ms, 400ms)

---

## WebSocket API (`ws://127.0.0.1:8765`)

### Message Types

#### Portfolio Update
```json
{
  "type": "UPDATE_PORTFOLIO",
  "data": {
    "balance": 1000.00,
    "nav": 1050.00,
    "daily_pnl": 50.00,
    "exposure": 0.35
  }
}
```

#### Trade Execution
```json
{
  "type": "EXECUTION",
  "data": {
    "order_id": "uuid",
    "ticker": "AAPL-UP-24H",
    "side": "yes",
    "quantity": 10,
    "fill_price": 0.65,
    "status": "filled"
  }
}
```

#### Risk Event
```json
{
  "type": "RISK_BLOCKED",
  "data": {
    "reason": "Daily drawdown 5% exceeded",
    "action": "CircuitBreaker",
    "urgency": 10
  }
}
```

#### Autonomous Decision
```json
{
  "type": "AUTONOMOUS_DECISION",
  "data": {
    "action": "AdjustRiskTolerance",
    "from": 0.5,
    "to": 0.55,
    "reason": "Win rate 68% exceeds threshold",
    "confidence": 0.75
  }
}
```

---

## Data Types

### TradeSignal
```rust
pub struct TradeSignal {
    pub id: Uuid,
    pub ticker: String,
    pub side: String,      // "yes" | "no"
    pub price: f64,        // 0.0 - 1.0
    pub quantity: i32,
    pub edge: f64,         // Expected edge percentage
    pub timestamp: DateTime<Utc>,
}
```

### RiskDecision
```rust
pub struct RiskDecision {
    pub action: RiskAction,
    pub reason: String,
    pub suggested_quantity: Option<i32>,
    pub urgency: u8,  // 1-10, 10 = immediate
}
```

### RiskAction Enum
```rust
pub enum RiskAction {
    Allow,              // Trade approved
    HardStop,           // 5% loss - immediate exit
    TrailingStop,       // Trailing stop triggered
    PositionTimeout,    // 24h limit exceeded
    ProgressiveUnwind,  // Start unwinding at 23h
    CircuitBreaker,     // Daily drawdown/consecutive losses
    PositionSizeExceeded, // Would exceed limits
    ProfitCapReached,   // Daily profit cap
}
```

---

## Error Handling

All API functions return `Result<T>` with `anyhow::Error`.

Common error types:
- `AuthenticationError` - Invalid credentials
- `RateLimitError` - API throttling
- `NetworkError` - Connection issues
- `ValidationError` - Invalid parameters

---

**API Version:** 3.0.0  
**Compatibility:** Kalshi Trade API v2
