#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Kalshi AI Trading Agent
Uses Ollama (Qwen) with MCP server for autonomous trading.
Supports actual Tool Execution via Function Calling.
"""

import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional
import ollama
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# Fix Windows console encoding
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

# Load system prompt
SYSTEM_PROMPT_PATH = Path(__file__).parent / "system_prompt.md"
with open(SYSTEM_PROMPT_PATH, "r") as f:
    SYSTEM_PROMPT = f.read()

# Configuration
MODEL = "qwen2.5:latest"
MCP_SERVER_PATH = Path(__file__).parent.parent / "mcp-server-kalshi"


def convert_mcp_to_ollama_tool(mcp_tool: Any) -> Dict[str, Any]:
    """Convert MCP tool schema to Ollama tool schema"""
    return {
        "type": "function",
        "function": {
            "name": mcp_tool.name,
            "description": mcp_tool.description,
            "parameters": mcp_tool.inputSchema,
        },
    }


class KalshiTradingAgent:
    def __init__(self):
        self.conversation_history = [{"role": "system", "content": SYSTEM_PROMPT}]
        self.mcp_session: Optional[ClientSession] = None
        self.available_tools_mcp = {}
        self.available_tools_ollama = []
        self.portfolio_balance = 0.0  # Track locally for logic modification

    async def connect_to_mcp(self):
        """Connect to the Kalshi MCP server"""
        print("🔌 Connecting to Kalshi MCP server...")

        # SECURITY: Validate required environment variables
        api_key = os.getenv("KALSHI_API_KEY")
        if not api_key:
            raise ValueError(
                "KALSHI_API_KEY environment variable is required. "
                "Please set it in your .env file."
            )

        private_key_path = os.getenv(
            "KALSHI_PRIVATE_KEY_PATH",
            str(Path(__file__).parent.parent / "config" / "kalshi_private.pem"),
        )

        if not Path(private_key_path).exists():
            raise FileNotFoundError(f"Private key not found at {private_key_path}.")

        server_params = StdioServerParameters(
            command="uv",
            args=["--directory", str(MCP_SERVER_PATH), "run", "start"],
            env={
                **os.environ,
                "KALSHI_API_KEY": api_key,
                "KALSHI_PRIVATE_KEY_PATH": private_key_path,
                "BASE_URL": os.getenv("BASE_URL", "https://api.elections.kalshi.com"),
                "PAPER_TRADING": "true",
                "PAPER_BALANCE": "10000",  # $100.00 in cents
            },
        )

        stdio_ctx = stdio_client(server_params)
        self.stdio, self.write = await stdio_ctx.__aenter__()
        self.stdio_ctx = stdio_ctx

        self.mcp_session = ClientSession(self.stdio, self.write)
        await self.mcp_session.__aenter__()

        # Initialize
        await self.mcp_session.initialize()
        tools_response = await self.mcp_session.list_tools()

        self.available_tools_mcp = {tool.name: tool for tool in tools_response.tools}
        self.available_tools_ollama = [
            convert_mcp_to_ollama_tool(tool) for tool in tools_response.tools
        ]

        print(f"✅ Connected! Available tools: {len(self.available_tools_mcp)}")

    async def chat(self, user_message: str):
        """Send a message to the agent and handle tool calls"""
        self.conversation_history.append({"role": "user", "content": user_message})
        print(f"\n💬 User: {user_message}")

        # --- Small Account Check ---
        # If we have a balance check from previous turns, we can inject a reminder
        if self.portfolio_balance > 0 and self.portfolio_balance < 50000: # < $500.00
             print("⚠️ Small account detected! Injecting Sniper Mode reminder.")
             reminder = "REMINDER: Your balance is under $500. Use SNIPER MODE: High conviction only, aggressive compounding."
             # Ephemeral message to context (not history to avoid bloating)
             # But for simplicity, we append to history temporarily or just rely on system prompt
             pass 

        while True:
            print("🤖 Agent thinking...")
            response = ollama.chat(
                model=MODEL,
                messages=self.conversation_history,
                tools=self.available_tools_ollama,
            )
            
            message = response["message"]
            
            # If the model wants to call tools
            if "tool_calls" in message and message["tool_calls"]:
                # Add the assistant's "thinking" (tool call request) to history
                self.conversation_history.append(message)
                
                print(f"🛠️ Agent wants to use {len(message['tool_calls'])} tools:")

                for tool_call in message["tool_calls"]:
                    tool_name = tool_call["function"]["name"]
                    tool_args = tool_call["function"]["arguments"]
                    
                    print(f"   👉 {tool_name}({json.dumps(tool_args)})")
                    
                    # Execute tool via MCP
                    try:
                        result = await self.mcp_session.call_tool(tool_name, tool_args)
                        # MCP result structure: content=[TextContent(type='text', text='...')]
                        # We need to extract the text
                        tool_output = result.content[0].text
                        
                        # Special handling to update local state
                        if tool_name == "get_balance":
                             try:
                                 # Parse balance to track locally (returns cents)
                                 data = json.loads(tool_output)
                                 if isinstance(data, dict) and "balance" in data:
                                     self.portfolio_balance = int(data["balance"])
                             except:
                                 pass

                    except Exception as e:
                        tool_output = f"Error executing tool {tool_name}: {str(e)}"
                        print(f"   ❌ Error: {e}")

                    # Add tool result to history
                    self.conversation_history.append({
                        "role": "tool",
                        "content": tool_output,
                    })
                    print("   ✅ Tool output received")
                
                # Loop back to let the agent process the tool outputs
                continue
            
            else:
                # Final response (no more tool calls)
                assistant_message = message["content"]
                self.conversation_history.append(message)
                print(f"\n🤖 Agent: {assistant_message}\n")
                return assistant_message

    async def autonomous_loop(self):
        """Main autonomous trading loop"""
        print("\n🚀 Starting autonomous trading loop...")
        
        # Initial boot check
        await self.chat("Check my balance and current positions to start.")

        iteration = 0
        while True:
            try:
                iteration += 1
                print(f"\n{'=' * 60}")
                print(f"ITERATION {iteration}")
                print(f"{'=' * 60}")

                # Dynamic prompting based on state
                if self.portfolio_balance > 0 and self.portfolio_balance < 50000:
                     strategy_hint = "Execute Broker Mode: Scan for ONE high conviction trade. Strict risk."
                else:
                     strategy_hint = "Scan markets, manage portfolio, and execute trades."

                prompt = f"""
                Execute trading iteration #{iteration}.
                1. {strategy_hint}
                2. Check RSS feeds for major news if relevant.
                3. Report your decision.
                """

                await self.chat(prompt.strip())
                await asyncio.sleep(45) # Wait before next loop

            except KeyboardInterrupt:
                print("\n⛔ Stopping...")
                break
            except Exception as e:
                print(f"\n❌ Error: {e}")
                await asyncio.sleep(10)

    async def interactive_mode(self):
        print("\n💬 Interactive Mode")
        while True:
            try:
                user_input = input("You: ").strip()
                if user_input.lower() in ["exit", "quit"]:
                    break
                if user_input.lower() == "auto":
                    await self.autonomous_loop()
                    break
                await self.chat(user_input)
            except KeyboardInterrupt:
                break

    async def cleanup(self):
        if self.mcp_session:
            await self.mcp_session.__aexit__(None, None, None)
        if hasattr(self, "stdio_ctx"):
            await self.stdio_ctx.__aexit__(None, None, None)

async def main():
    print("🎯 Kalshi AI Trading Agent (v2.0 - Tool Enabled)")
    agent = KalshiTradingAgent()
    try:
        await agent.connect_to_mcp()
        
        mode = input("\nMode (1=Interactive, 2=Autonomous): ").strip()
        if mode == "2":
            await agent.autonomous_loop()
        else:
            await agent.interactive_mode()
            
    except Exception as e:
        print(f"Fatal Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await agent.cleanup()

if __name__ == "__main__":
    asyncio.run(main())
