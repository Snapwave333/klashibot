
import sys
import os
import asyncio
import json
from pathlib import Path
from dotenv import load_dotenv

# Add path to find the module
# We need to include the 'src' directory of mcp-server-kalshi to import the package
internal_src = Path.cwd() / "mcp-server-kalshi" / "src"
sys.path.append(str(internal_src))

# Fix Windows console encoding
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

try:
    from mcp_server_kalshi.kalshi_client.base import BaseAPIClient
except ImportError as e:
    print(f"Import Error: {e}")
    print(f"Sys Path: {sys.path}")
    sys.exit(1)

load_dotenv()

async def main():
    print("🚀 STARTING ISOLATION DEBUG SCRIPT")
    print("====================================")
    
    # 1. Setup Auth
    api_key = os.getenv("KALSHI_API_KEY")
    # Handle private key path (relative to root)
    key_path_env = os.getenv("KALSHI_PRIVATE_KEY_PATH")
    if key_path_env:
        key_path = Path(key_path_env)
    else:
        key_path = Path.cwd() / "config" / "kalshi_private.pem"

    if not key_path.exists():
        print(f"❌ Private Key not found at: {key_path}")
        return

    base_url = os.getenv("BASE_URL", "https://api.elections.kalshi.com")
    
    print(f"🔑 Auth: Key found at {key_path}")
    print(f"🌐 URL: {base_url}")

    # Initialize Client (Manual auth to check live data structure)
    try:
        client = BaseAPIClient(base_url=base_url, private_key_path=str(key_path), api_key=api_key)
        
        async with client:
            print("✅ Client Authenticated")
            
            # 2. Fetch Active Market (High Volume)
            print("🔍 Fetching markets (simplified params)...")
            # We use the raw endpoint to get 'markets' without complex filters first
            markets_resp = await client.get("/trade-api/v2/markets", params={"limit": 10})
            
            # 3. PRINT RAW JSON
            if "markets" in markets_resp and len(markets_resp["markets"]) > 0:
                target_market = markets_resp["markets"][0]
                print("\n📄 RAW JSON RESPONSE (Single Market):")
                print(json.dumps(target_market, indent=2))
                
                # 4. Variable Mapping Test
                ticker = target_market.get("ticker")
                
                # Try to find 'Ask' price. Kalshi usually has 'yes_ask' and 'no_ask'
                current_price = target_market.get("yes_ask")
                
                print(f"\n🧬 VARIABLE MAPPING TEST:")
                print(f"Ticker: {ticker}")
                print(f"DEBUG: Found Ask Price: {current_price} type: {type(current_price)}")
                
                # 5. Force Execution Simulation
                print("\n🧪 EXECUTION SIMULATION:")
                wallet = 100 # User specified int
                
                # Check for None
                if current_price is None:
                    print(f"FAIL: Price is None. Available keys: {list(target_market.keys())}")
                    return

                print(f"Wallet: {wallet}")
                print(f"Price: {current_price}")
                
                if wallet > current_price:
                    wallet -= current_price
                    print("SUCCESS: Trade Simulated")
                    print(f"Remaining Wallet: {wallet}")
                else:
                    print("FAIL: Logic Error (Wallet <= Price)")
                    
            else:
                print("❌ No active markets found.")
                print(f"Full Response: {markets_resp}")

    except Exception as e:
        print(f"❌ SCRIPT ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
