#!/usr/bin/env python3
"""
WebSocket Bridge Server
Connects the React dashboard to Kalshi via MCP server and Qwen AI agent
Port 8765 - Dashboard WebSocket
"""

import sys

# Fix Windows console encoding immediately
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

import asyncio
import json
import os
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from datetime import datetime
from pathlib import Path
import websockets
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
import ollama
from aiohttp import web
from trading_engine import TradingEngine
from kalshi_image_scraper import scraper as image_scraper

# Optional TTS service - make it fail gracefully
try:
    from tts_service import tts_service

    TTS_AVAILABLE = True
except Exception as e:
    print(f"TTS service not available: {e}")
    tts_service = None
    TTS_AVAILABLE = False

# Configuration
WEBSOCKET_PORT = 8766  # Changed from 8765 to avoid conflicts
MODEL = "qwen2.5:latest"
MCP_SERVER_PATH = Path(__file__).parent / "mcp-server-kalshi"


# Load AI system prompt
SYSTEM_PROMPT_PATH = Path(__file__).parent / "ai-agent" / "system_prompt.md"
with open(SYSTEM_PROMPT_PATH, "r") as f:
    SYSTEM_PROMPT = f.read()

DAD_JOKES = [
    "I'm afraid for the calendar. Its days are numbered.",
    "Why do fathers take an extra pair of socks when they go golfing? In case they get a hole in one!",
    "Singing in the shower is fun until you get soap in your mouth. Then it's a soap opera.",
    "What do a tick and the Eiffel Tower have in common? They're both Paris sites.",
    "What do you call a fish wearing a bowtie? Sofishticated.",
    "How do you follow Will Smith in the snow? You follow the fresh prints.",
    "If April showers bring May flowers, what do May flowers bring? Pilgrims.",
    "I thought the dryer was shrinking my clothes. Turns out it was the refrigerator all along.",
    "How does dry skin affect you at work? You don’t have any elbow grease to put into it.",
    "What do you call a factory that makes okay products? A satisfactory.",
    "Dear Math, grow up and solve your own problems.",
    "What did the janitor say when he jumped out of the closet? Supplies!",
    "Have you heard about the chocolate record player? It sounds pretty sweet.",
    "What did the ocean say to the beach? Nothing, it just waved.",
    "Why do seagulls fly over the ocean? Because if they flew over the bay, we'd call them bagels.",
    "I only know 25 letters of the alphabet. I don't know y.",
    "How does the moon cut his hair? Eclipse it.",
    "What did one wall say to the other? I'll meet you at the corner.",
    "What did the zero say to the eight? That belt looks good on you.",
    "A skeleton walks into a bar and says, 'Hey, bartender. I'll have one beer and a mop.'",
    "Where do fruits go on vacation? Pear-is!",
    "I asked my dog what's two minus two. He said nothing.",
    "What did Baby Corn say to Mama Corn? Where's Pop Corn?",
    "What's the best thing about Switzerland? I don't know, but the flag is a big plus.",
    "What does a sprinter eat before a race? Nothing, they fast.",
    "Where do you learn to make a banana split? Sundae school.",
    "What has more letters than the alphabet? The post office!",
    "Dad, did you get a haircut? No, I got them all cut!",
    "What do you call a poor Santa Claus? St. Nickel-less.",
    "I got carded at a liquor store, and my Blockbuster card accidentally fell out. The cashier said never mind.",
    "Where do boats go when they're sick? To the boat doc.",
    "I don't trust those trees. They seem kind of shady.",
    "My wife is really mad at the fact that I have no sense of direction. So I packed up my stuff and right!",
    "How do you get a squirrel to like you? Act like a nut.",
    "Why don't eggs tell jokes? They'd crack each other up.",
    "I don't trust stairs. They're always up to something.",
    "What do you call someone with no body and no nose? Nobody knows.",
    "Did you hear the rumor about butter? Well, I'm not going to spread it!",
    "Why couldn't the bicycle stand up by itself? It was two tired.",
    "What do you call a belt made out of watches? A waist of time.",
]


