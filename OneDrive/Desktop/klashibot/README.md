<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:00c853,50:00bfa5,100:00acc1&height=180&section=header&text=KLASHIBOT&fontColor=ffffff&fontSize=60&animation=twinkling&fontAlignY=35&desc=High-Frequency%20Kalshi%20Trading%20Bot&descSize=20&descAlignY=55" alt="Klashibot Header" />
</p>

<div align="center">

[![Python](https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Kalshi](https://img.shields.io/badge/Kalshi-API-00C853?style=for-the-badge&logo=bitcoin&logoColor=white)](https://kalshi.com)
[![ML](https://img.shields.io/badge/ML-Powered-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://scikit-learn.org)
[![License](https://img.shields.io/badge/License-MIT-00CC00?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.2.0-FF6B6B?style=for-the-badge)](CHANGELOG.md)

</div>

<div align="center">

**Automated ML-Powered Trading Bot for Kalshi Prediction Markets**

*Transform $20 into consistent daily income with statistical arbitrage, intelligent risk management, and real-time TUI monitoring*

[![Stars](https://img.shields.io/github/stars/Snapwave333/klashibot?style=social)](https://github.com/Snapwave333/klashibot)
[![Forks](https://img.shields.io/github/forks/Snapwave333/klashibot?style=social)](https://github.com/Snapwave333/klashibot/fork)

</div>

<br/>

---

## What's New in v1.2.0

<table>
<tr>
<td width="50%">

### TUI Dashboard
Real-time terminal interface for monitoring:
- Live portfolio tracking
- Position management
- Risk metrics visualization
- Activity log streaming

</td>
<td width="50%">

### CLI Commander
Interactive command center:
- Start/stop trading
- Add/remove tickers
- Configure risk parameters
- Close positions instantly

</td>
</tr>
</table>

---

## Screenshots

<p align="center">
  <img src="https://via.placeholder.com/800x400/1e1e1e/00ff00?text=TUI+Dashboard+Preview" alt="TUI Dashboard" width="80%"/>
</p>

<details>
<summary><b>Click to see TUI Dashboard Layout</b></summary>

```
+===================================================================================+
|                           KLASHIBOT TUI DASHBOARD                                 |
+===================================================================================+

+------------------+  +--------------------------------+  +------------------+
|   Bot Status     |  |          Portfolio             |  |   Performance    |
|                  |  |                                |  |                  |
| [*] RUNNING      |  | Total Value:    $127.45       |  | Win Rate: 68.2%  |
| Mode: TRADING    |  | Cash:           $45.20        |  | Total: 156       |
| Uptime: 02:34    |  | Daily P&L:   [+] $12.30       |  | Wins: 106        |
| Tickers: KXBTC   |  | Total P&L:   [+] $107.45      |  | Losses: 50       |
+------------------+  +--------------------------------+  +------------------+

+------------------+  +--------------------------------+  +------------------+
| Risk Management  |  |        Positions (3)           |  |    Signals       |
|                  |  |                                |  |                  |
| Level: LOW       |  | KXBTC  YES  5  $0.45  +$2.1   |  | Today: 12        |
| Exposure: 23.1%  |  | KXETH  NO   3  $0.32  +$0.8   |  | Executed: 8      |
| Daily Loss: $0   |  | KXSP   YES  2  $0.67  -$0.3   |  | Rejected: 4      |
+------------------+  +--------------------------------+  +------------------+

+-----------------------------------------------------------------------------------+
|                              Activity Log                                         |
+-----------------------------------------------------------------------------------+
| 14:32:15  TRADE    Executed: KXBTC YES 5@$0.45                                    |
| 14:31:02  SIGNAL   Rejected: KXDOGE - insufficient edge                           |
| 14:30:45  INFO     Trading cycle completed: 3 signals processed                   |
+-----------------------------------------------------------------------------------+
```

</details>

---

## Features

<table>
<tr>
<td align="center" width="33%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" width="50"/>
<br/><b>ML Trading Engine</b>
<br/><sub>Statistical arbitrage with ensemble models (Random Forest, XGBoost, Gradient Boosting)</sub>
</td>
<td align="center" width="33%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg" width="50"/>
<br/><b>Smart Risk Management</b>
<br/><sub>Kelly criterion sizing, daily loss limits, position controls, correlation risk</sub>
</td>
<td align="center" width="33%">
<img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="50"/>
<br/><b>Real-Time Monitoring</b>
<br/><sub>TUI dashboard, CLI commander, Firebase sync, activity logging</sub>
</td>
</tr>
</table>

### Core Capabilities

| Feature | Description | Status |
|---------|-------------|--------|
| **Statistical Arbitrage** | Identifies probability deltas (modelP - impliedP > threshold) | Active |
| **Kelly Criterion Sizing** | Optimal bet sizing for risk-adjusted returns | Active |
| **Ensemble ML Models** | Logistic Regression, Random Forest, XGBoost, Gradient Boosting | Active |
| **Real-Time API** | REST & WebSocket integration with Kalshi | Active |
| **Risk Controls** | Daily loss limits, position caps, cash reserves | Active |
| **Growth Strategy** | 5-phase scaling from $20 to $5000+ | Active |
| **TUI Dashboard** | Real-time terminal monitoring | NEW |
| **CLI Commander** | Interactive command interface | NEW |
| **Firebase Sync** | Real-time state synchronization | Active |

---

## Architecture

```
                    +------------------+     +------------------+
                    |  TUI Dashboard   |     |  CLI Commander   |
                    |                  |     |                  |
                    |  - Monitoring    |     |  - Commands      |
                    |  - Visualization |     |  - Control       |
                    |  - Real-time     |     |  - Interactive   |
                    +--------+---------+     +--------+---------+
                             |                        |
                             +------------------------+
                                        |
                              +---------v---------+
                              |   Shared State    |
                              |  (~/.klashibot/)  |
                              |                   |
                              | - bot_state.json  |
                              | - commands.json   |
                              | - trading_log.json|
                              +---------+---------+
                                        |
                              +---------v---------+
                              |   Trading Bot     |
                              |                   |
                              | - Strategy Engine |
                              | - Risk Manager    |
                              | - ML Models       |
                              | - Execution       |
                              +---------+---------+
                                        |
                              +---------v---------+
                              |   Kalshi API      |
                              +-------------------+
```

<details>
<summary><b>Project Structure</b></summary>

```
klashibot/
|-- tui_dashboard.py       # Real-time TUI monitoring
|-- cli_commander.py       # Interactive CLI control
|-- run_trading_bot.py     # Main integrated bot
|-- launch_bot.sh          # Multi-window launcher
|-- setup_tui.sh           # Environment setup
|
|-- src/
|   |-- main.py               # Bot orchestrator
|   |-- shared_state.py       # TUI/CLI communication
|   |-- kalshi_client.py      # Kalshi API wrapper
|   |-- strategy.py           # Trading strategy engine
|   |-- models.py             # ML model framework
|   |-- execution.py          # Order execution
|   |-- risk_manager.py       # Risk management
|   |-- data_manager.py       # Market data collection
|   |-- monitoring.py         # Logging & alerts
|   |-- realistic_growth.py   # Growth strategy
|   |-- firebase_manager.py   # Firebase sync
|   `-- config.py             # Configuration
|
|-- config/
|   `-- threshold_profiles.json
|
|-- Documentation/
|   |-- TUI_CLI_GUIDE.md
|   |-- QUICKSTART.md
|   |-- IMPLEMENTATION_STATUS.md
|   `-- ...
|
`-- tests/
    `-- test_*.py
```

</details>

---

## Quick Start

### Prerequisites

<p>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" width="30" title="Python 3.8+"/>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg" width="30" title="Bash"/>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/git/git-original.svg" width="30" title="Git"/>
</p>

- **Python 3.8+**
- **Kalshi account** with API access
- **Git** for cloning

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Snapwave333/klashibot.git
cd klashibot/OneDrive/Desktop/klashibot

# 2. Run setup script (creates venv, installs deps)
./setup_tui.sh

# 3. Configure your Kalshi API credentials
cp config.env.example config.env
nano config.env  # Add your credentials
```

### Launch

**Option 1: Multi-Window Launch (Recommended)**
```bash
./launch_bot.sh
```

**Option 2: Manual Launch**
```bash
# Terminal 1 - TUI Dashboard
python tui_dashboard.py

# Terminal 2 - CLI Commander
python cli_commander.py

# Terminal 3 - Start bot from CLI
# Type: start KXBTC KXETH
```

---

## Configuration

Create a `config.env` file:

```env
# Kalshi API Configuration
KALSHI_EMAIL=your_email@example.com
KALSHI_PASSWORD=your_password
# OR use API keys
KALSHI_API_KEY=your_api_key
KALSHI_API_SECRET=your_api_secret

# Trading Parameters
DEFAULT_KELLY_FRACTION=0.05
MIN_PROBABILITY_DELTA=0.02
MAX_POSITION_SIZE=5

# Risk Management
MAX_DAILY_LOSS=2.0
MAX_PORTFOLIO_RISK=0.1
CASH_SAFETY_RESERVE=2.0

# Growth Strategy
STARTING_BALANCE=20.0
DAILY_INCOME_TARGET=400.0

# Optional: Firebase (for remote monitoring)
FIREBASE_ENABLED=false
```

---

## Growth Strategy

<div align="center">

| Phase | Balance Range | Strategy | Daily Target |
|:-----:|:-------------:|:--------:|:------------:|
| **1. Foundation** | $20 - $50 | Ultra-conservative, 1-2 shares | $0.40 - $1.00 |
| **2. Growth** | $50 - $200 | Small positions, gradual scaling | $2.50 - $20.00 |
| **3. Expansion** | $200 - $1,000 | Medium positions, increased frequency | $20 - $150 |
| **4. Scaling** | $1,000 - $5,000 | Large positions, multiple markets | $150 - $1,250 |
| **5. Target** | $5,000+ | Full strategy deployment | **$400/day** |

</div>

### Risk Controls Per Phase

```
Phase 1: Max 2 shares/position, $0.50 max daily loss
Phase 2: Max 5 shares/position, $2.00 max daily loss
Phase 3: Max 10 shares/position, $10.00 max daily loss
Phase 4: Max 25 shares/position, $50.00 max daily loss
Phase 5: Max 100 shares/position, $200.00 max daily loss
```

---

## CLI Commands Reference

<details>
<summary><b>Full Command List</b></summary>

### Trading Control
```bash
start TICKER1 TICKER2    # Start trading
stop                      # Stop trading
add_ticker TICKER         # Add ticker to watch
remove_ticker TICKER      # Remove ticker
train TICKER1 TICKER2     # Train ML models
```

### Monitoring
```bash
status                    # Bot status overview
portfolio                 # Portfolio details
positions                 # Open positions
risk                      # Risk metrics
performance               # Trading stats
growth                    # Growth strategy info
logs [count]              # Activity logs
```

### Configuration
```bash
set_interval 300          # Analysis interval (seconds)
set_risk max_daily_loss 3.0
set_risk max_exposure 0.15
```

### Position Management
```bash
cancel_orders             # Cancel all pending
close_position TICKER     # Close specific position
close_all                 # Close all (with confirmation)
```

</details>

---

## Tech Stack

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" width="50" title="Python"/>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/numpy/numpy-original.svg" width="50" title="NumPy"/>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pandas/pandas-original.svg" width="50" title="Pandas"/>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/sqlite/sqlite-original.svg" width="50" title="SQLite"/>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/firebase/firebase-plain.svg" width="50" title="Firebase"/>
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/bash/bash-original.svg" width="50" title="Bash"/>
</p>

<div align="center">

| Category | Technologies |
|----------|-------------|
| **Core** | Python 3.8+, AsyncIO, Pydantic |
| **ML/Data** | Scikit-learn, XGBoost, Pandas, NumPy |
| **API** | Kalshi SDK, aiohttp, WebSockets |
| **TUI** | Rich, Textual, Blessed |
| **Storage** | SQLite, Firebase Realtime DB |
| **Logging** | Structlog, Rich Console |

</div>

---

## Security & Safety

<table>
<tr>
<td width="50%">

### Built-in Protections
- Daily loss limits (auto-stop)
- Position size caps
- Cash safety reserves
- Correlation risk monitoring
- API credential encryption
- Graceful shutdown handling

</td>
<td width="50%">

### Risk Management
- Maximum 10% portfolio exposure
- Fractional Kelly criterion (conservative)
- Phase-based position scaling
- Real-time risk level monitoring
- Automatic stop-loss triggers

</td>
</tr>
</table>

---

## Performance Expectations

> **Disclaimer**: Past performance does not guarantee future results. Trading involves substantial risk of loss.

### Conservative Estimates

- **Phase 1**: 2-5% daily returns ($0.40 - $1.00)
- **Phase 2**: 5-10% daily returns ($2.50 - $20.00)
- **Phase 3**: 10-15% daily returns ($20 - $150)
- **Phase 4**: 15-25% daily returns ($150 - $1,250)
- **Phase 5**: Target $400 daily income

### Key Metrics Tracked

- Win Rate (target: >60%)
- Sharpe Ratio
- Max Drawdown
- Risk-Adjusted Returns
- Model Accuracy
- Signal Quality

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Setup

```bash
# Install dev dependencies
pip install -r requirements-dev.txt

# Run tests
pytest tests/

# Format code
black src/
```

---

## Documentation

- [TUI & CLI Guide](TUI_CLI_GUIDE.md)
- [Quick Start Guide](QUICKSTART.md)
- [Implementation Status](IMPLEMENTATION_STATUS.md)
- [Growth Strategy](REALISTIC_GROWTH.md)
- [Risk Management](FUND_SAFETY.md)
- [Dual Strategy](DUAL_STRATEGY.md)
- [Changelog](CHANGELOG.md)

---

## Troubleshooting

### Common Issues

**Bot Won't Start**
- Verify API credentials in `config.env`
- Check dependencies: `pip install -r requirements.txt`
- Ensure Python 3.8+ is installed

**TUI Not Updating**
- Check if bot is running: `status` in CLI
- Verify state files exist: `ls ~/.klashibot/`
- Restart TUI dashboard

**API Connection Errors**
- Verify Kalshi API credentials
- Check internet connectivity
- Ensure API endpoint is accessible

**Commands Not Processing**
- Ensure bot is running
- Check command queue: `cat ~/.klashibot/commands.json`
- Look for errors in activity log: `logs 20` in CLI

---

## Disclaimer

<div align="center">

**IMPORTANT: This software is for educational and personal use only.**

</div>

- Trading prediction markets involves substantial risk of loss
- This bot is provided "as-is" without warranty of any kind
- Past performance does not guarantee future results
- You are solely responsible for your trading decisions
- Ensure compliance with Kalshi's Terms of Service
- Never trade with money you cannot afford to lose
- This is not financial advice

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Kalshi](https://kalshi.com) for the prediction market platform
- [Rich](https://github.com/Textualize/rich) for beautiful terminal formatting
- [Scikit-learn](https://scikit-learn.org) for ML framework
- [XGBoost](https://xgboost.ai) for gradient boosting

---

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:00acc1,50:00bfa5,100:00c853&height=120&section=footer&animation=twinkling" alt="Footer" />
</p>

<div align="center">

**Made with love for algorithmic trading enthusiasts**

[![GitHub](https://img.shields.io/badge/GitHub-Snapwave333-181717?style=flat&logo=github)](https://github.com/Snapwave333)

*If you find this project useful, please consider giving it a star*

</div>

---

<div align="center">
<sub>README design inspired by <a href="https://medium.com/design-bootcamp/how-to-design-an-attractive-github-profile-readme-3618d6c53783">ISBP for GitHub READMEs</a></sub>
</div>
