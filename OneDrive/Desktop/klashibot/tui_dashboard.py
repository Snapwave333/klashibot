#!/usr/bin/env python3
"""
Kalshi Trading Bot TUI Dashboard

Real-time terminal user interface for monitoring the trading bot.
Runs in a separate window from the CLI/bot.
"""

import sys
import time
from pathlib import Path
from datetime import datetime
from typing import Optional

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from rich.console import Console
from rich.live import Live
from rich.table import Table
from rich.panel import Panel
from rich.layout import Layout
from rich.text import Text
from rich import box
from rich.progress import Progress, SpinnerColumn, TextColumn
from rich.align import Align

from src.shared_state import SharedStateManager, TradingLog


console = Console()


def create_header() -> Panel:
    """Create dashboard header"""
    grid = Table.grid(expand=True)
    grid.add_column(justify="left")
    grid.add_column(justify="center")
    grid.add_column(justify="right")

    grid.add_row(
        "[bold cyan]KLASHIBOT[/bold cyan]",
        "[bold white]Kalshi High-Frequency Trading Bot[/bold white]",
        f"[dim]{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}[/dim]"
    )

    return Panel(grid, box=box.DOUBLE, style="blue")


def create_bot_status(state: dict) -> Panel:
    """Create bot status panel"""
    bot_info = state["bot_info"]

    is_running = bot_info["is_running"]
    status_icon = "[green]●[/green]" if is_running else "[red]●[/red]"
    status_text = "[green]RUNNING[/green]" if is_running else "[red]STOPPED[/red]"

    mode = bot_info.get("mode", "idle").upper()
    mode_colors = {
        "TRADING": "green",
        "TRAINING": "yellow",
        "IDLE": "dim white",
        "ERROR": "red"
    }
    mode_color = mode_colors.get(mode, "white")

    uptime = bot_info.get("uptime_seconds", 0)
    hours = uptime // 3600
    minutes = (uptime % 3600) // 60
    seconds = uptime % 60

    tickers = ", ".join(state["tickers"]) if state["tickers"] else "None"

    table = Table(box=None, show_header=False, padding=(0, 1))
    table.add_column("Label", style="dim")
    table.add_column("Value")

    table.add_row("Status:", f"{status_icon} {status_text}")
    table.add_row("Mode:", f"[{mode_color}]{mode}[/{mode_color}]")
    table.add_row("Uptime:", f"{hours:02d}:{minutes:02d}:{seconds:02d}")
    table.add_row("Version:", bot_info.get("version", "1.1.0"))
    table.add_row("Tickers:", f"[cyan]{tickers}[/cyan]")
    table.add_row("Interval:", f"{state['analysis_interval']}s")

    if state["last_cycle_time"]:
        try:
            last_dt = datetime.fromisoformat(state["last_cycle_time"])
            ago = int((datetime.now() - last_dt).total_seconds())
            table.add_row("Last Cycle:", f"{ago}s ago")
        except:
            table.add_row("Last Cycle:", "N/A")

    return Panel(table, title="[bold]Bot Status[/bold]", border_style="blue")


def create_portfolio_panel(state: dict) -> Panel:
    """Create portfolio overview panel"""
    portfolio = state["portfolio"]

    total_value = portfolio["total_value"]
    cash = portfolio["cash_balance"]
    invested = portfolio["invested_value"]
    daily_pnl = portfolio["daily_pnl"]
    total_pnl = portfolio["total_pnl"]
    daily_pnl_pct = portfolio["daily_pnl_percent"]
    total_pnl_pct = portfolio["total_pnl_percent"]

    # Color based on P&L
    daily_color = "green" if daily_pnl >= 0 else "red"
    total_color = "green" if total_pnl >= 0 else "red"
    daily_arrow = "▲" if daily_pnl > 0 else "▼" if daily_pnl < 0 else "─"
    total_arrow = "▲" if total_pnl > 0 else "▼" if total_pnl < 0 else "─"

    table = Table(box=None, show_header=False, padding=(0, 1))
    table.add_column("Label", style="dim")
    table.add_column("Value", justify="right")

    table.add_row("Total Value:", f"[bold white]${total_value:.2f}[/bold white]")
    table.add_row("Cash:", f"${cash:.2f}")
    table.add_row("Invested:", f"${invested:.2f}")
    table.add_row("", "")
    table.add_row("Daily P&L:",
                  f"[{daily_color}]{daily_arrow} ${abs(daily_pnl):.2f} ({daily_pnl_pct:+.1f}%)[/{daily_color}]")
    table.add_row("Total P&L:",
                  f"[{total_color}]{total_arrow} ${abs(total_pnl):.2f} ({total_pnl_pct:+.1f}%)[/{total_color}]")

    return Panel(table, title="[bold]Portfolio[/bold]", border_style="green")


