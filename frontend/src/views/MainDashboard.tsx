/**
 * MainDashboard.tsx
 *
 * Unified dashboard with all widgets as expandable cards.
 * Layout buttons control which widgets are displayed.
 * Each widget can expand to fullscreen.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Maximize2,
  Minimize2,
  X,
  Activity,
  Brain,

  ScrollText,
  TrendingUp,
  PieChart,
  Wallet,
  Play,
  Pause,
  Square,
} from 'lucide-react';
import { useTradingStore } from '../context/TradingContext';

// Import all widget content components
import { EquityWidget } from '../components/widgets/EquityWidget';
import { PerformanceWidget } from '../components/widgets/PerformanceWidget';
import { ExposureMapWidget } from '../components/widgets/ExposureMapWidget';
import { ActivePositionsWidget } from '../components/widgets/ActivePositionsWidget';
import AIBrainView from './AIBrainView';

import LogsView from './LogsView';
import { cn } from '../utils/cn';

// ============================================================================
// TYPES
// ============================================================================

interface DashboardWidget {
  id: string;
  name: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  minHeight: string;
  category: 'trading' | 'ai' | 'system' | 'config';
}

interface ExpandableCardProps {
  widget: DashboardWidget;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
  className?: string; // Enhanced styling for Bento layout
}

// ============================================================================
// LAYOUT CONFIGURATIONS
// ============================================================================

// Each layout defines which widgets are visible and their grid arrangement
const layoutConfigs: Record<
  string,
  {
    name: string;
    widgets: string[];
    gridClass: string;
  }
> = {
  default: {
    name: 'Dashboard',
    widgets: ['equity', 'performance', 'exposure', 'positions', 'logs'],
    gridClass: 'grid-cols-1 lg:grid-cols-3 grid-rows-[45%_55%]',
  },
  focus: {
    name: 'Focus',
    widgets: ['ai-brain', 'logs'],
    gridClass: 'grid-cols-1 lg:grid-cols-2',
  },
  split: {
    name: 'Analytics',
    widgets: ['equity', 'performance', 'positions'],
    gridClass: 'grid-cols-2',
  },
  cinema: {
    name: 'Command',
    widgets: ['exposure', 'ai-brain', 'logs'],
    gridClass: 'grid-cols-1 lg:grid-cols-3',
  },
  'paper-trading': {
    name: 'Portfolio',
    widgets: ['equity', 'performance', 'positions', 'exposure', 'logs'],
    gridClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  }
};

// ============================================================================
// EXPANDABLE CARD COMPONENT
// ============================================================================

const ExpandableCard: React.FC<ExpandableCardProps> = ({
  widget,
  isExpanded,
  onToggleExpand,
  onClose,
  className
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`
        relative rounded-3xl overflow-hidden flex flex-col
        bg-slate-900/40 border border-white/5 backdrop-blur-2xl
        ${isExpanded ? 'w-full h-full shadow-2xl z-50' : 'z-0 shadow-lg'}
        ${className}
        group
      `}
      style={{ minHeight: isExpanded ? '100vh' : widget.minHeight, height: isExpanded ? '100vh' : '100%' }}
    >
      {/* Header */}
      <div 
        className="flex justify-between items-center bg-white/2 px-[var(--space-m)] py-[var(--space-s)] border-white/5 border-b"
      >
        <div className="flex items-center gap-[var(--space-s)]">
          <span className="text-[rgb(205,148,65)]">{widget.icon}</span>
          <h3 className="font-semibold text-white text-xs uppercase tracking-wider">{widget.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          {!isExpanded && (
            <button
              onClick={onToggleExpand}
              className="hover:bg-white/10 p-2 rounded-xl text-[var(--neutral-400)] hover:text-[var(--neutral-0)] active:scale-95 transition-all"
              title="Fullscreen"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
          )}
          {isExpanded && (
            <>
              <button
                onClick={onToggleExpand}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl font-bold text-[var(--neutral-0)] text-xs active:scale-95 transition-all"
                title="Minimize"
              >
                <Minimize2 className="w-4 h-4" />
                Exit Fullscreen
              </button>
              <button
                onClick={onClose}
                className="bg-[var(--color-danger)]/10 hover:bg-[var(--color-danger)]/20 p-2 rounded-xl text-[var(--color-danger)] active:scale-95 transition-all"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content Area with ISABP Spacing */}
      <div className={`p-[var(--space-m)] ${isExpanded ? 'h-[calc(100%-48px)] overflow-auto' : 'flex-1 overflow-auto'}`}>
        {widget.component}
      </div>

      {/* Fullscreen backdrop */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="-z-10 fixed inset-0 bg-[var(--bg-overlay)] backdrop-blur-sm"
          onClick={onClose}
        />
      )}
    </motion.div>
  );
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

