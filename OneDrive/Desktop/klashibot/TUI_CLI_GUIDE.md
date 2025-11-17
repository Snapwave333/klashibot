# Klashibot TUI & CLI Guide

This guide explains how to use the new TUI Dashboard and CLI Commander for your Kalshi trading bot.

## Overview

The trading bot now includes:
- **TUI Dashboard** - Real-time visual monitoring in your terminal
- **CLI Commander** - Interactive command-line control interface
- **Integrated Trading Bot** - Main bot with shared state support

All three components communicate via a shared state system, allowing you to monitor and control your bot from separate terminal windows.

## Quick Start

### 1. Setup

```bash
# Run the setup script
./setup_tui.sh

# Or manually install dependencies
pip install -r requirements.txt
```

### 2. Configure API Credentials

Edit `config.env` with your Kalshi API credentials:

```bash
KALSHI_EMAIL=your_email@example.com
KALSHI_PASSWORD=your_password
# Or use API keys
KALSHI_API_KEY=your_api_key
KALSHI_API_SECRET=your_api_secret
```

### 3. Launch Components

**Option A: Use the launcher script**
```bash
./launch_bot.sh
```

**Option B: Manual launch (3 terminal windows)**

Terminal 1 - TUI Dashboard:
```bash
python tui_dashboard.py
```

Terminal 2 - CLI Commander:
```bash
python cli_commander.py
```

Terminal 3 - Trading Bot:
```bash
python run_trading_bot.py KXBTC KXETH
```

## TUI Dashboard Features

The TUI Dashboard provides real-time monitoring with:

- **Bot Status** - Running state, mode, uptime, version
- **Portfolio Overview** - Total value, cash, daily/total P&L
- **Positions Table** - Open positions with entry/current prices and P&L
- **Risk Metrics** - Current exposure, daily loss limits, risk level
- **Performance Stats** - Win rate, total trades, Sharpe ratio
- **Growth Strategy** - Current phase, progress toward targets
- **Activity Log** - Recent trades, signals, and errors

The dashboard updates every second automatically.

### Keyboard Controls

- `Ctrl+C` - Exit dashboard

## CLI Commander Commands

### Trading Control

```bash
# Start trading with specific tickers
start KXBTC KXETH

# Stop the trading bot
stop

# Add a ticker to trade
add_ticker KXSP500

# Remove a ticker
remove_ticker KXBTC

# Train ML models
train KXBTC KXETH
```

### Monitoring

```bash
# Show bot status overview
status

# Show detailed portfolio info
portfolio

# Show open positions
positions

# Show risk metrics
risk

# Show performance statistics
performance

# Show growth strategy info
growth

# Show recent activity logs (default 10)
logs

# Show more logs
logs 50
```

### Configuration

```bash
# Set analysis interval (seconds)
set_interval 300

# Set risk parameters
set_risk max_daily_loss 3.0
set_risk max_exposure 0.15
set_risk kelly_fraction 0.25
```

### Position Management

```bash
# Cancel all pending orders
cancel_orders

# Close specific position
close_position KXBTC

# Close all positions (requires confirmation)
close_all
```

### System

```bash
# Clear activity logs
clear_logs

# Reset shared state to defaults
reset_state

# Exit CLI
quit
# or
exit
# or
q
```

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  TUI Dashboard  │     │  CLI Commander  │     │  Trading Bot    │
│                 │     │                 │     │                 │
│  - Monitoring   │     │  - Commands     │     │  - Execution    │
│  - Visualization│     │  - Control      │     │  - Strategy     │
│  - Real-time    │     │  - Interactive  │     │  - Risk Mgmt    │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     Shared State        │
                    │   (~/.klashibot/)       │
                    │                         │
                    │  - bot_state.json       │
                    │  - commands.json        │
                    │  - trading_log.json     │
                    └─────────────────────────┘
```

## File Structure

```
klashibot/
├── tui_dashboard.py      # TUI Dashboard main script
├── cli_commander.py      # CLI Commander main script
├── run_trading_bot.py    # Integrated trading bot
├── launch_bot.sh         # Multi-window launcher
├── setup_tui.sh          # Setup script
├── src/
│   ├── shared_state.py   # Shared state manager
│   ├── main.py           # Core bot logic
│   ├── kalshi_client.py  # API client
│   ├── strategy.py       # Trading strategy
│   ├── risk_manager.py   # Risk management
│   └── ...
└── ~/.klashibot/         # State directory
    ├── bot_state.json    # Current bot state
    ├── commands.json     # Command queue
    └── trading_log.json  # Activity log
```

## Tips & Best Practices

1. **Always start TUI Dashboard first** - It provides visual feedback as the bot starts

2. **Use CLI for control** - Send commands from CLI while monitoring in TUI

3. **Monitor risk levels** - Watch the risk panel in TUI for exposure warnings

4. **Check activity logs** - Review logs for trade execution details and errors

5. **Start with dry-run mode** - Test your setup before live trading

## Troubleshooting

### TUI Not Updating
- Check if bot is running: `status` in CLI
- Verify state files exist: `ls ~/.klashibot/`
- Restart TUI dashboard

### Commands Not Processing
- Ensure bot is running
- Check command queue: `cat ~/.klashibot/commands.json`
- Look for errors in activity log: `logs 20` in CLI

### Bot Won't Start
- Verify API credentials in `config.env`
- Check dependencies: `pip install -r requirements.txt`
- Review error logs in TUI or CLI

### Missing Dependencies
```bash
pip install rich textual pydantic-settings
```

## Support

- Check `logs` command for error details
- Review `~/.klashibot/trading_log.json` for history
- Ensure all configuration is correct in `config.env`

Happy Trading! 🚀
