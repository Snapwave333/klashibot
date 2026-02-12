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

async def debug_demo():
    load_dotenv()
    
    base_url = os.getenv("BASE_URL", "https://demo-api.kalshi.co")
    private_key_path = os.getenv("KALSHI_PRIVATE_KEY_PATH", "./config/kalshi_private.pem")
    api_key = os.getenv("KALSHI_API_KEY")
    
    print(f"DEBUG: Testing Demo API: {base_url}")
    print(f"DEBUG: Key Path: {private_key_path}")
    
    async with KalshiAPIClient(
        base_url=base_url,
        private_key_path=private_key_path,
        api_key=api_key
    ) as client:
        # Test 1: Simple markets check
        print("\nFETCH: Fetching first 5 markets...")
        try:
            markets = await client.get("/trade-api/v2/markets", {"limit": 5})
            print(json.dumps(markets, indent=2))
            
            # Extract common series if any
            if "markets" in markets:
                series = set(m.get("series_ticker") for m in markets["markets"] if m.get("series_ticker"))
                print(f"SERIES Found in sample: {series}")
        except Exception as e:
            print(f"ERROR Test 1 Failed: {e}")

        # Test 2: Checking series endpoint
        print("\nFETCH: Fetching available series...")
        try:
            series_data = await client.get("/trade-api/v2/series", {"limit": 20})
            print(json.dumps(series_data, indent=2))
        except Exception as e:
            print(f"ERROR Test 2 Failed: {e}")

        # Test 3: Checking if a specific series exists
        print("\nFETCH: Testing KXECON series scan...")
        try:
            inx_markets = await client.get("/trade-api/v2/markets", {"limit": 1, "series_ticker": "KXECON"})
            print(f"KXECON Search Result count: {len(inx_markets.get('markets', []))}")
        except Exception as e:
            print(f"ERROR KXECON Test Failed: {e}")

if __name__ == "__main__":
    asyncio.run(debug_demo())
