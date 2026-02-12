# Kalshi AI Trading Agent

An autonomous AI agent powered by Qwen that can trade on Kalshi prediction markets using the MCP server.

## Quick Start

### 1. Ensure MCP Server is Running

The MCP server should be configured and running. Check the configuration:

```bash
cd mcp-server-kalshi
uv run start
```

### 2. Configure Your AI Agent

The system prompt is in `system_prompt.md`. You can customize it to adjust:
- Trading strategy
- Risk parameters
- Decision-making logic

### 3. Use with Ollama + Open WebUI

#### Option A: Direct Ollama API

```python
import ollama

# Load the system prompt
with open('system_prompt.md', 'r') as f:
    system_prompt = f.read()

# Start a conversation
response = ollama.chat(model='qwen2.5:latest', messages=[
    {'role': 'system', 'content': system_prompt},
    {'role': 'user', 'content': 'Analyze the current Kalshi markets and identify trading opportunities'}
])

print(response['message']['content'])
```

#### Option B: Open WebUI with MCP

1. Open Open WebUI (typically at `http://localhost:3000`)
2. Go to Settings → Models
3. Select your Qwen model
4. In the system prompt field, paste the contents of `system_prompt.md`
5. Enable MCP tools in the settings
6. Start chatting with instructions like:
   - "Check my balance and show me available markets"
   - "Find markets with good liquidity and tight spreads"
   - "Place a buy order for MARKET_TICKER at 45 cents"

### 4. Test the Agent

Start with simple commands:

```
User: Check my Kalshi balance
Agent: [Uses get_balance tool to show current balance]

User: Show me the top 10 most liquid markets
Agent: [Uses get_markets to find and display markets]

User: What's the orderbook for INXD-24JAN20-T4800?
Agent: [Uses get_orderbook to show bids and asks]

User: Buy 10 contracts of INXD-24JAN20-T4800 YES at 45 cents
Agent: [Uses create_order to place the trade]
```

## Agent Configuration

### Risk Parameters (in system_prompt.md)

These match your `config/settings.yaml`:

- **fractional_kelly**: 0.25 (25% Kelly sizing)
- **max_concentration**: 20% (max in related markets)
- **max_order_size**: 25 contracts
- **max_concentration**: 20%
- **daily_loss_limit**: 10%

### AI Model Settings (in config/settings.yaml)

```yaml
ai:
  enabled: true
  model: "qwen2.5:latest"  # Update this if using different model
  base_url: "http://localhost:11434"
  temperature: 0.3
  timeout: 120.0
```

## MCP Tools Available

The agent has access to these tools via the MCP server:

### Market Data
- `get_markets` - Search and list markets
- `get_market` - Get details for specific market
- `get_orderbook` - View bids/asks
- `get_series` - Get market series info
- `get_event` - Get event details

### Trading
- `create_order` - Place buy/sell orders
- `batch_create_orders` - Place multiple orders at once
- `decrease_order` - Reduce order size
- `cancel_order` - Cancel an order
- `batch_cancel_orders` - Cancel multiple orders

### Portfolio
- `get_balance` - Check account balance
- `get_positions` - View open positions
- `get_orders` - See active orders
- `get_fills` - View trade history
- `get_portfolio_settlements` - See settlements

## Example Trading Scenarios

### Scenario 1: Market Scan

```
User: Scan all markets and find the best trading opportunities

Agent will:
1. Call get_markets to list all markets
2. For each market, call get_orderbook
3. Calculate spreads and identify mispriced contracts
4. Present top opportunities with reasoning
```

### Scenario 2: Automated Trading

```
User: Monitor markets and automatically trade when you find >5% edge

Agent will:
1. Continuously call get_markets
2. Analyze orderbooks for each market
3. When edge > 5%, call create_order
4. Monitor with get_positions
5. Exit positions as needed
```

### Scenario 3: Portfolio Management

```
User: Show me my portfolio and suggest any rebalancing

Agent will:
1. Call get_balance to see cash
2. Call get_positions to see holdings
3. Analyze concentration risk
4. Suggest orders to rebalance if needed
```

## Safety Features

- All orders go through the MCP server with your API credentials
- Agent respects risk limits in system prompt
- You can monitor all actions via MCP server logs
- Start in demo mode by setting `BASE_URL=https://demo-api.kalshi.co` in MCP config

## Troubleshooting

### Agent can't connect to MCP server

Check that the MCP server is running:
```bash
cd mcp-server-kalshi
uv run start
```

### Agent doesn't have access to tools

Verify MCP tools are enabled in your AI interface (Open WebUI, etc.)

### Orders are failing

Check:
1. API credentials are correct in `mcp-server-kalshi/.env`
2. Sufficient balance: agent can call `get_balance`
3. Market is still open and liquid

## Next Steps

1. Test the agent with simple queries
2. Let it run autonomously with monitoring
3. Adjust system prompt based on performance
4. Add more sophisticated strategies to the prompt

## Advanced: Custom Trading Strategies

You can extend the system prompt with specific strategies:

```markdown
### Mean Reversion Strategy
- Monitor markets for >2 std deviations from recent average
- Enter counter-trend positions when deviation detected
- Size using Kelly criterion
- Exit when price reverts to mean

### Arbitrage Strategy
- Compare prices across correlated markets
- Identify price discrepancies >3%
- Simultaneously buy underpriced and sell overpriced
- Close positions when prices converge
```

Just add these to the `system_prompt.md` file and the agent will follow them!
