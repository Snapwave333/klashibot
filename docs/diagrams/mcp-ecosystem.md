# MCP Server Ecosystem Diagram

> **Last Updated:** 2026-01-26 | **Version:** 4.3.0

## Multi-MCP Architecture

```mermaid
graph TB
    subgraph "AI Control Layer"
        Brian["Brian AI Persona<br/>(Ralph Loop)"]
    end

    subgraph "Unified Bridge"
        Bridge["WebSocket Bridge<br/>(mcp-python-sdk)<br/>Tool Registry"]
    end

    subgraph "MCP Servers"
        direction TB
        subgraph "Market Operations"
            Kalshi["mcp-server-kalshi<br/>Port: stdio"]
        end
        subgraph "System Operations"
            System["mcp-server-system<br/>Port: stdio"]
        end
        subgraph "Browser Operations"
            Browser["mcp-server-browser<br/>Port: stdio"]
        end
        subgraph "Infrastructure"
            Orch["mcp-server-orchestration<br/>Port: stdio"]
        end
    end

    subgraph "External Systems"
        KAPI["Kalshi API<br/>api.elections.kalshi.com"]
        GPU["NVIDIA RTX 4070<br/>8GB VRAM"]
        Docker["Docker Engine"]
        Git["Git Repository"]
        Web["Web (Playwright)"]
        K8S["Kubernetes Cluster"]
    end

    Brian <-->|JSON-RPC| Bridge

    Bridge <-->|stdio| Kalshi
    Bridge <-->|stdio| System
    Bridge <-->|stdio| Browser
    Bridge <-->|stdio| Orch

    Kalshi <-->|HTTPS + RSA| KAPI
    System --> GPU
    System --> Docker
    System --> Git
    Browser --> Web
    Orch --> K8S

    style Kalshi fill:#4CAF50
    style System fill:#2196F3
    style Browser fill:#FF9800
    style Orch fill:#9C27B0
```

## Tool Registry

### Kalshi MCP Server
```mermaid
flowchart LR
    subgraph Tools
        GM[get_markets]
        GMK[get_market]
        GOB[get_orderbook]
        GP[get_positions]
        GB[get_balance]
        GO[get_orders]
        GF[get_fills]
        CO[create_order]
        GE[get_event]
        RSS[fetch_rss_feed]
    end

    subgraph Auth
        RSA[RSA-PSS SHA256]
        Key[API Key + Private Key]
    end

    Auth --> Tools
```

| Tool | Description | Rate Limit |
|------|-------------|------------|
| `get_markets` | List active markets | 15/min |
| `get_market` | Single market details | 60/min |
| `get_orderbook` | Order book depth | 60/min |
| `get_positions` | Current holdings | 30/min |
| `get_balance` | Account balance | 30/min |
| `create_order` | Place order | 10/min |
| `fetch_rss_feed` | News & updates | 10/min |

### System MCP Server

| Tool | Description |
|------|-------------|
| `get_gpu_stats` | GPU temp, VRAM usage, utilization |
| `git_operations` | Git status, commit, push |
| `docker_manager` | Container lifecycle management |
| `play_profit_chime` | Audio feedback on profit |

### Browser MCP Server

| Tool | Description |
|------|-------------|
| `browse_and_extract` | Playwright-powered web scraping |

### Orchestration MCP Server

| Tool | Description |
|------|-------------|
| `k8s_manager` | kubectl operations |
| `scale_deployment` | Horizontal scaling |

## Ralph Loop Execution Flow

```mermaid
stateDiagram-v2
    [*] --> Observe
    Observe --> Plan: Edge > 0
    Observe --> Observe: No edge
    Plan --> Build: Strategy selected
    Plan --> Observe: Abort
    Build --> Observe: Trade complete
    Build --> Observe: Trade failed

    note right of Observe
        - Poll GPU stats
        - Fetch market data
        - Check portfolio
    end note

    note right of Plan
        - DeepSeek reasoning
        - Strategy evaluation
        - Risk assessment
    end note

    note right of Build
        - Execute order
        - Play profit chime
        - Log result
    end note
```
