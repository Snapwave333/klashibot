#!/bin/bash
#
# KLASHIBOT TUI/CLI SETUP
# Sets up the TUI dashboard and CLI commander environment
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
echo "║                   KLASHIBOT TUI/CLI SETUP                    ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check Python
echo -e "${CYAN}Checking Python installation...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Python3 not found! Please install Python 3.8+${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo -e "${GREEN}✓${NC} Python $PYTHON_VERSION found"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo -e "${CYAN}Creating virtual environment...${NC}"
    python3 -m venv venv
    echo -e "${GREEN}✓${NC} Virtual environment created"
fi

# Activate virtual environment
echo -e "${CYAN}Activating virtual environment...${NC}"
source venv/bin/activate
echo -e "${GREEN}✓${NC} Virtual environment activated"

# Install dependencies
echo -e "${CYAN}Installing dependencies...${NC}"
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} All dependencies installed"
else
    echo -e "${RED}✗${NC} Some dependencies failed to install"
    echo "Please check the error messages above"
fi

# Create state directory
echo -e "${CYAN}Setting up shared state directory...${NC}"
mkdir -p ~/.klashibot
echo -e "${GREEN}✓${NC} State directory created at ~/.klashibot"

# Initialize state files
python3 -c "
import sys
sys.path.insert(0, 'src')
from src.shared_state import SharedStateManager, CommandQueue, TradingLog
SharedStateManager()
CommandQueue()
TradingLog()
print('State files initialized')
"

# Make scripts executable
chmod +x launch_bot.sh
chmod +x run_trading_bot.py
chmod +x tui_dashboard.py
chmod +x cli_commander.py
echo -e "${GREEN}✓${NC} Scripts made executable"

# Check configuration
echo -e "${CYAN}Checking configuration...${NC}"
if [ -f "config.env" ]; then
    echo -e "${GREEN}✓${NC} Configuration file found"
else
    if [ -f "config.env.example" ]; then
        echo -e "${YELLOW}!${NC} config.env not found, copying from example..."
        cp config.env.example config.env
        echo -e "${YELLOW}!${NC} Please edit config.env with your Kalshi API credentials"
    else
        echo -e "${RED}✗${NC} No configuration file found"
    fi
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                     SETUP COMPLETE!                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Configure your Kalshi API credentials:"
echo -e "   ${CYAN}nano config.env${NC}"
echo ""
echo "2. Launch the TUI Dashboard (new terminal):"
echo -e "   ${CYAN}python tui_dashboard.py${NC}"
echo ""
echo "3. Launch the CLI Commander (another terminal):"
echo -e "   ${CYAN}python cli_commander.py${NC}"
echo ""
echo "4. Start trading from CLI:"
echo -e "   ${CYAN}start KXBTC KXETH${NC}"
echo ""
echo "Or use the launcher script:"
echo -e "   ${CYAN}./launch_bot.sh${NC}"
echo ""
echo "Type 'help' in CLI for all available commands."
echo ""
