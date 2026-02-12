# Frontend Architecture Diagram

> **Last Updated:** 2026-01-26 | **Version:** 4.3.0

## AURA Design System

```mermaid
graph TB
    subgraph "Application Shell"
        App["App.tsx<br/>Router + Layout"]
    end

    subgraph "Views"
        Main["MainDashboard<br/>(Bento Grid)"]
        StyleGuide["StyleGuide<br/>(/style-guide)"]
        Settings["Settings"]
        AIControl["AIControlCenter"]
    end

    subgraph "Layout Components"
        Header["Header<br/>(Branding + Nav)"]
        Sidebar["Sidebar<br/>(Navigation)"]
        Footer["Footer<br/>(Status Bar)"]
    end

    subgraph "Widget Components"
        Equity["EquityWidget<br/>(spans 2 rows)"]
        Positions["ActivePositionsWidget"]
        Performance["PerformanceWidget"]
        Risk["RiskWidget"]
        Pipeline["PipelineVisualizer"]
        AIInsights["AIInsightsWidget"]
    end

    subgraph "UI Primitives"
        Button["Button"]
        Badge["Badge"]
        Input["Input"]
        GlassCard["GlassCard"]
        Mascot["AuraMascot"]
    end

    subgraph "Context Providers"
        Theme["ThemeContext"]
        WS["WebSocketContext"]
        Audio["AudioContext"]
        Settings2["SettingsContext"]
    end

    App --> Main
    App --> StyleGuide
    App --> Settings
    App --> AIControl

    Main --> Header
    Main --> Sidebar
    Main --> Footer

    Main --> Equity
    Main --> Positions
    Main --> Performance
    Main --> Risk
    Main --> Pipeline
    Main --> AIInsights

    Equity --> GlassCard
    Positions --> GlassCard
    Performance --> GlassCard
    GlassCard --> Button
    GlassCard --> Badge

    App --> Theme
    App --> WS
    App --> Audio
    App --> Settings2
```

## Component Hierarchy

```mermaid
flowchart TD
    subgraph "src/"
        subgraph "components/"
            subgraph "layout/"
                Header["Header.tsx"]
                Sidebar["Sidebar.tsx"]
                Footer["Footer.tsx"]
            end

            subgraph "ui/"
                Button["Button.tsx"]
                Badge["Badge.tsx"]
                Input["Input.tsx"]
                GlassCard["GlassCard.tsx"]
                AuraMascot["AuraMascot.tsx"]
                AudioWaveform["AudioWaveform.tsx"]
            end

            subgraph "widgets/"
                EquityWidget["EquityWidget.tsx"]
                PositionsWidget["ActivePositionsWidget.tsx"]
                PerformanceWidget["PerformanceWidget.tsx"]
                RiskWidget["RiskWidget.tsx"]
            end

            subgraph "visualizations/"
                Pipeline["PipelineVisualizer.tsx"]
                Charts["Charts/"]
            end

            subgraph "modals/"
                SettingsModal["SettingsModal.tsx"]
                ConfirmDialog["ConfirmDialog.tsx"]
            end
        end

        subgraph "views/"
            MainDashboard["MainDashboard.tsx"]
            StyleGuide["StyleGuide.tsx"]
            AIControlCenter["AIControlCenter.tsx"]
        end

        subgraph "context/"
            ThemeCtx["ThemeContext.tsx"]
            WSCtx["WebSocketContext.tsx"]
            AudioCtx["AudioContext.tsx"]
            SettingsCtx["SettingsContext.tsx"]
        end

        subgraph "hooks/"
            useWebSocket["useWebSocket.ts"]
            usePortfolio["usePortfolio.ts"]
            useTheme["useTheme.ts"]
        end

        subgraph "utils/"
            formatters["formatters.ts"]
            constants["constants.ts"]
        end

        subgraph "assets/"
            fonts["fonts/"]
            images["images/"]
            sounds["sounds/"]
        end
    end
```

## Bento Grid Layout

```mermaid
graph TB
    subgraph "Dashboard Grid (3 columns)"
        subgraph "Row 1"
            E1["Equity Widget<br/>(span 1 col, 2 rows)"]
            E2["Performance<br/>(span 2 cols)"]
        end

        subgraph "Row 2"
            E3["Risk Widget"]
            E4["AI Insights"]
        end

        subgraph "Row 3"
            E5["Active Positions<br/>(span 3 cols)"]
        end

        subgraph "Row 4"
            E6["Pipeline Visualizer<br/>(span 3 cols)"]
        end
    end

    style E1 fill:#4CAF50
    style E2 fill:#2196F3
    style E3 fill:#FF9800
    style E4 fill:#9C27B0
    style E5 fill:#00BCD4
    style E6 fill:#607D8B
```

## WebSocket Data Flow

```mermaid
sequenceDiagram
    participant D as Dashboard
    participant WS as WebSocket Hook
    participant Ctx as Context
    participant W as Widgets

    D->>WS: Connect to ws://localhost:8766
    WS-->>D: Connection established

    loop Real-time Updates
        WS->>Ctx: portfolio_update message
        Ctx->>W: Update state

        WS->>Ctx: trade_execution message
        Ctx->>W: Show notification

        WS->>Ctx: ai_insight message
        Ctx->>W: Display insight
    end

    D->>WS: Send command (e.g., force_trade)
    WS->>WS: Forward to backend
```

## Theme System

```mermaid
flowchart LR
    subgraph "CSS Variables"
        Primary["--primary-500: #6366F1"]
        BG["--bg-app: #0F172A"]
        Card["--bg-card: rgba(30,41,59,0.8)"]
        Text["--text-primary: #F8FAFC"]
        Accent["--accent-green: #10B981"]
    end

    subgraph "Tailwind Config"
        Colors["colors.primary"]
        BG2["colors.bg"]
        Glass["backdrop-blur-xl"]
    end

    subgraph "Components"
        GlassCard2["GlassCard<br/>bg-card + backdrop-blur"]
        Button2["Button<br/>bg-primary hover:bg-primary-600"]
    end

    Primary --> Colors
    BG --> BG2
    Colors --> GlassCard2
    Colors --> Button2
```

## Audio System

```mermaid
flowchart TD
    subgraph "Audio Context"
        Ctx["AudioContext"]
        Analyzer["AnalyserNode"]
        FFT["FFT Data (32 bins)"]
    end

    subgraph "TTS Integration"
        TTS["TTS Service"]
        Audio["Audio Element"]
    end

    subgraph "Visualizer"
        Waveform["AudioWaveform<br/>Canvas Component"]
        Freq["Frequency Bars"]
    end

    subgraph "Triggers"
        Profit["Profit Chime"]
        Alert["Alert Sound"]
    end

    TTS --> Audio
    Audio --> Ctx
    Ctx --> Analyzer
    Analyzer --> FFT
    FFT --> Waveform
    Waveform --> Freq

    Profit --> Audio
    Alert --> Audio
```

## Performance Optimizations

| Technique | Implementation |
|-----------|----------------|
| **Code Splitting** | React.lazy for views |
| **Memoization** | useMemo for expensive calculations |
| **Virtualization** | react-window for log lists |
| **Debouncing** | WebSocket message batching |
| **Caching** | SWR for API data |
