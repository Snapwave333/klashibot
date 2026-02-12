# Kalshi AI Trading System - Startup Guide

## Quick Start (3 Steps)

### 1. Start the WebSocket Bridge
```bash
cd C:\Users\chrom\OneDrive\Desktop\VIBES\Kalashi
python -u websocket_bridge.py
```
Leave this terminal running. You should see:
- ✅ MCP Connected
- ✅ WebSocket server listening on port 8766

### 2. Start the Frontend
```bash
cd C:\Users\chrom\OneDrive\Desktop\VIBES\Kalashi\frontend
npm start
```
Leave this terminal running. It will open on http://localhost:3002

### 3. Use the Dashboard
1. Open http://localhost:3002 in your browser
2. Click the green **PLAY** button (center top)
3. Wait 10-60 seconds for first AI response
4. Watch AI make autonomous trading decisions every 30 seconds

## System Architecture

```
Frontend (3002) <--WebSocket--> Bridge (8766) <--> Ollama AI (11434)
                                        |
                                        v
                                 Kalshi MCP Server
```

## What Each Component Does

### WebSocket Bridge (Port 8766)
- Receives commands from frontend (PLAY/PAUSE/STOP)
- Calls Ollama/Qwen AI for trading decisions
- Manages Kalshi API via MCP server
- Broadcasts updates back to frontend

### Frontend Dashboard (Port 3002)
- Real-time trading interface
- Shows AI thinking and decisions
- Control buttons (PLAY/PAUSE/STOP)
- Live logs and metrics

### Ollama AI (Port 11434)
- Qwen 2.5 language model
- Makes autonomous trading decisions
- First request takes 60+ seconds (model loading)
- Subsequent requests: 10-20 seconds

## Troubleshooting

### "No AI activity"
- First AI response takes 60-90 seconds (Ollama loading model)
- Check bridge terminal for "🤖 Asking Ollama..." message
- If stuck, model might be too slow - consider switching to phi3.5 (smaller/faster)

### "WebSocket disconnected"
- Refresh browser page
- Restart bridge (Ctrl+C, then restart)
- Check firewall isn't blocking port 8766

### "Port already in use"
- Bridge: `taskkill //F //PID <pid>` (find PID with `netstat -ano | findstr 8766`)
- Frontend: `taskkill //F //PID <pid>` (find PID with `netstat -ano | findstr 3002`)

## Configuration

### Change AI Model
Edit `websocket_bridge.py` line 26:
```python
MODEL = "phi3.5:latest"  # Faster, smaller model
# MODEL = "qwen2.5:latest"  # Current (slower but smarter)
```

### Change Iteration Speed
Edit `websocket_bridge.py` line 320:
```python
await asyncio.sleep(10)  # Faster (every 10 seconds)
# await asyncio.sleep(30)  # Current (every 30 seconds)
```

### Change AI Timeout
Edit `websocket_bridge.py` line 154:
```python
timeout=120.0  # 2 minutes
# timeout=60.0  # Current (1 minute)
```

## Current Known Issues

1. **Balance Parsing Error**: MCP server returns unexpected format
   - Doesn't prevent AI from working
   - Portfolio shows $0 balance until fixed

2. **First AI Call Slow**: Ollama loads model on first request
   - Takes 60-90 seconds
   - Subsequent calls much faster (10-20s)

## Services Status Check

```bash
# Check all services running
netstat -ano | findstr "3002 8766 11434" | findstr "LISTENING"

# Should show:
# TCP    0.0.0.0:3002    (Frontend)
# TCP    127.0.0.1:8766  (Bridge)
# TCP    0.0.0.0:11434   (Ollama)
```

## Success Indicators

When working correctly, you'll see:
1. Dashboard loads at http://localhost:3002
2. "SYSTEM ONLINE" indicator (green)
3. Click PLAY → bot status changes to "RUNNING"
4. Bridge terminal shows "🤖 AI Trading Loop Started"
5. Within 60s: "✅ AI Response received"
6. Dashboard shows AI thinking/decisions
7. New iteration every 30 seconds

## Emergency Stop

Press **STOP** button or:
```bash
# Kill bridge
Ctrl+C in bridge terminal

# Kill frontend
Ctrl+C in frontend terminal
```

---

**Note**: The system is designed for paper trading. Do NOT connect real funds without thorough testing!
