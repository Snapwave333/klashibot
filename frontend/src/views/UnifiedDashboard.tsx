/**
 * UnifiedDashboard.tsx
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
  Activity,
  Brain,
  Shield,
  ScrollText,
  TrendingUp,
  PieChart,
  Wallet,
  Grid3x3,
  Layout,
  PanelTop,
  Columns,
  Maximize,
  Grid,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Play,
  Pause,
  Square,
  Settings,
} from 'lucide-react';
import { useTradingStore } from '../context/TradingContext';

// Import all widget content components
import { EquityWidget } from '../components/widgets/EquityWidget';
import { PerformanceWidget } from '../components/widgets/PerformanceWidget';
import { ExposureMapWidget } from '../components/widgets/ExposureMapWidget';
import { ActivePositionsWidget } from '../components/widgets/ActivePositionsWidget';
import { AIBrainView } from './AIBrainView';

import { LogsView } from './LogsView';
import { RiskView } from './RiskView';
import { AnimatedLayoutButtonContainer, BackgroundParticleField } from '../components/ui/LayoutTransitionManager';

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
  visible?: boolean;
  locked?: boolean;
  size?: string;
  title?: string;
  type?: string;
  position?: number;
  className?: string; // For specific grid placement
}

interface ExpandableCardProps {
  widget: DashboardWidget;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onClose: () => void;
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
    name: 'Bento Grid',
    widgets: ['equity', 'performance', 'exposure', 'positions', 'logs'],
    gridClass: 'grid-cols-1 lg:grid-cols-3 auto-rows-[minmax(300px,auto)]', // 3 cols, auto height rows (min 300px)
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
};

const layoutPresets = [
  {
    id: 'default',
    name: 'Dashboard',
    description: 'Standard Layout',
    icon: <Grid className="w-4 h-4" />,
    config: [],
  },
  {
    id: 'focus',
    name: 'Focus',
    description: 'Stacked View',
    icon: <PanelTop className="w-4 h-4" />,
    config: [],
  },
  {
    id: 'split',
    name: 'Split',
    description: 'Side by Side',
    icon: <Columns className="w-4 h-4" />,
    config: [],
  },
  {
    id: 'cinema',
    name: 'Cinema',
    description: 'Full Screen AI',
    icon: <Maximize className="w-4 h-4" />,
    config: [],
  },
];

// ============================================================================
// EXPANDABLE CARD COMPONENT
// ============================================================================

const ExpandableCard: React.FC<ExpandableCardProps> = ({
  widget,
  isExpanded,
  onToggleExpand,
  onClose,
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`
        relative rounded-xl overflow-hidden
        bg-[#0B0C10] border border-white/10 shadow-lg flex flex-col
        ${isExpanded ? 'w-full h-full shadow-2xl z-50' : 'z-0'}
      `}
      style={{ minHeight: isExpanded ? '100%' : widget.minHeight }}
    >
      {/* Header - Standardized Height (48px/12) */}
      <div className="flex justify-between items-center bg-white/5 px-4 border-white/10 border-b h-12 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[var(--primary-500)]">{widget.icon}</span>
          <h3 className="font-semibold text-[var(--neutral-0)] text-sm">{widget.name} <span className="opacity-20 text-[8px] text-[var(--neutral-400)]">BRIDGE.v1.1.2</span></h3>
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
        </div>
      </div>

      {/* Content */}
      <div className={`${isExpanded ? 'h-[calc(100%-48px)] overflow-auto' : 'h-full'}`}>
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
// MAIN UNIFIED DASHBOARD COMPONENT
// ============================================================================

