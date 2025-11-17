"""
Shared State Manager for TUI and CLI communication

This module provides a shared state mechanism using a JSON file that allows
the TUI dashboard and CLI to communicate with the running bot.
"""

import json
import os
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional, List
import fcntl
import structlog

logger = structlog.get_logger(__name__)

# State file location
STATE_DIR = Path.home() / ".klashibot"
STATE_FILE = STATE_DIR / "bot_state.json"
COMMAND_FILE = STATE_DIR / "commands.json"
LOG_FILE = STATE_DIR / "trading_log.json"


def ensure_state_dir():
    """Ensure state directory exists"""
    STATE_DIR.mkdir(parents=True, exist_ok=True)


def get_default_state() -> Dict[str, Any]:
    """Get default state structure"""
    return {
        "bot_info": {
            "is_running": False,
            "start_time": None,
            "uptime_seconds": 0,
            "last_update": datetime.now().isoformat(),
            "version": "1.1.0",
            "mode": "idle"
        },
        "portfolio": {
            "total_value": 0.0,
            "cash_balance": 0.0,
            "invested_value": 0.0,
            "daily_pnl": 0.0,
            "total_pnl": 0.0,
            "daily_pnl_percent": 0.0,
            "total_pnl_percent": 0.0
        },
        "positions": [],
        "orders": {
            "pending": [],
            "filled_today": 0,
            "cancelled_today": 0
        },
        "risk": {
            "current_exposure": 0.0,
            "max_exposure": 0.1,
            "daily_loss": 0.0,
            "max_daily_loss": 2.0,
            "risk_level": "LOW",
            "stop_loss_triggered": False
        },
        "performance": {
            "win_rate": 0.0,
            "total_trades": 0,
            "winning_trades": 0,
            "losing_trades": 0,
            "avg_profit": 0.0,
            "avg_loss": 0.0,
            "sharpe_ratio": 0.0,
            "max_drawdown": 0.0
        },
        "growth": {
            "current_phase": 1,
            "phase_name": "Foundation",
            "days_in_phase": 0,
            "target_balance": 100.0,
            "starting_balance": 20.0
        },
        "signals": {
            "last_signal": None,
            "signals_today": 0,
            "signals_executed": 0,
            "signals_rejected": 0
        },
        "tickers": [],
        "errors": [],
        "last_cycle_time": None,
        "next_cycle_time": None,
        "analysis_interval": 300
    }


