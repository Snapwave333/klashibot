
import requests
import json
import asyncio
import os

# Set env vars BEFORE importing config
os.environ["KALSHI_API_KEY"] = "c787e933-a584-442f-b551-b86656d80f2b"
os.environ["KALSHI_PRIVATE_KEY_PATH"] = "config/kalshi_private.pem"
os.environ["BASE_URL"] = "https://api.elections.kalshi.com"

from mcp_server_kalshi.kalshi_client.client import KalshiAPIClient
from mcp_server_kalshi.kalshi_client.schemas import GetMarketsRequest
from mcp_server_kalshi.config import settings

async def main():
    print("Fetching markets to test image URLs...")
    try:
        async with KalshiAPIClient(
            base_url=settings.BASE_URL,
            private_key_path=settings.KALSHI_PRIVATE_KEY_PATH,
            api_key=settings.KALSHI_API_KEY.get_secret_value()
        ) as client:
            response = await client.get_markets(GetMarketsRequest(limit=5))
            markets = response.get("markets", [])
            
            for m in markets:
                ticker = m.get("ticker")
                event_ticker = m.get("event_ticker")
                print(f"\n--- Market: {ticker} ---")
                
                # Test URL patterns
                urls = [
                    f"https://kalshi.com/api-app/preview/{ticker}?width=1200&height=630",
                    f"https://kalshi.com/api-app/preview/{event_ticker}?width=1200&height=630",
                    f"https://kalshi.com/markets/{event_ticker.lower()}"
                ]
                
                for url in urls:
                    try:
                        r = requests.head(url, timeout=2)
                        print(f"[{r.status_code}] {url}")
                        if r.status_code == 200:
                            content_type = r.headers.get("content-type", "")
                            print(f"  -> Type: {content_type}")
                    except Exception as e:
                        print(f"  -> Error: {e}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
