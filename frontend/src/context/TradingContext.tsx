import { create } from 'zustand';

export type Portfolio = {
  balance: number; // Cash balance
  total_equity: number; // Balance + Unrealized PnL
  free_margin: number; // Available for trading
  daily_pnl: number;
  daily_pnl_pct: number;
  uptime_seconds: number;

  // New Metrics
  max_drawdown: number;
  sharpe_ratio: number;
  win_rate: number;
  active_positions_count: number;
  orders_per_sec: number;

  // History for sparklines
  metrics_history: {
    pnl_7d: number[];
    pnl_30d: number[];
  };
};

export type Position = {
  ticker: string;
  side: 'YES' | 'NO';
  quantity: number;
  entry_price: number;
  current_price: number;
  unrealized_pnl: number;
  unrealized_pnl_pct: number;
  time_held_seconds: number;
  image_url?: string;
};

export type StrategyStatus = {
  name: string;
  enabled: boolean;
  throttled: boolean;
  performance_7d: number;
  win_rate: number;
  last_signal: string | null;
};

export type HealthMetrics = {
  websocket_connected: boolean;
  kalshi_connected: boolean;
  api_latency_ms: number | null;
  last_heartbeat: string;
  error_rate_1m: number;

  // New Health Metrics
  reliability_score: number; // 0-100
  last_incident_timestamp: string | null;
  active_strategies: string[];
  latency_history: { time: string; value: number }[];
  ai_agent_status: 'IDLE' | 'WARMING_UP' | 'ACTIVE' | 'RUNNING' | 'PAUSED' | 'ERROR' | 'STOPPED' | 'DISABLED' | 'STANDBY';
  startup_progress: number;
  startup_stage: string;
  database?: {
    status: 'ok' | 'error' | 'n/a';
    latency: number;
    message: string;
  };
  mcp?: {
    status: 'ok' | 'error' | 'n/a';
    latency: number; // Kalshi API latency
    message: string;
  };
};



export type LogEntry = {
  id: string; // Unique ID for keying
  timestamp: string;
  level: 'INFO' | 'WARN' | 'WARNING' | 'EXEC' | 'CRIT' | 'ERROR' | 'SUCCESS';
  message: string;
  tags?: string[];
  strategy?: string;
  context?: Record<string, unknown>;
};

export type DecisionNode = {
  id: string;
  timestamp: string;
  type: 'analysis' | 'decision' | 'action' | 'evaluation';
  description: string;
  confidence?: number;
  inputs?: Record<string, unknown>;
  output?: unknown;
  children?: DecisionNode[];
};

export type AIInsights = {
  confidence: number; // 0-100
  market_bias: string[];
  strategy_intent: string[];
  risk_posture: 'conservative' | 'moderate' | 'aggressive';
  thinking?: string;
  stage?: string;
  anomalies: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high';
    message: string;
    timestamp: string;
  }>;
};

// NEW: Trading Mode
export type TradingMode = 'paper' | 'live';

// NEW: AI Configuration for autonomous trading
export type AIConfiguration = {
  // Risk Parameters
  maxPositionSizePct: number; // Max % of portfolio per position (1-25)
  riskTolerance: 'low' | 'medium' | 'high';
  maxDailyLossPct: number; // Kill switch trigger (1-10%)

  // Market Filters
  minLiquidity: number; // Min contracts available
  maxSpread: number; // Max bid-ask spread
  volatilityThreshold: 'low' | 'medium' | 'high' | 'any';

  // Execution Protocols
  orderType: 'limit' | 'market' | 'adaptive';
  aggressiveness: number; // 1-10 (1 = passive, 10 = aggressive)

  // Autonomous Settings
  selfAdjustEnabled: boolean; // Allow AI to modify own parameters
  autoRebalance: boolean; // Allow portfolio rebalancing
  learningEnabled: boolean; // Enable ML optimization
};

// NEW: Autonomous Action Log
export type AutonomousAction = {
  id: string;
  timestamp: string;
  type: 'config_change' | 'strategy_switch' | 'risk_adjustment' | 'rebalance' | 'emergency';
  description: string;
  previousValue?: unknown;
  newValue?: unknown;
  reasoning: string;
  approved: boolean; // Was this auto-approved or requires review
};