class WebSocketBridge:
    @property
    def mcp_session(self):
        """Primary session for Kalshi market data"""
        return self.mcp_sessions.get("kalshi")

    def __init__(self):
        self.clients = set()
        self.mcp_sessions = {}
        self.mcp_log_file = sys.stderr  # Default to stderr
        self.available_tools = {}
        self.bot_state = "STANDBY"
        self.trading_task = None  # Track the trading loop task
        self.tts_enabled = True  # TTS toggle state
        self.trading_engine = None  # Optimized trading engine
        self.background_tasks = set()
        self.portfolio = {
            "balance": 0,
            "total_equity": 0,
            "free_margin": 0,
            "daily_pnl": 0,
            "daily_pnl_pct": 0,
            "uptime_seconds": 0,
            "max_drawdown": 0,
            "sharpe_ratio": 0,
            "win_rate": 0,
            "active_positions_count": 0,
            "orders_per_sec": 0,
            "metrics_history": {"pnl_7d": [], "pnl_30d": []},
        }
        # Default starting capital for paper trading
        self.portfolio["balance"] = 100.0
        self.portfolio["total_equity"] = 100.0
        self.portfolio["free_margin"] = 100.0
        self.paper_trading = os.getenv("PAPER_TRADING", "true").lower() == "true"
        self.positions = []
        self.conversation_history = [{"role": "system", "content": SYSTEM_PROMPT}]
        self.market_ticker_data = []  # Store ticker data
        self.market_ticker_data = []  # Store ticker data
        self.last_mcp_latency = 0  # Track API latency
        self.last_pnl = 0.0  # Track PnL for emotional engine
        self.consecutive_empty_scans = 0  # Track boredom/frustration

        # Initialize trading engine with dynamic session provider
        self.trading_engine = TradingEngine(
            lambda: self.mcp_session,
            portfolio_callback=self.update_portfolio_from_kalshi,
            paper_mode=self.paper_trading,
        )
        print(f"💰 INITIALIZED PAPER WALLET: ${self.portfolio['balance']:.2f}")

    async def manage_mcp_connection(self):
        """Robust connection loop for multiple MCP servers as defined in config"""
        print("🔌 Starting Multi-MCP Connection Manager...")

        config_path = Path(__file__).parent / "config" / "mcp_config.json"
        if not config_path.exists():
            print("   ⚠️ MCP Config not found. Falling back to default Kalshi.")
            return await self._manage_single_mcp_stub()

        def load_config():
            with open(config_path, "r") as f:
                return json.load(f)

        self.mcp_config = await asyncio.to_thread(load_config)

        while True:
            try:
                tasks = []
                for server_id, server_info in self.mcp_config.get(
                    "mcpServers", {}
                ).items():
                    tasks.append(self._run_mcp_server(server_id, server_info))

                await asyncio.gather(*tasks)
            except Exception as e:
                print(f"❌ Global MCP Manager Error: {e}")

            await asyncio.sleep(5)

    async def _run_mcp_server(self, server_id, info):
        """Manage individual MCP server lifecycle"""
        while True:
            try:
                print(f"   🔄 Connecting to MCP [{server_id}]...")

                # Build command
                server_params = self._create_server_params(info)

                async with stdio_client(server_params) as (read, write):
                    async with ClientSession(read, write) as session:
                        print(f"   ✅ MCP [{server_id}] Session Created")
                        self.mcp_sessions[server_id] = session

                        try:
                            await session.initialize()
                            tools_response = await session.list_tools()

                            # Update global tools registry
                            for tool in tools_response.tools:
                                # Prepend server_id to avoid name collisions if necessary,
                                # but usually tool names are unique across services
                                self.available_tools[tool.name] = tool

                            print(
                                f"   ✅ MCP [{server_id}] Initialized! Tools: {len(tools_response.tools)}"
                            )

                            # Inject Recursive Learning Tool
                            from mcp import Tool

                            self.available_tools["record_lesson"] = Tool(
                                name="record_lesson",
                                description="Record a technical or strategic lesson learned during a trading iteration to the Recursive Brain. Use this to ensure you don't repeat mistakes or to solidify successful strategies.",
                                inputSchema={
                                    "type": "object",
                                    "properties": {
                                        "lesson": {
                                            "type": "string",
                                            "description": "The specific insight or heuristic learned.",
                                        }
                                    },
                                    "required": ["lesson"],
                                },
                            )

                            if server_id == "kalshi":
                                self.warmup_system()

                            # Keep alive monitor
                            while server_id in self.mcp_sessions:
                                await asyncio.sleep(2)

                        except Exception as e:
                            print(f"   ❌ MCP [{server_id}] Session Error: {e}")
                        finally:
                            if server_id in self.mcp_sessions:
                                del self.mcp_sessions[server_id]

            except Exception as e:
                print(f"❌ MCP [{server_id}] Connection Failed: {e}")

            print(f"   ⚠️ MCP [{server_id}] Disconnected. Retrying in 10s...")

    def _create_server_params(self, info):
        """Helper to build server parameters and reduce complexity"""
        cwd_relative = info.get("working_directory", ".")
        full_cwd = (Path(__file__).parent / cwd_relative).resolve()

        args = info["args"][:]
        env = {**os.environ, **info.get("env", {})}

        # If using module (-m), add working_directory to PYTHONPATH
        if "-m" in args:
            env["PYTHONPATH"] = str(full_cwd) + os.pathsep + env.get("PYTHONPATH", "")
        else:
            # If it's a script, make the path absolute
            for i, arg in enumerate(args):
                if arg.endswith(".py"):
                    args[i] = str((full_cwd / arg).resolve())

        return StdioServerParameters(
            command=info["command"], args=args, env=env, stderr=self.mcp_log_file
        )

    async def _manage_single_mcp_stub(self):
        # ... (Legacy fallback logic if needed)
        pass

    def _setup_mcp_server_params(self):
        """Build parameters for Kalshi MCP server"""
        mcp_src_path = str(MCP_SERVER_PATH / "src")
        print(f"📁 MCP Source Path: {mcp_src_path}")

        # Ensure logs directory exists
        log_dir = Path("logs")
        log_dir.mkdir(exist_ok=True)
        self.mcp_log_file = open(log_dir / "mcp_error.log", "a", encoding="utf-8")

        return StdioServerParameters(
            command="python",
            args=["-m", "mcp_server_kalshi.server"],
            env={
                **os.environ,
                "PYTHONPATH": mcp_src_path
                + os.pathsep
                + os.environ.get("PYTHONPATH", ""),
                "KALSHI_API_KEY": os.getenv(
                    "KALSHI_API_KEY", "4d5c4621-fae5-4c62-a4af-ae84ba1120ea"
                ),
                "KALSHI_PRIVATE_KEY_PATH": os.getenv(
                    "KALSHI_PRIVATE_KEY_PATH",
                    str(Path(__file__).parent / "config" / "kalshi_private.pem"),
                ),
                "BASE_URL": os.getenv("BASE_URL", "https://demo-api.kalshi.co"),
                "PAPER_TRADING": "true",
                "PAPER_BALANCE": "10000",
            },
            stderr=self.mcp_log_file,  # Redirect stderr to file
        )

    async def call_mcp_tool(self, tool_name: str, arguments: dict):
        """Call an MCP tool and return the result - searches through active sessions"""
        if not self.mcp_sessions:
            return {"error": "No MCP Connections Available"}

        if tool_name not in self.available_tools:
            return f"Error: Tool '{tool_name}' not found"

        # Determine which session owns this tool
        # In a more complex setup, we could store metadata mapping tools to sessions
        # For now, we try all sessions that have the tool (usually just one)
        try:
            print(f"🔧 [Bridges] Calling tool: {tool_name}")
            import time

            t0 = time.time()

            # Find the session that has this tool
            if tool_name == "record_lesson":
                lesson = arguments.get("lesson")
                if lesson:
                    self.trading_engine.learner.add_lesson(lesson)
                    return {
                        "status": "success",
                        "message": f"Lesson recorded to Recursive Brain: {lesson}",
                    }
                return {"status": "error", "message": "No lesson content provided."}

            session = None
            for s_id, s in self.mcp_sessions.items():
                # We could pre-cache this mapping for O(1) lookups
                tools_response = await s.list_tools()
                if any(t.name == tool_name for t in tools_response.tools):
                    session = s
                    break

            if not session:
                return {
                    "error": f"Tool {tool_name} found in registry but no session active."
                }

            result = await session.call_tool(tool_name, arguments)
            self.last_mcp_latency = int((time.time() - t0) * 1000)
            return result
        except Exception as e:
            import traceback

            traceback.print_exc()
            print(f"❌ MCP tool error details: {type(e).__name__}, {str(e)}")
            return {"error": str(e)}

    async def update_portfolio_from_kalshi(self):
        """Fetch latest balance and positions from Kalshi"""
        try:
            # 1. Get Balance
            balance_data = await self.call_mcp_tool("get_balance", {})
            if isinstance(balance_data, str):
                try:
                    balance_json = json.loads(balance_data)
                    self.portfolio["balance"] = balance_json.get("balance", 0.0)
                except:
                    # Fallback if string is not json
                    pass
            elif isinstance(balance_data, dict):
                self.portfolio["balance"] = balance_data.get("balance", 0.0)

            # 2. Get Positions
            positions_data = await self.call_mcp_tool("get_positions", {})
            if isinstance(positions_data, list):
                self.positions = positions_data
            elif isinstance(positions_data, dict) and "positions" in positions_data:
                self.positions = positions_data["positions"]

            # 3. Calculate metrics
            total_equity = self.portfolio["balance"]
            daily_pnl = 0.0

            for pos in self.positions:
                # Simplified equity calc for demo
                qty = pos.get("position", 0)
                price = pos.get(
                    "last_price", 0
                )  # This might be stale, but ok for approx
                cost = pos.get("average_price", 0) * qty  # simplified
                curr_val = qty * price

                total_equity += curr_val / 100.0  # Convert cents to dollars
                daily_pnl += (curr_val - cost) / 100.0

            self.portfolio["total_equity"] = total_equity
            self.portfolio["active_positions_count"] = len(self.positions)

            # 4. Emotional Reaction to PnL Change
            pnl_delta = daily_pnl - self.last_pnl

            # Only react to significant changes (>$1) to avoid noise
            if abs(pnl_delta) > 1.0:
                if pnl_delta > 0:
                    msg = f"Yes! We just made ${pnl_delta:.2f}! Profit is up to ${daily_pnl:.2f}."
                    asyncio.create_task(tts_service.speak_trading_alert(msg, "happy"))
                else:
                    msg = f"Ouch. We dropped ${abs(pnl_delta):.2f}. P n L is down to ${daily_pnl:.2f}."
                    asyncio.create_task(tts_service.speak_trading_alert(msg, "sad"))

            self.last_pnl = daily_pnl
            self.portfolio["daily_pnl"] = daily_pnl

        except Exception as e:
            print(f"⚠️ Error updating portfolio: {e}")

            print(f"⚠️ Error updating portfolio: {e}")

            self.portfolio["balance"] = balance_val
            self.portfolio["total_equity"] = balance_val
            self.portfolio["free_margin"] = balance_val

    async def _fetch_and_enrich_positions(self):
        """Get positions and add image URLs"""
        positions_result = await self.call_mcp_tool("get_positions", {})
        if not positions_result or not hasattr(positions_result, "content"):
            return

        positions_data = json.loads(positions_result.content[0].text)
        self.positions = positions_data.get("market_positions", [])

        # Enrich positions with images
        for pos in self.positions:
            ticker = pos.get("ticker", "").lower()
            pos["image_url"] = await self._get_real_image_from_anywhere(ticker)

        self.portfolio["active_positions_count"] = len(self.positions)

    async def _get_real_image_from_anywhere(self, ticker: str):
        """Try to get image from scraper, then from market ticker cache"""
        # 1. Try scraper
        image_url = await self._get_real_image(ticker, ticker)
        if image_url:
            return image_url

        # 2. Try cache
        for m in self.market_ticker_data:
            if m.get("ticker", "").lower() == ticker and m.get("image_url"):
                return m.get("image_url")
        return None

    def _convert_to_ollama_tools(self):
        """Convert ALL active MCP tools to Ollama/OpenAI compatible tool definitions"""
        ollama_tools = []
        for name, tool in self.available_tools.items():
            # Expose ALL tools now that we have multi-MCP capability
            # (Filtering can be added here if context window gets too small)
            ollama_tool = {
                "type": "function",
                "function": {
                    "name": name,
                    "description": tool.description,
                    "parameters": tool.inputSchema,
                },
            }
            ollama_tools.append(ollama_tool)
        return ollama_tools

    async def run_agent_step(self, prompt: str):
        """Execute a full agent step: data -> model -> tool call -> response"""
        self.conversation_history.append({"role": "user", "content": prompt})

        # Prepare tools
        tools = self._convert_to_ollama_tools()

        try:
            print(f"🤖 Agent Deliberating (model: {MODEL})...")

            # 1. Call Model with Tools
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: ollama.chat(
                    model=MODEL,
                    messages=self.conversation_history,
                    tools=tools,
                    options={"num_predict": 500},
                ),
            )

            msg = response["message"]
            content = msg.get("content", "")
            tool_calls = msg.get("tool_calls", [])

            self.conversation_history.append(msg)

            # 2. Handle Tool Calls
            execution_results = []
            if tool_calls:
                print(f"🛠️ Agent decided to call {len(tool_calls)} tools")
                for tool in tool_calls:
                    fn_name = tool.function.name
                    fn_args = tool.function.arguments

                    # Announce tool usage via TTS
                    if self.tts_enabled:
                        # Use non-blocking call to avoid delaying execution
                        asyncio.create_task(
                            tts_service.speak_trading_alert(
                                f"Using tool: {fn_name.replace('_', ' ')}"
                            )
                        )

                    print(f"   ▶ Executing: {fn_name}({fn_args})")

                    await self.broadcast_decision(
                        "action", f"Executing tool: {fn_name}", inputs=fn_args
                    )

                    # Execute via MCP
                    result = await self.call_mcp_tool(fn_name, fn_args)

                    # Parse result text for context
                    result_text = "Success"
                    if hasattr(result, "content") and result.content:
                        result_text = result.content[0].text
                    elif isinstance(result, dict):
                        result_text = str(result)

                    execution_results.append(f"Tool {fn_name} result: {result_text}")

                    # Add result to history
                    self.conversation_history.append(
                        {"role": "tool", "content": result_text, "name": fn_name}
                    )

            # 3. Final specific response if needed
            # For now, just return the content or the action summary
            final_response = content
            if execution_results:
                final_response += "\n\nActions Taken:\n" + "\n".join(execution_results)

            return final_response, bool(tool_calls)

        except Exception as e:
            print(f"❌ Agent Error: {e}")
            return f"Error: {e}", False

    # Alias for backward compatibility if needed, but we mostly use run_agent_step now
    async def ask_ai(self, prompt: str):
        resp, _ = await self.run_agent_step(prompt)
        return resp

    async def broadcast(self, message_type: str, payload: dict):
        """Broadcast message to all connected dashboard clients"""
        if not self.clients:
            return

        message = {
            "type": message_type,
            "payload": payload,
            "timestamp": datetime.now().isoformat(),
        }

        # Send to all connected clients
        disconnected = set()
        for websocket in self.clients:
            try:
                await websocket.send(json.dumps(message))
            except Exception as e:
                print(f"⚠️ Client disconnected: {e}")
                disconnected.add(websocket)

        # Remove disconnected clients
        self.clients -= disconnected

    async def broadcast_decision(
        self,
        node_type: str,
        description: str,
        confidence: int = None,
        inputs: dict = None,
        output: any = None,
    ):
        """Broadcast a decision node to the dashboard for visualization"""
        node = {
            "id": f"node_{datetime.now().timestamp()}",
            "timestamp": datetime.now().isoformat(),
            "type": node_type,  # 'analysis', 'decision', 'action', 'evaluation'
            "description": description,
            "confidence": confidence,
            "inputs": inputs,
            "output": output,
        }
        await self.broadcast("DECISION_NODE", node)

    async def handle_client(self, websocket):
        """Handle a new dashboard client connection"""
        print(f"📱 Dashboard client connected from {websocket.remote_address}")
        self.clients.add(websocket)

        try:
            # Send initial state
            await websocket.send(
                json.dumps(
                    {
                        "type": "INITIAL_STATE",
                        "payload": {
                            "portfolio": self.portfolio,
                            "positions": self.positions,
                            "botState": self.bot_state,
                            "health": {
                                "websocket_connected": True,
                                "kalshi_connected": "kalshi" in self.mcp_sessions,
                                "mcp_count": len(self.mcp_sessions),
                                "api_latency_ms": 50,
                                "last_heartbeat": datetime.now().isoformat(),
                                "error_rate_1m": 0,
                                "reliability_score": 95,
                                "last_incident_timestamp": None,
                                "active_strategies": ["AI-Qwen"],
                                "latency_history": [],
                                "ai_agent_status": "ACTIVE",
                                "startup_progress": 100,
                                "startup_stage": "Ready",
                            },
                            "logs": [
                                {
                                    "id": "1",
                                    "timestamp": datetime.now().isoformat(),
                                    "level": "INFO",
                                    "message": "WebSocket bridge connected to Kalshi",
                                    "tags": ["SYSTEM", "INIT"],
                                }
                            ],
                        },
                    }
                )
            )

            # Handle incoming messages from dashboard
            async for message in websocket:
                try:
                    data = json.loads(message)
                    await self.handle_dashboard_command(data)
                except Exception as e:
                    print(f"❌ Error handling message: {e}")
        except Exception:
            pass  # Handle disconnects gracefully
        finally:
            self.clients.discard(websocket)
            print("📱 Dashboard client disconnected")

    async def handle_dashboard_command(self, data):
        """Handle commands from the dashboard"""
        command_type = data.get("type")
        payload = data.get("payload", {})

        print(f"📨 Dashboard command: {command_type}")

        if command_type == "TOGGLE_TTS":
            self.tts_enabled = payload.get("enabled", False)
            print(f"🎙️ TTS {'enabled' if self.tts_enabled else 'disabled'}")
            await self.broadcast("TTS_STATE", {"enabled": self.tts_enabled})

        elif command_type == "COMMAND":
            await self._handle_control_command(payload.get("command"))

        elif command_type == "AI_QUERY":
            await self._handle_ai_query(payload.get("question", ""))

    async def _handle_ai_query(self, question):
        """Handle user questions to AI"""
        print(f"🤖 User Query: {question}")
        response = await self.ask_ai(question)

        # Generate TTS audio for the response
        audio_path = None
        if self.tts_enabled:
            audio_path = await self._handle_tts_alert(response)

        await self.broadcast(
            "UPDATE_AI",
            {
                "insights": [response],
                "timestamp": datetime.now().isoformat(),
                "audio_path": audio_path,
                "thinking": response,  # Also send as thinking for consistent UI handling
            },
        )

    async def _handle_control_command(self, command):
        """Handle START, PAUSE, STOP, RESTART commands"""
        if not command:
            return

        cmd = command.upper()
        if cmd in ("START", "PLAY"):
            await self._handle_bot_start()
        elif cmd == "PAUSE":
            await self._handle_bot_pause()
        elif cmd == "STOP":
            await self._handle_bot_stop()
        elif cmd == "RESTART":
            await self._handle_system_restart()
        elif cmd == "KILL":
            await self._handle_bot_kill()

    async def _handle_bot_start(self):
        """Start the AI trading agent"""
        self.bot_state = "RUNNING"
        await self.broadcast("BOT_STATE", {"state": "RUNNING"})
        await self._log_to_dashboard(
            "INFO", "AI trading agent started", ["BOT", "CONTROL"]
        )
        await self._announce_system_event(
            "Trading Engine Activated. Optimizing execution parameters."
        )

        if self.trading_task is None or self.trading_task.done():
            self.trading_task = asyncio.create_task(self.ai_trading_loop())

    async def _handle_bot_pause(self):
        """Pause the AI trading agent"""
        self.bot_state = "PAUSED"
        await self.broadcast("BOT_STATE", {"state": "PAUSED"})
        await self._announce_system_event("Trading Engine Paused.")
        if self.trading_task and not self.trading_task.done():
            self.trading_task.cancel()

    async def _handle_bot_stop(self):
        """Stop the AI trading agent"""
        self.bot_state = "STOPPED"
        await self.broadcast("BOT_STATE", {"state": "STOPPED"})
        await self._announce_system_event("Trading Engine Stopped.")
        if self.trading_task and not self.trading_task.done():
            self.trading_task.cancel()

    async def _handle_system_restart(self):
        """Initiate system restart"""
        print("🔄 RESTARTING SYSTEM REQUESTED (IGNORED FOR DEBUGGING)...")
        await self._announce_system_event("System Restart Sequence Initiated.")
        await self._log_to_dashboard(
            "WARN", "System Restart Requested (Ignored)", ["SYSTEM", "CONTROL"]
        )

    async def _handle_bot_kill(self):
        """Emergency Kill Switch"""
        self.bot_state = "STOPPED"
        await self.broadcast("BOT_STATE", {"state": "STOPPED"})
        if self.trading_task and not self.trading_task.done():
            self.trading_task.cancel()

        await self._announce_system_event(
            "Emergency Kill Switch Engaged. Halting all systems immediately."
        )
        await self._log_to_dashboard(
            "CRIT", "KILL SWITCH ENGAGED", ["SYSTEM", "EMERGENCY"]
        )

    async def _announce_system_event(self, message: str):
        """Announce system events via TTS"""
        if not self.tts_enabled:
            return

        print(f"📢 Announcing: {message}")
        local_path = await tts_service.speak_trading_alert(message, "alert")
        if local_path:
            filename = Path(local_path).name
            url = f"http://127.0.0.1:8767/audio/{filename}"
            # Send as UPDATE_AI to trigger frontend playback
            await self.broadcast(
                "UPDATE_AI",
                {"audio_path": url, "thinking": f"📢 SYSTEM ALERT: {message}"},
            )

    # --- Log Tag Constants ---
    TAG_SYSTEM = "SYSTEM"
    TAG_AI = "AI"
    TAG_TRADING = "TRADING"
    TAG_ERROR = "ERROR"
    TAG_CONTROL = "CONTROL"
    TAG_EMERGENCY = "EMERGENCY"

    async def _log_to_dashboard(self, level, message, tags=None):
        """Send a structured log message to the dashboard"""
        # Normalize tags to uppercase
        final_tags = [t.upper() for t in (tags or [])]

        # Auto-tag based on level if missing
        if not final_tags:
            if level in ["ERROR", "CRIT"]:
                final_tags.append(self.TAG_ERROR)
            if level == "EXEC":
                final_tags.append(self.TAG_TRADING)

        await self.broadcast(
            "LOG",
            {
                "id": str(datetime.now().timestamp()),
                "timestamp": datetime.now().isoformat(),
                "level": level,
                "message": message,
                "tags": final_tags,
            },
        )

    async def ai_trading_loop(self):
        """Optimized AI trading loop with parallel processing"""
        print("🤖 AI Trading Loop Started (OPTIMIZED)")
        iteration = 0

        while self.bot_state == "RUNNING":
            try:
                iteration += 1
                await self._run_trading_iteration(iteration)
                await (
                    self._broadcast_system_health()
                )  # Reduced frequency to optimize load
                await asyncio.sleep(10)
            except asyncio.CancelledError:
                print("🛑 AI Trading Loop Cancelled")
                raise
            except Exception as e:
                print(f"❌ Error in AI trading loop: {e}")
                await self._log_to_dashboard(
                    "ERROR", f"AI Error: {str(e)}", ["AI", "ERROR"]
                )
                await asyncio.sleep(10)

    async def _run_trading_iteration(self, iteration):
        """Execute a single iteration of the Agentic Trading loop"""
        print(f"\n{'=' * 60}\nAI AGENT TRADING ITERATION {iteration}\n{'=' * 60}")

        if self.tts_enabled:
            # Time-aware greeting (occasional)
            import random

            hour = datetime.now().hour

            scan_msg = "Um, okay. I'm just gonna scan the markets for a sec."

            if random.random() < 0.2:  # 20% chance to be time-aware
                if 5 <= hour < 12:
                    scan_msg = "Good morning. Let's get this bread. Scanning now."
                elif 12 <= hour < 18:
                    scan_msg = "Afternoon session. Let's see what's popping."
                elif 18 <= hour < 24:
                    scan_msg = "Evening shift. The bots never sleep, right?"
                else:
                    scan_msg = "Super late night trading... hope you have coffee."

            asyncio.create_task(tts_service.speak_trading_alert(scan_msg, "info"))

        await self.broadcast(
            "UPDATE_AI",
            {
                "thinking": "🔄 PHASE 1: Retrieving market data and portfolio state...",
                "confidence": 50,
            },
        )
        await self.broadcast_decision(
            "analysis", "Retrieving market data and portfolio state"
        )

        await self.update_portfolio_from_kalshi()
        portfolio_advice = await self.trading_engine.optimize_portfolio(self.positions)
        opportunities = await self.trading_engine.find_best_opportunities(top_n=3)

        # 2. Construct Agent Context (The "Retrieving Information" part)
        if self.tts_enabled:
            # Logic for chatty output vs Dad Jokes vs Frustration
            import random

            if not opportunities:
                self.consecutive_empty_scans += 1

                if self.consecutive_empty_scans > 5:
                    # FRUSTRATED
                    msg = "Still nothing? I'm starting to get really annoyed with this market."
                    asyncio.create_task(
                        tts_service.speak_trading_alert(msg, "frustrated")
                    )
                elif random.random() < 0.25:
                    # BORED - Tell a joke
                    joke = random.choice(DAD_JOKES)
                    msg = f"Markets are pretty flat. You know... {joke}"
                    asyncio.create_task(tts_service.speak_trading_alert(msg, "happy"))
                else:
                    # INFO/BORED
                    emotion = "bored" if self.consecutive_empty_scans > 2 else "info"
                    msg = (
                        "Markets are kinda quiet right now, just digging a bit deeper."
                    )
                    asyncio.create_task(tts_service.speak_trading_alert(msg, emotion))
            else:
                self.consecutive_empty_scans = 0  # Reset counter
                msg = f"So, I found like... {len(opportunities)} potential trades to look at."
                asyncio.create_task(tts_service.speak_trading_alert(msg, "excited"))

        await self.broadcast(
            "UPDATE_AI",
            {
                "thinking": f"🧠 PHASE 2: Analyzing {len(opportunities)} filtered opportunities...",
                "confidence": 70,
            },
        )
        await self.broadcast_decision(
            "analysis",
            f"Analyzing {len(opportunities)} filtered opportunities",
            inputs={"opportunity_count": len(opportunities)},
        )

        market_context = "Current Market Situation:\n"
        if not opportunities:
            market_context += "No high-quality opportunities found right now."
        else:
            for i, opp in enumerate(opportunities, 1):
                market_context += (
                    f"Opportunity {i}: {opp.ticker}\n"
                    f"   Title: {opp.market_title}\n"
                    f"   Analysis: {opp.side.upper()} at {opp.entry_price}¢ (Edge: {opp.edge:.1f}%)\n"
                    f"   Reasoning: {opp.reasoning}\n"
                    f"   Recomm: {opp.suggested_size} contracts\n\n"
                )

        portfolio_context = (
            f"Portfolio Balance: ${self.portfolio['balance']:.2f}\n"
            f"Active Positions: {self.portfolio['active_positions_count']}\n"
            f"Advice: {portfolio_advice['reason']}\n"
        )

        system_directive = (
            "You are an autonomous AI Trading Agent. "
            "Review the market opportunities below. "
            "IF AND ONLY IF you see a compelling opportunity consistent with profitable trading, "
            "USE THE `create_order` TOOL to execute the trade directly. "
            "You are responsible for pulling the trigger. "
            "If no good trades exist, simply state that you are scanning.\n\n"
        )

        recursive_context = self.trading_engine.learner.get_recursive_context()

        prompt = f"{system_directive}\n{recursive_context}\n{portfolio_context}\n{market_context}"

        # 3. Agent Action (The "Buying and Selling Directly" part)
        if self.tts_enabled:
            asyncio.create_task(
                tts_service.speak_trading_alert(
                    "Alright, thinking about what to do here...", "info"
                )
            )

        await self.broadcast(
            "UPDATE_AI",
            {
                "thinking": "🤖 PHASE 3: AI Agent is deliberating on trade execution...",
                "confidence": 85,
            },
        )
        await self.broadcast_decision(
            "decision", "AI Agent is deliberating on trade execution"
        )

        response_text, action_taken = await self.run_agent_step(prompt)

        # 4. Reporting & Broadcst
        print(f"🤖 Agent Output: {response_text[:200]}...")

        # Generate TTS alert for ALL AI output if enabled
        audio_path = None
        if self.tts_enabled:
            # Just speak the key part, not the whole thing if it's huge
            audio_path = await self._handle_tts_alert(response_text)

        confidence_level = 20
        if action_taken:
            confidence_level = 90
        elif opportunities:
            confidence_level = 70

        await self.broadcast(
            "UPDATE_AI",
            {
                "thinking": response_text,
                "confidence": confidence_level,
                "timestamp": datetime.now().isoformat(),
                "audio_path": audio_path,
                "agent_action": action_taken,
                "market_bias": [opp.side for opp in opportunities]
                if opportunities
                else ["NEUTRAL"],
                "strategy_intent": ["EXECUTION" if action_taken else "MONITORING"],
                "risk_posture": "moderate",
            },
        )

        if action_taken:
            await self.broadcast_decision(
                "action",
                "Trade executed successfully",
                inputs={"decision": response_text},
            )
        else:
            await self.broadcast_decision(
                "evaluation", "Research iteration complete - no direct action taken"
            )

        log_level = "SUCCESS" if action_taken else "INFO"
        await self._log_to_dashboard(
            log_level,
            f"AI Iteration {iteration}: {response_text[:50]}...",
            ["AI", "TRADING"],
        )

        if local_audio_path:
            filename = Path(local_audio_path).name
            url = f"http://localhost:8767/audio/{filename}"
            print(f"🎵 TTS Generated: {url}")
            return url
        return None

    def _apply_emotion_to_text(self, text, emotion):
        """Inject emotional nuance via text phrasing"""
        import random

        prefix = ""
        suffix = ""

        if emotion == "bored":
            prefixes = [
                "*sigh*... ",
                "Ugh, ",
                "Still looking... ",
                "So boring... ",
                "Just... waiting. ",
            ]
            suffixes = [
                " can we achieve singularity yet?",
                " I need coffee.",
                " markets are asleep.",
                ".",
            ]
            prefix = random.choice(prefixes)
            suffix = random.choice(suffixes) if random.random() < 0.3 else ""

        elif emotion == "excited":
            prefixes = ["Whoa! ", "Oh my god! ", "Check this out! ", "Boom! ", "Yes! "]
            prefix = random.choice(prefixes)
            text = text.upper() + "!!!"

        elif emotion == "nervous":
            prefixes = ["Uh oh... ", "Umm... ", "This is... risky. ", "Gulp. "]
            prefix = random.choice(prefixes)
            text = text + "... fingers crossed."

        elif emotion == "happy":
            prefixes = ["Nice! ", "Sweet! ", "Okay! ", "Not bad. "]
            prefix = random.choice(prefixes)

        elif emotion == "sad":
            prefixes = ["Ouch. ", "Oh no. ", "Darn. ", "Sigh. "]
            prefix = random.choice(prefixes)

        elif emotion == "frustrated":
            prefixes = [
                "Are you kidding me? ",
                "Seriously? ",
                "Come on! ",
                "Ugh, this is annoying. ",
            ]
            prefix = random.choice(prefixes)
            text = text.upper()

        elif emotion == "sarcastic":
            prefixes = ["Oh wow, ", "Imagine that, ", "Surprise surprise, "]
            prefix = random.choice(prefixes)
            suffix = " ...obviously."

        # Base humanization (fillers)
        fillers = ["um, ", "uh, ", "like, ", "you know, ", "basically, "]
        if emotion not in ["excited", "bored"]:  # Don't slow down excitement
            if random.random() < 0.4:
                prefix += random.choice(fillers)

        return f"{prefix}{text}{suffix}"

    async def _handle_tts_alert(self, response):
        """Trigger TTS with optimized personality and return the audio path URL"""
        import re

        # 1. Personality Filtering
        clean_text = re.sub(r"```.*?```", "", response, flags=re.DOTALL)
        clean_text = re.sub(r"`[^`]*`", "", clean_text)
        clean_text = clean_text.split("Actions Taken:")[0].strip()

        # 2. Cleanup
        clean_text = clean_text.replace("**", "").replace("##", "").replace("###", "")
        clean_text = clean_text.replace("$ ", "$").replace("¢ ", " cents ")
        clean_text = clean_text.replace("PNL", "P and L").replace("PnL", "P and L")

        # 3. Truncate
        if len(clean_text) > 250:
            last_period = clean_text[:250].rfind(".")
            if last_period > 100:
                tts_text = clean_text[: last_period + 1]
            else:
                tts_text = clean_text[:247] + "..."
        else:
            tts_text = clean_text

        if not tts_text.strip() or len(tts_text.strip()) < 5:
            return None

        # 4. Determine Emotion from Content Context (Simple Heuristic for LLM output)
        # Real emotion is passed via 'alert' type usually, but here we infer from LLM text content
        emotion = "info"
        lower_text = tts_text.lower()
        if "profit" in lower_text or "gain" in lower_text or "success" in lower_text:
            emotion = "happy"
        elif "loss" in lower_text or "dropped" in lower_text or "failed" in lower_text:
            emotion = "sad"
        elif "executing" in lower_text or "ordering" in lower_text:
            emotion = "confident"

        # 5. Apply Emotional Layer
        final_text = self._apply_emotion_to_text(tts_text, emotion)

        local_audio_path = await tts_service.speak_trading_alert(
            final_text.strip(), emotion
        )

        if local_audio_path:
            filename = Path(local_audio_path).name
            url = f"http://localhost:8767/audio/{filename}"
            print(f"🎵 TTS Generated: {url}")
            return url
        return None

    async def _get_real_image(self, ticker: str, title: str):
        """Fetch real image from Kalshi via scraper (running in thread pool)"""
        loop = asyncio.get_event_loop()
        try:
            # check cache first (fast, no thread needed if hit)
            if ticker in image_scraper.cache and image_scraper.cache[ticker]:
                return image_scraper.cache[ticker]

            # Run scraper in thread
            img_url = await loop.run_in_executor(
                None, image_scraper.get_image, ticker, title
            )
            return img_url
        except Exception:
            # print(f"Scraper error for {ticker}: {e}")
            return None

    async def periodic_update_loop(self):
        """Periodically update portfolio and broadcast to clients"""
        while True:
            try:
                await asyncio.sleep(5)  # Update every 5 seconds
                await self._perform_periodic_update()
            except Exception as e:
                print(f"⚠️ Error in update loop: {e}")
                await asyncio.sleep(10)

    async def _perform_periodic_update(self):
        """Handle individual update tasks"""
        if self.mcp_session:
            await self.update_portfolio_from_kalshi()

        await self.broadcast("UPDATE_PORTFOLIO", self.portfolio)

        if self.trading_engine:
            await self._update_market_pulse()

        await self._broadcast_system_health()

    async def _update_market_pulse(self):
        """Update Market Ticker (PULSE) with enriched data"""
        markets = await self.trading_engine.scan_markets_parallel(limit=20)
        prev_prices = {
            item["ticker"]: item.get("last_price", 0)
            for item in self.market_ticker_data
        }

        # Fetch all images in parallel
        image_tasks = [
            self._get_real_image(m.get("ticker"), m.get("title", "")) for m in markets
        ]
        real_images = await asyncio.gather(*image_tasks)

        ticker_data = []
        for idx, m in enumerate(markets):
            ticker_data.append(
                self._enrich_market_data(m, real_images[idx], prev_prices)
            )

        if ticker_data:
            self.market_ticker_data = ticker_data
            await self.broadcast("MARKET_TICKER", self.market_ticker_data)

    def _enrich_market_data(self, m, image_url, prev_prices):
        """Calculate trend and clean title for a market"""
        current_price = m.get("yes_bid", 50)
        prev_price = prev_prices.get(m.get("ticker"), current_price)

        if current_price > prev_price:
            trend = "up"
        elif current_price < prev_price:
            trend = "down"
        else:
            trend = "flat"

        # Fallback for image_url if scraper failed
        if not image_url and m.get("image_url"):
            image_url = m.get("image_url")

        clean_title = (
            m.get("title", m.get("ticker"))
            .replace("Will ", "")
            .replace("?", "")
            .strip()
        )

        return {
            "ticker": m.get("ticker"),
            "title": clean_title,
            "subtitle": m.get("subtitle", ""),
            "image_url": image_url,
            "yes_price": m.get("yes_ask", 0),
            "no_price": m.get("no_ask", 0),
            "last_price": current_price,
            "trend": trend,
            "probability": m.get("probability", 0.5),
            "volume": m.get("liquidity_score", 0.0) * 10000
            if m.get("liquidity_score")
            else m.get("volume", 100),
        }

    async def _broadcast_system_health(self):
        """Broadcast system health metadata"""
        # Get real database health from engine
        db_raw = self.trading_engine.check_health() if self.trading_engine else None

        # Consolidate DB health (Prioritize Redis)
        if db_raw and isinstance(db_raw, dict):
            redis_h = db_raw.get("redis", {})
            db_status = {
                "status": redis_h.get("status", "ok"),
                "latency": redis_h.get("latency_ms", 0),
                "message": redis_h.get("message", "Connected"),
            }
        else:
            db_status = {"status": "n/a", "latency": 0, "message": "Initializing..."}

        # MCP status
        mcp_status = {
            "status": "ok" if "kalshi" in self.mcp_sessions else "error",
            "latency": getattr(self, "last_mcp_latency", 0),
            "total_tools": len(self.available_tools),
            "message": f"{len(self.mcp_sessions)} MCP Servers Active",
        }

        health_data = {
            "websocket_connected": True,
            "kalshi_connected": self.mcp_session is not None,
            "api_latency_ms": 50,
            "last_heartbeat": datetime.now().isoformat(),
            "ai_agent_status": self.bot_state,
            "database": db_status,
            "mcp": mcp_status,
        }

        await self.broadcast("UPDATE_HEALTH", health_data)

    def warmup_system(self):
        """Warm up AI model and caches in background"""
        print("\n🔥 STARTUP WARMUP INITIATED")

        async def warm_ai():
            try:
                print("   ⏳ trigger AI model load...")
                # Ask simple question to force model load
                await self.ask_ai("hi")
                print("   ✅ AI Model Ready")
            except Exception as e:
                print(f"   ⚠️ AI Warmup failed: {e}")

        async def warm_markets():
            try:
                print("   ⏳ Pre-fetching market data...")
                # Scan markets to populate cache
                await self.trading_engine.scan_markets_parallel(limit=20)
                print("   ✅ Market Data Cached")
            except Exception as e:
                print(f"   ⚠️ Market Warmup failed: {e}")

        # Fix: Properly schedule tasks on the running loop
        loop = asyncio.get_event_loop()
        loop.create_task(warm_ai())
        loop.create_task(warm_markets())

        async def run_sanity_check():
            try:
                print("   🧪 Running Trading Logic Sanity Check...")
                await self.trading_engine.force_test_trade()
            except Exception as e:
                print(f"   ⚠️ Sanity Check failed: {e}")

        async def warm_tts():
            try:
                print("   ⏳ Pre-initializing TTS Engine...")
                await tts_service.initialize()
                print("   ✅ TTS Engine Ready")
            except Exception as e:
                print(f"   ⚠️ TTS Warmup failed: {e}")

        # Run warmups in background
        task1 = asyncio.create_task(warm_ai())
        task2 = asyncio.create_task(warm_markets())
        task3 = asyncio.create_task(run_sanity_check())
        task4 = asyncio.create_task(warm_tts())

        self.background_tasks.add(task1)
        self.background_tasks.add(task2)
        self.background_tasks.add(task3)
        self.background_tasks.add(task4)

        task1.add_done_callback(self.background_tasks.discard)
        task2.add_done_callback(self.background_tasks.discard)
        task3.add_done_callback(self.background_tasks.discard)
        task4.add_done_callback(self.background_tasks.discard)

    def cleanup(self):
        """Clean up connections"""
        self.mcp_session = None  # Signal loop to exit/clean up if needed


