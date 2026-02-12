# Risk Management Flow Diagram

> **Last Updated:** 2026-01-26 | **Version:** 4.3.0

## Risk Assessment Pipeline

```mermaid
flowchart TD
    Start([Trade Opportunity]) --> CB{Circuit Breaker<br/>Active?}

    CB -->|Yes| Reject1([REJECT:<br/>Circuit Breaker])
    CB -->|No| DL{Daily Loss<br/>> 10%?}

    DL -->|Yes| Reject2([REJECT:<br/>Daily Loss Limit])
    DL -->|No| DD{Max Drawdown<br/>> 15%?}

    DD -->|Yes| Reject3([REJECT:<br/>Drawdown Limit])
    DD -->|No| Corr{Correlation<br/>Check}

    Corr --> CorrCalc[Calculate<br/>Group Exposure]
    CorrCalc --> CorrLimit{Group<br/>> 25%?}

    CorrLimit -->|Yes| Reject4([REJECT:<br/>Concentration])
    CorrLimit -->|No| Kelly[Calculate<br/>Kelly Size]

    Kelly --> EdgeCheck{Edge<br/>> 2%?}

    EdgeCheck -->|No| Reject5([REJECT:<br/>Insufficient Edge])
    EdgeCheck -->|Yes| SizeCalc[Calculate<br/>Position Size]

    SizeCalc --> MaxCheck{Size ><br/>Max Position?}

    MaxCheck -->|Yes| Cap[Cap at Max<br/>20% of Portfolio]
    MaxCheck -->|No| Approve

    Cap --> Approve([APPROVE:<br/>Sized Trade])
```

## Kelly Criterion Calculation

```mermaid
flowchart LR
    subgraph "Inputs"
        Edge[Edge %]
        Conf[Confidence %]
        Balance[Portfolio Balance]
    end

    subgraph "Kelly Formula"
        K["Kelly = (edge * confidence) / (1 - edge)"]
        Frac["Fraction = Kelly * 0.25<br/>(Quarter Kelly)"]
    end

    subgraph "Position Size"
        Size["Size = Balance * Fraction"]
        Min["Min: 1 contract"]
        Max["Max: 20% of Balance"]
    end

    Edge --> K
    Conf --> K
    K --> Frac
    Balance --> Size
    Frac --> Size
    Size --> Min
    Size --> Max
```

## Correlation Groups

```mermaid
graph TB
    subgraph "Correlation Groups"
        Election["Election<br/>PRES, SENATE, HOUSE"]
        Crypto["Crypto<br/>BTC, ETH, DOGE"]
        Stocks["Stocks<br/>SP500, NASDAQ, DOW"]
        Economy["Economy<br/>GDP, CPI, JOBS"]
        Sports["Sports<br/>NFL, NBA, MLB"]
    end

    subgraph "Exposure Limits"
        Limit["Max 25% per group"]
    end

    subgraph "Current Positions"
        Pos1["PRES-2024: 15%"]
        Pos2["BTC-100K: 10%"]
        Pos3["SP500-ATH: 8%"]
    end

    Election --> Limit
    Crypto --> Limit
    Stocks --> Limit
    Economy --> Limit
    Sports --> Limit

    Pos1 -->|In Group| Election
    Pos2 -->|In Group| Crypto
    Pos3 -->|In Group| Stocks

    style Election fill:#E3F2FD
    style Crypto fill:#FFF3E0
    style Stocks fill:#E8F5E9
```

## Circuit Breaker States

```mermaid
stateDiagram-v2
    [*] --> Normal

    Normal --> Warning: Loss > 5%
    Warning --> Critical: Loss > 8%
    Critical --> Halted: Loss > 10%
    Halted --> Halted: All trades blocked

    Warning --> Normal: Recovery
    Critical --> Warning: Partial recovery
    Halted --> Normal: Manual reset

    note right of Normal
        Full trading capacity
        Normal position sizes
    end note

    note right of Warning
        Reduced Kelly fraction (0.5x)
        Enhanced monitoring
    end note

    note right of Critical
        Minimal sizing (0.25x)
        Only high-edge trades
    end note

    note right of Halted
        NO trades allowed
        Requires intervention
    end note
```

## Risk Metrics Dashboard

```mermaid
flowchart LR
    subgraph "Real-time Metrics"
        WR[Win Rate: 62.5%]
        DD[Drawdown: 4.2%]
        DL[Daily P&L: +$87.50]
        Exp[Total Exposure: 45%]
    end

    subgraph "Per-Trade Metrics"
        Edge[Avg Edge: 2.8%]
        Slip[Avg Slippage: 0.11%]
        Lat[Avg Latency: 145ms]
        Fill[Fill Rate: 83%]
    end

    subgraph "Risk Status"
        CB[Circuit Breaker: OFF]
        Mode[Mode: ADAPTIVE]
    end
```

## Risk Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `max_position_pct` | 20% | Max single position as % of portfolio |
| `max_daily_loss_pct` | 10% | Daily loss circuit breaker |
| `max_drawdown_pct` | 15% | Maximum drawdown allowed |
| `kelly_fraction` | 0.25 | Quarter Kelly for safety |
| `min_edge_threshold` | 2% | Minimum edge to trade |
| `correlation_limit` | 25% | Max exposure per correlation group |
| `max_consecutive_losses` | 5 | Trigger warning state |
