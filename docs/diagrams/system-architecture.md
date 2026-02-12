# System Architecture Diagram

> **Last Updated:** 2026-01-26 | **Version:** 4.3.0

## High-Level System Overview

```mermaid
graph TB
    subgraph "User Interface Layer"
        Dashboard["React Dashboard<br/>(AURA Design System)<br/>localhost:3002"]
        StyleGuide["Style Guide<br/>/style-guide"]
    end

    subgraph "Communication Layer"
        WS["WebSocket Bridge<br/>(websocket_bridge.py)<br/>port 8766"]
    end

    subgraph "Core Engine Layer"
        Engine["Trading Engine<br/>(trading_engine.py)"]
        StratMgr["Strategy Manager"]
        RiskMgr["Risk Manager"]
        Learner["Recursive Learner"]
    end

    subgraph "Strategy Layer"
        Fund["Fundamental Strategy"]
        Sent["Sentiment Strategy"]
    end

    subgraph "MCP Server Layer"
        MCPKalshi["Kalshi MCP<br/>(mcp-server-kalshi)"]
        MCPSystem["System MCP<br/>(mcp-server-system)"]
        MCPBrowser["Browser MCP<br/>(mcp-server-browser)"]
        MCPOrch["Orchestration MCP<br/>(mcp-server-orchestration)"]
    end

    subgraph "Infrastructure Layer"
        Redis["Redis Cache"]
        SQLite["SQLite DB<br/>(WAL Mode)"]
        TTS["TTS Service"]
    end

    subgraph "External Services"
        Kalshi["Kalshi Exchange API"]
        GPU["NVIDIA GPU<br/>(RTX 4070)"]
        K8s["Kubernetes Cluster"]
    end

    subgraph "Self-Healing"
        Healer["Self-Healing Worker<br/>(FastAPI)"]
    end

    Dashboard <-->|WebSocket| WS
    StyleGuide --> Dashboard

    WS <--> Engine
    Engine --> StratMgr
    Engine --> RiskMgr
    Engine --> Learner

    StratMgr --> Fund
    StratMgr --> Sent

    WS <-->|MCP Protocol| MCPKalshi
    WS <-->|MCP Protocol| MCPSystem
    WS <-->|MCP Protocol| MCPBrowser
    WS <-->|MCP Protocol| MCPOrch

    MCPKalshi <-->|REST/WSS| Kalshi
    MCPSystem --> GPU
    MCPSystem --> SQLite
    MCPOrch --> K8s

    Engine <--> Redis
    Engine <--> SQLite

    Healer -->|Monitor| Redis
    Healer -->|Monitor| MCPKalshi
    Healer -->|Monitor| SQLite

    WS --> TTS
```

## Component Descriptions

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Dashboard** | React 18 + TypeScript + Tailwind | Bento grid UI with glassmorphism |
| **WebSocket Bridge** | Python asyncio | Real-time communication hub |
| **Trading Engine** | Python + orjson | Market analysis and trade execution |
| **Strategy Manager** | Python | Orchestrates multiple trading strategies |
| **Risk Manager** | Python | Kelly sizing, circuit breakers, correlation limits |
| **MCP Servers** | Python (FastAPI/mcp-sdk) | Tool servers for external integrations |
| **Redis** | Redis 7+ | High-speed caching layer |
| **SQLite** | SQLite3 (WAL) | Persistent data storage |
| **Self-Healing Worker** | Python FastAPI | Infrastructure health monitoring |

## Data Flow

1. **User Interaction** → Dashboard sends commands via WebSocket
2. **Bridge Processing** → WebSocket Bridge routes to Trading Engine
3. **Market Analysis** → Engine scans markets via MCP → Kalshi API
4. **Strategy Evaluation** → Strategy Manager aggregates signals
5. **Risk Assessment** → Risk Manager validates and sizes positions
6. **Execution** → Orders placed via MCP → Kalshi Exchange
7. **Feedback Loop** → Results broadcast to Dashboard
