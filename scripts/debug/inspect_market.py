
import asyncio
import os
import json

# Set env vars BEFORE importing config
os.environ["KALSHI_API_KEY"] = "c787e933-a584-442f-b551-b86656d80f2b"
os.environ["KALSHI_PRIVATE_KEY_PATH"] = "config/kalshi_private.pem"
os.environ["BASE_URL"] = "https://api.elections.kalshi.com"

from mcp_server_kalshi.kalshi_client.client import KalshiAPIClient
from mcp_server_kalshi.kalshi_client.schemas import GetMarketsRequest, GetEventRequest
from mcp_server_kalshi.config import settings

async def main():
    print("Fetching market and associated event...")
    try:
        async with KalshiAPIClient(
            base_url=settings.BASE_URL,
            private_key_path=settings.KALSHI_PRIVATE_KEY_PATH,
            api_key=settings.KALSHI_API_KEY.get_secret_value()
        ) as client:
            # Get a market
            response = await client.get_markets(GetMarketsRequest(limit=1))
            markets = response.get("markets", [])
            
            if markets:
                market = markets[0]
                print(f"Market Ticker: {market.get('ticker')}")
                
                event_ticker = market.get("event_ticker")
                if event_ticker:
                    print(f"Fetching Event: {event_ticker}")
                    event_response = await client.get_event(GetEventRequest(event_ticker=event_ticker))
                    print(json.dumps(event_response, indent=2))
                else:
                    print("No event ticker found on market.")
            else:
                print("No markets found.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
