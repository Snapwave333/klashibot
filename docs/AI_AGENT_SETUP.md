# AI Agent Setup Guide
## For Systems with 8GB VRAM

Your system has 8GB VRAM, which is perfect for efficient AI trading agents!

## ✅ Recommended Models for 8GB VRAM

### Option 1: DeepSeek-R1 7B (4.7GB) - **Currently Configured**
```bash
ollama pull deepseek-r1:7b
```
- **Size**: 4.7GB (fits comfortably in 8GB VRAM)
- **Specialization**: Reasoning and decision-making
- **Speed**: ~2-3 seconds per decision
- **Best For**: Complex trading decisions, risk analysis

### Option 2: Qwen2.5 7B (4.7GB) - Alternative
```bash
ollama pull qwen2.5:7b
```
- **Size**: 4.7GB
- **Specialization**: General purpose, fast
- **Speed**: ~1-2 seconds per decision
- **Best For**: Quick decisions, high-frequency trading

### Option 3: Phi3.5 (2.2GB) - Lightweight
```bash
ollama pull phi3.5:latest
```
- **Size**: 2.2GB (very light!)
- **Specialization**: Efficient reasoning
- **Speed**: <1 second per decision
- **Best For**: Low latency, frequent decisions

### Option 4: Gemma2 9B (5.4GB) - Balanced
```bash
ollama pull gemma2:latest
```
- **Size**: 5.4GB
- **Specialization**: Balanced performance
- **Speed**: ~2 seconds per decision

## 🚀 Quick Start

### 1. Install Ollama (if not already installed)
Download from: https://ollama.com

### 2. Pull the Model
```bash
# Default (already configured in code)
ollama pull deepseek-r1:7b
```

### 3. Start the Bot with AI
```bash
# Option A: Use the batch file
start_bot_with_ai.bat

# Option B: Command line
cd backend
python main.py --paper --ai
```

## ⚙️ Changing Models

If you want to use a different model, edit `backend/main.py` line 147-149:

```python
ollama_config = OllamaConfig(
    model="deepseek-r1:7b",  # Change this
    temperature=0.3
)
```

Example changes:
```python
# For faster decisions
model="qwen2.5:7b"

# For ultra-light weight
model="phi3.5:latest"

# For balanced performance
model="gemma2:latest"
```

## 📊 VRAM Usage Table

| Model | Size | VRAM Usage | Headroom | Speed |
|-------|------|------------|----------|-------|
| phi3.5 | 2.2GB | ~3GB | ✅ 5GB free | ⚡⚡⚡ Very Fast |
| deepseek-r1:7b | 4.7GB | ~5.5GB | ✅ 2.5GB free | ⚡⚡ Fast |
| qwen2.5:7b | 4.7GB | ~5.5GB | ✅ 2.5GB free | ⚡⚡ Fast |
| gemma2 | 5.4GB | ~6.5GB | ✅ 1.5GB free | ⚡ Medium |

**Note**: VRAM usage includes model + context + inference overhead

## 🎯 What the AI Agent Does

### Autonomous Actions:
1. **Risk Management**
   - Adjusts Kelly fractions based on performance
   - Reduces exposure during drawdowns
   - Increases exposure during winning streaks

2. **Strategy Control**
   - Pauses underperforming strategies
   - Resumes strategies when conditions improve
   - Suggests parameter modifications

3. **Portfolio Protection**
   - Monitors daily P&L limits
   - Responds to high error rates
   - Protects against adverse market conditions

### Example Decisions:

**Scenario 1**: Profitable Day
```
AI Decision: adjust_risk
Reasoning: Portfolio up 12%. Reducing Kelly to 0.20 to lock in gains.
Confidence: 87%
```

**Scenario 2**: High Error Rate
```
AI Decision: pause_strategy
Reasoning: Error rate at 5%. Pausing pure_arb strategy until stability returns.
Confidence: 92%
```

**Scenario 3**: Stable Performance
```
AI Decision: hold
Reasoning: All metrics within normal range. Continue current strategy.
Confidence: 95%
```

## 📝 Monitoring AI Decisions

### Dashboard Logs
All AI decisions appear in the live dashboard at http://localhost:3000:

```
[AI] Decision: adjust_risk (85% confident)
[AI] Reasoning: Portfolio volatility increased. Reducing Kelly to 0.15
```

### Decision History
The bot stores all AI decisions with timestamps and reasoning for post-analysis.

## 🛡️ Safety Features

1. **Rate Limited**: AI makes decisions maximum once per 60 seconds
2. **Conservative**: AI prioritizes capital preservation over gains
3. **Transparent**: Every decision includes clear reasoning
4. **Override Available**: Dashboard controls always work
5. **Paper Trading First**: Test AI behavior with virtual money

## ⚡ Performance Optimization

### For Faster Inference:
```python
ollama_config = OllamaConfig(
    model="qwen2.5:7b",
    temperature=0.2,  # Lower for faster, more deterministic
    max_tokens=2048   # Reduce for shorter responses
)
```

### For Better Reasoning:
```python
ollama_config = OllamaConfig(
    model="deepseek-r1:7b",
    temperature=0.4,  # Slightly higher for creative reasoning
    max_tokens=4096   # Allow longer analysis
)
```

## 🔍 Troubleshooting

### "Model not found"
```bash
ollama list
ollama pull deepseek-r1:7b
```

### "Connection refused"
```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# If not, start it
ollama serve
```

### Out of Memory
1. Use a smaller model: `phi3.5:latest` (2.2GB)
2. Close other GPU applications
3. Restart Ollama: `ollama serve`

### Slow Decisions
- Current model may be too large
- Switch to `qwen2.5:7b` or `phi3.5` for faster inference
- Check CPU usage - Ollama may be using CPU instead of GPU

## 📚 Next Steps

1. ✅ **Pull the model**: `ollama pull deepseek-r1:7b`
2. ✅ **Start the bot**: `start_bot_with_ai.bat`
3. ✅ **Watch the dashboard**: http://localhost:3000
4. ✅ **Monitor AI decisions**: Check live logs
5. ✅ **Experiment**: Try different models and parameters

## 🎉 You're Ready!

Your AI agent is configured and ready to autonomously control your trading bot with reasoning-based decisions. Start with paper trading to see how it performs!

```bash
start_bot_with_ai.bat
```

Then open: http://localhost:3000
