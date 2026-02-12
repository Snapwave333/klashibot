
import asyncio
import os
import sys
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def run():
    try:
        print("Starting manual verification...")
        server_params = StdioServerParameters(
            command='python', 
            args=['/app/mcp-server-kalshi/src/mcp_server_kalshi/server.py'], 
            env={
                **os.environ, 
                'KALSHI_API_KEY': os.environ.get('KALSHI_API_KEY', ''), 
                'KALSHI_PRIVATE_KEY_PATH': '/app/config/kalshi_private.pem'
            }
        )
        
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                await session.initialize()
                
                ticker = 'KXMVESPORTSMULTIGAMEEXTENDED-S20256410C6CBA11-E86A389E584'
                print(f"Fetching market: {ticker}")
                
                try:
                    market = await session.call_tool('get_market', {'ticker': ticker})
                    print("✅ Market Data:")
                    print(market.content[0].text[:500])
                except Exception as e:
                    print(f"❌ Market Fetch Error: {e}")

                try:
                    orderbook = await session.call_tool('get_orderbook', {'ticker': ticker})
                    print("✅ Orderbook Data:")
                    print(orderbook.content[0].text[:500])
                except Exception as e:
                    print(f"❌ Orderbook Fetch Error: {e}")

    except Exception as e:
        print(f"Script Error: {e}")

if __name__ == "__main__":
    asyncio.run(run())
