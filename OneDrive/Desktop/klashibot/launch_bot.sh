#!/bin/bash
#
# KLASHIBOT LAUNCHER
# Launches TUI dashboard, CLI commander, and trading bot in separate terminals
#

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    KLASHIBOT LAUNCHER                        ║"
echo "║              High-Frequency Kalshi Trading Bot               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check for required tools
check_terminal() {
    if command -v gnome-terminal &> /dev/null; then
        echo "gnome-terminal"
    elif command -v xterm &> /dev/null; then
        echo "xterm"
    elif command -v konsole &> /dev/null; then
        echo "konsole"
    elif command -v xfce4-terminal &> /dev/null; then
        echo "xfce4-terminal"
    else
        echo "none"
    fi
}

TERMINAL=$(check_terminal)

# Function to launch in new terminal
launch_in_terminal() {
    local title="$1"
    local command="$2"

    case $TERMINAL in
        gnome-terminal)
            gnome-terminal --title="$title" -- bash -c "$command; exec bash"
            ;;
        xterm)
            xterm -title "$title" -e "$command" &
            ;;
        konsole)
            konsole --new-tab -p tabtitle="$title" -e "$command" &
            ;;
        xfce4-terminal)
            xfce4-terminal --title="$title" -e "$command" &
            ;;
        *)
            echo -e "${RED}No supported terminal found!${NC}"
            return 1
            ;;
    esac
}

# Parse arguments
MODE="all"
TICKERS=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --tui)
            MODE="tui"
            shift
            ;;
        --cli)
            MODE="cli"
            shift
            ;;
        --bot)
            MODE="bot"
            shift
            ;;
        --tickers)
            TICKERS="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --tui           Launch only TUI dashboard"
            echo "  --cli           Launch only CLI commander"
            echo "  --bot           Launch only trading bot"
            echo "  --tickers T1 T2 Specify tickers for trading"
            echo "  --help          Show this help"
            echo ""
            echo "Without options, launches all components in separate windows."
            exit 0
            ;;
        *)
            TICKERS="$TICKERS $1"
            shift
            ;;
    esac
done

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python3 not found! Please install Python 3.8+${NC}"
    exit 1
fi

# Check if virtual environment exists
if [ -d "venv" ]; then
    echo -e "${GREEN}✓${NC} Virtual environment found"
    PYTHON="./venv/bin/python"
else
    echo -e "${YELLOW}!${NC} No virtual environment, using system Python"
    PYTHON="python3"
fi

# Check dependencies
echo -e "${CYAN}Checking dependencies...${NC}"
$PYTHON -c "import rich; import structlog" 2>/dev/null
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}Installing missing dependencies...${NC}"
    $PYTHON -m pip install -r requirements.txt
fi

# Initialize shared state directory
mkdir -p ~/.klashibot
echo -e "${GREEN}✓${NC} State directory initialized"

# Launch components based on mode
if [ "$TERMINAL" == "none" ] && [ "$MODE" == "all" ]; then
    echo -e "${YELLOW}No GUI terminal found. Running in single terminal mode.${NC}"
    echo ""
    echo "Options:"
    echo "  1) Run TUI Dashboard"
    echo "  2) Run CLI Commander"
    echo "  3) Run Trading Bot"
    read -p "Select option (1-3): " choice

    case $choice in
        1)
            $PYTHON tui_dashboard.py
            ;;
        2)
            $PYTHON cli_commander.py
            ;;
        3)
            if [ -n "$TICKERS" ]; then
                $PYTHON run_trading_bot.py $TICKERS
            else
                echo "Please specify tickers: $0 --bot TICKER1 TICKER2"
            fi
            ;;
    esac
    exit 0
fi

case $MODE in
    all)
        echo -e "${CYAN}Launching all components...${NC}"

        # Launch TUI Dashboard
        echo -e "${GREEN}✓${NC} Launching TUI Dashboard..."
        launch_in_terminal "Klashibot TUI" "$PYTHON tui_dashboard.py"
        sleep 1

        # Launch CLI Commander
        echo -e "${GREEN}✓${NC} Launching CLI Commander..."
        launch_in_terminal "Klashibot CLI" "$PYTHON cli_commander.py"
        sleep 1

        echo ""
        echo -e "${GREEN}All components launched!${NC}"
        echo ""
        echo "To start trading, use the CLI and type:"
        echo -e "  ${CYAN}start TICKER1 TICKER2${NC}"
        echo ""
        echo "Or run the bot directly with:"
        echo -e "  ${CYAN}$PYTHON run_trading_bot.py TICKER1 TICKER2${NC}"
        ;;

    tui)
        echo -e "${GREEN}✓${NC} Launching TUI Dashboard..."
        $PYTHON tui_dashboard.py
        ;;

    cli)
        echo -e "${GREEN}✓${NC} Launching CLI Commander..."
        $PYTHON cli_commander.py
        ;;

    bot)
        if [ -z "$TICKERS" ]; then
            echo -e "${RED}Error: Please specify tickers${NC}"
            echo "Usage: $0 --bot TICKER1 TICKER2"
            exit 1
        fi
        echo -e "${GREEN}✓${NC} Launching Trading Bot with: $TICKERS"
        $PYTHON run_trading_bot.py $TICKERS
        ;;
esac
