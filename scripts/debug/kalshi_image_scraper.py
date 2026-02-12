
import cloudscraper
from bs4 import BeautifulSoup
import re
import threading
import time

class KalshiImageScraper:
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(KalshiImageScraper, cls).__new__(cls)
                    cls._instance.cache = {}
                    # Initialize cloudscraper
                    cls._instance.scraper = cloudscraper.create_scraper()
                    cls._instance.generic_images = [
                        "https://kalshi.com/images/meta-og.png",
                        "https://kalshi.com/static/media/meta-og.png",
                    ]
        return cls._instance

    def get_image(self, ticker: str, title: str = "") -> str:
        """
        Attempt to scrape the real market image from Kalshi.
        Returns None if no specific image is found.
        """
        # Check cache first
        if ticker in self.cache:
            return self.cache[ticker]
            
        # Try to derive the series ticker
        # Example: KXBITCOIN-25DEC31 -> kxbitcoin
        series_ticker = self._extract_series_ticker(ticker)
        
        # URL candidates to try
        urls_to_try = []
        if series_ticker:
            urls_to_try.append(f"https://kalshi.com/markets/{series_ticker.lower()}")
            urls_to_try.append(f"https://kalshi.com/markets/{series_ticker.lower().replace('kx', '')}")
            
        # Also try the full ticker as a fallback slug (sometimes helpful)
        urls_to_try.append(f"https://kalshi.com/markets/{ticker.lower()}")

        for url in urls_to_try:
            try:
                # Use cloudscraper to bypass 403
                response = self.scraper.get(url, timeout=5)
                
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, 'html.parser')
                    
                    # 1. Try OG Image
                    og_image = soup.find("meta", property="og:image")
                    if og_image and og_image.get("content"):
                        img_url = og_image["content"]
                        # We return it even if it's generic, if that's what Kalshi uses.
                        # But user hates placeholders. 
                        # If generic, we might want to try the next URL?
                        if not self._is_generic(img_url):
                            self.cache[ticker] = img_url
                            return img_url
                            
                    # 2. Try Twitter Image
                    twitter_image = soup.find("meta", property="twitter:image")
                    if twitter_image and twitter_image.get("content"):
                        img_url = twitter_image["content"]
                        if not self._is_generic(img_url):
                            self.cache[ticker] = img_url
                            return img_url
            except Exception as e:
                # print(f"Error scraping {url}: {e}")
                pass
                
        # If we failed to find a *specific* image, return None
        # Do NOT return a fallback here.
        self.cache[ticker] = None
        return None

    def _extract_series_ticker(self, ticker: str) -> str:
        # Match the first alphabetic sequence
        match = re.match(r"([A-Z]+)", ticker)
        if match:
            return match.group(1)
        return ticker.split('-')[0]

    def _is_generic(self, url: str) -> bool:
        return any(generic in url for generic in self.generic_images)

# Singleton instance
scraper = KalshiImageScraper()