def create_positions_table(state: dict) -> Panel:
    """Create positions table"""
    positions = state["positions"]

    table = Table(box=box.SIMPLE, expand=True)
    table.add_column("Ticker", style="cyan", no_wrap=True)
    table.add_column("Side", justify="center")
    table.add_column("Qty", justify="right")
    table.add_column("Entry", justify="right")
    table.add_column("Current", justify="right")
    table.add_column("P&L", justify="right")

    if not positions:
        table.add_row("[dim]No open positions[/dim]", "", "", "", "", "")
    else:
        for pos in positions[:8]:  # Show max 8 positions
            pnl = pos.get("unrealized_pnl", 0)
            pnl_color = "green" if pnl >= 0 else "red"
            side_color = "green" if pos.get("side", "YES") == "YES" else "red"

            table.add_row(
                pos.get("ticker", "N/A")[:12],
                f"[{side_color}]{pos.get('side', 'YES')}[/{side_color}]",
                str(pos.get("quantity", 0)),
                f"${pos.get('entry_price', 0):.2f}",
                f"${pos.get('current_price', 0):.2f}",
                f"[{pnl_color}]${pnl:+.2f}[/{pnl_color}]"
            )

    if len(positions) > 8:
        table.add_row(f"[dim]... and {len(positions) - 8} more[/dim]", "", "", "", "", "")

    return Panel(table, title=f"[bold]Positions ({len(positions)})[/bold]", border_style="yellow")


def create_risk_panel(state: dict) -> Panel:
    """Create risk metrics panel"""
    risk = state["risk"]

    exposure = risk["current_exposure"]
    max_exp = risk["max_exposure"]
    daily_loss = risk["daily_loss"]
    max_loss = risk["max_daily_loss"]
    risk_level = risk["risk_level"]
    stop_loss = risk["stop_loss_triggered"]

    # Risk level colors
    risk_colors = {
        "LOW": "green",
        "MEDIUM": "yellow",
        "HIGH": "red",
        "CRITICAL": "bold red"
    }
    risk_color = risk_colors.get(risk_level, "white")

    # Create progress bars
    exp_pct = (exposure / max_exp * 100) if max_exp > 0 else 0
    loss_pct = (daily_loss / max_loss * 100) if max_loss > 0 else 0

    exp_bar = create_bar(exp_pct, color="cyan")
    loss_bar = create_bar(loss_pct, color="red")

    table = Table(box=None, show_header=False, padding=(0, 1))
    table.add_column("Label", style="dim")
    table.add_column("Value")

    table.add_row("Risk Level:", f"[{risk_color}]{risk_level}[/{risk_color}]")
    table.add_row("Exposure:", f"{exp_bar} {exp_pct:.1f}%")
    table.add_row("Daily Loss:", f"{loss_bar} ${daily_loss:.2f}/${max_loss:.2f}")

    if stop_loss:
        table.add_row("", "[bold red]⚠ STOP LOSS TRIGGERED[/bold red]")

    return Panel(table, title="[bold]Risk Management[/bold]", border_style="red")


def create_bar(percentage: float, width: int = 15, color: str = "green") -> str:
    """Create a simple progress bar"""
    filled = int((percentage / 100) * width)
    filled = min(filled, width)
    empty = width - filled

    if percentage > 80:
        color = "red"
    elif percentage > 50:
        color = "yellow"

    return f"[{color}]{'█' * filled}[/{color}][dim]{'░' * empty}[/dim]"


