# Kalshi High-Velocity Bot - Setup Guide

This guide will walk you through setting up and running the Kalshi High-Velocity Trading Bot.

## Prerequisites

### System Requirements
- Python 3.11 or higher
- Node.js 18+ and npm
- 4GB+ RAM
- Windows/Linux/macOS

### External Accounts
1. **Kalshi Account** (Required)
   - Sign up at https://kalshi.com
   - Generate API credentials from your account settings
   - Fund your account with initial capital

2. **Weather Data** (Automatic)
   - National Weather Service API is free and public
   - No API key required

3. **CME FedWatch** (Optional)
   - Public data, no account needed
   - For production, consider CME Datamine subscription

## Installation

### 1. Clone and Navigate
```bash
cd Kalashi
```

### 2. Backend Setup (Python)

#### Create Virtual Environment
```bash
cd backend
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate
```

#### Install Dependencies
```bash
pip install -r requirements.txt
```

#### Configure Settings
```bash
# Copy example config
cp ../config/settings.example.yaml ../config/settings.yaml

# Edit with your credentials
# Use your preferred editor (notepad, vim, nano, etc.)
notepad ../config/settings.yaml
```

**Required Changes:**
- `kalshi.api_key`: Your Kalshi API key
- `kalshi.api_secret`: Your Kalshi API secret
- `data_sources.nws_user_agent`: Update email to your contact

**Optional Changes:**
- `initial_bankroll`: Match your actual account balance
- `risk.max_order_size`: Adjust based on your risk tolerance
- `risk.fractional_kelly`: Lower for more conservative sizing (e.g., 0.10)

### 3. Frontend Setup (React/Electron)

```bash
cd ../frontend
npm install
```

## Running the Bot

### Option 1: Backend + Dashboard (Recommended)

#### Terminal 1 - Backend
```bash
cd backend
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
python main.py
```

You should see:
```
[MAIN] Initializing Kalshi Bot...
[MAIN] ✓ Database connected
[MAIN] ✓ All components initialized
[DASHBOARD] Server running on ws://localhost:8765
[KALSHI WS] Connected to wss://api.elections.kalshi.com/...
[NWS] Starting poller (interval: 60s)
[FEDWATCH] Starting scraper (interval: 300s)
[MAIN] 🚀 Bot is running!
```

#### Terminal 2 - Dashboard
```bash
cd frontend
npm start
```

The dashboard will open at `http://localhost:3000`

### Option 2: Electron Desktop App

```bash
cd frontend
npm run electron-dev
```

This starts both the backend and opens a dedicated Electron window.

## First Run Checklist

### Pre-Flight Checks
1. **API Connection**: Dashboard shows "Connected" heartbeat (green dot)
2. **WebSocket**: Check logs for "[KALSHI WS] Connected"
3. **Data Feeds**: Look for "[NWS]" and "[FEDWATCH]" logs
4. **Database**: Verify `data/kalshi.db` was created

### Test Mode
Before going live, test with small amounts:

1. Set `initial_bankroll: 100` in config
2. Set `risk.max_order_size: 10`
3. Enable only one strategy: `strategies.pure_arb: true`
4. Monitor for 1 hour

### Going Live
Once comfortable:

1. Update bankroll to actual balance
2. Enable desired strategies
3. Adjust Kelly multiplier (0.25 is recommended)
4. Monitor daily, especially first week

## Dashboard Usage

### Status Bar (Top)
- **Bankroll**: Current cash balance
- **NAV**: Net Asset Value (cash + positions)
- **Daily P&L**: Profit/Loss for today ($ and %)
- **Uptime**: How long bot has been running

### Metrics Row
- **API Latency**: Round-trip time to Kalshi (target: <50ms)
- **Error Rate**: % of failed API calls in last minute
- **Active Strategies**: Number of enabled strategies

### Live Log Terminal
Color-coded log levels:
- **[INFO]** (Blue): Routine operations
- **[WARN]** (Yellow): Non-critical issues
- **[EXEC]** (Green): Trade executions
- **[CRIT]** (Red): Critical errors, kill switch

### Kill Switch
The red "🛑 KILL SWITCH" button:
- Cancels all open orders
- Stops all trading
- Saves current state
- Requires confirmation

**When to use:**
- Unexpected behavior
- Large losses
- API issues
- Manual intervention needed

## Troubleshooting

### "Config file not found"
```bash
cp config/settings.example.yaml config/settings.yaml
# Then edit settings.yaml with your credentials
```

### "Authentication failed: 401"
- Check API key/secret in `config/settings.yaml`
- Ensure no extra spaces or quotes
- Verify key is active on Kalshi

### "WebSocket disconnected"
- Check internet connection
- Verify Kalshi API status
- Bot will auto-reconnect after 1s