interface TradingState {
  // TTS (Text-to-Speech)
  ttsEnabled: boolean;
  setTtsEnabled: (enabled: boolean) => void;
  ttsPlaying: boolean;
  setTtsPlaying: (playing: boolean) => void;
  // Profit Sound
  profitSoundEnabled: boolean;
  setProfitSoundEnabled: (enabled: boolean) => void;

  // Theme (NEW)
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Trading Mode (NEW)
  tradingMode: TradingMode;
  setTradingMode: (mode: TradingMode) => void;

  // AI Configuration (NEW)
  aiConfig: AIConfiguration;
  updateAIConfig: (updates: Partial<AIConfiguration>) => void;

  // Autonomous Actions (NEW)
  autonomousActions: AutonomousAction[];
  addAutonomousAction: (action: AutonomousAction) => void;
  clearAutonomousActions: () => void;

  // Emergency Controls (NEW)
  emergencyStop: boolean;
  setEmergencyStop: (stop: boolean) => void;

  // Bot State
  botState: 'RUNNING' | 'PAUSED' | 'STOPPED';
  setBotState: (state: 'RUNNING' | 'PAUSED' | 'STOPPED') => void;

  // Config
  initialCapital: number;
  setInitialCapital: (amount: number) => void;

  // Markets

  // Portfolio
  portfolio: Portfolio;
  setPortfolio: (portfolio: Partial<Portfolio>) => void;

  // Positions
  positions: Position[];
  setPositions: (positions: Position[]) => void;
  addPosition: (position: Position) => void;
  updatePosition: (ticker: string, updates: Partial<Position>) => void;
  removePosition: (ticker: string) => void;

  // Strategies
  strategies: StrategyStatus[];
  setStrategies: (strategies: StrategyStatus[]) => void;
  updateStrategy: (name: string, updates: Partial<StrategyStatus>) => void;

  // Health
  health: HealthMetrics;
  setHealth: (health: Partial<HealthMetrics>) => void;
  updateLatency: (latency: number) => void;

  // Logs
  logs: LogEntry[];
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;

  // GC
  gc: () => void;

  // AI Insights
  aiInsights: AIInsights;
  setAIInsights: (insights: Partial<AIInsights>) => void;

  // Decision Tree
  decisionTree: DecisionNode[];
  addDecisionNode: (node: DecisionNode) => void;
  clearDecisionTree: () => void;

  // Navigation & UI State
  currentView: string;
  setCurrentView: (view: string) => void;
  currentLayout: string;
  setCurrentLayout: (layout: string) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  favoriteViews: string[];
  recentViews: string[];
}

