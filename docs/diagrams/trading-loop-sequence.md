# Trading Loop Sequence Diagram

> **Last Updated:** 2026-01-26 | **Version:** 4.3.0

## AI Trading Loop (10-second intervals)

```mermaid
sequenceDiagram
    participant D as Dashboard
    participant WS as WebSocket Bridge
    participant TE as Trading Engine
    participant SM as Strategy Manager
    participant RM as Risk Manager
    participant MCP as MCP Server
    participant K as Kalshi API
    participant R as Redis Cache

    loop Every 10 seconds
        WS->>TE: Trigger AI Loop

        Note over TE: Step 1: Update Portfolio
        TE->>MCP: get_balance()
        MCP->>K: GET /portfolio/balance
        K-->>MCP: Balance Response
        MCP-->>TE: Portfolio Data

        Note over TE: Step 2: Dynamic Risk Adjustment
        TE->>RM: adjust_risk_params()
        RM-->>TE: Updated Kelly Fraction

        Note over TE: Step 3: Market Scan
        TE->>R: Check cache (global_market_cache)
        alt Cache Hit
            R-->>TE: Cached Markets
        else Cache Miss
            TE->>MCP: get_markets() [staggered]
            MCP->>K: GET /markets
            K-->>MCP: Market List
            MCP-->>TE: Markets Data
            TE->>R: Cache markets (TTL: 20s)
        end

        Note over TE: Step 4: Parallel Analysis
        par Analyze Market 1
            TE->>R: Check opp_TICKER1
            alt Cache Miss
                TE->>MCP: get_market(), get_orderbook()
                MCP->>K: Parallel API calls
                K-->>MCP: Market + Orderbook
                MCP-->>TE: Analysis Data
                TE->>SM: analyze_market()
                SM-->>TE: MarketOpportunity
                TE->>R: Cache opportunity
            end
        and Analyze Market 2
            TE->>R: Check opp_TICKER2
        and Analyze Market N
            TE->>R: Check opp_TICKERN
        end

        Note over TE: Step 5: Risk Filtering
        TE->>RM: check_trade_risk(opportunities)
        RM->>RM: Check circuit breakers
        RM->>RM: Check correlations
        RM->>RM: Calculate Kelly size
        RM-->>TE: Sized Opportunities

        Note over TE: Step 6: Execute Best Trade
        TE->>MCP: create_order()
        MCP->>K: POST /orders
        K-->>MCP: Order Confirmation
        MCP-->>TE: Execution Result

        Note over TE: Step 7: Broadcast Results
        TE->>WS: Trade Update
        WS->>D: WebSocket Message
        D->>D: Update UI
    end
```

## Cache Flow Detail

```mermaid
flowchart TD
    Start([analyze_market_fast]) --> KeyGen[Generate cache key<br/>opp_TICKER]
    KeyGen --> CheckRedis{Redis<br/>available?}

    CheckRedis -->|Yes| RedisGet[redis.get key]
    CheckRedis -->|No| LocalGet[local_cache.get key]

    RedisGet --> RHit{Hit?}
    LocalGet --> LHit{Hit?}

    RHit -->|Yes| Return([Return cached])
    LHit -->|Yes| Return

    RHit -->|No| Fetch[Fetch fresh data]
    LHit -->|No| Fetch

    Fetch --> Analyze[Strategy analysis]
    Analyze --> Store{Redis<br/>available?}

    Store -->|Yes| RedisSet[redis.setex TTL=30s]
    Store -->|No| LocalSet[local_cache TTL=30s]

    RedisSet --> SizeCheck[LRU size check]
    LocalSet --> SizeCheck

    SizeCheck --> Evict{Size > 200?}
    Evict -->|Yes| Remove[Remove oldest]
    Evict -->|No| Done([Return opportunity])
    Remove --> Done
```

## Trading Loop Metrics

| Step | Target Latency | Actual |
|------|----------------|--------|
| Portfolio Update | 50ms | ~30-40ms |
| Market Scan (cached) | 1ms | <1ms |
| Market Scan (fresh) | 500ms | ~300-500ms |
| Single Market Analysis | 100ms | ~50-80ms |
| Risk Check | 5ms | <2ms |
| Order Execution | 150ms | ~100-150ms |
| **Total Loop** | **10s** | **10s** |
