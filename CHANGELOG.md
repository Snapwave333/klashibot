# Changelog

All notable changes to the Kalshi Trading Bot are documented in this file.
Format follows [Semantic Versioning](https://semver.org/) and [Keep a Changelog](https://keepachangelog.com/).

---

## [Unreleased]

### Planned
- Advanced order routing algorithms in `execution/`
- Backtesting framework integration
- Multi-venue support (Polymarket)
- Machine learning edge prediction

---

## [4.5.0] - 2026-01-26

### 🧠 AI MIND Window Redesign
- **Layout Restructure**: Implemented a professional three-section card layout (Status, Feed, Input).
- **Sticky Status Bar**: Created a high-density, dual-row status header for wallet, equity, and live P/L.
- **Enhanced Event Feed**: Added neural link event filtering (`thought`, `action`, `system`, etc.) and real-time search.
- **Advanced Input Area**: Overhauled the input area with a multi-line textarea, quick-command badges, and voice input placeholders.
- **Theme Alignment**: Standardized mono/sans typography and applied specific orange/green semantic accents.

### 🎙️ Neural Voice Cloning
- **Exclusive Voice**: Integrated "Mandarin Accent.mp3" as the system-wide cloning reference.
- **Qwen3-TTS Core**: Replaced legacy stubs with full local model inference for announcements.
- **Audio Feedback**: Verified seamless transition between AI thought cycles and voice synthesis.

### 🛠️ UI Stability
- **Layout Fixes**: Streamlined flex containers in `App.tsx` to ensure content fills the viewport without truncation.
- **Redundancy Cleanup**: Removed nested `overflow-auto` containers for smoother scrolling.

---

## [4.4.0] - 2026-01-26

### Documentation
- **Comprehensive Diagram Overhaul**: Created 8 new Mermaid diagrams in `/docs/diagrams/`:
  - `system-architecture.md`: High-level system overview
  - `trading-loop-sequence.md`: AI trading loop sequence diagram
  - `mcp-ecosystem.md`: Multi-MCP server architecture
  - `class-diagram.md`: UML class diagram of core classes
  - `deployment-diagram.md`: Docker/Kubernetes deployment
  - `data-flow-diagram.md`: End-to-end data flow
  - `risk-management-flow.md`: Risk assessment pipeline
  - `frontend-architecture.md`: AURA design system components
- **Diagram Index**: Added `/docs/diagrams/README.md` with viewing instructions
- **Version Sync**: All diagrams updated to reflect v4.3.0 architecture

### Project Organization
- **Directory Cleanup**: Removed temporary files, logs, and cache directories
- **Naming Standardization**: Enforced lowercase-hyphenated naming convention
- **Static Assets**: Consolidated images/fonts into `/frontend/src/assets/`
- **Configuration**: Centralized config files with `.example` templates
- **Updated `.gitignore`**: Added comprehensive exclusion rules

---

## [4.3.0] - 2026-01-25

### 🍱 Bento Grid Layout
*   **Responsive Grid**: Implemented specific 3-column layout (`grid-cols-1 lg:grid-cols-3`).
*   **Smart Spanning**: "Total Equity" widget now spans 2 rows for visual prominence.
*   **Auto-Height**: Rows adapt to content size (`minmax(300px, auto)`), preventing inner scroll cropping.

### 🎨 Design Polish
*   **Enhanced Carbon Fiber**: Increased contrast (opacity 0.2 -> 0.4) and adjusted scale for better texture visibility.
*   **UI Cleanup**: Removed legacy "Reset Layout" button; layout is now auto-managed.
*   **Layout Safety**: Added `pb-24` padding to all dashboards to ensure bottom-most content is never cropped by the viewport edge.

---

## [4.2.0] - 2026-01-25

### 🏥 Self-Healing Infrastructure
*   **New Microservice**: `self-healing-worker` (Python/FastAPI) added to the stack.
*   **Health Monitors**: Modular checks for Redis, Backend, Database, and MCP.
*   **Orchestration**: `HealerEngine` loop for continuous health verification.
*   **Kubernetes Ready**: Added full manifests in `/k8s`.

### 💰 Profitability Features
*   **Profit Chime**: Audio feedback ("Ka-Ching") when realized P&L increases.
*   **Visual Alerts**: Neon green toast notifications for profit events.
*   **Configuration**: Added "Profit Chime" toggle in Settings > Interface.

### 📊 Visualization Refinements
*   **Pipeline Visualizer**: Reordered nodes (Backend → MCP → DB) to match actual data flow.
*   **Settings UI**: Verified header visibility and layout.
*   **Status Indicators**: Improved hover telemetry for all system nodes.

---

## [4.1.0] - 2026-01-23

### 🎨 Frontend UI Redesign ("AURA" System)
*   **Design System**: Implemented "AURA" (Autonomous Universal Reasoning Agent) visual language.
    *   **Color Palette**: Semantic, theme-aware variables (`--primary-500`, `--bg-app`).
    *   **Typography**: Fluid `clamp()` based scaling for consistent readability across devices.
    *   **Accessibility**: Enforced WCAG 2.2 standards (44px touch targets, contrast ratios).
*   **Component Architecture**:
    *   **Primitives**: Created reusable `Button`, `Input`, `Badge`, and `GlassCard` components.
    *   **Mascot**: Integrated `AuraMascot` for reactive system state visualization (Idle, Thinking, Warning).
    *   **Refactor**: Updated `MainDashboard`, `EquityWidget`, `ActivePositionsWidget`, and Layouts to use new primitives.
*   **New Views**:
    *   **Style Guide**: Added a live documentation portal (`/style-guide`) for developers.
    *   **Unified Grid**: Refactored dashboard grid with consistent expandable card behavior.

---

## [4.0.0] - 2026-01-23

### 🚀 Major Architectural Refactor
*   **Modular Architecture**: Fully refactored `TradingEngine` into decoupled modules:
    *   `strategies/`: Isolated trading logic (Fundamental, Sentiment, Manager).
    *   `risk/`: Centralized risk management (Kelly Sizing, Limits, Correlations).
    *   `execution/`: Placeholder for future smart routing.
*   **Python-First**: Consolidated all logic into a high-performance Python engine using `asyncio` and `orjson`.

### ✨ New Features
*   **Multi-Strategy Engine**:
    *   **Fundamental Strategy**: Edge detection based on "True Probability" vs. Market Price.
    *   **Sentiment Strategy**: Framework for NLP-based sentiment trading (simulated for now).
    *   **Strategy Manager**: Orchestrates multiple strategies and aggregates signals.
*   **Advanced Risk Management**:
    *   **Kelly Criterion**: Dynamic position sizing based on edge and confidence.
    *   **Circuit Breakers**: Hard stops for Max Daily Loss and Max Drawdown.
    *   **Correlation Filtering**: Prevents over-concentration in correlated groups (e.g., "Crypto", "Election").
*   **"Brian" Interface**:
    *   **Persona-Driven Logs**: Detailed, professional trade execution logs via WebSocket.
    *   **Rich Metadata**: Logs now include Strategy Name, Logic/Reasoning, Edge %, and Confidence %.
*   **Performance Optimization**:
    *   **Parallel Scanning**: Scan 50+ markets concurrently.
    *   **Orjson Integration**: 20-30x faster JSON parsing for market data.
    *   **Optimized Loops**: Reduced overhead in correlation checks (O(N) vs O(N^2)).

### 🛠️ Developer Experience
*   **Dev Suite**: Comprehensive testing and benchmarking tools (`dev_suite/`).
*   **Benchmarks**: Added realistic benchmarks for the full trading pipeline.
*   **Documentation**: Updated `README.md` and `ARCHITECTURE.md` with Mermaid diagrams.

---

## [3.3.0] - 2026-01-22

### Added
- **RSS Feed Integration** (`fetch_rss_feed`): Agent can now consume real-time news.
- **Tool Execution Loop** (`agent.py`): Replaced hallucinated actions with real Function Calling loop via Ollama + MCP.
- **Startup Optimization**: Pre-warming of AI models and market cache in background.

### Changed
- **Small Account Logic**: Implemented "Sniper Mode" for <$500 accounts (Aggressive compounding, strict stops).
- **Agent Architecture**: Shifted from passive chat to active tool execution model.

---

## [3.2.0] - 2026-01-21

### Added
- **Audio Waveform Visualization** (`components/ui/AudioWaveform.tsx`): Real-time frequency analysis
  - Interactive canvas-based visualizer
  - Reacts to system audio output
  - Smooth frequency smoothing and decay
- **Audio Context Integration** (`context/AudioContext.tsx`): Global audio state management
  - Web Audio API integration
  - Real-time frequency data processing
  - Auto-connection handling for browser audio policies
- **Real-time Frequency Analysis**: Fast Fourier Transform (FFT) implementation
  - 32-bin frequency resolution
  - Visual synchronization with TTS voice output

### Changed
- **TTS System**: Enhanced with visual feedback loop
- **UI Components**: Updated glassmorphism styles for audio components

---

## [3.1.0] - 2026-01-20

### Added
- **Sub-Agent Orchestrator** (`brain/subagent.rs`): Smart model selection for RTX 4070 8GB
  - Auto-routes tasks to optimal Ollama model based on complexity
  - Fast tier (tinyllama, gemma3, phi3.5) for quick decisions
  - Standard tier (llama3, qwen2.5) for price analysis
  - Expert tier (deepseek-r1, mistral-nemo) for strategy planning
  - VRAM limit: 6.5 GB with 1.5 GB headroom
  - CPU thread cap: 8 threads max
  - Rate limiting: 100ms between AI calls
- **CrewAI Multi-Agent System** (`brain/crew.rs`): Collaborative AI trading crew
  - Atlas (Market Analyst): Identifies trading opportunities
  - Guardian (Risk Manager): Evaluates position risk
  - Strategos (Strategy Planner): Develops execution plans
  - Trigger (Executor): Makes final go/no-go decisions
  - Shared context for cross-agent communication
  - Workflow-based task orchestration
  - Quick consensus voting mechanism
- **Ralph Loop Pattern** (`brain/ralph.rs`): Continuous AI execution loop
  - Three modes: Observing → Planning → Building
  - Fresh context each iteration (prevents stale state)
  - Backpressure validation (tasks must pass before proceeding)
  - Persistent `ImplementationPlan` state between iterations
  - Auto-discovery of learnings and discoveries
  - Task prioritization and dependency management

### Changed
- **Brain Module**: Now exports `OptimizedBrain`, `CrewBrain`, `RalphBrain`
- **Model Selection**: Uses smallest capable model to reduce VRAM pressure
- **Documentation**: Updated ARCHITECTURE.md, STRUCTURE.md, MOVED_FILES.md

### Performance
- Optimized for: i7-13620H / RTX 4070 8GB / 16GB RAM
- VRAM usage capped at 6.5 GB
- CPU threads capped at 8
- 100ms rate limiting prevents system overload

---

## [3.0.0] - 2026-01-20

### Added
- **Autonomous Self-Modification** (`autonomous/mod.rs`): AI can modify strategy without human approval
  - Self-adjusting risk tolerance based on win rate
  - Performance-based learning from trade outcomes
  - Unprompted strategy changes enabled
- **Risk Guardian Module** (`risk/guardian.rs`): Multi-layer risk control framework
  - Hard stops at 5% position loss
  - Trailing stops after 2% gain (1.5% trail distance)
  - Circuit breakers: 5% daily drawdown, 3 consecutive losses
  - 24-hour position lifecycle with auto-liquidation
  - Progressive unwinding starting at 23 hours
- **Market Filter Module** (`risk/market_filter.rs`): Short-term payout optimization
  - Settlement ≤24h filter (rejects longer positions)
  - Liquidity requirements (100+ contracts)
  - Spread limits (5 cents max)
  - Time-weighted position sizing
- **AI Control Center** (`views/AIControlCenter.tsx`): Comprehensive AI config UI
