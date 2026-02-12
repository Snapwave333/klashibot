
import requests
from bs4 import BeautifulSoup
import re

def get_kalshi_image(ticker):
    # Try to construct a URL.
    # Tickers are often like "KXBITCOIN-25DEC31"
    # Kalshi URLs often use the "series ticker" or a slug.
    # Let's try to extract the series part.
    
    # Heuristic: split by hyphen, take the first part? 
    # Or just try the full ticker.
    
    print(f"Testing ticker: {ticker}")
    
    # Strategy 1: Search Kalshi (simulated via direct URL guess)
    # The actual URL format is typically https://kalshi.com/markets/{series_ticker}
    # Example: https://kalshi.com/markets/kxbitcoin
    
    # Extract probable series ticker (e.g., KXBITCOIN from KXBITCOIN-25DEC31)
    # However, some tickers are complex like "KXMVESPORTS..."
    
    # Let's just try to extract the alpha prefix if it starts with KX
    match = re.match(r"([A-Z]+)", ticker)
    if match:
        series_ticker = match.group(1)
        # Kalshi usually lowercases it in URLs? Let's check.
        url = f"https://kalshi.com/markets/{series_ticker.lower()}"
        print(f"Trying URL: {url}")
        
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(url, headers=headers, timeout=5)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                og_image = soup.find("meta", property="og:image")
                if og_image and og_image.get("content"):
                    return og_image["content"]
                
                # Also check for twitter:image
                twitter_image = soup.find("meta", property="twitter:image")
                if twitter_image and twitter_image.get("content"):
                    return twitter_image["content"]
                    
            else:
                print(f"Failed with status: {response.status_code}")
                
        except Exception as e:
            print(f"Error scraping: {e}")

    return None

if __name__ == "__main__":
    # Test with a few examples
    print("Result:", get_kalshi_image("KXBITCOIN"))
    print("Result:", get_kalshi_image("KXFED"))
    print("Result:", get_kalshi_image("KXINFLATION"))
