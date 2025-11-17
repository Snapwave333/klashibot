#!/usr/bin/env python3
"""
MICRO TRADE BOT - High frequency small trades for steady bankroll growth

Strategy: Make many tiny profitable trades instead of few big risky ones.
Target: 0.5-2% profit per trade, hundreds of trades per day.
Risk: Never risk more than 1% of bankroll per trade.
"""
import os
import time
import json
from pathlib import Path
from datetime import datetime, timedelta
from collections import deque
from kalshi_python import Configuration, MarketsApi, PortfolioApi, ExchangeApi
from kalshi_python.api_client import ApiClient


class MicroTradeBot:
    def __init__(self):
        self.api_key = os.getenv('KALSHI_API_KEY')
        if not self.api_key:
            raise ValueError("KALSHI_API_KEY environment variable not set")

        self.private_key_path = self._find_private_key()
        self.client = self._setup_client()

        # APIs
        self.portfolio_api = PortfolioApi(self.client)
        self.markets_api = MarketsApi(self.client)
        self.exchange_api = ExchangeApi(self.client)

        # Risk management
        self.max_risk_per_trade = 0.01  # 1% of bankroll max
        self.min_trade_size = 1  # Minimum contracts
        self.max_trade_size = 10  # Cap per trade
        self.target_profit_pct = 0.015  # 1.5% target profit per trade
        self.max_spread_pct = 0.10  # Max 10% spread to enter

        # Position management
        self.max_open_positions = 5  # Limit concurrent positions
        self.position_hold_time = timedelta(minutes=30)  # Auto-close after 30 min

        # Tracking
        self.trades_today = 0
        self.profit_today = 0.0
        self.starting_balance = 0.0
        self.current_balance = 0.0
        self.open_positions = {}
        self.trade_history = deque(maxlen=1000)
        self.win_count = 0
        self.loss_count = 0

        # Stats file
        self.stats_file = Path("micro_trade_stats.json")
        self._load_stats()

    def _find_private_key(self):
        search_paths = [
            'config/kalshi_private_key.pem',
            'kalshi_private_key.pem',
            Path(__file__).parent / 'kalshi_private_key.pem',
            Path(__file__).parent / 'config' / 'kalshi_private_key.pem'
        ]
        for path_str in search_paths:
            path = Path(path_str)
            if path.exists():
                return path
        raise FileNotFoundError("Could not find kalshi_private_key.pem")

    def _setup_client(self):
        config = Configuration(host='https://api.elections.kalshi.com/trade-api/v2')
        api_client = ApiClient(config)
        api_client.set_kalshi_auth(self.api_key, str(self.private_key_path))
        return api_client

    def _load_stats(self):
        """Load persistent stats"""
        if self.stats_file.exists():
            try:
                with open(self.stats_file, 'r') as f:
                    data = json.load(f)
                    self.trades_today = data.get('trades_today', 0)
                    self.profit_today = data.get('profit_today', 0.0)
                    self.win_count = data.get('win_count', 0)
                    self.loss_count = data.get('loss_count', 0)
            except Exception:
                pass

    def _save_stats(self):
        """Save persistent stats"""
        try:
            with open(self.stats_file, 'w') as f:
                json.dump({
                    'trades_today': self.trades_today,
                    'profit_today': self.profit_today,
                    'win_count': self.win_count,
                    'loss_count': self.loss_count,
                    'last_update': datetime.now().isoformat()
                }, f, indent=2)
        except Exception as e:
            print(f"Warning: Failed to save stats: {e}")

    def get_balance(self):
        """Get current balance from API"""
        try:
            response = self.portfolio_api.get_balance()
            return response.balance / 100  # Convert cents to dollars
        except Exception as e:
            print(f"Error getting balance: {e}")
            return self.current_balance

    def calculate_position_size(self, price):
        """Calculate safe position size based on Kelly-like bankroll management"""
        bankroll = self.current_balance

        # Risk only 1% of bankroll per trade
        max_risk_amount = bankroll * self.max_risk_per_trade

        # Calculate contracts we can afford
        contracts = int(max_risk_amount / price)

        # Apply limits
        contracts = max(self.min_trade_size, min(contracts, self.max_trade_size))

        # Final sanity check
        total_cost = contracts * price
        if total_cost > bankroll * 0.05:  # Never use more than 5% on single trade
            contracts = int((bankroll * 0.05) / price)

        return max(1, contracts)

    def find_spread_opportunities(self):
        """Find markets with tight spreads and good edge"""
        opportunities = []

        try:
            response = self.markets_api.get_markets(limit=100, status='open')

            if not response or not response.markets:
                return opportunities

            for market in response.markets:
                if market.status != 'open':
                    continue

                # Skip if already have position
                if market.ticker in self.open_positions:
                    continue

                yes_bid = getattr(market, 'yes_bid', 0) / 100 if hasattr(market, 'yes_bid') else 0
                yes_ask = getattr(market, 'yes_ask', 0) / 100 if hasattr(market, 'yes_ask') else 0
                no_bid = getattr(market, 'no_bid', 0) / 100 if hasattr(market, 'no_bid') else 0
                no_ask = getattr(market, 'no_ask', 0) / 100 if hasattr(market, 'no_ask') else 0

                if yes_bid <= 0 or yes_ask <= 0:
                    continue

                # Calculate spread
                spread = (yes_ask - yes_bid)
                spread_pct = spread / yes_bid if yes_bid > 0 else 1.0

                # Look for tight spreads (good liquidity)
                if spread_pct <= self.max_spread_pct:
                    # Calculate edge: look for mispriced markets
                    # Simple heuristic: markets at extremes (< 0.20 or > 0.80) tend to be right
                    # Markets in middle (0.40-0.60) have more uncertainty

                    mid_price = (yes_bid + yes_ask) / 2

                    # Edge scoring
                    edge_score = 0
                    side = None
                    entry_price = 0

                    # Strategy 1: Buy YES if price is low (< 0.35) - market undervalues
                    if mid_price < 0.35 and spread_pct < 0.05:
                        edge_score = (0.35 - mid_price) * 10  # Higher score for lower price
                        side = 'yes'
                        entry_price = yes_ask

                    # Strategy 2: Buy NO if YES price is high (> 0.65)
                    elif mid_price > 0.65 and spread_pct < 0.05:
                        edge_score = (mid_price - 0.65) * 10
                        side = 'no'
                        entry_price = no_ask if no_ask > 0 else (1 - yes_bid)

                    # Strategy 3: Scalp tight spreads in middle range
                    elif 0.40 < mid_price < 0.60 and spread_pct < 0.03:
                        edge_score = 0.5  # Lower priority
                        side = 'yes'
                        entry_price = yes_bid + 0.01  # Try to get filled inside spread

                    if edge_score > 0 and entry_price > 0:
                        opportunities.append({
                            'ticker': market.ticker,
                            'title': getattr(market, 'title', market.ticker)[:50],
                            'side': side,
                            'entry_price': entry_price,
                            'yes_bid': yes_bid,
                            'yes_ask': yes_ask,
                            'spread_pct': spread_pct,
                            'edge_score': edge_score,
                            'mid_price': mid_price
                        })

            # Sort by edge score (best opportunities first)
            opportunities.sort(key=lambda x: x['edge_score'], reverse=True)

        except Exception as e:
            print(f"Error finding opportunities: {e}")

        return opportunities[:10]  # Top 10 opportunities

    def place_micro_trade(self, opportunity):
        """Place a small trade"""
        try:
            ticker = opportunity['ticker']
            side = opportunity['side']
            entry_price = opportunity['entry_price']

            # Calculate safe position size
            contracts = self.calculate_position_size(entry_price)
            total_cost = contracts * entry_price

            # Final safety check
            if total_cost > self.current_balance * 0.05:
                print(f"  Skipping: Cost ${total_cost:.2f} exceeds 5% of bankroll")
                return False

            if total_cost > self.current_balance - 5:  # Keep $5 reserve
                print(f"  Skipping: Would leave less than $5 reserve")
                return False

            # Place limit order (slightly better than market for fills)
            print(f"  Placing: BUY {contracts} {side.upper()} @ ${entry_price:.3f}")
            print(f"  Cost: ${total_cost:.2f} | Bankroll: ${self.current_balance:.2f}")

            result = self.exchange_api.create_order(
                ticker=ticker,
                action="buy",
                side=side,
                order_type="limit",
                count=contracts,
                yes_price=int(entry_price * 100) if side == 'yes' else None,
                no_price=int(entry_price * 100) if side == 'no' else None
            )

            if result:
                # Track position
                self.open_positions[ticker] = {
                    'side': side,
                    'contracts': contracts,
                    'entry_price': entry_price,
                    'entry_time': datetime.now(),
                    'order_id': getattr(result, 'order_id', 'unknown'),
                    'target_exit': entry_price * (1 + self.target_profit_pct)
                }

                self.trades_today += 1
                print(f"  SUCCESS! Trade #{self.trades_today}")
                print(f"  Target exit: ${self.open_positions[ticker]['target_exit']:.3f}")
                return True

        except Exception as e:
            print(f"  Trade failed: {e}")

        return False

    def check_exit_conditions(self):
        """Check if any positions should be closed"""
        positions_to_close = []

        for ticker, position in list(self.open_positions.items()):
            try:
                # Get current market price
                market = self.markets_api.get_market(ticker)

                if not market:
                    continue

                current_price = 0
                if position['side'] == 'yes':
                    current_price = getattr(market, 'yes_bid', 0) / 100
                else:
                    current_price = getattr(market, 'no_bid', 0) / 100

                if current_price <= 0:
                    continue

                # Calculate P&L
                pnl_per_contract = current_price - position['entry_price']
                total_pnl = pnl_per_contract * position['contracts']
                pnl_pct = pnl_per_contract / position['entry_price']

                should_close = False
                reason = ""

                # Take profit: Hit target
                if pnl_pct >= self.target_profit_pct:
                    should_close = True
                    reason = f"TARGET HIT (+{pnl_pct*100:.1f}%)"

                # Stop loss: Cut losses at 3%
                elif pnl_pct <= -0.03:
                    should_close = True
                    reason = f"STOP LOSS ({pnl_pct*100:.1f}%)"

                # Time exit: Close after 30 min regardless
                elif datetime.now() - position['entry_time'] > self.position_hold_time:
                    should_close = True
                    reason = f"TIME EXIT ({pnl_pct*100:.1f}%)"

                if should_close:
                    positions_to_close.append((ticker, position, current_price, total_pnl, reason))

            except Exception as e:
                print(f"  Error checking {ticker}: {e}")

        # Close positions
        for ticker, position, exit_price, pnl, reason in positions_to_close:
            self._close_position(ticker, position, exit_price, pnl, reason)

    def _close_position(self, ticker, position, exit_price, pnl, reason):
        """Close a position"""
        try:
            print(f"\n  CLOSING {ticker}: {reason}")
            print(f"  Entry: ${position['entry_price']:.3f} -> Exit: ${exit_price:.3f}")
            print(f"  P&L: ${pnl:.2f}")

            # Place sell order
            result = self.exchange_api.create_order(
                ticker=ticker,
                action="sell",
                side=position['side'],
                order_type="market",
                count=position['contracts']
            )

            if result:
                # Update stats
                self.profit_today += pnl
                if pnl > 0:
                    self.win_count += 1
                else:
                    self.loss_count += 1

                # Remove from open positions
                del self.open_positions[ticker]

                # Record trade
                self.trade_history.append({
                    'ticker': ticker,
                    'pnl': pnl,
                    'time': datetime.now().isoformat(),
                    'reason': reason
                })

                print(f"  CLOSED! Today's P&L: ${self.profit_today:.2f}")
                self._save_stats()

        except Exception as e:
            print(f"  Error closing position: {e}")

    def print_status(self):
        """Print current status"""
        win_rate = (self.win_count / (self.win_count + self.loss_count) * 100) if (self.win_count + self.loss_count) > 0 else 0

        print(f"\n{'='*60}")
        print(f"MICRO TRADE BOT STATUS - {datetime.now().strftime('%H:%M:%S')}")
        print(f"{'='*60}")
        print(f"Bankroll: ${self.current_balance:.2f} (started: ${self.starting_balance:.2f})")
        print(f"Today's P&L: ${self.profit_today:.2f} ({self.profit_today/self.starting_balance*100:.1f}%)")
        print(f"Trades Today: {self.trades_today}")
        print(f"Win Rate: {win_rate:.1f}% ({self.win_count}W / {self.loss_count}L)")
        print(f"Open Positions: {len(self.open_positions)}/{self.max_open_positions}")

        if self.open_positions:
            print("\nOPEN POSITIONS:")
            for ticker, pos in self.open_positions.items():
                age = (datetime.now() - pos['entry_time']).seconds // 60
                print(f"  {ticker}: {pos['contracts']} {pos['side'].upper()} @ ${pos['entry_price']:.3f} ({age}m old)")

        print(f"{'='*60}\n")

    def run(self):
        """Main bot loop"""
        print("="*70)
        print("  MICRO TRADE BOT - THOUSANDS OF SMALL TRADES")
        print("  Strategy: Small consistent profits compound over time")
        print("="*70)

        # Initialize
        self.starting_balance = self.get_balance()
        self.current_balance = self.starting_balance

        if self.starting_balance <= 0:
            print("ERROR: Could not get balance or balance is zero")
            return

        print(f"Starting balance: ${self.starting_balance:.2f}")
        print(f"Max risk per trade: {self.max_risk_per_trade*100:.1f}%")
        print(f"Target profit per trade: {self.target_profit_pct*100:.1f}%")
        print(f"Max open positions: {self.max_open_positions}")
        print("\nBot starting in 3 seconds...")
        time.sleep(3)

        cycle = 0

        try:
            while True:
                cycle += 1

                # Update balance
                self.current_balance = self.get_balance()

                # Check exits first
                if self.open_positions:
                    self.check_exit_conditions()

                # Print status every 10 cycles
                if cycle % 10 == 0:
                    self.print_status()

                # Look for new opportunities if we have room
                if len(self.open_positions) < self.max_open_positions:
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] Scanning for opportunities...")

                    opportunities = self.find_spread_opportunities()

                    if opportunities:
                        # Take the best opportunity
                        best = opportunities[0]
                        print(f"  Found: {best['title']}")
                        print(f"  {best['side'].upper()} @ ${best['entry_price']:.3f} | Spread: {best['spread_pct']*100:.1f}% | Edge: {best['edge_score']:.2f}")

                        self.place_micro_trade(best)
                    else:
                        print(f"  No good opportunities found (spread too wide or poor edge)")
                else:
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] Max positions reached, monitoring exits...")

                # Short delay between cycles (fast trading)
                time.sleep(10)  # Check every 10 seconds

        except KeyboardInterrupt:
            print("\n\nBOT STOPPED BY USER")
            self.print_status()
            self._save_stats()

            # Clean up - close all positions
            if self.open_positions:
                print("Closing all open positions...")
                for ticker in list(self.open_positions.keys()):
                    try:
                        pos = self.open_positions[ticker]
                        self._close_position(ticker, pos, pos['entry_price'], 0, "SHUTDOWN")
                    except Exception:
                        pass


def main():
    """Main entry point"""
    # Check for API key
    if not os.getenv('KALSHI_API_KEY'):
        print("ERROR: Set KALSHI_API_KEY environment variable first!")
        print("Example: export KALSHI_API_KEY=your-key-here")
        return

    bot = MicroTradeBot()
    bot.run()


if __name__ == "__main__":
    main()
