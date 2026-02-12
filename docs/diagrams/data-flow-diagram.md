# Data Flow Diagram

> **Last Updated:** 2026-01-26 | **Version:** 4.3.0

## End-to-End Data Flow

```mermaid
flowchart TD
    subgraph "Data Sources"
        KalshiAPI["Kalshi API<br/>REST + WebSocket"]
        RSS["RSS Feeds<br/>News & Updates"]
        Web["Web Sources<br/>(Playwright)"]
    end

    subgraph "Ingestion Layer"
        MCPKalshi["MCP Kalshi Server"]
        MCPBrowser["MCP Browser Server"]
    end

    subgraph "Caching Layer"
        Redis["Redis Cache<br/>TTL: 20-60s"]
        LocalCache["Local Memory Cache<br/>Fallback"]
    end

    subgraph "Processing Layer"
        Engine["Trading Engine"]
        StratMgr["Strategy Manager"]
        Fund["Fundamental<br/>Strategy"]
        Sent["Sentiment<br/>Strategy"]
        Learner["Recursive<br/>Learner"]
    end

    subgraph "Risk Layer"
        RiskMgr["Risk Manager"]
        Kelly["Kelly Criterion"]
        Circuit["Circuit Breakers"]
        Corr["Correlation Filter"]
    end

    subgraph "Execution Layer"
        OrderMgr["Order Manager"]
        Impact["Price Impact<br/>Adjustment"]
    end

    subgraph "Persistence Layer"
        SQLite["SQLite DB<br/>(WAL Mode)"]
    end

    subgraph "Output Layer"
        WS["WebSocket Bridge"]
        Dashboard["React Dashboard"]
        TTS["TTS Service"]
        Logs["Log Files"]
    end

    KalshiAPI --> MCPKalshi
    RSS --> MCPKalshi
    Web --> MCPBrowser

    MCPKalshi --> Redis
    MCPBrowser --> Redis
    Redis --> Engine
    LocalCache --> Engine

    Engine --> StratMgr
    StratMgr --> Fund
    StratMgr --> Sent
    Fund --> Learner
    Sent --> Learner

    Engine --> RiskMgr
    RiskMgr --> Kelly
    RiskMgr --> Circuit
    RiskMgr --> Corr

    RiskMgr --> OrderMgr
    OrderMgr --> Impact
    Impact --> MCPKalshi
    MCPKalshi --> KalshiAPI

    Engine --> SQLite
    Engine --> WS
    WS --> Dashboard
    WS --> TTS
    Engine --> Logs
```

## Market Data Pipeline

```mermaid
flowchart LR
    subgraph "1. Fetch"
        API[Kalshi API]
        Req[get_markets]
    end

    subgraph "2. Cache Check"
        CK{Redis<br/>Hit?}
        Hit[Return Cached]
        Miss[Fetch Fresh]
    end

    subgraph "3. Filter"
        Status[Status = open]
        Volume[Volume > 100]
        OI[Open Interest > 50]
    end

    subgraph "4. Enrich"
        Prob[Calculate<br/>Probability]
        Liq[Calculate<br/>Liquidity Score]
    end

    subgraph "5. Store"
        Store[Cache with TTL]
    end

    API --> Req
    Req --> CK
    CK -->|Yes| Hit
    CK -->|No| Miss
    Miss --> Status
    Status --> Volume
    Volume --> OI
    OI --> Prob
    Prob --> Liq
    Liq --> Store
```

## Trade Execution Flow

```mermaid
flowchart TD
    Start([MarketOpportunity]) --> RiskCheck{Risk Manager<br/>Approved?}

    RiskCheck -->|No| Reject([Reject Trade])
    RiskCheck -->|Yes| Size[Calculate Position Size<br/>Kelly Criterion]

    Size --> Impact[Adjust Price for<br/>Market Impact]

    Impact --> Order[Create Order<br/>via MCP]

    Order --> Submit[Submit to<br/>Kalshi API]

    Submit --> Result{Order<br/>Result}

    Result -->|Success| Log[Log Trade]
    Result -->|Fail| Retry{Retry?}

    Retry -->|Yes| Impact
    Retry -->|No| LogFail[Log Failure]

    Log --> Update[Update Performance<br/>Metrics]
    Update --> Broadcast[Broadcast to<br/>Dashboard]
    Broadcast --> Audio{Profit?}
    Audio -->|Yes| Chime[Play Profit<br/>Chime]
    Audio -->|No| End([End])
    Chime --> End
```

## Cache Strategy

```mermaid
flowchart TD
    subgraph "Cache Keys"
        K1["global_market_cache<br/>TTL: 20s"]
        K2["opp_{ticker}<br/>TTL: 30s"]
        K3["portfolio_state<br/>TTL: 10s"]
    end

    subgraph "Write Policy"
        W1[Write-Through<br/>Orders]
        W2[Write-Behind<br/>Performance]
        W3[Cache-Aside<br/>Markets]
    end

    subgraph "Eviction"
        LRU[LRU Eviction<br/>Max 200 entries]
        TTL[TTL Expiration]
    end

    K1 --> W3
    K2 --> W3
    K3 --> W1
    W3 --> LRU
    W3 --> TTL
```

## Data Retention

| Data Type | Storage | Retention |
|-----------|---------|-----------|
| Market Cache | Redis | 20-60 seconds |
| Trade History | SQLite | Permanent |
| Performance Metrics | Memory | Session |
| Logs | Files | 30 days |
| Order Book Snapshots | SQLite | 7 days |