interface MainDashboardProps {
  onCommand: (command: string) => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({ onCommand }) => {
  const { currentLayout, botState } = useTradingStore();
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null);

  // Define all available widgets
  const allWidgets: DashboardWidget[] = React.useMemo(() => [
    {
      id: 'equity',
      name: 'Portfolio Equity',
      icon: <Wallet className="w-4 h-4" />,
      component: <EquityWidget />,
      minHeight: '100%',
      category: 'trading',
    },
    {
      id: 'performance',
      name: 'Performance',
      icon: <TrendingUp className="w-4 h-4" />,
      component: <PerformanceWidget />,
      minHeight: '100%',
      category: 'trading',
    },
    {
      id: 'exposure',
      name: 'Exposure Map',
      icon: <PieChart className="w-4 h-4" />,
      component: <ExposureMapWidget />,
      minHeight: '100%',
      category: 'trading',
    },
    {
      id: 'positions',
      name: 'Active Positions',
      icon: <Activity className="w-4 h-4" />,
      component: <ActivePositionsWidget />,
      minHeight: '100%',
      category: 'trading',
    },
    {
      id: 'ai-brain',
      name: 'AI Neural Core',
      icon: <Brain className="w-4 h-4" />,
      component: <AIBrainView />,
      minHeight: '100%',
      category: 'ai',
    },

    {
      id: 'logs',
      name: 'System Logs',
      icon: <ScrollText className="w-4 h-4" />,
      component: <LogsView />,
      minHeight: '100%',
      category: 'system',
    },
  ], []);

  // Get current layout config with safety fallback
  const config = React.useMemo(() => {
    return layoutConfigs[currentLayout] || layoutConfigs.default;
  }, [currentLayout]);

  // const handleResetLayout = () => {
  //   const storageKey = `aura_layout_${currentLayout}`;
  //   localStorage.removeItem(storageKey);
  //   window.location.reload(); // Hard reset for any stuck state
  // };


  const handleToggleExpand = useCallback((widgetId: string) => {
    setExpandedWidget((prev) => (prev === widgetId ? null : widgetId));
  }, []);

  const handleCloseExpanded = useCallback(() => {
    setExpandedWidget(null);
  }, []);

