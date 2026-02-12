
import asyncio
import os
import sys
import json
from pathlib import Path
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# Force unbuffered output
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

# Setup paths (assuming running in /app or project root)
BASE_DIR = Path(__file__).parent.absolute()
MCP_SERVER_PATH = BASE_DIR / "mcp-server-kalshi"
SRC_PATH = MCP_SERVER_PATH / "src"
CONFIG_PATH = BASE_DIR / "config"

def setup_env():
    # Load .env manually if needed, or rely on existing env
    env = os.environ.copy()
    
    # Critical paths
    env["PYTHONPATH"] = str(SRC_PATH) + os.pathsep + env.get("PYTHONPATH", "")
    
    # Check credentials
    api_key = env.get("KALSHI_API_KEY")
    if not api_key:
        print("❌ CRITICAL: KALSHI_API_KEY is not set!")
    
    private_key_path = env.get("KALSHI_PRIVATE_KEY_PATH", str(CONFIG_PATH / "kalshi_private.pem"))
    if not os.path.exists(private_key_path):
        print(f"❌ CRITICAL: Private key not found at {private_key_path}")
    else:
        print(f"✅ Found private key at {private_key_path}")
        env["KALSHI_PRIVATE_KEY_PATH"] = private_key_path

    env["PAPER_TRADING"] = "true"
    env["PAPER_BALANCE"] = "10000"
    
    return env

async def main():
    print("🚀 Starting MCP Isolation Debugger")
    
    server_params = StdioServerParameters(
        command="python",
        args=["-m", "mcp_server_kalshi.server"],
        env=setup_env()
    )
    
    print(f"🔧 Launching server: {server_params.command} {' '.join(server_params.args)}")
    
    try:
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                print("✅ Session Initialized")
                
                print("🔄 Initializing...")
                await session.initialize()
                
                print("🔍 Listing Tools...")
                tools = await session.list_tools()
                print(f"✅ Found {len(tools.tools)} tools: {[t.name for t in tools.tools]}")
                
                # Try get_balance
                print("\n🧪 Testing get_balance...")
                try:
                    result = await session.call_tool("get_balance", {})
                    print(f"✅ Result: {result}")
                except Exception as e:
                    print(f"❌ call_tool failed: {e}")
                    
    except Exception as e:
        print(f"❌ Connection/Setup Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