class SharedStateManager:
    """Manages shared state between TUI and bot"""

    def __init__(self):
        ensure_state_dir()
        self.state = get_default_state()
        self._load_state()

    def _load_state(self):
        """Load state from file"""
        try:
            if STATE_FILE.exists():
                with open(STATE_FILE, 'r') as f:
                    fcntl.flock(f.fileno(), fcntl.LOCK_SH)
                    try:
                        self.state = json.load(f)
                    finally:
                        fcntl.flock(f.fileno(), fcntl.LOCK_UN)
        except Exception as e:
            logger.warning("Failed to load state, using default", error=str(e))
            self.state = get_default_state()

    def _save_state(self):
        """Save state to file"""
        try:
            self.state["bot_info"]["last_update"] = datetime.now().isoformat()
            with open(STATE_FILE, 'w') as f:
                fcntl.flock(f.fileno(), fcntl.LOCK_EX)
                try:
                    json.dump(self.state, f, indent=2, default=str)
                finally:
                    fcntl.flock(f.fileno(), fcntl.LOCK_UN)
        except Exception as e:
            logger.error("Failed to save state", error=str(e))

    def update_bot_info(self, **kwargs):
        """Update bot information"""
        self.state["bot_info"].update(kwargs)
        self._save_state()

    def update_portfolio(self, total_value: float, cash_balance: float,
                        daily_pnl: float, total_pnl: float, starting_balance: float = 20.0):
        """Update portfolio information"""
        invested = total_value - cash_balance
        daily_pnl_pct = (daily_pnl / starting_balance * 100) if starting_balance > 0 else 0
        total_pnl_pct = (total_pnl / starting_balance * 100) if starting_balance > 0 else 0

        self.state["portfolio"].update({
            "total_value": total_value,
            "cash_balance": cash_balance,
            "invested_value": invested,
            "daily_pnl": daily_pnl,
            "total_pnl": total_pnl,
            "daily_pnl_percent": daily_pnl_pct,
            "total_pnl_percent": total_pnl_pct
        })
        self._save_state()

    def update_positions(self, positions: List[Dict[str, Any]]):
        """Update current positions"""
        self.state["positions"] = positions
        self._save_state()

    def update_orders(self, pending: List[Dict], filled_today: int, cancelled_today: int):
        """Update order information"""
        self.state["orders"].update({
            "pending": pending,
            "filled_today": filled_today,
            "cancelled_today": cancelled_today
        })
        self._save_state()

    def update_risk(self, exposure: float, max_exposure: float, daily_loss: float,
                   max_daily_loss: float, risk_level: str, stop_loss: bool = False):
        """Update risk metrics"""
        self.state["risk"].update({
            "current_exposure": exposure,
            "max_exposure": max_exposure,
            "daily_loss": daily_loss,
            "max_daily_loss": max_daily_loss,
            "risk_level": risk_level,
            "stop_loss_triggered": stop_loss
        })
        self._save_state()

    def update_performance(self, win_rate: float, total_trades: int, winning: int,
                          losing: int, avg_profit: float, avg_loss: float,
                          sharpe: float = 0.0, max_drawdown: float = 0.0):
        """Update performance metrics"""
        self.state["performance"].update({
            "win_rate": win_rate,
            "total_trades": total_trades,
            "winning_trades": winning,
            "losing_trades": losing,
            "avg_profit": avg_profit,
            "avg_loss": avg_loss,
            "sharpe_ratio": sharpe,
            "max_drawdown": max_drawdown
        })
        self._save_state()

    def update_growth(self, phase: int, phase_name: str, days: int,
                     target: float, starting: float):
        """Update growth strategy info"""
        self.state["growth"].update({
            "current_phase": phase,
            "phase_name": phase_name,
            "days_in_phase": days,
            "target_balance": target,
            "starting_balance": starting
        })
        self._save_state()

    def update_signals(self, last_signal: Optional[Dict], signals_today: int,
                      executed: int, rejected: int):
        """Update signal information"""
        self.state["signals"].update({
            "last_signal": last_signal,
            "signals_today": signals_today,
            "signals_executed": executed,
            "signals_rejected": rejected
        })
        self._save_state()

    def update_tickers(self, tickers: List[str]):
        """Update tracked tickers"""
        self.state["tickers"] = tickers
        self._save_state()

    def add_error(self, error_msg: str, timestamp: Optional[str] = None):
        """Add an error to the log"""
        if timestamp is None:
            timestamp = datetime.now().isoformat()

        self.state["errors"].append({
            "timestamp": timestamp,
            "message": error_msg
        })
        # Keep only last 100 errors
        self.state["errors"] = self.state["errors"][-100:]
        self._save_state()

    def update_cycle_times(self, last: Optional[str], next_cycle: Optional[str], interval: int):
        """Update cycle timing information"""
        self.state["last_cycle_time"] = last
        self.state["next_cycle_time"] = next_cycle
        self.state["analysis_interval"] = interval
        self._save_state()

    def get_state(self) -> Dict[str, Any]:
        """Get current state (refresh from file)"""
        self._load_state()
        return self.state

    def reset_state(self):
        """Reset to default state"""
        self.state = get_default_state()
        self._save_state()


