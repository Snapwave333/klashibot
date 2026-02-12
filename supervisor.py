import asyncio
import websockets
import json
import logging
import os
import sys
import subprocess
import re
import time
from datetime import datetime
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("supervisor.log"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("Supervisor")

WS_URL = "ws://localhost:8766"
PROJECT_ROOT = Path("c:/Users/chrom/OneDrive/Desktop/current-projects/production/kalashi")
STRATEGY_FILE = PROJECT_ROOT / "strategies" / "fundamental.py"
BRIDGE_SCRIPT = PROJECT_ROOT / "websocket_bridge.py"

class Supervisor:
    def __init__(self):
        self.connection = None
        self.portfolio = {}
        self.positions = []
        self.last_trade_time = datetime.now()
        self.start_time = datetime.now()
        self.intervention_count = 0
        self.min_edge_val = 2.0
        self.success_condition_met = False
        self.process = None

    async def ensure_bridge_running(self):
        """Check if bridge is running, start if not."""
        try:
            async with websockets.connect(WS_URL):
                logger.info("Bridge is already running.")
                return True
        except (ConnectionRefusedError, OSError):
            logger.info("Bridge not running. Starting it...")
            # Start process in new window to keep it alive
            if sys.platform == 'win32':
                creation_flags = subprocess.CREATE_NEW_CONSOLE
            else:
                creation_flags = 0
                
            self.process = subprocess.Popen(
                [sys.executable, str(BRIDGE_SCRIPT)],
                cwd=str(PROJECT_ROOT),
                creationflags=creation_flags
            )
            # Wait for startup
            for _ in range(10):
                try:
                    await asyncio.sleep(2)
                    async with websockets.connect(WS_URL):
                        logger.info("Bridge started successfully.")
                        return True
                except:
                    pass
            logger.error("Failed to start bridge.")
            return False

    async def modify_strategy(self):
        """Reduce min_edge and min_liquidity in strategy file."""
        self.intervention_count += 1
        logger.info(f"INTERVENTION #{self.intervention_count}: Modifying strategy parameters...")
        
        try:
            with open(STRATEGY_FILE, 'r') as f:
                content = f.read()
            
            # Reduce min_edge
            new_edge = max(0.1, self.min_edge_val - 0.5)
            self.min_edge_val = new_edge
            
            # Reduce min_liquidity
            # Extract current min_liquidity
            liq_match = re.search(r"min_liquidity: float = (\d+(\.\d+)?)", content)
            if liq_match:
                curr_liq = float(liq_match.group(1))
                new_liq = max(0.01, curr_liq - 0.1)
                content = re.sub(
                    r"min_liquidity: float = \d+(\.\d+)?",
                    f"min_liquidity: float = {new_liq}",
                    content
                )
                # Also replace in __init__ defaults
                content = re.sub(
                    r"self\.min_liquidity = \d+(\.\d+)?",
                    f"self.min_liquidity = {new_liq}",
                    content
                )
                logger.info(f"Reduced min_liquidity to {new_liq}")
            
            # Use regex to replace min_edge
            new_content = re.sub(
                r"min_edge: float = \d+(\.\d+)?",
                f"min_edge: float = {new_edge}",
                content
            )
            
            # Also replace in __init__ defaults if present
            new_content = re.sub(
                r"self\.min_edge = \d+(\.\d+)?",
                f"self.min_edge = {new_edge}",
                new_content
            )

            with open(STRATEGY_FILE, 'w') as f:
                f.write(new_content)
                
            logger.info(f"Reduced min_edge to {new_edge}")
            return True
        except Exception as e:
            logger.error(f"Failed to modify strategy: {e}")
            return False

    async def run(self):
        await self.ensure_bridge_running()
        
        while not self.success_condition_met:
            try:
                logger.info("Connecting to supervisor...")
                async with websockets.connect(WS_URL) as websocket:
                    self.connection = websocket
                    logger.info("Connected.")
                    
                    # Start Bot
                    await websocket.send(json.dumps({"type": "COMMAND", "payload": {"command": "START"}}))
                    
                    async for message in websocket:
                        data = json.loads(message)
                        msg_type = data.get("type")
                        payload = data.get("payload", {})
                        
                        if msg_type == "INITIAL_STATE" or msg_type == "UPDATE_PORTFOLIO":
                            if "portfolio" in payload:
                                self.portfolio = payload["portfolio"]
                            elif msg_type == "UPDATE_PORTFOLIO":
                                self.portfolio = payload # structure differs potentially

                            # Normalize portfolio data
                            pnl = self.portfolio.get("daily_pnl", 0)
                            balance = self.portfolio.get("balance", 0)
                            
                            logger.info(f"Status: PnL=${pnl:.2f} | Balance=${balance:.2f} | Positions={self.portfolio.get('active_positions_count', 0)}")
                            
                            # SUCCESS CHECK
                            if pnl > 5.0:
                                logger.info("SUCCESS CONDITION MET! PnL > $5.00")
                                self.success_condition_met = True
                                
                                # Generate Report
                                report = f"""
                                # FINAL SUPERVISION REPORT
                                - Net Profit: ${pnl:.2f}
                                - Trades Executed: {self.portfolio.get('active_positions_count', 'N/A')} (Approx)
                                - Strategy Changes: {self.intervention_count}
                                - Final Config: min_edge={self.min_edge_val}
                                """
                                with open("final_report.md", "w") as f:
                                    f.write(report)
                                    
                                logger.info("Report generated. Exiting.")
                                await websocket.send(json.dumps({"type": "COMMAND", "payload": {"command": "STOP"}}))
                                return

                        # Check Inactivity (Simulated by checking last log or trade count)
                        # Since we don't get a stream of trades easily without parsing logs, 
                        # we check if active_positions_count is 0 for too long.
                        
                        time_since_trade = (datetime.now() - self.last_trade_time).total_seconds()
                        
                        # LOGIC: If inactive for 45 seconds and no positions
                        if (datetime.now() - self.start_time).total_seconds() > 60 and \
                           self.portfolio.get("active_positions_count", 0) == 0 and \
                           time_since_trade > 45:
                            
                            logger.warning("Detected inactivity.")
                            modified = await self.modify_strategy()
                            if modified:
                                await websocket.send(json.dumps({"type": "COMMAND", "payload": {"command": "RESTART"}}))
                                logger.info("Sent RESTART command. Reconnecting...")
                                self.last_trade_time = datetime.now() # Reset timer
                                break # Break inner loop to reconnect
                            
            except websockets.exceptions.ConnectionClosed:
                logger.warning("Connection closed. Retrying in 5s...")
                await asyncio.sleep(5)
            except Exception as e:
                logger.error(f"Error: {e}")
                await asyncio.sleep(5)

if __name__ == "__main__":
    supervisor = Supervisor()
    asyncio.run(supervisor.run())
