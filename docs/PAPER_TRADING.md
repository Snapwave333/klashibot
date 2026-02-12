# Paper Trading Mode Guide

## What is Paper Trading?

Paper trading is a **risk-free simulation mode** that allows you to:

✅ **Test strategies** with real market data
✅ **Learn the system** without losing money
✅ **Validate configuration** before going live
✅ **Track performance** with realistic fills
✅ **Build confidence** in your setup

The bot connects to **real Kalshi markets**, processes **real signals**, but executes trades in a **simulated environment** with virtual money.

---

## How It Works

### Real Components
- ✅ Live WebSocket connection to Kalshi
- ✅ Real-time order book data
- ✅ Actual NWS weather data
- ✅ Live CME FedWatch probabilities
- ✅ Real strategy signals (Kelly, arbitrage)

### Simulated Components
- 🎮 Simulated order execution
- 🎮 Virtual portfolio ($10,000 default)
- 🎮 Realistic fill modeling
- 🎮 Slippage simulation (5 basis points)
- 🎮 No actual API calls to exchange

### Fill Simulation

**Maker Orders (Limit Orders):**
- Placed in queue (virtual)
- 70% fill probability when market touches price
- Simulates queue position uncertainty

**Sniper Orders (Market Orders):**
- Instant fill (like real market orders)
- 5 bps slippage applied (realistic market impact)
- Respects available liquidity

---

## Running Paper Trading

### Quick Start

```bash
cd backend
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac

# Start in paper trading mode
python main.py --paper
```

You'll see:
```
============================================================
PAPER TRADING MODE - Using Real Markets with Virtual Money
============================================================
[MAIN] Initializing Kalshi Bot...
[PAPER] Initialized with $10000 virtual bankroll
[MAIN] ✓ Paper trading mode enabled (no real money)
[MAIN] 🚀 Bot is running!
```

### Command Line Options

```bash
# Long form
python main.py --paper

# Short form
python main.py -p
```

---

## Configuration for Paper Trading

In `config/settings.yaml`:

```yaml
# Paper trading specific settings
initial_bankroll: 10000  # Virtual starting balance

# Use conservative settings to test
risk:
  fractional_kelly: 0.10  # More conservative for learning
  max_order_size: 100     # Smaller size to see more trades

# Start with one strategy
strategies:
  nws_weather: false
  fed_watch: false
  pure_arb: true  # Safest strategy to test first
```

---

## Dashboard in Paper Mode

The dashboard looks identical to live trading but shows **PAPER MODE** indicator.

### Key Metrics

| Metric | Description |
|--------|-------------|
| **Bankroll** | Virtual cash balance |
| **NAV** | Total virtual account value |
| **Daily P&L** | Simulated profit/loss |
| **Filled Orders** | Successfully executed (simulated) |

### Logs

Watch for:
```
[PAPER] Maker order placed: HIGHNYC-24 100@$0.52
[PAPER] Maker order filled: HIGHNYC-24 100@$0.52
[PAPER] Sniper order filled: FEDRATE-MAR 50@$0.743 (slippage: $0.0004)
```

---

## Performance Analysis

### Built-in Reporting

From Python console:

```python
# Get performance report
report = bot.paper_engine.get_performance_report()

print(report)
# Output:
{
    'total_trades': 47,
    'winning_trades': 32,
    'losing_trades': 15,
    'win_rate': 0.68,
    'total_pnl': 327.50,
    'avg_win': 15.30,
    'avg_loss': -8.20,
    'profit_factor': 1.87,
    'starting_balance': 10000.00,
    'current_balance': 9850.00,
    'current_nav': 10327.50,
    'return_pct': 3.28
}
```

### Export Trades

```python
# Export to CSV for analysis
bot.paper_engine.export_trades_csv("my_paper_trades.csv")
```

CSV columns:
- `timestamp`: When trade executed
- `ticker`: Market identifier
- `side`: "yes" or "no"
- `quantity`: Number of contracts
- `price`: Execution price
- `value`: Dollar amount
- `pnl`: Realized profit/loss (if closed)
- `strategy`: Which strategy generated signal

---

## Testing Workflow

### Phase 1: Smoke Test (1 hour)

**Goal:** Ensure system works

```yaml
# config/settings.yaml
initial_bankroll: 100
risk:
  max_order_size: 10
strategies:
  pure_arb: true  # Only arbitrage
  nws_weather: false
  fed_watch: false
```

**Success Criteria:**
- ✅ WebSocket connects
- ✅ Data feeds updating
- ✅ At least 1 signal generated
- ✅ No crashes or errors

---

### Phase 2: Strategy Test (24 hours)

**Goal:** Validate strategy logic

```yaml
initial_bankroll: 1000
risk:
  fractional_kelly: 0.10
  max_order_size: 50
strategies:
  pure_arb: true
  nws_weather: true  # Add weather
  fed_watch: false
```

**Analysis:**
- How many signals generated?
- What's the win rate?
- Is edge calculation correct?
- Any unexpected behavior?

---

### Phase 3: Full System Test (7 days)

**Goal:** Long-term stability

