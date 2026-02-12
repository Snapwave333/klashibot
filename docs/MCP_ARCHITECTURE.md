# MCP Server Ecosystem Architecture

The Kalashi Trading System utilizes a **Unified Multi-MCP Bridge** to orchestrate interactions between the Brian AI Persona and specialized tool servers.

## 📊 System Overview

```mermaid
graph TD
    subgraph "AI Control Layer"
        Agent["Brian AI Persona<br/>(System Prompt / Ralph Loop)"]
    end

    subgraph "Unified Registry"
        Bridge["WebSocket Bridge<br/>(mcp-python-sdk)"]
    end

    subgraph "MCP Server Layer"
        Kalshi["Kalshi MCP<br/>(Market Data & Ops)"]
        System["System MCP<br/>(GPU/VRAM & Ops)"]
        Browser["Browser MCP<br/>(Playwright context)"]
        Orch["Orchestration MCP<br/>(K8s/kubectl)"]
    end

    subgraph "External & Hardware"
        KAPI["Kalshi API"]
        GPU["NVIDIA GPU<br/>(RTX 4070)"]
        Docker["Docker Engine"]
        Git["Git Repository"]
        WEB["Web Markets"]
        K8S["K8s Cluster"]
    end

    %% Connections
    Agent <-->|JSON-RPC| Bridge
    
    Bridge <-->|Stdio| Kalshi
    Bridge <-->|Stdio| System
    Bridge <-->|Stdio| Browser
    Bridge <-->|Stdio| Orch

    Kalshi <--> KAPI
    System <--> GPU
    System <--> Docker
    System <--> Git
    Browser <--> WEB
    Orch <--> K8S
```

## 🛠️ Integrated Tools

| Server | Primary Responsibility | Key Tools |
| :--- | :--- | :--- |
| **Kalshi** | Market Execution | `create_order`, `get_markets`, `fetch_rss_feed` |
| **System** | Hardware & Ops | `get_gpu_stats`, `git_operations`, `docker_manager`, `play_profit_chime` |
| **Browser** | Deep Research | `browse_and_extract` |
| **Orchestration** | Scaling | `k8s_manager` |

## 🔄 Execution Flow (Ralph Loop)

1. **Observe**: Bridge polls `System.get_gpu_stats` and `Kalshi.get_markets`.
2. **Plan**: Agent reasons via `DeepSeek-R1` if edge > 0.
3. **Build**: Execution via `Kalshi.create_order` and feedback via `System.play_profit_chime`.
