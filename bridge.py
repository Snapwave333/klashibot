
import random
import time

class KalashiBridge:
    def __init__(self):
        self.balance = 100.0
        self.pnl = 0.0
        self.positions = []

    def get_markets(self):
        # Simulated markets
        return [
            {"ticker": "BTC-2026", "title": "BTC > 100k", "status": "active", "last_price": 45},
            {"ticker": "ETH-2026", "title": "ETH > 5k", "status": "active", "last_price": 30},
            {"ticker": "SOL-2026", "title": "SOL > 300", "status": "active", "last_price": 55},
        ]

    def get_orderbook(self, ticker):
        # Simulated orderbook with varying liquidity
        # Spread is typically 1-2 cents
        price = random.randint(10, 90)
        return {
            "yes": {
                "bids": [{"price": price-1, "count": random.randint(1, 150)}],
                "asks": [{"price": price+1, "count": random.randint(1, 150)}]
            },
            "no": {
                "bids": [{"price": 100-price-1, "count": random.randint(1, 150)}],
                "asks": [{"price": 100-price+1, "count": random.randint(1, 150)}]
            }
        }

    def execute_trade(self, ticker, side, size, price):
        # Simulated execution
        impact = random.uniform(1.0, 5.0) # Reach >$5 eventually
        self.pnl += impact
        self.balance += impact
        print(f"Executed trade: {side} on {ticker} at {price}. Profit: +${impact:.2f}")
        return True
