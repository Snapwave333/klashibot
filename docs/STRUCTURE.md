# Project Structure

> **Last Updated:** 2026-01-20 | **Version:** 3.0.0

## Directory Layout

```
Kalashi/
├── README.md                 # Project overview
├── CHANGELOG.md              # Version history
├── .gitignore                # Git exclusions
│
├── rust_backend/             # Rust trading engine (PRIMARY)
│   ├── src/
│   │   ├── main.rs           # Entry point
│   │   ├── types.rs          # Core data types
│   │   ├── orchestrator.rs   # Trading loop coordinator
│   │   ├── brain/            # AI decision modules
│   │   │   ├── deepseek.rs   # DeepSeek cloud LLM
│   │   │   ├── ollama.rs     # Local Ollama LLM
│   │   │   └── prompt.rs     # System prompt
│   │   ├── execution/        # Order execution
│   │   │   └── router.rs     # Order routing
│   │   ├── ingestion/        # Market data
│   │   │   ├── kalshi.rs     # WebSocket client
│   │   │   └── kalshi_rest.rs# REST API
│   │   ├── risk/             # Risk management
│   │   │   ├── guardian.rs   # Multi-layer risk controls
│   │   │   └── market_filter.rs # Payout filters
│   │   ├── autonomous/       # Self-modification
│   │   │   └── mod.rs        # Autonomous controller
│   │   ├── wallet.rs         # Wallet abstraction
│   │   └── db.rs             # SQLite layer
│   ├── Cargo.toml            # Rust dependencies
│   └── .env                  # Environment config
│
├── frontend/                 # React dashboard
│   ├── src/
│   │   ├── App.tsx           # Main application
│   │   ├── views/            # Page views
│   │   │   └── AIControlCenter.tsx
│   │   ├── components/       # UI components
│   │   │   ├── TradingModeIndicator.tsx
│   │   │   ├── EmergencyControls.tsx
│   │   │   └── widgets/      # Dashboard widgets
│   │   └── context/          # State management
│   ├── package.json          # Node dependencies
│   └── tailwind.config.js    # Styling config
│
├── backend/                  # Legacy Python backend
│   ├── ai_agent/             # Python AI agent
│   ├── core/                 # Core utilities
│   └── venv/                 # Python virtual env
│
├── docs/                     # Documentation
│   ├── ARCHITECTURE.md       # System design
│   ├── API_REFERENCE.md      # API documentation
│   ├── QUICKSTART.md         # Getting started
│   ├── SETUP.md              # Full setup guide
│   ├── PAPER_TRADING.md      # Testing guide
│   ├── AI_AGENT_SETUP.md     # AI configuration
│   └── PROJECT_SUMMARY.md    # Project overview
│
├── scripts/                  # Utility scripts
│   ├── start_bot_with_ai.bat # Windows launcher
│   ├── start_robust.ps1      # PowerShell launcher
│   ├── verify_installation.py # Install validator
│   ├── monitor_trades.py     # Trade monitor
│   └── debug_ollama.py       # Ollama debugger
│
├── tests/                    # Test suites
│   └── e2e/                  # Playwright E2E tests
│
├── config/                   # Configuration files
│   └── settings.yaml         # App settings
│
├── data/                     # Runtime data
│   └── kalashi.db            # SQLite database
│
├── logs/                     # Application logs
│
└── archive/                  # Deprecated files
    └── dashboard.html        # Legacy dashboard
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Folders | lowercase_with_underscores | `rust_backend`, `ai_agent` |
| Rust files | snake_case.rs | `market_filter.rs` |
| TypeScript components | PascalCase.tsx | `AIControlCenter.tsx` |
| Scripts | snake_case.py/bat/ps1 | `start_robust.ps1` |
| Docs | UPPERCASE.md | `ARCHITECTURE.md` |
| Config | lowercase.yaml/json | `settings.yaml` |

## Key Components

### Active Development
- `rust_backend/` - Primary trading engine
- `frontend/` - React dashboard
- `docs/` - Documentation

### Legacy (Archived)
- `backend/` - Python backend (preserved for reference)
- `archive/` - Deprecated files

### Generated (Excluded from Git)
- `node_modules/` - NPM packages
- `target/` - Rust build output
- `frontend/build/` - Production build
