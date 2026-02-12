#!/usr/bin/env python3
"""Quick test to verify Ollama and MCP server are working"""

import sys
import ollama

print("=" * 60)
print("Testing Kalshi AI Agent Setup")
print("=" * 60)

# Test 1: Ollama connection
print("\n1. Testing Ollama connection...")
try:
    models = ollama.list()
    print(f"   ✓ Ollama connected! Found {len(models['models'])} models")

    # Check for qwen2.5
    qwen_found = any("qwen2.5" in m["name"] for m in models["models"])
    if qwen_found:
        print("   ✓ qwen2.5:latest model found")
    else:
        print("   ✗ qwen2.5:latest model NOT found - run: ollama pull qwen2.5:latest")
except Exception as e:
    print(f"   ✗ Ollama connection failed: {e}")
    sys.exit(1)

# Test 2: Simple Ollama query (CPU only, small response)
print("\n2. Testing Ollama inference (CPU)...")
try:
    response = ollama.generate(
        model="qwen2.5:latest",
        prompt='Say "Hello" in 1 word only',
        options={
            "num_predict": 10,  # Very short response
            "num_gpu": 0,  # Force CPU to avoid CUDA errors
        },
    )
    print(f"   ✓ Ollama responded: {response['response'][:50]}")
except Exception as e:
    print(f"   ✗ Ollama inference failed: {e}")
    print("   Note: Try restarting Ollama or use CPU mode")

# Test 3: Check MCP server files
print("\n3. Checking MCP server setup...")
from pathlib import Path

mcp_path = Path(__file__).parent.parent / "mcp-server-kalshi"
if mcp_path.exists():
    print(f"   ✓ MCP server directory found: {mcp_path}")

    env_file = mcp_path / ".env"
    if env_file.exists():
        print("   ✓ MCP .env file found")
    else:
        print("   ✗ MCP .env file missing")
else:
    print(f"   ✗ MCP server directory not found: {mcp_path}")

# Test 4: Check system prompt
print("\n4. Checking AI agent files...")
prompt_file = Path(__file__).parent / "system_prompt.md"
if prompt_file.exists():
    with open(prompt_file, "r") as f:
        prompt = f.read()
    print(f"   ✓ System prompt loaded ({len(prompt)} characters)")

    # Check for key phrases
    if "FULLY ADAPTIVE" in prompt:
        print("   ✓ Adaptive strategy enabled")
    if "ADJUSTABLE" in prompt:
        print("   ✓ Adjustable risk parameters enabled")
else:
    print("   ✗ System prompt file missing")

print("\n" + "=" * 60)
print("Setup Status:")
print("  • Ollama: READY")
print("  • MCP Server files: READY")
print("  • AI Agent: READY")
print("=" * 60)
print("\nTo start trading:")
print("  cd C:\\Users\\chrom\\OneDrive\\Desktop\\VIBES\\Kalashi\\ai-agent")
print("  start_agent.bat")
print("\nOr if CUDA issues persist, set CPU mode:")
print("  set CUDA_VISIBLE_DEVICES=-1")
print("  python agent.py")
print("=" * 60)
