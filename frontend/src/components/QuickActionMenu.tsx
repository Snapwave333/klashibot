import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  TrendingUp,
  Download,
  Brain,
  RefreshCw,
  AlertTriangle,
  Settings,
  Activity,
  BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useTradingStore } from '../context/TradingContext';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: 'cyan' | 'green' | 'amber' | 'red' | 'purple';
  action: () => void;
  badge?: string;
  disabled?: boolean;
}

interface QuickActionMenuProps {
  onCommand?: (cmd: string) => void;
}

export const QuickActionMenu: React.FC<QuickActionMenuProps> = ({ onCommand }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { logs, botState } = useTradingStore();

  const colorClasses = {
    cyan: {
      bg: 'bg-neon-cyan/10',
      border: 'border-neon-cyan/30',
      text: 'text-neon-cyan',
      hover: 'hover:bg-neon-cyan/20 hover:border-neon-cyan/50',
      shadow: 'hover:shadow-[0_0_20px_rgba(0,255,255,0.2)]',
    },
    green: {
      bg: 'bg-neon-green/10',
      border: 'border-neon-green/30',
      text: 'text-neon-green',
      hover: 'hover:bg-neon-green/20 hover:border-neon-green/50',
      shadow: 'hover:shadow-[0_0_20px_rgba(0,255,136,0.2)]',
    },
    amber: {
      bg: 'bg-neon-amber/10',
      border: 'border-neon-amber/30',
      text: 'text-neon-amber',
      hover: 'hover:bg-neon-amber/20 hover:border-neon-amber/50',
      shadow: 'hover:shadow-[0_0_20px_rgba(255,170,0,0.2)]',
    },
    red: {
      bg: 'bg-neon-red/10',
      border: 'border-neon-red/30',
      text: 'text-neon-red',
      hover: 'hover:bg-neon-red/20 hover:border-neon-red/50',
      shadow: 'hover:shadow-[0_0_20px_rgba(255,51,102,0.2)]',
    },
    purple: {
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
      text: 'text-purple-400',
      hover: 'hover:bg-purple-500/20 hover:border-purple-500/50',
      shadow: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]',
    },
  };

  const actions: QuickAction[] = [
    {
      id: 'new-position',
      label: 'New Position',
      icon: TrendingUp,
      color: 'green',
      action: () => {
        toast.success('Opening new position dialog...', { duration: 2000 });
        // Open new position dialog
      },
    },
    {
      id: 'ai-query',
      label: 'Ask AI',
      icon: Brain,
      color: 'cyan',
      action: () => {
        toast.success('Opening AI query interface...', { duration: 2000 });
        // Open AI query dialog
      },
      badge: botState === 'RUNNING' ? 'Active' : undefined,
    },
    {
      id: 'export-logs',
      label: 'Export Logs',
      icon: Download,
      color: 'amber',
      action: () => {
        try {
          // Create log export
          const logData = JSON.stringify(logs, null, 2);
          const blob = new Blob([logData], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `kalshi-logs-${Date.now()}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          toast.success('Logs exported successfully!', { duration: 2000 });
        } catch (error) {
          toast.error('Failed to export logs', { duration: 2000 });
        }
      },
      badge: `${logs.length}`,
    },
    {
      id: 'refresh-data',
      label: 'Refresh Data',
      icon: RefreshCw,
      color: 'purple',
      action: () => {
        toast.success('Refreshing market data...', {
          duration: 2000,
          icon: '🔄',
        });
        if (onCommand) {
          onCommand('REFRESH');
        }
      },
    },
    {
      id: 'risk-check',
      label: 'Risk Analysis',
      icon: AlertTriangle,
      color: 'amber',
      action: () => {
        toast.success('Running risk analysis...', { duration: 2000 });
        // Trigger risk analysis
      },
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: BarChart3,
      color: 'cyan',
      action: () => {
        toast.success('Opening performance metrics...', { duration: 2000 });
        // Navigate to performance view
      },
    },
  ];

  return (
    <>
      {/* Quick Action Buttons (when expanded) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-28 right-6 z-40 flex flex-col gap-2"
          >
            {actions.map((action, idx) => {
              const Icon = action.icon;
              const colors = colorClasses[action.color];

              return (
                <motion.button
                  key={action.id}
                  initial={{ opacity: 0, x: 20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 20, scale: 0.8 }}
                  transition={{
                    delay: idx * 0.05,
                    type: 'spring',
                    damping: 15,
                    stiffness: 300,
                  }}
                  onClick={() => {
                    if (!action.disabled) {
                      action.action();
                      setIsOpen(false);
                    }
                  }}
                  disabled={action.disabled}
                  className={`
                    group flex items-center gap-3 px-4 py-3
                    bg-black/90 backdrop-blur-xl
                    border ${colors.border}
                    rounded-xl
                    ${colors.hover}
                    ${colors.shadow}
                    transition-all duration-200
                    whitespace-nowrap
                    ${action.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  whileHover={!action.disabled ? { x: -4, scale: 1.02 } : {}}
                  whileTap={!action.disabled ? { scale: 0.98 } : {}}
                >
                  <div className={`p-2 rounded-lg ${colors.bg}`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium text-sm">{action.label}</span>
                    {action.badge && (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${colors.bg} ${colors.text}`}
                      >
                        {action.badge}
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05, rotate: isOpen ? 90 : 0 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          fixed bottom-6 right-6 z-50
          w-14 h-14
          rounded-full
          font-bold
          shadow-2xl
          transition-all duration-300
          flex items-center justify-center
          ${
            isOpen
              ? 'bg-neon-red text-black shadow-[0_0_30px_rgba(255,51,102,0.6)]'
              : 'bg-neon-cyan text-black shadow-[0_0_30px_rgba(0,255,255,0.6)]'
          }
          hover:shadow-[0_0_40px_rgba(0,255,255,0.8)]
          active:shadow-[0_0_20px_rgba(0,255,255,0.4)]
        `}
        title={isOpen ? 'Close Quick Actions' : 'Open Quick Actions'}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Plus className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Keyboard Hint (shows briefly on first load) */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed bottom-[88px] right-6 z-40 px-3 py-1.5 bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg text-xs text-gray-400 pointer-events-none"
          >
            Quick Actions
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
