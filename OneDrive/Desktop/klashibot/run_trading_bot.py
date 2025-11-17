#!/usr/bin/env python3
"""
Kalshi Trading Bot Runner with TUI/CLI Integration

This is the main entry point for the trading bot that integrates
with the shared state for TUI dashboard and CLI commander.
"""

import asyncio
import sys
import signal
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Any

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

import structlog
from src.shared_state import SharedStateManager, CommandQueue, TradingLog
from src.config import config

logger = structlog.get_logger(__name__)


class IntegratedTradingBot:
    """Trading bot with TUI/CLI integration via shared state"""

    def __init__(self):
        self.state_manager = SharedStateManager()
        self.command_queue = CommandQueue()
        self.trading_log = TradingLog()

        # Bot components (will be initialized)
        self.client = None
        self.data_manager = None
        self.model_manager = None
        self.strategy_engine = None
        self.execution_manager = None
        self.risk_manager = None
        self.monitoring_system = None
        self.growth_manager = None
        self.capital_manager = None

        # Bot state
        self.is_running = False
        self.tickers_to_trade: List[str] = []
        self.analysis_interval = 300  # 5 minutes default
        self.start_time = None
        self.last_cycle_time = None

        # Signal handler for graceful shutdown
        signal.signal(signal.SIGINT, self._handle_shutdown)
        signal.signal(signal.SIGTERM, self._handle_shutdown)

    def _handle_shutdown(self, signum, frame):
        """Handle shutdown signals"""
        logger.info("Shutdown signal received")
        self.is_running = False

    async def initialize(self):
        """Initialize bot components"""
        try:
            logger.info("Initializing Integrated Trading Bot")
            self.trading_log.add_entry("INFO", "Bot initialization started")

            # Update state
            self.state_manager.update_bot_info(
                is_running=False,
                mode="initializing",
                start_time=datetime.now().isoformat()
            )

            # Validate configuration
            if not config.validate_config():
                raise ValueError("Configuration validation failed")

            # Import bot components
            from src.kalshi_client import KalshiAPIClient
            from src.data_manager import DataManager
            from src.models import ModelManager
            from src.strategy import StrategyEngine
            from src.execution import ExecutionManager
            from src.risk_manager import RiskManager
            from src.monitoring import MonitoringSystem
            from src.realistic_growth import RealisticGrowthManager, DailyCapitalManager

            # Initialize API client
            self.client = KalshiAPIClient()
            await self.client.__aenter__()
            self.trading_log.add_entry("INFO", "Kalshi API client connected")

            # Initialize data manager
            self.data_manager = DataManager()
            await self.data_manager.initialize()
            self.trading_log.add_entry("INFO", "Data manager initialized")

            # Initialize model manager
            self.model_manager = ModelManager(self.data_manager)

            # Initialize strategy engine
            self.strategy_engine = StrategyEngine(self.data_manager, self.model_manager)

            # Initialize execution manager
            self.execution_manager = ExecutionManager(self.client)
            await self.execution_manager.initialize()
            self.trading_log.add_entry("INFO", "Execution manager ready")

            # Initialize risk manager
            self.risk_manager = RiskManager()

            # Initialize monitoring system
            self.monitoring_system = MonitoringSystem()
            await self.monitoring_system.start_monitoring()

            # Initialize growth manager
            self.growth_manager = RealisticGrowthManager(self.client)
            await self.growth_manager.initialize()

            # Initialize capital manager
            self.capital_manager = DailyCapitalManager(self.client)
            await self.capital_manager.initialize()

            # Update growth state
            growth_summary = self.growth_manager.get_growth_summary()
            self.state_manager.update_growth(
                phase=growth_summary.get("current_phase", 1),
                phase_name=growth_summary.get("phase_name", "Foundation"),
                days=growth_summary.get("days_in_phase", 0),
                target=growth_summary.get("target_balance", 100.0),
                starting=config.dual_strategy.starting_balance
            )

            self.state_manager.update_bot_info(mode="idle")
            self.trading_log.add_entry("INFO", "Bot initialization completed successfully")
            logger.info("Bot initialization completed successfully")

        except Exception as e:
            error_msg = f"Failed to initialize bot: {str(e)}"
            logger.error(error_msg)
            self.trading_log.add_entry("ERROR", error_msg)
            self.state_manager.add_error(error_msg)
            raise

    async def cleanup(self):
        """Cleanup all bot components"""
        try:
            logger.info("Cleaning up bot components")
            self.trading_log.add_entry("INFO", "Bot cleanup started")

            # Stop monitoring
            if self.monitoring_system:
                await self.monitoring_system.stop_monitoring()

            # Stop execution monitoring
            if self.execution_manager:
                await self.execution_manager.stop_monitoring()

            # Cleanup data manager
            if self.data_manager:
                await self.data_manager.cleanup()

            # Close API client
            if self.client:
                await self.client.__aexit__(None, None, None)

            # Update state
            self.state_manager.update_bot_info(
                is_running=False,
                mode="stopped"
            )

            self.trading_log.add_entry("INFO", "Bot cleanup completed")
            logger.info("Bot cleanup completed")

        except Exception as e:
            logger.error("Error during cleanup", error=str(e))

    async def start_trading(self, tickers: List[str]):
        """Start trading with specified tickers"""
        try:
            logger.info("Starting trading", tickers=tickers)
            self.trading_log.add_entry("INFO", f"Starting trading with: {', '.join(tickers)}")

            self.tickers_to_trade = tickers
            self.is_running = True
            self.start_time = datetime.now()

            # Update state
            self.state_manager.update_bot_info(
                is_running=True,
                mode="trading",
                start_time=self.start_time.isoformat()
            )
            self.state_manager.update_tickers(tickers)

            # Start execution monitoring
            await self.execution_manager.start_monitoring()

            # Main trading loop
            while self.is_running:
                try:
                    # Process any pending commands
                    await self._process_commands()

                    # Execute trading cycle
                    await self._trading_cycle()

                    # Update cycle times
                    self.last_cycle_time = datetime.now()
                    next_cycle = self.last_cycle_time + timedelta(seconds=self.analysis_interval)

                    self.state_manager.update_cycle_times(
                        last=self.last_cycle_time.isoformat(),
                        next_cycle=next_cycle.isoformat(),
                        interval=self.analysis_interval
                    )

                    # Update uptime
                    if self.start_time:
                        uptime = int((datetime.now() - self.start_time).total_seconds())
                        self.state_manager.update_bot_info(uptime_seconds=uptime)

                    # Wait for next cycle
                    await asyncio.sleep(self.analysis_interval)

                except Exception as e:
                    error_msg = f"Error in trading cycle: {str(e)}"
                    logger.error(error_msg)
                    self.trading_log.add_entry("ERROR", error_msg)
                    self.state_manager.add_error(error_msg)
                    await asyncio.sleep(60)  # Wait before retrying

        except Exception as e:
            error_msg = f"Failed to start trading: {str(e)}"
            logger.error(error_msg)
            self.trading_log.add_entry("ERROR", error_msg)
            raise
        finally:
            self.state_manager.update_bot_info(
                is_running=False,
                mode="stopped"
            )

    async def stop_trading(self):
        """Stop trading"""
        logger.info("Stopping trading")
        self.trading_log.add_entry("INFO", "Stopping trading bot")
        self.is_running = False

        # Cancel all active orders
        if self.execution_manager:
            await self.execution_manager.cancel_all_orders()
            self.trading_log.add_entry("INFO", "All pending orders cancelled")

        self.state_manager.update_bot_info(
            is_running=False,
            mode="stopped"
        )

    async def _trading_cycle(self):
        """Execute one trading cycle"""
        try:
            logger.info("Starting trading cycle")
            self.trading_log.add_entry("INFO", "Trading cycle started")

            # Update portfolio and positions
            await self.execution_manager.position_manager.update_portfolio()
            await self.execution_manager.position_manager.update_positions()

            portfolio_value = self.execution_manager.position_manager.portfolio_value
            cash_balance = self.execution_manager.position_manager.cash_balance
            positions = self.execution_manager.position_manager.get_all_positions()

            # Calculate P&L
            total_pnl = sum(pos.unrealized_pnl + pos.realized_pnl for pos in positions.values())
            daily_pnl = self.risk_manager.portfolio_risk_manager.get_daily_pnl()

            # Update portfolio state
            self.state_manager.update_portfolio(
                total_value=portfolio_value,
                cash_balance=cash_balance,
                daily_pnl=daily_pnl,
                total_pnl=total_pnl,
                starting_balance=config.dual_strategy.starting_balance
            )

            # Update positions state
            positions_list = []
            for ticker, pos in positions.items():
                positions_list.append({
                    "ticker": ticker,
                    "side": pos.side,
                    "quantity": pos.quantity,
                    "entry_price": pos.entry_price,
                    "current_price": pos.current_price,
                    "unrealized_pnl": pos.unrealized_pnl,
                    "realized_pnl": pos.realized_pnl
                })
            self.state_manager.update_positions(positions_list)

            # Update risk metrics
            risk_metrics = self.risk_manager.update_risk_metrics(
                positions, portfolio_value, cash_balance
            )

            self.state_manager.update_risk(
                exposure=risk_metrics.get("total_exposure", 0),
                max_exposure=config.risk.max_portfolio_risk,
                daily_loss=daily_pnl if daily_pnl < 0 else 0,
                max_daily_loss=config.risk.max_daily_loss,
                risk_level=risk_metrics.get("risk_level", "LOW"),
                stop_loss=risk_metrics.get("stop_loss_triggered", False)
            )

            # Check if we should stop trading due to risk
            if self.risk_manager.should_stop_trading():
                logger.critical("Risk limits exceeded, stopping trading")
                self.trading_log.add_entry("WARNING", "Risk limits exceeded - trading stopped")
                await self.stop_trading()
                return

            # Analyze markets and generate signals
            signals = await self.strategy_engine.analyze_markets(
                self.tickers_to_trade, portfolio_value
            )

            # Track signals
            signals_executed = 0
            signals_rejected = 0

            # Process signals
            for signal in signals:
                # Enhance signal for realistic growth phase
                enhanced_signal = self.growth_manager.enhance_signal_for_growth_phase(signal)

                # Validate signal against risk limits
                is_valid, reasons = self.risk_manager.validate_signal(
                    enhanced_signal, portfolio_value, positions
                )

                if not is_valid:
                    logger.warning("Signal rejected", ticker=signal.ticker, reasons=reasons)
                    self.trading_log.add_entry("SIGNAL", f"Rejected: {signal.ticker} - {', '.join(reasons)}")
                    signals_rejected += 1
                    continue

                # Execute signal
                result = await self.execution_manager.execute_signal(enhanced_signal)

                if result.success:
                    signals_executed += 1
                    self.trading_log.add_entry(
                        "TRADE",
                        f"Executed: {signal.ticker} {signal.side} {signal.quantity}@${signal.price:.2f}"
                    )

                    # Update last signal
                    self.state_manager.update_signals(
                        last_signal={
                            "ticker": signal.ticker,
                            "action": signal.side,
                            "edge": signal.expected_value,
                            "price": signal.price,
                            "quantity": signal.quantity,
                            "timestamp": datetime.now().isoformat()
                        },
                        signals_today=len(signals),
                        executed=signals_executed,
                        rejected=signals_rejected
                    )

                    logger.info("Signal executed successfully", ticker=signal.ticker)
                else:
                    signals_rejected += 1
                    self.trading_log.add_entry("ERROR", f"Execution failed: {signal.ticker} - {result.error_message}")
                    logger.error("Signal execution failed", ticker=signal.ticker, error=result.error_message)

            # Update performance metrics
            strategy_metrics = self.strategy_engine.get_strategy_metrics()

            self.state_manager.update_performance(
                win_rate=strategy_metrics.win_rate,
                total_trades=strategy_metrics.total_trades,
                winning=strategy_metrics.winning_trades,
                losing=strategy_metrics.losing_trades,
                avg_profit=strategy_metrics.avg_profit,
                avg_loss=strategy_metrics.avg_loss,
                sharpe=strategy_metrics.sharpe_ratio if hasattr(strategy_metrics, 'sharpe_ratio') else 0.0,
                max_drawdown=strategy_metrics.max_drawdown if hasattr(strategy_metrics, 'max_drawdown') else 0.0
            )

            # Update orders state
            pending_orders = self.execution_manager.get_pending_orders()
            filled_today = self.execution_manager.get_filled_count_today()
            cancelled_today = self.execution_manager.get_cancelled_count_today()

            self.state_manager.update_orders(
                pending=pending_orders,
                filled_today=filled_today,
                cancelled_today=cancelled_today
            )

            self.trading_log.add_entry("INFO", f"Cycle completed: {len(signals)} signals, {signals_executed} executed")
            logger.info("Trading cycle completed",
                       n_signals=len(signals),
                       executed=signals_executed,
                       rejected=signals_rejected)

        except Exception as e:
            error_msg = f"Error in trading cycle: {str(e)}"
            logger.error(error_msg)
            self.trading_log.add_entry("ERROR", error_msg)
            self.state_manager.add_error(error_msg)

    async def _process_commands(self):
        """Process pending commands from CLI"""
        commands = self.command_queue.get_pending_commands()

        for cmd in commands:
            try:
                command = cmd["command"]
                params = cmd["params"]
                timestamp = cmd["timestamp"]

                logger.info("Processing command", command=command, params=params)

                if command == "stop":
                    await self.stop_trading()

                elif command == "add_ticker":
                    ticker = params.get("ticker")
                    if ticker and ticker not in self.tickers_to_trade:
                        self.tickers_to_trade.append(ticker)
                        self.state_manager.update_tickers(self.tickers_to_trade)
                        self.trading_log.add_entry("INFO", f"Added ticker: {ticker}")

                elif command == "remove_ticker":
                    ticker = params.get("ticker")
                    if ticker and ticker in self.tickers_to_trade:
                        self.tickers_to_trade.remove(ticker)
                        self.state_manager.update_tickers(self.tickers_to_trade)
                        self.trading_log.add_entry("INFO", f"Removed ticker: {ticker}")

                elif command == "set_interval":
                    seconds = params.get("seconds", 300)
                    self.analysis_interval = seconds
                    self.trading_log.add_entry("INFO", f"Interval set to {seconds}s")

                elif command == "cancel_orders":
                    await self.execution_manager.cancel_all_orders()
                    self.trading_log.add_entry("INFO", "All orders cancelled")

                elif command == "close_position":
                    ticker = params.get("ticker")
                    if ticker:
                        await self.execution_manager.close_position(ticker)
                        self.trading_log.add_entry("INFO", f"Closed position: {ticker}")

                elif command == "close_all":
                    await self.execution_manager.close_all_positions()
                    self.trading_log.add_entry("INFO", "All positions closed")

                elif command == "train":
                    tickers = params.get("tickers", [])
                    if tickers:
                        self.state_manager.update_bot_info(mode="training")
                        await self._train_models(tickers)
                        self.state_manager.update_bot_info(mode="trading")

                # Mark command as processed
                self.command_queue.mark_command_processed(timestamp)

            except Exception as e:
                error_msg = f"Error processing command {cmd.get('command')}: {str(e)}"
                logger.error(error_msg)
                self.trading_log.add_entry("ERROR", error_msg)
                self.command_queue.mark_command_processed(cmd["timestamp"])

    async def _train_models(self, tickers: List[str]):
        """Train models for specified tickers"""
        logger.info("Training models", tickers=tickers)
        self.trading_log.add_entry("INFO", f"Training models for: {', '.join(tickers)}")

        for ticker in tickers:
            try:
                performances = self.model_manager.train_models(ticker)
                self.trading_log.add_entry("INFO", f"Model trained: {ticker}")
                logger.info("Model training completed", ticker=ticker)
            except Exception as e:
                error_msg = f"Failed to train model for {ticker}: {str(e)}"
                logger.error(error_msg)
                self.trading_log.add_entry("ERROR", error_msg)


async def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print("Usage: python run_trading_bot.py <ticker1> [ticker2] ...")
        print("Example: python run_trading_bot.py KXBTC KXETH")
        sys.exit(1)

    tickers = [t.upper() for t in sys.argv[1:]]

    print(f"""
╔═══════════════════════════════════════════════════════════════════╗
║                    KLASHIBOT TRADING BOT                         ║
║              High-Frequency Kalshi Trading Engine                ║
╚═══════════════════════════════════════════════════════════════════╝
    """)

    print(f"Starting bot with tickers: {', '.join(tickers)}")
    print("Press Ctrl+C to stop the bot\n")

    bot = IntegratedTradingBot()

    try:
        await bot.initialize()
        await bot.start_trading(tickers)

    except KeyboardInterrupt:
        print("\nBot stopped by user")
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
    finally:
        await bot.cleanup()


if __name__ == "__main__":
    asyncio.run(main())
