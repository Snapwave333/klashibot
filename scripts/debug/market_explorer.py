import asyncio
import json
import os
import sys
from pathlib import Path
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def explore():
    print("[EXPLORER] Exploring Kalshi Markets for Liquidity...")
    
    mcp_path = Path(os.getcwd()) / "mcp-server-kalshi" / "src" / "mcp_server_kalshi" / "server.py"
    if not mcp_path.exists():
        # Try another common path
        mcp_path = Path(os.getcwd()) / "mcp-server-kalshi" / "src" / "mcp_server_kalshi" / "server.py"

    server_params = StdioServerParameters(
        command="python",
        args=[str(mcp_path)],
        env=os.environ.copy()
    )

    try:
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                print("[SUCCESS] Connected to Kalshi MCP")
                
                # 1. Scan many markets
                all_markets = []
                for cursor in range(0, 200, 50):
                     print(f"   Fetching markets {cursor} to {cursor+50}...")
                     results = await session.call_tool("get_markets", {"limit": 50, "cursor": str(cursor), "status": "active"})
                     if results and hasattr(results, 'content'):
                         data = json.loads(results.content[0].text)
                         all_markets.extend(data.get("markets", []))
                
                print(f"📊 Total markets scanned: {len(all_markets)}")
                
                # 2. Filter for liquid ones
                liquid = [m for m in all_markets if m.get("volume", 0) > 0 or m.get("open_interest", 0) > 0]
                liquid.sort(key=lambda x: x.get("volume", 0) + x.get("open_interest", 0), reverse=True)
                
                print(f"💧 Found {len(liquid)} markets with volume/OI")
                for m in liquid[:20]:
                    print(f"   - {m['ticker']} | Vol: {m.get('volume')} | OI: {m.get('open_interest')} | Title: {m.get('title')}")
                    
                if not liquid:
                    print("⚠️ No liquid markets found in the first 200.")
                    
    except Exception as e:
        print(f"❌ Explorer Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(explore())
