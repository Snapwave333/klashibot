from typing import Dict, Optional, List
from .base import BaseStrategy
from models import MarketOpportunity
import datetime
import json


class SentimentStrategy(BaseStrategy):
    """
    Analyzes market sentiment using REAL-WORLD news signals via fetch_rss_feed tool.
    """

    def __init__(self, sentiment_threshold: float = 0.3):
        self.sentiment_threshold = sentiment_threshold
        # RSS Feeds to monitor (Financial/Crypto)
        self.feeds = [
            "https://feeds.content.dowjones.io/public/rss/mw_topstories",  # MarketWatch
            "https://www.cnbc.com/id/19789731/device/rss/rss.xml",  # CNBC Finance
            "https://cointelegraph.com/rss",  # Crypto
        ]
        self.news_cache = []  # List of {title, summary}
        self.last_update = datetime.datetime.min
        self._updating = False

    async def _update_news(self, mcp_session):
        """Fetch latest news if cache is stale (older than 10 mins)."""
        now = datetime.datetime.now()
        if (now - self.last_update).total_seconds() < 600 or self._updating:
            return

        self._updating = True
        try:
            print(f"📡 Updating News Sentiment from {len(self.feeds)} feeds...")
            new_items = []
            for url in self.feeds:
                try:
                    result = await mcp_session.call_tool(
                        "fetch_rss_feed", {"url": url, "limit": 5}
                    )
                    if result and hasattr(result, "content"):
                        data = json.loads(result.content[0].text)
                        new_items.extend(data.get("items", []))
                except Exception as e:
                    print(f"⚠️ RSS Fetch Error ({url}): {e}")

            if new_items:
                self.news_cache = new_items
                self.last_update = now
        finally:
            self._updating = False

    async def analyze_market(
        self, market: Dict, orderbook: Dict, mcp_session=None
    ) -> Optional[MarketOpportunity]:
        if mcp_session is None:
            return None

        await self._update_news(mcp_session)

        title = market.get("title", "").lower()
        ticker = market.get("ticker", "").lower()

        # 1. Correlate news keywords with market title/ticker
        sentiment_score = 0.0
        hit_count = 0
        matching_news = []

        bullish = [
            "up",
            "rise",
            "gain",
            "high",
            "positive",
            "beat",
            "surge",
            "win",
            "approved",
            "growth",
        ]
        bearish = [
            "down",
            "fall",
            "loss",
            "low",
            "negative",
            "miss",
            "crash",
            "loss",
            "denied",
            "recession",
        ]

        for item in self.news_cache:
            news_txt = (item.get("title", "") + " " + item.get("summary", "")).lower()

            # Simple matching: ticker parts or title keywords
            parts = ticker.split("-")
            relevant = any(p in news_txt for p in parts if len(p) > 2)
            if not relevant:
                relevant = any(w in news_txt for w in title.split() if len(w) > 4)

            if relevant:
                matching_news.append(item.get("title"))
                pos_hits = sum(1 for w in bullish if w in news_txt)
                neg_hits = sum(1 for w in bearish if w in news_txt)
                sentiment_score += pos_hits - neg_hits
                hit_count += 1

        if hit_count == 0 or abs(sentiment_score) < self.sentiment_threshold:
            return None

        # 2. Generate Signal
        avg_sentiment = sentiment_score / hit_count
        side = "yes" if avg_sentiment > 0 else "no"

        # 3. Entry Price Calculation
        yes_data = (orderbook.get("yes") or {}) if orderbook else {}
        no_data = (orderbook.get("no") or {}) if orderbook else {}
        yes_asks = yes_data.get("asks", [])
        no_asks = no_data.get("asks", [])

        last_price = market.get("last_price", 50) or 50
        if side == "yes":
            entry_price = (
                yes_asks[0]["price"] if yes_asks else market.get("yes_ask", last_price)
            )
        else:
            entry_price = (
                no_asks[0]["price"]
                if no_asks
                else market.get("no_ask", 100 - last_price)
            )

        # Sentiment edge
        edge = min(abs(avg_sentiment) * 5.0, 20.0)

        ticker = market.get("ticker")
        if not ticker:
            return None

        return MarketOpportunity(
            ticker=ticker,
            market_title=market.get("title", ""),
            edge=edge,
            confidence=min(abs(avg_sentiment), 1.0),
            side=side,
            entry_price=entry_price,
            suggested_size=1,
            reasoning=f"News Sentiment: {matching_news[0][:50]}... (Score: {avg_sentiment:.2f})",
            liquidity_score=0.8,
            probability=0.7 if side == "yes" else 0.3,
            timestamp=datetime.datetime.now(),
        )
