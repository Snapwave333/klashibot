
import asyncio
import os
import json
import requests

# Set env vars BEFORE importing config
os.environ["KALSHI_API_KEY"] = "c787e933-a584-442f-b551-b86656d80f2b"
os.environ["KALSHI_PRIVATE_KEY_PATH"] = "config/kalshi_private.pem"
os.environ["BASE_URL"] = "https://api.elections.kalshi.com"

from mcp_server_kalshi.kalshi_client.client import KalshiAPIClient
from mcp_server_kalshi.kalshi_client.schemas import GetMarketsRequest, GetEventRequest
from mcp_server_kalshi.config import settings

async def main():
    print("Fetching one market and event to inspect for IMAGES...")
    try:
        async with KalshiAPIClient(
            base_url=settings.BASE_URL,
            private_key_path=settings.KALSHI_PRIVATE_KEY_PATH,
            api_key=settings.KALSHI_API_KEY.get_secret_value()
        ) as client:
            response = await client.get_markets(GetMarketsRequest(limit=5))
            markets = response.get("markets", [])
            
            for m in markets[:3]: # Check first 3
                print(f"\n--- Market: {m.get('ticker')} ---")
                print(f"Image URL in Market: {m.get('image_url')}")
                
                event_ticker = m.get("event_ticker")
                if event_ticker:
                    print(f"Fetching Event: {event_ticker}")
                    event = await client.get_event(GetEventRequest(event_ticker=event_ticker))
                    
                    # Print all keys in event that might contain 'image' or 'url'
                    print("Event Keys:", event.keys())
                    print(f"Event Image: {event.get('image_url')}")
                    print(f"Event Banner: {event.get('banner_image')}")
                    
                    # Try to scrape the event page
                    url = f"https://kalshi.com/markets/{event_ticker.lower()}"
                    print(f"Scraping {url}...")
                    headers = {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                        'Accept-Language': 'en-US,en;q=0.5',
                        'DNT': '1',
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1',
                    }
                    try:
                        r = requests.get(url, headers=headers, timeout=3)
                        print(f"Status: {r.status_code}")
                        if r.status_code == 200:
                            if "og:image" in r.text:
                                print("Found og:image!")
                            else:
                                print("No og:image found in HTML")
                    except Exception as e:
                        print(f"Scrape Error: {e}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
