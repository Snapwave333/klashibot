
import time
import logging
import socket
import json
from bridge import KalashiBridge
from strategies.fundamental import FundamentalStrategy
from risk.manager import RiskManager

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TradingBot:
    def __init__(self):
        self.bridge = KalashiBridge()
        self.strategy = FundamentalStrategy()
        self.risk_manager = RiskManager()
        self.supervisor_socket = None
        self._connect_to_supervisor()

    def _connect_to_supervisor(self):
        try:
            self.supervisor_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.supervisor_socket.connect(('127.0.0.1', 65432))
            logger.info("Connected to supervisor.")
        except Exception as e:
            logger.warning(f"Could not connect to supervisor: {e}")

    def send_status(self):
        if self.supervisor_socket:
            status = {
                "pnl": self.bridge.pnl,
                "balance": self.bridge.balance,
                "positions": len(self.bridge.positions)
            }
            try:
                self.supervisor_socket.sendall(json.dumps(status).encode() + b'\n')
            except:
                pass

    def run_once(self):
        markets = self.bridge.get_markets()
        for m in markets:
            ob = self.bridge.get_orderbook(m['ticker'])
            opp = self.strategy.analyze_market(m, ob)
            if opp:
                if self.risk_manager.validate_opportunity(opp, self.bridge.balance):
                    self.bridge.execute_trade(opp.ticker, opp.side, opp.suggested_size, opp.entry_price)
        
        self.send_status()

    def run(self):
        logger.info("Bot started.")
        while True:
            try:
                self.run_once()
                time.sleep(5)
            except KeyboardInterrupt:
                break
            except Exception as e:
                logger.error(f"Error in main loop: {e}")
                time.sleep(5)

if __name__ == "__main__":
    bot = TradingBot()
    bot.run()
