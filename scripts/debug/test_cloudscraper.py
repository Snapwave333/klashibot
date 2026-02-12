
import cloudscraper
import asyncio

def test_cloudscraper():
    scraper = cloudscraper.create_scraper()
    
    # Test direct image URLs
    urls = [
        "https://kalshi.com/api-app/preview/KXBITCOIN?width=1200&height=630",
        "https://kalshi.com/api-app/preview/KXFED?width=1200&height=630",
        "https://kalshi.com/api-app/preview/KXMVESPORTSMULTIGAMEEXTENDED-S2025E8EC0D15C4F?width=1200&height=630"
    ]
    
    for url in urls:
        print(f"\nFetching Image {url}...")
        try:
            response = scraper.get(url)
            print(f"Status: {response.status_code}")
            print(f"Content-Type: {response.headers.get('content-type')}")
            print(f"Content-Length: {response.headers.get('content-length')}")
            
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    test_cloudscraper()