```yaml
initial_bankroll: 10000
risk:
  fractional_kelly: 0.25  # Production setting
  max_order_size: 500
strategies:
  pure_arb: true
  nws_weather: true
  fed_watch: true
```

**Metrics to Track:**
- Daily P&L trend
- Drawdown magnitude
- Sharpe ratio (calculate externally)
- System uptime

---

## Comparing Paper vs. Live

### Expected Differences

**Paper trading will likely show BETTER results** due to:

1. **Perfect Fills:** 70% maker fill rate vs. real-world uncertainty
2. **No Latency:** Instant execution in simulation
3. **No API Failures:** No rejected orders or timeouts
4. **Conservative Slippage:** 5 bps may be optimistic

**Realistic Adjustment:**

If paper shows **+10% monthly**, expect **+6-8% live** (accounting for friction).

---

## Transitioning to Live Trading

### Checklist Before Going Live

- [ ] Paper trading profitable for 7+ days
- [ ] Win rate ≥ 55%
- [ ] Max drawdown acceptable (< 15%)
- [ ] No critical errors in logs
- [ ] Understand all strategy logic
- [ ] Comfortable with risk parameters

### Gradual Rollout

**Week 1:** Live with $100 bankroll
```yaml
initial_bankroll: 100  # Real money
risk:
  max_order_size: 10
```

**Week 2-4:** Scale up slowly
```yaml
initial_bankroll: 500
risk:
  max_order_size: 50
```

**Month 2+:** Full deployment
```yaml
initial_bankroll: 10000
risk:
  max_order_size: 500
```

---

## Advanced Features

### Manual Position Close

```python
# Close a specific position
await bot.paper_engine.close_position("HIGHNYC-24:yes")
```

### Cancel All Orders

```python
# Cancel all pending orders
await bot.paper_engine.cancel_all()
```

### Real-time P&L

```python
# Force portfolio update
bot.paper_engine._update_portfolio_metrics()
print(f"Current NAV: ${bot.paper_engine.portfolio.nav}")
```

---

## Common Questions

### Q: Can I mix paper and live trading?

**A:** No. The bot runs in one mode at a time. Run two instances on different ports if needed.

### Q: Does paper mode use real API credentials?

**A:** Yes, for reading market data. But NO actual orders are placed.

### Q: How accurate is the fill simulation?

**A:**
- **Sniper orders:** Very accurate (just adds slippage)
- **Maker orders:** Less accurate (uses 70% fill probability)

### Q: Can I backtest with historical data?

**A:** Not yet. Paper trading uses LIVE data only. Backtesting feature is planned.

### Q: Will paper mode drain my API rate limits?

**A:** No more than live mode. It reads the same market data, just doesn't place orders.

---

## Troubleshooting

### "Paper mode shows no fills"

**Cause:** No liquidity at your limit prices

**Fix:**
- Check if markets are active
- Lower `fractional_kelly` to place more orders
- Enable more strategies

### "Win rate is 100%"

**Suspicious!** Likely issues:
- Fee calculation wrong
- Only trading "past-posted" outcomes
- Sample size too small (< 10 trades)

**Fix:** Run longer (24+ hours) to get realistic sample

### "Paper P&L doesn't match dashboard"

**Cause:** Positions not marked to market

**Fix:** Ensure order books are updating
```python
# Check last book update
print(bot.paper_engine.current_books.keys())
```

---

## Performance Goals

### Realistic Targets (Paper Trading)

| Metric | Conservative | Moderate | Aggressive |
|--------|-------------|----------|------------|
| **Monthly Return** | +2-5% | +5-10% | +10-20% |
| **Win Rate** | 55-60% | 60-70% | 70-80% |
| **Max Drawdown** | -5% | -10% | -15% |
| **Sharpe Ratio** | 1.0+ | 1.5+ | 2.0+ |

### Red Flags 🚩

- Win rate > 90% (too good to be true)
- Max drawdown > 25% (excessive risk)
- Negative Sharpe ratio (strategy broken)
- Profit factor < 1.0 (losing money)

---

## Next Steps

1. **Run paper mode for 7 days**
2. **Analyze performance report**
3. **Adjust risk parameters**
4. **Test configuration changes**
5. **Build confidence in system**
6. **Transition to live (small size)**

---

## Example Session

```bash
# Day 1: Start paper trading
python main.py --paper

# Let run for 24 hours...

# Day 2: Check results
>>> report = bot.paper_engine.get_performance_report()
>>> print(f"Return: {report['return_pct']:.2f}%")
Return: 2.34%

>>> print(f"Win Rate: {report['win_rate']:.1%}")
Win Rate: 64.5%

# Export for analysis
>>> bot.paper_engine.export_trades_csv("day1_trades.csv")
[PAPER] Exported 23 trades to day1_trades.csv

# Review in Excel/Python
import pandas as pd
df = pd.read_csv("day1_trades.csv")
print(df.groupby('strategy')['pnl'].sum())
```

---

**Ready to Test?**

```bash
cd backend
venv\Scripts\activate
python main.py --paper
```

Watch the dashboard, analyze performance, and build confidence before risking real capital! 🎯📊
