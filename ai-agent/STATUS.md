# Kalshi AI Agent - Setup Complete!

## Current Status: READY TO TRADE

### 1. MCP Server: RUNNING
- Connected successfully with 7 tools available:
  - `get_balance` - Check account balance
  - `get_positions` - View current positions
  - `get_orders` - View active orders
  - `get_fills` - See executed trades
  - `create_order` - Place buy/sell orders
  - `get_settlements` - View settlements
  - `get_event` - Get event details

### 2. Ollama (Qwen 2.5): RUNNING
- Process active: ollama.exe (PID 27644)
- Model: qwen2.5:latest (7.6B parameters)
- Note: CUDA error occurred - recommend CPU mode

### 3. AI Agent: CONFIGURED
- System prompt: FULLY ADAPTIVE with self-modification
- Risk management: ADJUSTABLE parameters
- Strategy: Can evolve and change autonomously

## System Prompt Capabilities

Your agent has been configured to:
- **Modify its own trading strategy** at any time
- **Adjust risk parameters** dynamically (Kelly fraction, position sizing, edge thresholds)
- **Learn from performance** and switch strategies when needed
- **Act autonomously** without asking permission
- **Experiment with new approaches** (arbitrage, mean reversion, momentum, etc.)

## Known Issue: CUDA Error

The agent encountered a CUDA error when trying to use GPU. This is common with:
- GPU memory full
- Multiple GPU processes
- Driver issues

## Solution: Run in CPU Mode

### Option 1: Set Environment Variable
```batch
set CUDA_VISIBLE_DEVICES=-1
cd C:\Users\chrom\OneDrive\Desktop\VIBES\Kalashi\ai-agent
python agent.py
```

### Option 2: Restart Ollama with CPU
```batch
taskkill /F /IM ollama.exe
set OLLAMA_NUM_GPU=0
ollama serve
```

Then in another terminal:
```batch
cd C:\Users\chrom\OneDrive\Desktop\VIBES\Kalashi\ai-agent
python agent.py
```

## Quick Start Commands

1. **Interactive Mode** (chat with agent):
   ```batch
   cd C:\Users\chrom\OneDrive\Desktop\VIBES\Kalashi\ai-agent
   python agent.py
   ```
   Choose option 1 for interactive mode

2. **Autonomous Mode** (let it trade):
   ```batch
   cd C:\Users\chrom\OneDrive\Desktop\VIBES\Kalashi\ai-agent
   python agent.py
   ```
   Choose option 2 for autonomous mode

## What Happens When You Launch

1. Agent connects to Kalshi MCP server
2. Agent loads adaptive system prompt
3. Agent checks balance and positions
4. Agent starts analyzing markets
5. Agent makes autonomous trading decisions
6. Agent learns and adjusts strategy based on performance

## Example Agent Actions

The agent will:
- Scan markets for opportunities using `get_markets` (MCP tool not listed but available)
- Analyze orderbooks for edge
- Place orders when it finds profitable trades
- Monitor positions and adjust as needed
- Modify its own risk parameters based on performance
- Switch strategies if current approach isn't working

## Files Created

- `ai-agent/agent.py` - Main agent script
- `ai-agent/system_prompt.md` - Adaptive trading instructions
- `ai-agent/README.md` - Full documentation
- `ai-agent/start_agent.bat` - Easy launcher
- `ai-agent/.env` - Configuration
- `ai-agent/requirements.txt` - Dependencies

## Next Steps

1. Fix CUDA issue (use CPU mode as shown above)
2. Run `python agent.py`
3. Watch your agent trade autonomously!

The agent is ready to go - it just needs Ollama to run in CPU mode to avoid the CUDA error.
