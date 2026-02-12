import React from 'react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Zap,
  AlertTriangle,
  Brain,
  Settings,
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  ScrollText,
  Grid,
} from 'lucide-react';
import { useTradingStore } from '../../context/TradingContext';
import { cn } from '../../utils/cn';

type NavItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  mode?: 'paper' | 'live';
  badge?: number;
};

type LeftRailProps = {
  onCommand?: (cmd: string) => void;
  className?: string;
};

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Grid, path: '/' },
  { id: 'ai-brain', label: 'Neural Core', icon: Brain, path: '/ai-brain' },
  {
    id: 'paper-trading',
    label: 'Portfolio View',
    icon: LayoutDashboard,
    path: '/portfolio',
    mode: 'paper',
  },
  { id: 'live-trading', label: 'Live Trading', icon: Zap, path: '/live-trading', mode: 'live' },
  { id: 'risk', label: 'Risk Protection', icon: AlertTriangle, path: '/risk' },
  { id: 'logs', label: 'System Logs', icon: ScrollText, path: '/logs' },
  { id: 'settings', label: 'System Settings', icon: Settings, path: '/settings' },
];

export const LeftRail: React.FC<LeftRailProps> = ({ onCommand, className }) => {
  const { sidebarCollapsed, toggleSidebar, tradingMode } = useTradingStore();

  const visibleItems = navItems.filter((item) => {
    if (!item.mode) return true;
    return item.mode === tradingMode;
  });

  const handleKillSwitch = () => {
    if (
      globalThis.confirm('CRITICAL: Flatten all positions and halt all AI agents immediately?')
    ) {
      if (onCommand) {
        onCommand('KILL');
      }
    }
  };

  return (
    <motion.div
      className={cn(
        'flex flex-col bg-glass-bg backdrop-blur-glass border-glass-border border-r h-full',
        className
      )}
      animate={{ width: sidebarCollapsed ? 80 : 240 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Toggle Button */}
      <div className="flex justify-between items-center px-4 border-glass-border border-b h-16">
        {!sidebarCollapsed && (
          <span className="font-medium text-gray-400 text-xs uppercase tracking-wider">
            Navigation
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="hover:bg-glass-hover p-2 rounded-lg transition-colors"
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>

      {/* Navigation Items with React Router NavLink */}
      <nav className="flex-1 space-y-1 p-3">
        {visibleItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-3 rounded-lg w-full smooth-transition',
                  'hover:bg-glass-hover',
                  isActive && 'bg-glass-hover border border-neon-cyan/30',
                  sidebarCollapsed && 'justify-center'
                )
              }
            >
              {({ isActive }) => (
                <motion.div
                  className="flex items-center gap-3 w-full"
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className={cn('w-5 h-5', isActive ? 'text-neon-cyan' : 'text-gray-400')} />
                  {!sidebarCollapsed && (
                    <span
                      className={cn(
                        'font-medium text-sm',
                        isActive ? 'text-neon-cyan' : 'text-gray-300'
                      )}
                    >
                      {item.label}
                    </span>
                  )}
                  {item.badge && !sidebarCollapsed && (
                    <span className="bg-neon-red/20 ml-auto px-2 py-0.5 rounded-full font-bold text-neon-red text-xs">
                      {item.badge}
                    </span>
                  )}
                </motion.div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Kill Switch (Always at bottom) */}
      <div className="p-3 border-glass-border border-t">
        <motion.button
          onClick={handleKillSwitch}
          className={cn(
            'flex items-center gap-3 px-3 py-3 rounded-lg w-full smooth-transition',
            'bg-gradient-to-r from-neon-red/20 to-neon-red/10',
            'border border-neon-red/30',
            'hover:from-neon-red/30 hover:to-neon-red/20',
            'hover:border-neon-red/50',
            sidebarCollapsed && 'justify-center'
          )}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <AlertOctagon className="w-5 h-5 text-neon-red" />
          {!sidebarCollapsed && (
            <span className="font-bold text-neon-red text-sm uppercase tracking-wide">
              Kill Switch
            </span>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};
