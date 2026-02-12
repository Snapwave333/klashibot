import asyncio
import os
import json
import sys
from pathlib import Path
from dotenv import load_dotenv

# Fix encoding for Windows
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
    sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())

# Add the mcp-server-kalshi src directory to PYTHONPATH
mcp_src = str(Path(__file__).parent / "mcp-server-kalshi" / "src")
sys.path.append(mcp_src)

from mcp_server_kalshi.kalshi_client import KalshiAPIClient

async def debug_status():
    load_dotenv()
    
    base_url = os.getenv("BASE_URL", "https://demo-api.kalshi.co")
    private_key_path = os.getenv("KALSHI_PRIVATE_KEY_PATH", "./config/kalshi_private.pem")
    api_key = os.getenv("KALSHI_API_KEY")
    
    async with KalshiAPIClient(
        base_url=base_url,
        private_key_path=private_key_path,
        api_key=api_key
    ) as client:
        print(f"FETCH: Testing status=active filter...")
        try:
            markets_res = await client.get("/trade-api/v2/markets", {"limit": 1, "status": "open"})
            markets = markets_res.get("markets", [])
            if markets:
                print(f"SUCCESS: Found market. Full structure:")
                print(json.dumps(markets[0], indent=2))
                
                ticker = markets[0].get("ticker")
                print(f"\nFETCH: Testing get_market for {ticker}...")
                market_res = await client.get(f"/trade-api/v2/markets/{ticker}")
                print(f"SUCCESS: get_market response structure keys: {list(market_res.keys())}")
                
                print(f"\nFETCH: Testing get_orderbook for {ticker}...")
                orderbook_res = await client.get(f"/trade-api/v2/markets/{ticker}/orderbook")
                print(f"SUCCESS: get_orderbook response structure keys: {list(orderbook_res.keys())}")
                if "orderbook" in orderbook_res:
                    print(f"Sample orderbook yes bids: {orderbook_res['orderbook'].get('yes', {}).get('bids', [])[:1]}")
            else:
                print("ERROR: No open markets found.")
        except Exception as e:
            print(f"ERROR: Failed to fetch market info: {e}")

        print("\nFETCH: Testing status=open filter...")
        try:
            markets = await client.get("/trade-api/v2/markets", {"limit": 5, "status": "open"})
            print(f"SUCCESS: status=open worked. Count: {len(markets.get('markets', []))}")
        except Exception as e:
            print(f"ERROR: status=open failed: {e}")

        print("\nFETCH: Testing NO status filter...")
        try:
            markets = await client.get("/trade-api/v2/markets", {"limit": 5})
            print(f"SUCCESS: No status filter worked. Count: {len(markets.get('markets', []))}")
        except Exception as e:
            print(f"ERROR: No status filter failed: {e}")

if __name__ == "__main__":
    asyncio.run(debug_status())