  const handleBotControl = useCallback((action: 'START' | 'PAUSE' | 'STOP') => {
    const ws = (globalThis as any).__ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'COMMAND',
          payload: { command: action === 'START' ? 'PLAY' : action },
        })
      );
    }
  }, []);

  return (
    <div className="relative p-4 w-full h-full overflow-hidden">
      {/* Header with Title and Controls */}
      <div className="flex justify-between items-center bg-black/40 -mx-4 -mt-4 mb-4 px-4 py-3 border-white/10 border-b">
        <div className="flex items-center gap-4">
          <div className="text-left">
            <h1 className="font-bold text-white text-xl">{config.name}</h1>
            <p className="font-mono text-[10px] text-gray-600 uppercase tracking-widest">{config.widgets.length} modules active</p>
          </div>

        </div>

        {/* Bot Controls */}
        <div className="flex bg-black/30 shadow-lg p-1.5 border border-white/10 rounded-xl">
            <button
            onClick={() => handleBotControl('START')}
            disabled={botState === 'RUNNING'}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                botState === 'RUNNING'
                ? 'bg-neon-green/20 text-neon-green'
                : 'hover:bg-white/5 text-gray-400'
            }`}
            >
            <Play className="w-4 h-4" />
            <span className="font-bold text-xs">START</span>
            </button>
            <button
            onClick={() => handleBotControl('PAUSE')}
            disabled={botState !== 'RUNNING'}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                botState === 'PAUSED'
                ? 'bg-neon-amber/20 text-neon-amber'
                : 'hover:bg-white/5 text-gray-400'
            }`}
            >
            <Pause className="w-4 h-4" />
            <span className="font-bold text-xs">PAUSE</span>
            </button>
            <button
            onClick={() => handleBotControl('STOP')}
            className="flex items-center gap-2 hover:bg-red-500/10 px-4 py-2 rounded-lg text-gray-400 hover:text-red-400 transition-all"
            >
            <Square className="w-4 h-4" />
            <span className="font-bold text-xs">STOP</span>
            </button>
        </div>
      </div>

      {/* Bento Grid Implementation */}
      <motion.div 
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1
            }
          }
        }}
        initial="hidden"
        animate="show"
        className={cn(
          "gap-[var(--space-m)] grid p-0 w-full h-[calc(100%-60px)]",
          config.gridClass
        )}
      >
        <AnimatePresence mode="popLayout">
          {allWidgets.filter(w => config.widgets.includes(w.id)).map((widget) => (
            <motion.div 
              key={widget.id}
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0 }
              }}
              className={cn(
                "h-full transition-all duration-300",
                widget.id === 'equity' && 'lg:col-span-1 lg:row-span-2', // Item 1: Span 2 rows
                widget.id === 'performance' && 'lg:col-span-1', // Item 2
                widget.id === 'exposure' && 'lg:col-span-1', // Item 3
                widget.id === 'positions' && 'lg:col-span-1', // Item 4
                widget.id === 'logs' && 'lg:col-span-1', // Item 5
                
                // Fallbacks for other widgets if added
                widget.id === 'ai-brain' && 'lg:col-span-3 lg:row-span-2'
              )}
            >
              <ExpandableCard
                  widget={widget}
                  isExpanded={false}
                  onToggleExpand={() => handleToggleExpand(widget.id)}
                  onClose={handleCloseExpanded}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Expanded Widget Overlay */}
      <AnimatePresence>
        {expandedWidget && (
          <div className="z-[100] fixed inset-0 flex justify-center items-center p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto"
              onClick={handleCloseExpanded}
            />
            
            {/* Global Exit Fullscreen Button - Positioned below header */}
            <motion.button
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              onClick={handleCloseExpanded}
              className="top-24 z-[110] absolute flex items-center gap-2 bg-neon-cyan/10 hover:bg-neon-cyan/20 shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:shadow-[0_0_30px_rgba(0,255,255,0.4)] backdrop-blur-md px-6 py-3 border border-neon-cyan/30 rounded-full font-bold text-neon-cyan transition-all cursor-pointer pointer-events-auto"
            >
              <Minimize2 className="w-5 h-5" />
              EXIT FULLSCREEN
            </motion.button>

            <motion.div
              layoutId={`widget-${expandedWidget}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-slate-900 shadow-2xl border border-white/10 rounded-3xl w-full max-w-7xl h-full max-h-[90vh] overflow-hidden pointer-events-auto"
            >
              {allWidgets.find(w => w.id === expandedWidget) && (
                <ExpandableCard
                  widget={allWidgets.find(w => w.id === expandedWidget)}
                  isExpanded={true}
                  onToggleExpand={handleCloseExpanded}
                  onClose={handleCloseExpanded}
                />
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainDashboard;