class CommandQueue:
    """Manages command queue for CLI to bot communication"""

    def __init__(self):
        ensure_state_dir()
        self._ensure_queue_file()

    def _ensure_queue_file(self):
        """Ensure command queue file exists"""
        if not COMMAND_FILE.exists():
            with open(COMMAND_FILE, 'w') as f:
                json.dump({"commands": []}, f)

    def send_command(self, command: str, params: Dict[str, Any] = None):
        """Send a command to the bot"""
        try:
            with open(COMMAND_FILE, 'r+') as f:
                fcntl.flock(f.fileno(), fcntl.LOCK_EX)
                try:
                    data = json.load(f)
                    data["commands"].append({
                        "command": command,
                        "params": params or {},
                        "timestamp": datetime.now().isoformat(),
                        "processed": False
                    })
                    f.seek(0)
                    json.dump(data, f, indent=2)
                    f.truncate()
                finally:
                    fcntl.flock(f.fileno(), fcntl.LOCK_UN)
        except Exception as e:
            logger.error("Failed to send command", error=str(e))

    def get_pending_commands(self) -> List[Dict[str, Any]]:
        """Get all pending commands"""
        try:
            with open(COMMAND_FILE, 'r') as f:
                fcntl.flock(f.fileno(), fcntl.LOCK_SH)
                try:
                    data = json.load(f)
                    return [cmd for cmd in data["commands"] if not cmd["processed"]]
                finally:
                    fcntl.flock(f.fileno(), fcntl.LOCK_UN)
        except Exception as e:
            logger.error("Failed to get commands", error=str(e))
            return []

    def mark_command_processed(self, timestamp: str):
        """Mark a command as processed"""
        try:
            with open(COMMAND_FILE, 'r+') as f:
                fcntl.flock(f.fileno(), fcntl.LOCK_EX)
                try:
                    data = json.load(f)
                    for cmd in data["commands"]:
                        if cmd["timestamp"] == timestamp:
                            cmd["processed"] = True
                    f.seek(0)
                    json.dump(data, f, indent=2)
                    f.truncate()
                finally:
                    fcntl.flock(f.fileno(), fcntl.LOCK_UN)
        except Exception as e:
            logger.error("Failed to mark command processed", error=str(e))

    def clear_old_commands(self):
        """Clear commands older than 1 hour"""
        try:
            with open(COMMAND_FILE, 'r+') as f:
                fcntl.flock(f.fileno(), fcntl.LOCK_EX)
                try:
                    data = json.load(f)
                    cutoff = datetime.now()
                    # Keep only recent commands
                    data["commands"] = [
                        cmd for cmd in data["commands"]
                        if not cmd["processed"] or
                        (datetime.fromisoformat(cmd["timestamp"]) - cutoff).total_seconds() < 3600
                    ][-50:]  # Keep max 50 commands
                    f.seek(0)
                    json.dump(data, f, indent=2)
                    f.truncate()
                finally:
                    fcntl.flock(f.fileno(), fcntl.LOCK_UN)
        except Exception as e:
            logger.error("Failed to clear old commands", error=str(e))


class TradingLog:
    """Manages trading activity log"""

    def __init__(self):
        ensure_state_dir()
        self._ensure_log_file()

    def _ensure_log_file(self):
        """Ensure log file exists"""
        if not LOG_FILE.exists():
            with open(LOG_FILE, 'w') as f:
                json.dump({"entries": []}, f)

    def add_entry(self, entry_type: str, message: str, data: Dict[str, Any] = None):
        """Add a log entry"""
        try:
            with open(LOG_FILE, 'r+') as f:
                fcntl.flock(f.fileno(), fcntl.LOCK_EX)
                try:
                    log_data = json.load(f)
                    log_data["entries"].append({
                        "timestamp": datetime.now().isoformat(),
                        "type": entry_type,
                        "message": message,
                        "data": data or {}
                    })
                    # Keep only last 500 entries
                    log_data["entries"] = log_data["entries"][-500:]
                    f.seek(0)
                    json.dump(log_data, f, indent=2, default=str)
                    f.truncate()
                finally:
                    fcntl.flock(f.fileno(), fcntl.LOCK_UN)
        except Exception as e:
            logger.error("Failed to add log entry", error=str(e))

    def get_recent_entries(self, count: int = 50) -> List[Dict[str, Any]]:
        """Get recent log entries"""
        try:
            with open(LOG_FILE, 'r') as f:
                fcntl.flock(f.fileno(), fcntl.LOCK_SH)
                try:
                    log_data = json.load(f)
                    return log_data["entries"][-count:]
                finally:
                    fcntl.flock(f.fileno(), fcntl.LOCK_UN)
        except Exception as e:
            logger.error("Failed to get log entries", error=str(e))
            return []

    def clear_log(self):
        """Clear all log entries"""
        try:
            with open(LOG_FILE, 'w') as f:
                fcntl.flock(f.fileno(), fcntl.LOCK_EX)
                try:
                    json.dump({"entries": []}, f)
                finally:
                    fcntl.flock(f.fileno(), fcntl.LOCK_UN)
        except Exception as e:
            logger.error("Failed to clear log", error=str(e))
