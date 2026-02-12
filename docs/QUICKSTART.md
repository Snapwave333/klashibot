# Kalshi Bot - Quick Start Guide

Get up and running in 5 minutes with paper trading mode!

## Prerequisites

- Python 3.11+
- Node.js 18+
- Kalshi account (free signup at kalshi.com)

---

## Installation

### 1. Install Backend Dependencies

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 3. Configure API Credentials

```bash
# Copy example config
cp config/settings.example.yaml config/settings.yaml

# Edit with your credentials
notepad config/settings.yaml  # Windows
nano config/settings.yaml     # Linux/Mac
```

**Minimum required changes:**

```yaml
kalshi:
  api_key: "your_actual_api_key_here"
  api_secret: "your_actual_api_secret_here"
```

---

## First Run (Paper Trading - No Risk!)

### Terminal 1: Backend

```bash
cd backend
venv\Scripts\activate  # or source venv/bin/activate
python main.py --paper
```

Expected output:
```
============================================================
PAPER TRADING MODE - Using Real Markets with Virtual Money
============================================================
[MAIN] Initializing Kalshi Bot...
[PAPER] Initialized with $10000 virtual bankroll
[MAIN] ✓ Paper trading mode enabled (no real money)
[KALSHI WS] Connected to wss://...
[NWS] Starting poller
[MAIN] 🚀 Bot is running!
```

### Terminal 2: Dashboard

```bash
cd frontend
npm start
```

Browser opens at http://localhost:3000

---

## What You Should See

### Dashboard (After 1-2 minutes)

```
┌─────────────────────────────────────────┐
│  Kalshi Bot                             │
│  High-Velocity Trading System           │
│                                         │
│  Bankroll: $10,000.00                   │
│  NAV: $10,000.00                        │
│  Daily P&L: $0.00 (0.00%)              │
│  Uptime: 0h 2m                         │
│                                         │
│  🟢 Connected                           │
└─────────────────────────────────────────┘
```

### Logs

```
[INFO] Book update: HIGHNYC-24 Spread: 0.03
[INFO] NWS: KNYC 72.3°F (QC: V)
[EXEC] Maker order placed: FEDRATE-MAR 100@$0.52
```

---

## Testing the System

### 1. Verify Connections (First 5 minutes)

Check logs for:
- ✅ `[KALSHI WS] Connected`
- ✅ `[NWS] KNYC: XX.X°F`
- ✅ `[DASHBOARD] Client connected`

### 2. Wait for First Signal (5-30 minutes)

Depends on market activity. You should see:
```
[EXEC] Maker order placed: TICKER 50@$0.45
```

### 3. Check Performance (After 1 hour)

In Python console:
```python
>>> report = bot.paper_engine.get_performance_report()
>>> print(report)
```

---

## Common First-Run Issues

### "Config file not found"

```bash
cp config/settings.example.yaml config/settings.yaml
```

### "Authentication failed"

Check `config/settings.yaml`:
- Remove quotes around API key/secret
- Ensure no extra spaces
- Verify credentials on Kalshi

### "Dashboard shows Disconnected"

1. Ensure backend started FIRST
2. Check backend terminal for errors
3. Restart frontend: `npm start`

### "No trades after 1 hour"

This is normal! Depends on:
- Market activity (weekends are slow)
- Strategy configuration
- Edge thresholds

Try lowering thresholds temporarily:
```yaml
strategies:
  min_edge_threshold: 0.01  # Lower from 0.02
```

---

## Next Steps

### Day 1: Observe
- Let paper trading run
- Watch dashboard
- Read logs
- Understand signals

### Day 2-7: Analyze
- Check performance report
- Review trade history
- Adjust configuration
- Test different strategies

### Week 2+: Go Live (Optional)

Once paper trading is profitable:

```bash
# Remove --paper flag for REAL MONEY
python main.py
```

**Start small:**
```yaml
initial_bankroll: 100  # Match your actual Kalshi balance
risk:
  max_order_size: 10
```

---

## Configuration Tips

### Conservative (Learning)

```yaml
risk:
  fractional_kelly: 0.10  # Very conservative
  max_order_size: 50

strategies:
  pure_arb: true   # Safest
  nws_weather: false
  fed_watch: false
```

### Balanced (Recommended)

```yaml
risk:
  fractional_kelly: 0.25  # Quarter Kelly
  max_order_size: 500

strategies:
  pure_arb: true
  nws_weather: true
  fed_watch: true
```

### Aggressive (Experienced Only)

```yaml
risk:
  fractional_kelly: 0.50  # Half Kelly
  max_order_size: 1000

strategies:
  pure_arb: true
  nws_weather: true
  fed_watch: true
  correlation_arb: true
```

---

## Kill Switch

Red button in dashboard or:

```python
# Emergency stop
await bot.trigger_kill_switch()
```

This will:
1. Cancel all orders
2. Stop trading
3. Save state
4. Shut down gracefully

---

## Documentation

- **Full Setup:** See `SETUP.md`
- **Paper Trading:** See `PAPER_TRADING.md`
- **Architecture:** See `ARCHITECTURE.md`
- **Main Guide:** See `README.md`

---

## Support

### Logs Location
```
logs/bot.log
```

### Database Location
```
data/kalshi.db
```

### Getting Help

1. Check logs for errors
2. Read troubleshooting docs
3. Open GitHub issue with:
   - Error message
   - Config (redacted)
   - Log excerpt

---

## Safety Reminders

### Paper Trading
✅ **Safe**: Uses virtual money
✅ **Learning**: Perfect for testing
✅ **Risk-free**: No real trades

### Live Trading
⚠️ **Real Money**: Actual capital at risk
⚠️ **Start Small**: Begin with $100-500
⚠️ **Monitor Daily**: Check P&L and logs
⚠️ **Use Kill Switch**: If anything looks wrong

---

**Ready to Start?**

```bash
# Backend (Terminal 1)
cd backend
venv\Scripts\activate
python main.py --paper

# Dashboard (Terminal 2)
cd frontend
npm start
```

Happy trading! 🚀📈

---

**Questions?**

- Check `SETUP.md` for detailed instructions
- Review `PAPER_TRADING.md` for testing workflow
- Read `ARCHITECTURE.md` to understand the system