### "No module named 'backend'"
- Ensure you're in the `backend` directory
- Activate virtual environment: `venv\Scripts\activate`
- Reinstall: `pip install -r requirements.txt`

### Dashboard shows "Disconnected"
- Ensure backend is running first
- Check backend terminal for errors
- Verify dashboard WebSocket port (8765) is free

### High latency (>100ms)
- Check your internet speed
- Consider cloud hosting (AWS us-east-1)
- Disable other network-heavy applications

## Safety & Risk Management

### Built-in Safeguards

1. **Position Limits**
   - Max 20% of NAV in single event category
   - Max $500 per order (configurable)
   - Max 25% correlated exposure

2. **Auto-Halt Triggers**
   - Daily loss exceeds 10%
   - API error rate > 5%
   - Data feed stale > 5 seconds
   - Sequence gap in order book

3. **Drawdown Recovery**
   - At -5% drawdown, Kelly multiplier drops to 0.10
   - Prevents "revenge trading" spiral
   - Must earn back through consistent wins

### Manual Monitoring

**Daily:**
- Check P&L trend
- Review execution logs for anomalies
- Verify data feed health

**Weekly:**
- Analyze strategy performance
- Adjust concentration limits if needed
- Review fee costs vs. edge

**Monthly:**
- Full performance review
- Sharpe ratio calculation
- Strategy enable/disable decisions

## Advanced Configuration

### Kelly Multiplier Tuning
The `fractional_kelly` parameter controls aggression:

- **0.10** (Conservative): 10% of optimal Kelly, low variance
- **0.25** (Recommended): Quarter Kelly, balanced growth
- **0.50** (Aggressive): Half Kelly, higher variance
- **1.00** (Full Kelly): Maximum growth, highest drawdowns

### Strategy Selection

**Pure Arbitrage** (`pure_arb`)
- Risk-free profits from pricing inconsistencies
- Highest Sharpe ratio
- Limited opportunities
- **Recommended: Always enabled**

**NWS Weather** (`nws_weather`)
- High frequency (daily events)
- Edge from latency + quality data
- Requires fast execution
- **Recommended: Enable if latency <50ms**

**FedWatch** (`fed_watch`)
- Lower frequency (monthly FOMC)
- Edge from CME bond market
- Large size opportunities
- **Recommended: Enable for macro exposure**

**Correlation Arb** (`correlation_arb`)
- Exploits mispriced correlations
- Requires large sample size
- Complex to validate
- **Recommended: Advanced users only**

**Bayesian Flow** (`bayesian_flow`)
- Order flow-based signals
- Experimental strategy
- Requires tuning
- **Recommended: Disabled for now**

## Performance Optimization

### Latency Reduction
1. **Cloud Hosting**: Deploy on AWS us-east-1 (closest to Kalshi servers)
2. **Dedicated Connection**: Wired ethernet > WiFi
3. **Disable Polling**: Set `nws_poll_interval_sec: 120` if not trading weather

### Database Maintenance
SQLite with WAL mode auto-manages itself, but for long runs:

```bash
# Check database size
ls -lh data/kalshi.db

# Vacuum (compact) if >1GB
sqlite3 data/kalshi.db "VACUUM;"
```

### Log Rotation
Logs can grow large over time:

```bash
# Archive old logs
mv logs/bot.log logs/bot_$(date +%Y%m%d).log

# Compress
gzip logs/bot_*.log
```

## Support & Community

### Getting Help
1. Check `TROUBLESHOOTING.md` for common issues
2. Review logs in `logs/bot.log`
3. Open GitHub issue with:
   - Error message
   - Config (redact credentials)
   - Log excerpt

### Reporting Bugs
Include:
- OS and Python version
- Full error traceback
- Steps to reproduce
- Expected vs actual behavior

### Feature Requests
Use GitHub Discussions to propose:
- New data sources
- Additional strategies
- Dashboard improvements
- Performance enhancements

## Legal & Compliance

### Regulatory Notice
This software is designed for use on **regulated prediction markets** (Kalshi is a CFTC-regulated DCM).

**You are responsible for:**
- Compliance with local trading laws
- Tax reporting (consult CPA)
- Position limit adherence
- Prohibited participant rules

### Terms of Service
Ensure your usage complies with:
- Kalshi Terms of Service
- Kalshi API Usage Guidelines
- Exchange position limits
- Wash trading prohibitions

The bot includes **self-trade prevention** to avoid wash trading violations.

## Next Steps

1. **Backtest**: Implement paper trading mode
2. **Optimize**: Fine-tune strategy parameters
3. **Scale**: Increase bankroll as confidence grows
4. **Diversify**: Enable multiple uncorrelated strategies
5. **Monitor**: Set up alerts for critical events

---

**Ready to Trade?**

```bash
# Activate environment
cd backend && venv\Scripts\activate

# Start bot
python main.py
```

Good luck, and may your Sharpe ratio be ever in your favor! 🚀📈
