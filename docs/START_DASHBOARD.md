# 🚀 Kalshi Dashboard - Quick Start Guide

## Current Configuration

### Services & Ports

| Service | Port | URL | Status |
|---------|------|-----|--------|
| **Frontend Dashboard** | 3000 | http://localhost:3000 | ✅ Running |
| **WebSocket Bridge** | 8766 | ws://127.0.0.1:8766 | ✅ Running |
| **Ollama (Qwen AI)** | 11434 | http://localhost:11434 | Required |

### Architecture

```
┌─────────────────┐
│  React Frontend │  (Port 3000)
│   Dashboard     │
└────────┬────────┘
         │ WebSocket
         ▼
┌─────────────────┐
│  WebSocket      │  (Port 8766)
│  Bridge Server  │
└────┬──────┬─────┘
     │      │
     │      └──────► Ollama/Qwen AI (Port 11434)
     │
     ▼
┌─────────────────┐
│  MCP Server     │
│  (Kalshi API)   │
└─────────────────┘
```

## 🎯 Quick Start

### 1. Start WebSocket Bridge (Backend)

```bash
cd C:\Users\chrom\OneDrive\Desktop\VIBES\Kalashi
python websocket_bridge.py
```

This will:
- ✅ Connect to Kalshi API via MCP
- ✅ Start WebSocket server on port 8766
- ✅ Initialize Qwen AI agent
- ✅ Begin sending real-time updates to dashboard

### 2. Start Frontend Dashboard

```bash
cd C:\Users\chrom\OneDrive\Desktop\VIBES\Kalashi\frontend
npm start
```

Dashboard will open at: http://localhost:3000

### 3. Ensure Ollama is Running

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start Ollama service
ollama serve
```

## 📊 Dashboard Features

Once connected, you can:

- ✅ **View Portfolio**: Real-time balance, equity, P&L
- ✅ **Monitor Positions**: Active positions with unrealized P&L
- ✅ **Control Trading**: START/PAUSE/STOP the AI agent
- ✅ **AI Insights**: Chat with Qwen about markets and strategies
- ✅ **Health Monitoring**: API latency, connection status, error rates
- ✅ **Live Logs**: All trading activity and AI decisions

## 🔧 Troubleshooting

### Dashboard shows "Reconnecting..."

1. Check WebSocket bridge is running:
   ```bash
   netstat -ano | findstr "8766"
   ```
   Should show: `LISTENING` on port 8766

2. Restart WebSocket bridge:
   ```bash
   python websocket_bridge.py
   ```

### "MCP Connection Failed"

Check your Kalshi credentials in:
- `mcp-server-kalshi/.env`
- `ai-agent/.env`

Verify:
- `KALSHI_API_KEY` is set
- `KALSHI_PRIVATE_KEY_PATH` points to your private key file
- `BASE_URL` is correct (demo or production)

### "Ollama Not Found"

Install Ollama and pull Qwen model:
```bash
# Install Ollama from: https://ollama.ai

# Pull Qwen model
ollama pull qwen2.5:latest

# Verify it's running
ollama list
```

### Port Conflicts

If ports 3000 or 8766 are in use:

**Change WebSocket port:**
1. Edit `websocket_bridge.py` - change `WEBSOCKET_PORT`
2. Edit `frontend/src/App.tsx` - update WebSocket URL
3. Restart both services

**Change Frontend port:**
```bash
# In frontend directory
PORT=3001 npm start
```

## 🤖 AI Agent Control

### From Dashboard
- Click **START** to begin autonomous trading
- Click **PAUSE** to pause trading (keeps positions)
- Click **STOP** to halt trading completely

### From AI Insights Panel
Ask questions like:
- "What's my current balance?"
- "Show me my active positions"
- "Find markets with good opportunities"
- "Analyze the current market conditions"

## 📝 Files

| File | Purpose |
|------|---------|
| `websocket_bridge.py` | WebSocket server connecting dashboard to Kalshi/AI |
| `frontend/` | React dashboard application |
| `mcp-server-kalshi/` | Kalshi API MCP server |
| `ai-agent/` | Qwen AI trading agent |

## 🔐 Security Notes

- Never commit `.env` files with real credentials
- Use demo account for testing (`BASE_URL=https://demo-api.kalshi.co`)
- Private keys should have restricted file permissions
- WebSocket server only listens on localhost (127.0.0.1)

## ✨ Next Steps

1. Configure your trading strategy in `ai-agent/system_prompt.md`
2. Adjust risk parameters (Kelly fraction, position limits)
3. Test with demo account before going live
4. Monitor the dashboard during trading hours
5. Review logs for AI decision reasoning

---

**Need help?** Check:
- Main README: `README.md`
- AI Agent docs: `ai-agent/LAUNCH_INSTRUCTIONS.md`
- MCP Server docs: `mcp-server-kalshi/README.md`