export const useTradingStore = create<TradingState>((set) => ({
  // TTS
  ttsEnabled: true,
  setTtsEnabled: (enabled) => set({ ttsEnabled: enabled }),
  ttsPlaying: false,
  setTtsPlaying: (playing) => set({ ttsPlaying: playing }),
  profitSoundEnabled: true,
  setProfitSoundEnabled: (enabled) => set({ profitSoundEnabled: enabled }),

  // Theme (NEW)
  theme: 'dark',
  toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),

  // Trading Mode (NEW)
  tradingMode: 'paper',
  setTradingMode: (mode) => set({ tradingMode: mode }),

  // AI Configuration (NEW)
  aiConfig: {
    maxPositionSizePct: 10,
    riskTolerance: 'medium',
    maxDailyLossPct: 5,
    minLiquidity: 100,
    maxSpread: 0.05,
    volatilityThreshold: 'medium',
    orderType: 'limit',
    aggressiveness: 5,
    selfAdjustEnabled: true,
    autoRebalance: true,
    learningEnabled: true,
  },
  updateAIConfig: (updates) =>
    set((state) => ({
      aiConfig: { ...state.aiConfig, ...updates },
    })),

  // Autonomous Actions (NEW)
  autonomousActions: [],
  addAutonomousAction: (action) =>
    set((state) => ({
      autonomousActions: [action, ...state.autonomousActions].slice(0, 100),
    })),
  clearAutonomousActions: () => set({ autonomousActions: [] }),

  // Emergency Controls (NEW)
  emergencyStop: false,
  setEmergencyStop: (stop) => set({ emergencyStop: stop, botState: stop ? 'STOPPED' : 'PAUSED' }),

  // Initial Bot State
  botState: 'STOPPED',
  setBotState: (state) => set({ botState: state }),

  // Configuration
  initialCapital: 100, // Default requested by user
  setInitialCapital: (amount) => set({ initialCapital: amount }),

  // Initial Portfolio
  portfolio: {
    balance: 100,
    total_equity: 100,
    free_margin: 100,
    daily_pnl: 0,
    daily_pnl_pct: 0,
    uptime_seconds: 0,
    max_drawdown: 0,
    sharpe_ratio: 0,
    win_rate: 0,
    active_positions_count: 0,
    orders_per_sec: 0,
    metrics_history: {
      pnl_7d: [],
      pnl_30d: [],
    },
  },
  setPortfolio: (updates) =>
    set((state) => ({
      portfolio: { ...state.portfolio, ...updates },
    })),

  // Initial Markets

  // Initial Positions
  positions: [],
  setPositions: (positions) => set({ positions }),
  addPosition: (position) =>
    set((state) => ({
      positions: [...state.positions, position],
    })),
  updatePosition: (ticker, updates) =>
    set((state) => ({
      positions: state.positions.map((p) => (p.ticker === ticker ? { ...p, ...updates } : p)),
    })),
  removePosition: (ticker) =>
    set((state) => ({
      positions: state.positions.filter((p) => p.ticker !== ticker),
    })),

  // Initial Strategies
  strategies: [],
  setStrategies: (strategies) => set({ strategies }),
  updateStrategy: (name, updates) =>
    set((state) => ({
      strategies: state.strategies.map((s) => (s.name === name ? { ...s, ...updates } : s)),
    })),

  // Initial Health
  health: {
    websocket_connected: false,
    kalshi_connected: false,
    api_latency_ms: null,
    last_heartbeat: '',
    error_rate_1m: 0,
    reliability_score: 100,
    last_incident_timestamp: null,
    active_strategies: [],
    latency_history: [],
    ai_agent_status: 'STANDBY',
    startup_progress: 10,
    startup_stage: 'Establishing Link...',
  },
  setHealth: (updates) =>
    set((state) => ({
      health: { ...state.health, ...updates },
    })),

  updateLatency: (latency) =>
    set((state) => {
      const history = state.health.latency_history || [];
      const newHistory = [
        ...history,
        { time: new Date().toLocaleTimeString('en-US', { hour12: true }), value: latency },
      ].slice(-50);
      return {
        health: {
          ...state.health,
          api_latency_ms: latency,
          latency_history: newHistory,
        },
      };
    }),

  // Initial Logs
  logs: [],
  addLog: (log) =>
    set((state) => ({
      // Keep max 1000 logs
      logs: [log, ...state.logs].slice(0, 1000),
    })),
  clearLogs: () => set({ logs: [] }),

  gc: () =>
    set((state) => ({
      logs: state.logs.slice(0, 200),
      decisionTree: state.decisionTree.slice(0, 50),
      health: {
        ...state.health,
        latency_history: state.health.latency_history.slice(-20),
      },
    })),

  // Initial AI Insights
  aiInsights: {
    confidence: 0,
    market_bias: [],
    strategy_intent: [],
    risk_posture: 'conservative',
    anomalies: [],
  },
  setAIInsights: (updates) =>
    set((state) => ({
      aiInsights: { ...state.aiInsights, ...updates },
    })),

  // Decision Tree
  decisionTree: [],
  addDecisionNode: (node) =>
    set((state) => ({
      // Keep max 100 nodes
      decisionTree: [node, ...state.decisionTree].slice(0, 100),
    })),
  clearDecisionTree: () => set({ decisionTree: [] }),

  // Navigation
  currentView: 'ai-brain',
  setCurrentView: (view) => set({ currentView: view }),
  currentLayout: 'default',
  setCurrentLayout: (layout) => set({ currentLayout: layout }),

  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  favoriteViews: [],
  recentViews: [],
}));