def create_performance_panel(state: dict) -> Panel:
    """Create performance metrics panel"""
    perf = state["performance"]

    win_rate = perf["win_rate"]
    total_trades = perf["total_trades"]
    winning = perf["winning_trades"]
    losing = perf["losing_trades"]
    avg_profit = perf["avg_profit"]
    avg_loss = perf["avg_loss"]
    sharpe = perf["sharpe_ratio"]
    max_dd = perf["max_drawdown"]

    win_color = "green" if win_rate >= 0.5 else "red"

    table = Table(box=None, show_header=False, padding=(0, 1))
    table.add_column("Label", style="dim")
    table.add_column("Value", justify="right")

    table.add_row("Win Rate:", f"[{win_color}]{win_rate*100:.1f}%[/{win_color}]")
    table.add_row("Total Trades:", str(total_trades))
    table.add_row("Wins/Losses:", f"[green]{winning}[/green]/[red]{losing}[/red]")
    table.add_row("Avg Profit:", f"[green]${avg_profit:.3f}[/green]")
    table.add_row("Avg Loss:", f"[red]${avg_loss:.3f}[/red]")
    table.add_row("Sharpe Ratio:", f"{sharpe:.2f}")
    table.add_row("Max Drawdown:", f"[red]{max_dd:.1f}%[/red]")

    return Panel(table, title="[bold]Performance[/bold]", border_style="magenta")


def create_signals_panel(state: dict) -> Panel:
    """Create signals panel"""
    signals = state["signals"]

    today = signals["signals_today"]
    executed = signals["signals_executed"]
    rejected = signals["signals_rejected"]
    last = signals["last_signal"]

    table = Table(box=None, show_header=False, padding=(0, 1))
    table.add_column("Label", style="dim")
    table.add_column("Value")

    table.add_row("Signals Today:", str(today))
    table.add_row("Executed:", f"[green]{executed}[/green]")
    table.add_row("Rejected:", f"[red]{rejected}[/red]")

    if last:
        table.add_row("", "")
        table.add_row("Last Signal:", "")
        table.add_row("  Ticker:", f"[cyan]{last.get('ticker', 'N/A')}[/cyan]")
        table.add_row("  Action:", last.get("action", "N/A"))
        table.add_row("  Edge:", f"{last.get('edge', 0)*100:.2f}%")

    return Panel(table, title="[bold]Signals[/bold]", border_style="cyan")


def create_growth_panel(state: dict) -> Panel:
    """Create growth strategy panel"""
    growth = state["growth"]

    phase = growth["current_phase"]
    phase_name = growth["phase_name"]
    days = growth["days_in_phase"]
    target = growth["target_balance"]
    starting = growth["starting_balance"]

    # Calculate progress
    current = state["portfolio"]["total_value"]
    progress = ((current - starting) / (target - starting) * 100) if (target - starting) > 0 else 0
    progress = max(0, min(100, progress))

    progress_bar = create_bar(progress, width=20, color="yellow")

    table = Table(box=None, show_header=False, padding=(0, 1))
    table.add_column("Label", style="dim")
    table.add_column("Value")

    table.add_row("Phase:", f"[yellow]{phase}[/yellow] - {phase_name}")
    table.add_row("Days in Phase:", str(days))
    table.add_row("Target:", f"${target:.2f}")
    table.add_row("Progress:", progress_bar)
    table.add_row("", f"${current:.2f} / ${target:.2f}")

    return Panel(table, title="[bold]Growth Strategy[/bold]", border_style="yellow")