export const UnifiedDashboard: React.FC<{ onCommand?: (cmd: string) => void }> = ({ onCommand }) => {
  const { currentLayout, botState } = useTradingStore();
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [currentPreset, setCurrentPreset] = useState('default');

  // Define all available widgets
  const allWidgets: DashboardWidget[] = [
    {
      id: 'equity',
      name: 'Portfolio Equity',
      icon: <Wallet className="w-4 h-4" />,
      component: <EquityWidget />,
      minHeight: '100%',
      category: 'trading',
      className: 'lg:col-span-1 lg:row-span-2', // Spans 2 rows (Item 1)
    },
    {
      id: 'performance',
      name: 'Performance',
      icon: <TrendingUp className="w-4 h-4" />,
      component: <PerformanceWidget />,
      minHeight: '100%',
      category: 'trading',
      className: 'lg:col-span-1', // Item 2
    },
    {
      id: 'exposure',
      name: 'Exposure Map',
      icon: <PieChart className="w-4 h-4" />,
      component: <ExposureMapWidget />,
      minHeight: '100%',
      category: 'trading',
      className: 'lg:col-span-1', // Item 3
    },
    {
      id: 'positions',
      name: 'Active Positions',
      icon: <Activity className="w-4 h-4" />,
      component: <ActivePositionsWidget />,
      minHeight: '100%',
      category: 'trading',
      className: 'lg:col-span-1', // Item 4
    },
    {
      id: 'ai-brain',
      name: 'AI Neural Core',
      icon: <Brain className="w-4 h-4" />,
      component: <AIBrainView />,
      minHeight: '450px',
      category: 'ai',
      className: 'lg:col-span-3',
    },
    {
      id: 'risk',
      name: 'Risk Analysis',
      icon: <Shield className="w-4 h-4" />,
      component: <RiskView />,
      minHeight: '400px',
      category: 'system',
    },
    {
      id: 'logs',
      name: 'System Logs',
      icon: <ScrollText className="w-4 h-4" />,
      component: <LogsView />,
      minHeight: '100%',
      category: 'system',
      className: 'lg:col-span-1', // Item 5
    },
  ];

  // Get current layout config
  const config = layoutConfigs[currentLayout] || layoutConfigs.default;

  // Filter widgets based on current layout
  const visibleWidgets = allWidgets.filter((w) => config.widgets.includes(w.id));

  const toggleWidgetVisibility = (id: string) => {
    // Note: Since widgets are static in this demo, this would need state update logic
    // eslint-disable-next-line no-console
    console.log('Toggle visibility:', id);
  };

  const toggleWidgetLock = (id: string) => {
    // eslint-disable-next-line no-console
    console.log('Toggle lock:', id);
  };

  const handleToggleExpand = useCallback((widgetId: string) => {
    setExpandedWidget((prev) => (prev === widgetId ? null : widgetId));
  }, []);

  const handleCloseExpanded = useCallback(() => {
    setExpandedWidget(null);
  }, []);

  const handleBotControl = useCallback((action: 'START' | 'PAUSE' | 'STOP') => {
    const ws = (globalThis as unknown as Window & { __ws?: WebSocket }).__ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'COMMAND',
          payload: { command: action === 'START' ? 'PLAY' : action },
        })
      );
    }
  }, []);

   const applyPreset = (presetId: string) => {
        setCurrentPreset(presetId);
        // Logic to update layout would go here, currently using static layoutConfigs
   }

  return (
    <div className="relative flex flex-col bg-carbon-fiber h-full overflow-hidden">
       {/* Animated background with particle field */}
       <div className="z-0 absolute inset-0 opacity-30">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,255,255,0.1),transparent_50%)]" />
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(0,255,136,0.1),transparent_50%)]" />
         <BackgroundParticleField isActive={true} intensity={0.5} />
       </div>

       {/* Header Bar */}
       <div className="z-10 relative flex justify-between items-center bg-void/50 shadow-2xl backdrop-blur-xl px-8 py-4 border-white/10 border-b">
         <div className="flex items-center gap-4">
           <motion.div
             animate={{ rotate: 360 }}
             transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
             className="flex justify-center items-center bg-gradient-to-br from-neon-cyan to-neon-green shadow-lg shadow-neon-cyan/50 rounded-full w-12 h-12"
           >
             <span className="font-black text-void text-2xl">K</span>
           </motion.div>
           <div>
             <h1 className="font-black text-white text-2xl tracking-tight">
               KALASHI
               <span className="ml-2 text-neon-cyan">COMMAND</span>
             </h1>
             <p className="text-gray-400 text-xs">AI-Powered Autonomous Trading</p>
           </div>
         </div>

         {/* Bot Controls */}
         <div className="flex items-center gap-3">
           {/* Animated Layout Selector with 60 FPS Effects */}
           <AnimatedLayoutButtonContainer
             presets={layoutPresets}
             currentPreset={currentPreset}
             onPresetChange={applyPreset}
           />

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

           <button
             onClick={() => setIsCustomizing(!isCustomizing)}
             className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
               isCustomizing
                 ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                 : 'bg-black/30 text-gray-400 border border-white/10 hover:text-white'
             }`}
           >
             <Settings className="w-4 h-4" />
             <span className="font-bold text-xs">CUSTOMIZE</span>
           </button>
         </div>
       </div>

    <div className="relative flex-1 p-4 pb-24 overflow-auto custom-scrollbar">
      {/* Layout Title */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="font-bold text-white text-xl">{config.name}</h1>
          <p className="text-gray-500 text-xs">{visibleWidgets.length} widgets active</p>
        </div>
      </div>

      {/* Widget Grid */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentLayout}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`grid gap-2 ${config.gridClass}`}
        >
          {visibleWidgets.map((widget) => (
            <div 
              key={widget.id} 
              className={widget.className || ''} 
              style={{ minHeight: widget.minHeight, height: '100%' }}
            >
              {expandedWidget !== widget.id && (
                <ExpandableCard
                  widget={widget}
                  isExpanded={false}
                  onToggleExpand={() => handleToggleExpand(widget.id)}
                  onClose={handleCloseExpanded}
                />
              )}
            </div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Expanded Widget Overlay */}
      <AnimatePresence>
        {expandedWidget && (
          <div className="z-[100] fixed inset-0 flex flex-col justify-center items-center p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md pointer-events-auto"
              onClick={handleCloseExpanded}
            />
            
            <motion.div
              layoutId={`widget-${expandedWidget}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-slate-900 shadow-2xl border border-white/10 rounded-3xl w-full max-w-7xl h-[85vh] overflow-hidden pointer-events-auto"
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

            {/* Global Exit Fullscreen Button - Positioned at Bottom */}
            <motion.button
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={handleCloseExpanded}
              className="bottom-8 z-[110] absolute flex items-center gap-2 bg-neon-cyan/10 hover:bg-neon-cyan/20 shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:shadow-[0_0_30px_rgba(0,255,255,0.4)] backdrop-blur-md px-6 py-3 border border-neon-cyan/30 rounded-full font-bold text-neon-cyan transition-all cursor-pointer pointer-events-auto btn-primary"
            >
              <Minimize2 className="w-5 h-5" />
              EXIT FULLSCREEN
            </motion.button>
          </div>
        )}
      </AnimatePresence>
    </div>

    {/* Customization Panel */}
       <AnimatePresence>
         {isCustomizing && (
           <motion.div
             initial={{ x: 400 }}
             animate={{ x: 0 }}
             exit={{ x: 400 }}
             className="top-20 right-6 z-50 absolute bg-void/95 shadow-2xl backdrop-blur-xl border border-white/20 rounded-2xl w-96 overflow-hidden"
           >
             <div className="flex justify-between items-center bg-neon-cyan/10 p-4 border-neon-cyan/30 border-b">
               <h3 className="flex items-center gap-2 font-bold text-neon-cyan">
                 <Grid3x3 className="w-5 h-5" />
                 Dashboard Layout
               </h3>
               <button
                 onClick={() => setIsCustomizing(false)}
                 className="hover:bg-white/10 p-2 rounded-lg text-gray-400 hover:text-white transition-all"
               >
                 ✕
               </button>
             </div>
 
             <div className="space-y-4 p-4 max-h-[600px] overflow-y-auto">
               {/* Preset Layout Buttons */}
               <div className="space-y-2">
                 <h4 className="flex items-center gap-2 font-semibold text-gray-300 text-xs uppercase tracking-wider">
                   <Layout className="w-3 h-3" />
                   Layout Presets
                 </h4>
                 <div className="gap-2 grid grid-cols-2">
                   {layoutPresets.map((preset) => (
                     <motion.button
                       key={preset.id}
                       onClick={() => applyPreset(preset.id)}
                       whileHover={{ scale: 1.02 }}
                       whileTap={{ scale: 0.98 }}
                       className={`flex flex-col items-start gap-2 p-3 rounded-xl transition-all ${
                         currentPreset === preset.id
                           ? 'bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan'
                           : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20'
                       }`}
                     >
                       <div className="flex justify-between items-center w-full">
                         <div className="flex items-center gap-2">
                           {preset.icon}
                           <span className="font-bold text-xs">{preset.name}</span>
                         </div>
                         {currentPreset === preset.id && (
                           <motion.div
                             initial={{ scale: 0 }}
                             animate={{ scale: 1 }}
                             className="bg-neon-cyan rounded-full w-1.5 h-1.5"
                           />
                         )}
                       </div>
                       <p className="opacity-80 text-[10px] text-left">{preset.description}</p>
                     </motion.button>
                   ))}
                 </div>
               </div>
 
               {/* Widget List */}
               <div className="space-y-2">
                 <h4 className="flex items-center gap-2 font-semibold text-gray-300 text-xs uppercase tracking-wider">
                   <Grid3x3 className="w-3 h-3" />
                   Widgets
                 </h4>
                 <div className="space-y-2">
                   {visibleWidgets.map((widget) => (
                     <div
                       key={widget.id}
                       className="flex justify-between items-center bg-white/5 p-3 border border-white/10 rounded-xl"
                     >
                       <div className="flex items-center gap-3">
                         <div className="text-neon-cyan">{widget.icon}</div>
                         <span className="font-medium text-white text-sm">{widget.title || widget.name}</span>
                       </div>
                       <div className="flex gap-2">
                         <button
                           onClick={() => toggleWidgetVisibility(widget.id)}
                           className={`p-2 rounded-lg transition-all ${
                             widget.visible
                               ? 'bg-neon-green/20 text-neon-green'
                               : 'bg-white/5 text-gray-500'
                           }`}
                         >
                           {widget.visible ? (
                             <Eye className="w-4 h-4" />
                           ) : (
                             <EyeOff className="w-4 h-4" />
                           )}
                         </button>
                         <button
                           onClick={() => toggleWidgetLock(widget.id)}
                           className={`p-2 rounded-lg transition-all ${
                             widget.locked
                               ? 'bg-neon-red/20 text-neon-red'
                               : 'bg-white/5 text-gray-500'
                           }`}
                         >
                           {widget.locked ? (
                             <Lock className="w-4 h-4" />
                           ) : (
                             <Unlock className="w-4 h-4" />
                           )}
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             </div>
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
};

export default UnifiedDashboard;