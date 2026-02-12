import React, { useCallback, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { TopBar } from './components/layout/TopBar';
import { ControlDeck } from './components/layout/ControlDeck';
import { SettingsView } from './views/SettingsView';
import { useTradingStore, LogEntry } from './context/TradingContext';
import { useWebSocket } from './hooks/useWebSocket';
import { useAudio } from './context/AudioContext';
import { AppRouter } from './Router';
import { HealthMonitor } from './components/HealthMonitor';
import { ProfitMonitor } from './components/ProfitMonitor';

type BotState = 'RUNNING' | 'PAUSED' | 'STOPPED';

type WSMessage<T = unknown> = {
  type: string;
  payload: T;
  _latency?: number;
  active_strategies?: string[];
};

function App() {
  const {
    setPortfolio,
    setHealth,
    setBotState,
    addLog,
    setAIInsights,
    updateLatency,
    addDecisionNode,
    gc,
    ttsEnabled,
    theme,
  } = useTradingStore();
  const { playAudio } = useAudio();
  const [showSettings, setShowSettings] = useState(false);

  // Apply Theme Class
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Periodic Garbage Collection
  useEffect(() => {
    const gcInterval = setInterval(() => {
      // eslint-disable-next-line no-console
      console.log('🧹 Triggering frontend garbage collection...');
      gc();
    }, 3600000); // 1 hour
    return () => clearInterval(gcInterval);
  }, [gc]);

  // Memoized onMessage to prevent reconnection loops
  const handleMessage = useCallback(
    (data: WSMessage) => {
      if (data._latency) updateLatency(data._latency);

      const handlers: Record<string, (payload: unknown) => void> = {
        INITIAL_STATE: (payload: unknown) => {
          const p = payload as { 
            portfolio?: unknown; 
            health?: unknown; 
            botState?: string; 
            bot_state?: string; 
            logs?: LogEntry[]; 
            aiInsights?: unknown 
          };
          if (!p) return;
          if (p.portfolio) setPortfolio(p.portfolio);
          if (p.health) setHealth(p.health as any); // Context handles merge
          const bState = p.botState || p.bot_state;
          if (bState) setBotState(bState as BotState);
          if (p.logs) p.logs.forEach((l: LogEntry) => addLog(l));
          if (p.aiInsights) setAIInsights(p.aiInsights);
        },
        UPDATE_PORTFOLIO: (payload: unknown) => setPortfolio(payload as any),
        UPDATE_HEALTH: (payload: unknown) => {
          // Preserve websocket state, only update other metrics
          const { websocket_connected, ...rest } = payload as any;
          setHealth(rest); 
        },
        HEALTH: (payload: unknown) => {
           // Preserve websocket state, only update other metrics
           const { websocket_connected, ...rest } = payload as any;
           setHealth(rest);
        },
        UPDATE_AI: (payload: unknown) => {
          setAIInsights(payload);
          const p = payload as { audio_path?: string };
          if (ttsEnabled && p.audio_path) {
            playAudio(p.audio_path);
          }
        },
        LOG: (payload: unknown) => addLog(payload as LogEntry),
        BOT_STATE: (payload: unknown) => {
          const p = payload as { state?: string };
          if (p?.state) {
            const stateMap: Record<string, BotState> = {
              Starting: 'RUNNING',
              INITIALIZING: 'RUNNING',
              WarmingUp: 'RUNNING',
              Active: 'RUNNING',
              ACTIVE: 'RUNNING',
              Paused: 'PAUSED',
              PAUSED: 'PAUSED',
              Stopped: 'STOPPED',
              STOPPED: 'STOPPED',
              Error: 'STOPPED',
              ERROR: 'STOPPED',
              OneIterationDone: 'RUNNING',
            };
            const mappedState = stateMap[p.state] || (p.state.toUpperCase() as BotState) || 'STOPPED';
            setBotState(mappedState);
          }
        },
        DECISION_NODE: (payload: unknown) => {
          if (payload && typeof payload === 'object') {
            addDecisionNode(payload as any);
          }
        },
      };

      try {
        const handler = handlers[data.type];
        if (handler) {
          handler(data.payload);
        } else if (data.active_strategies !== undefined) {
          setHealth(data);
        }
      } catch (err) {
        console.error('[WebSocket] Handler Error:', err);
      }
    },
    [
      setPortfolio,
      setHealth,
      setBotState,
      addLog,
      setAIInsights,
      updateLatency,
      addDecisionNode,
      ttsEnabled,
      playAudio,
    ]
  );

  // WebSocket connection
  const { send: sendMessage, connectionState } = useWebSocket({
    url: 'ws://127.0.0.1:8766',
    onMessage: handleMessage,
  });

  // Sync connection state with store
  useEffect(() => {
    setHealth({ websocket_connected: connectionState === 'CONNECTED' });
  }, [connectionState, setHealth]);

  const handleSendCommand = useCallback(
    (cmd: string) => {
      // eslint-disable-next-line no-console
      console.log('[APP] Sending command:', cmd);
      sendMessage({ type: 'COMMAND', payload: { command: cmd } });
    },
    [sendMessage]
  );

  return (
    <div className="flex flex-col gap-4 bg-[var(--bg-app)] selection:bg-neon-cyan/30 p-0 h-full overflow-hidden font-sans text-[var(--text-primary)] selection:text-neon-cyan transition-colors duration-300">
      
      {/* Top Bar with Navigation */}
      <TopBar onCommand={handleSendCommand} onOpenSettings={() => setShowSettings(true)} />

      {/* Secondary Control Deck (Bot, Pipeline, Audio) */}
      <ControlDeck onCommand={handleSendCommand} />

      {/* Health Monitoring (Headless) */}
      <div className="hidden">
        <HealthMonitor />
        <ProfitMonitor />
      </div>

      {/* Main Content Area - Floated & Aligned */}
      <main className="relative flex flex-col flex-1 bg-black/20 border border-white/5 rounded-2xl min-h-0 overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="top-[-20%] left-[-10%] z-0 absolute bg-neon-cyan/5 blur-[120px] rounded-full w-[50%] h-[50%] pointer-events-none" />
        <div className="right-[-10%] bottom-[-20%] z-0 absolute bg-neon-green/5 blur-[100px] rounded-full w-[40%] h-[40%] pointer-events-none" />

        {/* Main Dashboard - Unified Widget Grid */}
        <div className="z-10 flex flex-col flex-1 min-h-0 overflow-hidden">
          <AppRouter onCommand={handleSendCommand} />
        </div>
      </main>

      {/* Settings Fullscreen Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-50 fixed inset-0 flex flex-col bg-[var(--bg-app)]"
          >
            {/* Settings Header */}
            <div className="flex justify-between items-center bg-black/50 backdrop-blur-xl px-6 py-4 border-white/10 border-b">
              <h1 className="font-bold text-white text-xl">Settings</h1>
              <button
                onClick={() => setShowSettings(false)}
                className="hover:bg-white/10 p-2 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Settings Content */}
            <div className="flex-1 overflow-auto">
              <SettingsView onCommand={handleSendCommand} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Right Floating Controls */}
      <div className="right-6 bottom-6 z-40 fixed flex flex-col items-end gap-3 pointer-events-auto">
        {/* TradingModeIndicator removed */}
      </div>

      {/* Toast Notifications */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'glass-card !bg-black/80 !border-white/10 !text-gray-200',
          duration: 4000,
          success: {
            iconTheme: { primary: '#00ff88', secondary: '#0a0a0f' },
          },
          error: {
            iconTheme: { primary: '#ff3366', secondary: '#0a0a0f' },
          },
        }}
      />
    </div>
  );
}

export default App;
