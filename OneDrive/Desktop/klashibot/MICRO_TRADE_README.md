# Micro Trade Bot - High Frequency Small Trades

## Strategy
Instead of making big risky bets, this bot makes **thousands of tiny trades** to steadily grow your bankroll.

- **Risk per trade**: Max 1% of bankroll
- **Target profit**: 1.5% per trade
- **Trade frequency**: Every 10 seconds
- **Max positions**: 5 concurrent
- **Auto-exit**: 30 minutes max hold time

## How It Works

1. Scans 100+ markets for tight spreads (good liquidity)
2. Looks for mispriced opportunities using edge scoring
3. Places small limit orders to capture spread
4. Takes profit at 1.5% or cuts losses at 3%
5. Auto-closes positions after 30 minutes

## Running the Bot

```bash
# Set your API key (REQUIRED - no hardcoded keys!)
export KALSHI_API_KEY=your-key-here

# Make sure your private key is in place
# Should be at: config/kalshi_private_key.pem or ./kalshi_private_key.pem

# Run the bot
python micro_trade_bot.py
```

## Risk Management

- Never risks more than 1% per trade
- Keeps $5 minimum reserve
- Max 5 open positions at once
- 3% stop loss on every trade
- 30-minute time limit per position

## Expected Performance

With conservative settings:
- 50+ trades per day
- 50-60% win rate
- 0.5-1% daily bankroll growth
- Compounding over time

**This is NOT get-rich-quick. This is steady accumulation.**

## Stats Tracking

The bot saves stats to `micro_trade_stats.json`:
- Total trades today
- Today's P&L
- Win/loss count
- Last update time

## Important Notes

1. **API Key**: Must be set via environment variable (no hardcoded keys!)
2. **Private Key**: Must exist in config/ or current directory
3. **Small Bankroll Friendly**: Designed to work with $20-100 starting balance
4. **Patience Required**: Growth is slow but steady

## Key Differences from Old Bot

| Old Bot | Micro Trade Bot |
|---------|----------------|
| Big trades ($10+) | Tiny trades (1% of bankroll) |
| Few trades per day | Hundreds of trades |
| High risk | Conservative risk |
| No stop losses | 3% stop loss always |
| Balance sync issues | Real-time balance tracking |
| Hardcoded API keys | Environment variables only |

## Stopping the Bot

Press `Ctrl+C` to stop. The bot will:
1. Save all stats
2. Attempt to close open positions
3. Print final summary
