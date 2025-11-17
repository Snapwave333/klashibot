#!/usr/bin/env python3
"""
Kalshi Trading Bot CLI Commander

Interactive CLI for sending commands to the running trading bot.
Works alongside the TUI dashboard in a separate terminal window.
"""

import sys
import cmd
import time
from pathlib import Path
from datetime import datetime

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import box

from src.shared_state import SharedStateManager, CommandQueue, TradingLog

console = Console()


class KlashibotCLI(cmd.Cmd):
    """Interactive CLI for controlling the trading bot"""

    intro = None  # We'll print our own banner
    prompt = "[bold cyan]klashibot>[/bold cyan] "
    doc_header = "Available Commands (type help <command> for details):"

    def __init__(self):
        super().__init__()
        self.state_manager = SharedStateManager()
        self.command_queue = CommandQueue()
        self.trading_log = TradingLog()
        self.prompt = "klashibot> "  # Simple prompt for cmd.Cmd

    def preloop(self):
        """Print banner before starting CLI"""
        self._print_banner()

    def _print_banner(self):
        """Print CLI banner"""
        banner = """
╔═══════════════════════════════════════════════════════════════════╗
║                    KLASHIBOT CLI COMMANDER                       ║
║                  Control Your Trading Bot                        ║
╚═══════════════════════════════════════════════════════════════════╝
        """
        console.print(banner, style="bold green")
        console.print("Type [cyan]help[/cyan] to see available commands.\n")

    def _send_command(self, command: str, params: dict = None):
        """Send command to the bot"""
        self.command_queue.send_command(command, params or {})
        console.print(f"[green]✓[/green] Command sent: [cyan]{command}[/cyan]")
        self.trading_log.add_entry("INFO", f"CLI command: {command}")

    def do_start(self, arg):
        """Start the trading bot with specified tickers
        Usage: start <ticker1> [ticker2] ...
        Example: start KXBTC KXETH"""
        args = arg.strip().split()
        if not args:
            console.print("[red]Error:[/red] Please specify at least one ticker")
            console.print("Usage: start <ticker1> [ticker2] ...")
            return

        tickers = [t.upper() for t in args]
        self._send_command("start", {"tickers": tickers})
        console.print(f"Starting bot with tickers: {', '.join(tickers)}")

    def do_stop(self, arg):
        """Stop the trading bot
        Usage: stop"""
        self._send_command("stop", {})
        console.print("[yellow]Stopping trading bot...[/yellow]")

    def do_status(self, arg):
        """Show current bot status
        Usage: status"""
        state = self.state_manager.get_state()

        table = Table(title="Bot Status", box=box.ROUNDED)
        table.add_column("Property", style="cyan")
        table.add_column("Value", style="white")

        bot_info = state["bot_info"]
        portfolio = state["portfolio"]

        status = "[green]RUNNING[/green]" if bot_info["is_running"] else "[red]STOPPED[/red]"
        table.add_row("Status", status)
        table.add_row("Mode", bot_info.get("mode", "idle"))
        table.add_row("Version", bot_info.get("version", "1.1.0"))
        table.add_row("Tickers", ", ".join(state["tickers"]) or "None")
        table.add_row("Portfolio Value", f"${portfolio['total_value']:.2f}")
        table.add_row("Daily P&L", f"${portfolio['daily_pnl']:.2f}")
        table.add_row("Positions", str(len(state["positions"])))
        table.add_row("Risk Level", state["risk"]["risk_level"])
        table.add_row("Last Update", bot_info.get("last_update", "N/A"))

        console.print(table)

    def do_portfolio(self, arg):
        """Show detailed portfolio information
        Usage: portfolio"""
        state = self.state_manager.get_state()
        portfolio = state["portfolio"]

        table = Table(title="Portfolio Details", box=box.ROUNDED)
        table.add_column("Metric", style="cyan")
        table.add_column("Value", justify="right", style="white")

        table.add_row("Total Value", f"${portfolio['total_value']:.2f}")
        table.add_row("Cash Balance", f"${portfolio['cash_balance']:.2f}")
        table.add_row("Invested", f"${portfolio['invested_value']:.2f}")

        # P&L with colors
        daily_pnl = portfolio['daily_pnl']
        total_pnl = portfolio['total_pnl']
        daily_color = "green" if daily_pnl >= 0 else "red"
        total_color = "green" if total_pnl >= 0 else "red"

        table.add_row("Daily P&L", f"[{daily_color}]${daily_pnl:+.2f} ({portfolio['daily_pnl_percent']:+.1f}%)[/{daily_color}]")
        table.add_row("Total P&L", f"[{total_color}]${total_pnl:+.2f} ({portfolio['total_pnl_percent']:+.1f}%)[/{total_color}]")

        console.print(table)

    def do_positions(self, arg):
        """Show current positions
        Usage: positions"""
        state = self.state_manager.get_state()
        positions = state["positions"]

        if not positions:
            console.print("[yellow]No open positions[/yellow]")
            return

        table = Table(title=f"Open Positions ({len(positions)})", box=box.ROUNDED)
        table.add_column("Ticker", style="cyan")
        table.add_column("Side", justify="center")
        table.add_column("Qty", justify="right")
        table.add_column("Entry", justify="right")
        table.add_column("Current", justify="right")
        table.add_column("P&L", justify="right")

        for pos in positions:
            pnl = pos.get("unrealized_pnl", 0)
            pnl_color = "green" if pnl >= 0 else "red"
            side_color = "green" if pos.get("side", "YES") == "YES" else "red"

            table.add_row(
                pos.get("ticker", "N/A"),
                f"[{side_color}]{pos.get('side', 'YES')}[/{side_color}]",
                str(pos.get("quantity", 0)),
                f"${pos.get('entry_price', 0):.2f}",
                f"${pos.get('current_price', 0):.2f}",
                f"[{pnl_color}]${pnl:+.2f}[/{pnl_color}]"
            )

        console.print(table)

    def do_risk(self, arg):
        """Show risk metrics
        Usage: risk"""
        state = self.state_manager.get_state()
        risk = state["risk"]

        table = Table(title="Risk Metrics", box=box.ROUNDED)
        table.add_column("Metric", style="cyan")
        table.add_column("Value", justify="right", style="white")

        risk_colors = {
            "LOW": "green",
            "MEDIUM": "yellow",
            "HIGH": "red",
            "CRITICAL": "bold red"
        }
        risk_color = risk_colors.get(risk["risk_level"], "white")

        table.add_row("Risk Level", f"[{risk_color}]{risk['risk_level']}[/{risk_color}]")
        table.add_row("Current Exposure", f"{risk['current_exposure']*100:.1f}%")
        table.add_row("Max Exposure", f"{risk['max_exposure']*100:.1f}%")
        table.add_row("Daily Loss", f"${risk['daily_loss']:.2f}")
        table.add_row("Max Daily Loss", f"${risk['max_daily_loss']:.2f}")

        if risk["stop_loss_triggered"]:
            table.add_row("Stop Loss", "[bold red]TRIGGERED[/bold red]")

        console.print(table)

    def do_performance(self, arg):
        """Show performance metrics
        Usage: performance"""
        state = self.state_manager.get_state()
        perf = state["performance"]

        table = Table(title="Performance Metrics", box=box.ROUNDED)
        table.add_column("Metric", style="cyan")
        table.add_column("Value", justify="right", style="white")

        win_rate = perf["win_rate"]
        win_color = "green" if win_rate >= 0.5 else "red"

        table.add_row("Win Rate", f"[{win_color}]{win_rate*100:.1f}%[/{win_color}]")
        table.add_row("Total Trades", str(perf["total_trades"]))
        table.add_row("Winning Trades", f"[green]{perf['winning_trades']}[/green]")
        table.add_row("Losing Trades", f"[red]{perf['losing_trades']}[/red]")
        table.add_row("Avg Profit", f"[green]${perf['avg_profit']:.3f}[/green]")
        table.add_row("Avg Loss", f"[red]${perf['avg_loss']:.3f}[/red]")
        table.add_row("Sharpe Ratio", f"{perf['sharpe_ratio']:.2f}")
        table.add_row("Max Drawdown", f"{perf['max_drawdown']:.1f}%")

        console.print(table)

    def do_add_ticker(self, arg):
        """Add a ticker to the trading list
        Usage: add_ticker <ticker>
        Example: add_ticker KXBTC"""
        ticker = arg.strip().upper()
        if not ticker:
            console.print("[red]Error:[/red] Please specify a ticker")
            return

        self._send_command("add_ticker", {"ticker": ticker})
        console.print(f"Adding ticker: [cyan]{ticker}[/cyan]")

    def do_remove_ticker(self, arg):
        """Remove a ticker from the trading list
        Usage: remove_ticker <ticker>
        Example: remove_ticker KXBTC"""
        ticker = arg.strip().upper()
        if not ticker:
            console.print("[red]Error:[/red] Please specify a ticker")
            return

        self._send_command("remove_ticker", {"ticker": ticker})
        console.print(f"Removing ticker: [cyan]{ticker}[/cyan]")

    def do_train(self, arg):
        """Train ML models for specified tickers
        Usage: train <ticker1> [ticker2] ...
        Example: train KXBTC KXETH"""
        args = arg.strip().split()
        if not args:
            console.print("[red]Error:[/red] Please specify at least one ticker")
            return

        tickers = [t.upper() for t in args]
        self._send_command("train", {"tickers": tickers})
        console.print(f"Training models for: {', '.join(tickers)}")

    def do_set_interval(self, arg):
        """Set analysis interval in seconds
        Usage: set_interval <seconds>
        Example: set_interval 300"""
        try:
            seconds = int(arg.strip())
            if seconds < 10:
                console.print("[red]Error:[/red] Interval must be at least 10 seconds")
                return
            self._send_command("set_interval", {"seconds": seconds})
            console.print(f"Setting analysis interval to [cyan]{seconds}[/cyan] seconds")
        except ValueError:
            console.print("[red]Error:[/red] Please provide a valid number")

    def do_set_risk(self, arg):
        """Set risk parameters
        Usage: set_risk <parameter> <value>
        Parameters: max_daily_loss, max_exposure, kelly_fraction
        Example: set_risk max_daily_loss 3.0"""
        args = arg.strip().split()
        if len(args) != 2:
            console.print("[red]Error:[/red] Please specify parameter and value")
            console.print("Usage: set_risk <parameter> <value>")
            return

        param, value = args[0], args[1]
        try:
            value = float(value)
            self._send_command("set_risk", {"parameter": param, "value": value})
            console.print(f"Setting [cyan]{param}[/cyan] to [yellow]{value}[/yellow]")
        except ValueError:
            console.print("[red]Error:[/red] Value must be a number")

    def do_cancel_orders(self, arg):
        """Cancel all pending orders
        Usage: cancel_orders"""
        self._send_command("cancel_orders", {})
        console.print("[yellow]Canceling all pending orders...[/yellow]")

    def do_close_position(self, arg):
        """Close a specific position
        Usage: close_position <ticker>
        Example: close_position KXBTC"""
        ticker = arg.strip().upper()
        if not ticker:
            console.print("[red]Error:[/red] Please specify a ticker")
            return

        self._send_command("close_position", {"ticker": ticker})
        console.print(f"Closing position: [cyan]{ticker}[/cyan]")

    def do_close_all(self, arg):
        """Close all positions
        Usage: close_all"""
        confirm = input("Are you sure you want to close ALL positions? (yes/no): ")
        if confirm.lower() == "yes":
            self._send_command("close_all", {})
            console.print("[yellow]Closing all positions...[/yellow]")
        else:
            console.print("Cancelled")

    def do_logs(self, arg):
        """Show recent activity logs
        Usage: logs [count]
        Example: logs 20"""
        try:
            count = int(arg.strip()) if arg.strip() else 10
        except ValueError:
            count = 10

        entries = self.trading_log.get_recent_entries(count)

        if not entries:
            console.print("[yellow]No log entries[/yellow]")
            return

        table = Table(title=f"Recent Activity (last {len(entries)} entries)", box=box.ROUNDED)
        table.add_column("Time", style="dim")
        table.add_column("Type", style="cyan")
        table.add_column("Message", style="white")

        for entry in entries:
            try:
                dt = datetime.fromisoformat(entry["timestamp"])
                time_str = dt.strftime("%H:%M:%S")
            except:
                time_str = "N/A"

            entry_type = entry.get("type", "INFO")
            type_colors = {
                "TRADE": "green",
                "SIGNAL": "cyan",
                "ERROR": "red",
                "WARNING": "yellow",
                "INFO": "white"
            }
            type_color = type_colors.get(entry_type, "white")

            table.add_row(
                time_str,
                f"[{type_color}]{entry_type}[/{type_color}]",
                entry.get("message", "")[:80]
            )

        console.print(table)

    def do_clear_logs(self, arg):
        """Clear all activity logs
        Usage: clear_logs"""
        self.trading_log.clear_log()
        console.print("[green]✓[/green] Logs cleared")

    def do_reset_state(self, arg):
        """Reset shared state to defaults
        Usage: reset_state"""
        confirm = input("Are you sure you want to reset state? (yes/no): ")
        if confirm.lower() == "yes":
            self.state_manager.reset_state()
            console.print("[green]✓[/green] State reset to defaults")
        else:
            console.print("Cancelled")

    def do_growth(self, arg):
        """Show growth strategy information
        Usage: growth"""
        state = self.state_manager.get_state()
        growth = state["growth"]
        portfolio = state["portfolio"]

        table = Table(title="Growth Strategy", box=box.ROUNDED)
        table.add_column("Metric", style="cyan")
        table.add_column("Value", style="white")

        table.add_row("Current Phase", f"{growth['current_phase']} - {growth['phase_name']}")
        table.add_row("Days in Phase", str(growth['days_in_phase']))
        table.add_row("Starting Balance", f"${growth['starting_balance']:.2f}")
        table.add_row("Current Balance", f"${portfolio['total_value']:.2f}")
        table.add_row("Target Balance", f"${growth['target_balance']:.2f}")

        # Progress
        current = portfolio["total_value"]
        starting = growth["starting_balance"]
        target = growth["target_balance"]
        if target > starting:
            progress = (current - starting) / (target - starting) * 100
            progress = max(0, min(100, progress))
        else:
            progress = 0

        table.add_row("Progress", f"{progress:.1f}%")

        console.print(table)

    def do_help(self, arg):
        """Show help for commands
        Usage: help [command]"""
        if arg:
            # Show help for specific command
            super().do_help(arg)
        else:
            # Show all commands grouped
            console.print("\n[bold]Available Commands:[/bold]\n")

            commands = {
                "Trading Control": [
                    ("start <tickers>", "Start trading with specified tickers"),
                    ("stop", "Stop the trading bot"),
                    ("add_ticker <ticker>", "Add a ticker to trade"),
                    ("remove_ticker <ticker>", "Remove a ticker"),
                    ("train <tickers>", "Train ML models for tickers"),
                ],
                "Monitoring": [
                    ("status", "Show bot status overview"),
                    ("portfolio", "Show portfolio details"),
                    ("positions", "Show open positions"),
                    ("risk", "Show risk metrics"),
                    ("performance", "Show performance stats"),
                    ("growth", "Show growth strategy info"),
                    ("logs [count]", "Show recent activity logs"),
                ],
                "Configuration": [
                    ("set_interval <sec>", "Set analysis interval"),
                    ("set_risk <param> <val>", "Set risk parameters"),
                ],
                "Position Management": [
                    ("cancel_orders", "Cancel all pending orders"),
                    ("close_position <ticker>", "Close specific position"),
                    ("close_all", "Close all positions"),
                ],
                "System": [
                    ("clear_logs", "Clear activity logs"),
                    ("reset_state", "Reset shared state"),
                    ("quit", "Exit CLI"),
                ]
            }

            for category, cmds in commands.items():
                console.print(f"[bold cyan]{category}:[/bold cyan]")
                for cmd_name, desc in cmds:
                    console.print(f"  [green]{cmd_name:25}[/green] {desc}")
                console.print()

    def do_quit(self, arg):
        """Exit the CLI
        Usage: quit"""
        console.print("\n[yellow]Goodbye![/yellow]")
        return True

    def do_exit(self, arg):
        """Exit the CLI
        Usage: exit"""
        return self.do_quit(arg)

    def do_q(self, arg):
        """Exit the CLI
        Usage: q"""
        return self.do_quit(arg)

    def default(self, line):
        """Handle unknown commands"""
        console.print(f"[red]Unknown command:[/red] {line}")
        console.print("Type [cyan]help[/cyan] for available commands")

    def emptyline(self):
        """Don't repeat last command on empty line"""
        pass


def main():
    """Main entry point for CLI commander"""
    console.clear()

    try:
        cli = KlashibotCLI()
        cli.cmdloop()
    except KeyboardInterrupt:
        console.print("\n[yellow]CLI closed.[/yellow]")


if __name__ == "__main__":
    main()