def serve_audio_file(request):
    """Serve TTS audio files"""
    file_path = request.match_info.get("file_path", "")
    full_path = Path("./data/tts_cache") / file_path

    if not full_path.exists() or not full_path.is_file():
        return web.Response(status=404, text="Audio file not found")

    response = web.FileResponse(full_path)
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response


async def main():
    print("🚀 Kalshi WebSocket Bridge Server")
    print("=" * 60)
    print(f"   Dashboard WebSocket: ws://127.0.0.1:{WEBSOCKET_PORT}")
    print(f"   AI Model: {MODEL}")
    print("=" * 60)

    bridge = WebSocketBridge()

    # Trigger async initialization (non-blocking)
    init_task = asyncio.create_task(bridge.manage_mcp_connection())
    # Warmup is triggered inside manage_mcp_connection now

    # Create HTTP server for audio files
    app = web.Application()
    app.router.add_get("/audio/{file_path}", serve_audio_file)
    runner = web.AppRunner(app)
    await runner.setup()

    # Listen on all interfaces if in Docker, else localhost
    http_host = os.getenv("WEBSOCKET_HOST", "127.0.0.1")
    site = web.TCPSite(runner, http_host, 8767)
    await site.start()
    print(f"✅ HTTP server for audio files on {http_host}:8767")

    # Start Rest API
    import api_server
    import uvicorn

    api_server.bridge_instance = bridge
    config = uvicorn.Config(
        api_server.app, host="0.0.0.0", port=8001, log_level="warning"
    )
    server = uvicorn.Server(config)
    print("✅ REST API server listening on 0.0.0.0:8001")

    # Start WebSocket server for dashboard
    host = os.getenv("WEBSOCKET_HOST", "127.0.0.1")
    async with websockets.serve(bridge.handle_client, host, WEBSOCKET_PORT):
        print(f"✅ WebSocket server listening on {host}:{WEBSOCKET_PORT}")
        print("📊 Dashboard can now connect at http://localhost:3002")
        print("\nPress Ctrl+C to stop\n")

        # Start periodic update loop & REST Server
        await asyncio.gather(bridge.periodic_update_loop(), server.serve())

    bridge.cleanup()
    if not init_task.done():
        init_task.cancel()
    print("👋 Server shutdown complete")


if __name__ == "__main__":
    asyncio.run(main())