def create_log_panel(trading_log: TradingLog) -> Panel:
    """Create recent activity log panel"""
    entries = trading_log.get_recent_entries(8)

    table = Table(box=None, show_header=False, expand=True)
    table.add_column("Time", style="dim", width=10)
    table.add_column("Type", width=10)
    table.add_column("Message")

    if not entries:
        table.add_row("", "[dim]No activity yet[/dim]", "")
    else:
        for entry in reversed(entries):
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

            message = entry.get("message", "")[:60]

            table.add_row(
                time_str,
                f"[{type_color}]{entry_type}[/{type_color}]",
                message
            )

    return Panel(table, title="[bold]Activity Log[/bold]", border_style="dim white")


def create_footer() -> Panel:
    """Create footer with controls info"""
    controls = Text()
    controls.append("Controls: ", style="dim")
    controls.append("Ctrl+C", style="bold yellow")
    controls.append(" Exit  ", style="dim")
    controls.append("|", style="dim")
    controls.append("  CLI Commands: ", style="dim")
    controls.append("start", style="cyan")
    controls.append(", ", style="dim")
    controls.append("stop", style="cyan")
    controls.append(", ", style="dim")
    controls.append("status", style="cyan")
    controls.append(", ", style="dim")
    controls.append("add-ticker", style="cyan")

    return Panel(Align.center(controls), box=box.SIMPLE, style="dim")


def create_dashboard_layout(state: dict, trading_log: TradingLog) -> Layout:
    """Create the main dashboard layout"""
    layout = Layout()

    # Main structure
    layout.split_column(
        Layout(name="header", size=3),
        Layout(name="body"),
        Layout(name="footer", size=3)
    )

    # Body split
    layout["body"].split_row(
        Layout(name="left", ratio=1),
        Layout(name="center", ratio=2),
        Layout(name="right", ratio=1)
    )

    # Left column
    layout["left"].split_column(
        Layout(name="status"),
        Layout(name="risk"),
        Layout(name="growth")
    )

    # Center column
    layout["center"].split_column(
        Layout(name="portfolio", size=10),
        Layout(name="positions"),
        Layout(name="log")
    )

    # Right column
    layout["right"].split_column(
        Layout(name="performance"),
        Layout(name="signals")
    )

    # Populate panels
    layout["header"].update(create_header())
    layout["status"].update(create_bot_status(state))
    layout["portfolio"].update(create_portfolio_panel(state))
    layout["positions"].update(create_positions_table(state))
    layout["risk"].update(create_risk_panel(state))
    layout["performance"].update(create_performance_panel(state))
    layout["signals"].update(create_signals_panel(state))
    layout["growth"].update(create_growth_panel(state))
    layout["log"].update(create_log_panel(trading_log))
    layout["footer"].update(create_footer())

    return layout


def main():
    """Main TUI dashboard entry point"""
    console.clear()

    # Print banner
    banner = """
    ╔═══════════════════════════════════════════════════════════════╗
    ║                    KLASHIBOT TUI DASHBOARD                   ║
    ║              High-Frequency Kalshi Trading Bot               ║
    ╚═══════════════════════════════════════════════════════════════╝
    """
    console.print(banner, style="bold cyan")
    console.print("Initializing dashboard...\n", style="dim")
    time.sleep(1)

    # Initialize state manager and log
    state_manager = SharedStateManager()
    trading_log = TradingLog()

    console.print("[green]✓[/green] State manager initialized")
    console.print("[green]✓[/green] Trading log connected")
    console.print("\nStarting live dashboard in 2 seconds...\n", style="dim")
    time.sleep(2)

    # Start live dashboard
    try:
        with Live(console=console, refresh_per_second=1, screen=True) as live:
            start_time = time.time()

            while True:
                # Update state
                state = state_manager.get_state()

                # Update uptime if bot is running
                if state["bot_info"]["is_running"]:
                    elapsed = int(time.time() - start_time)
                    state["bot_info"]["uptime_seconds"] = elapsed

                # Create and update layout
                layout = create_dashboard_layout(state, trading_log)
                live.update(layout)

                time.sleep(1)

    except KeyboardInterrupt:
        console.clear()
        console.print("\n[yellow]Dashboard closed.[/yellow]")
        console.print("Run [cyan]python tui_dashboard.py[/cyan] to restart.\n")


if __name__ == "__main__":
    main()
