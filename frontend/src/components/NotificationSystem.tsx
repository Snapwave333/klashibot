import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  X,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  DollarSign,
  Filter,
} from 'lucide-react';
import { useTradingStore } from '../context/TradingContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'trade' | 'alert' | 'system' | 'performance' | 'risk';
  severity: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionable?: boolean;
  action?: () => void;
  actionLabel?: string;
}

interface NotificationRule {
  id: string;
  name: string;
  type: 'price' | 'pnl' | 'position' | 'risk' | 'strategy';
  enabled: boolean;
  condition: string;
  value: number;
}

export const NotificationSystem: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | Notification['type']>('all');
  const [showRules, setShowRules] = useState(false);

  const { portfolio, positions, logs, addLog } = useTradingStore();

  // Default notification rules
  const [rules, setRules] = useState<NotificationRule[]>([
    {
      id: 'rule-1',
      name: 'Large P&L Change',
      type: 'pnl',
      enabled: true,
      condition: 'absolute_change',
      value: 10, // $10
    },
    {
      id: 'rule-2',
      name: 'High Risk Position',
      type: 'risk',
      enabled: true,
      condition: 'position_size',
      value: 20, // 20% of portfolio
    },
    {
      id: 'rule-3',
      name: 'Win Rate Drop',
      type: 'strategy',
      enabled: true,
      condition: 'win_rate_below',
      value: 50, // 50%
    },
    {
      id: 'rule-4',
      name: 'Position Filled',
      type: 'position',
      enabled: true,
      condition: 'fill',
      value: 0,
    },
  ]);

  // Generate notification
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev].slice(0, 50)); // Keep last 50

    // Show toast
    const icon = {
      info: <Info className="w-5 h-5" />,
      success: <CheckCircle className="w-5 h-5" />,
      warning: <AlertTriangle className="w-5 h-5" />,
      error: <AlertTriangle className="w-5 h-5" />,
    }[notification.severity];

    const toastFn = {
      info: toast,
      success: toast.success,
      warning: toast,
      error: toast.error,
    }[notification.severity];

    toastFn(notification.title, {
      icon,
      duration: 4000,
    });
  }, []);

  // Monitor portfolio changes
  useEffect(() => {
    const dailyPnL = portfolio.daily_pnl || 0;
    const pnlDollars = dailyPnL / 100;

    // Large P&L change rule
    const pnlRule = rules.find((r) => r.id === 'rule-1');
    if (pnlRule?.enabled && Math.abs(pnlDollars) >= pnlRule.value) {
      if (Math.random() > 0.98) { // Throttle notifications
        addNotification({
          type: 'performance',
          severity: pnlDollars > 0 ? 'success' : 'warning',
          title: pnlDollars > 0 ? 'Strong Performance' : 'P&L Alert',
          message: `Daily P&L: $${pnlDollars.toFixed(2)}`,
        });
      }
    }
  }, [portfolio.daily_pnl, rules, addNotification]);

  // Monitor win rate
  useEffect(() => {
    const winRate = (portfolio.win_rate || 0) * 100;
    const winRateRule = rules.find((r) => r.id === 'rule-3');

    if (winRateRule?.enabled && winRate < winRateRule.value && winRate > 0) {
      if (Math.random() > 0.95) { // Throttle
        addNotification({
          type: 'alert',
          severity: 'warning',
          title: 'Win Rate Alert',
          message: `Win rate dropped to ${winRate.toFixed(1)}%`,
          actionable: true,
          action: () => {
            console.log('Adjusting strategy parameters...');
            toast.success('Strategy parameters adjusted');
          },
          actionLabel: 'Adjust Strategy',
        });
      }
    }
  }, [portfolio.win_rate, rules, addNotification]);

  // Monitor logs for trade execution
  useEffect(() => {
    if (logs.length === 0) return;

    const latestLog = logs[logs.length - 1];
    if (latestLog.message?.includes('TRADE EXECUTED')) {
      addNotification({
        type: 'trade',
        severity: 'success',
        title: 'Trade Executed',
        message: latestLog.message.substring(0, 100),
      });
    } else if (latestLog.message?.includes('ERROR') || latestLog.level === 'ERROR') {
      addNotification({
        type: 'system',
        severity: 'error',
        title: 'System Error',
        message: latestLog.message?.substring(0, 100) || 'An error occurred',
      });
    }
  }, [logs.length, addNotification]); // Only trigger on new logs

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter(
    (n) => filter === 'all' || n.type === filter
  );

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'trade':
        return TrendingUp;
      case 'alert':
        return AlertTriangle;
      case 'system':
        return Info;
      case 'performance':
        return Zap;
      case 'risk':
        return AlertTriangle;
      default:
        return Bell;
    }
  };

  const getSeverityColor = (severity: Notification['severity']) => {
    switch (severity) {
      case 'success':
        return 'neon-green';
      case 'warning':
        return 'neon-amber';
      case 'error':
        return 'neon-red';
      default:
        return 'neon-cyan';
    }
  };

  return (
    <>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-lg hover:bg-white/10 transition-colors"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-400" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-neon-red rounded-full flex items-center justify-center"
          >
            <span className="text-[10px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>
          </motion.div>
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[80]"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed right-0 top-16 bottom-0 w-full sm:w-96 bg-black/95 backdrop-blur-xl border-l border-white/10 z-[90] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-neon-cyan" />
                  <h2 className="text-lg font-bold text-white">Notifications</h2>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-neon-red/20 text-neon-red rounded-full text-xs font-bold">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Filter Bar */}
              <div className="flex items-center gap-2 p-3 border-b border-white/10 overflow-x-auto">
                {['all', 'trade', 'alert', 'system', 'performance', 'risk'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f as typeof filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                      filter === f
                        ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              {/* Actions */}
              {notifications.length > 0 && (
                <div className="flex items-center gap-2 p-3 border-b border-white/10">
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-neon-cyan hover:text-neon-cyan/80 transition-colors"
                  >
                    Mark all as read
                  </button>
                  <button
                    onClick={() => setShowRules(!showRules)}
                    className="ml-auto text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                  >
                    <Filter className="w-3 h-3" />
                    Rules
                  </button>
                </div>
              )}

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-12">
                    <Bell className="w-16 h-16 text-gray-600 mb-4" />
                    <p className="text-gray-500 text-sm">No notifications</p>
                    <p className="text-gray-600 text-xs mt-1">You're all caught up!</p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => {
                    const Icon = getIcon(notification.type);
                    const color = getSeverityColor(notification.severity);

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className={`bg-white/5 rounded-lg p-3 border transition-all ${
                          notification.read ? 'border-white/5' : `border-${color}/30`
                        }`}
                        onClick={() => !notification.read && markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg bg-${color}/10 flex-shrink-0`}>
                            <Icon className={`w-4 h-4 text-${color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="text-sm font-medium text-white truncate">{notification.title}</h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="flex-shrink-0 text-gray-600 hover:text-white transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-xs text-gray-400 mb-2">{notification.message}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-gray-600">
                                {format(notification.timestamp, 'MMM dd, HH:mm')}
                              </span>
                              {notification.actionable && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    notification.action?.();
                                  }}
                                  className="text-xs text-neon-cyan hover:text-neon-cyan/80 transition-colors font-medium"
                                >
                                  {notification.actionLabel || 'Action'}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {/* Rules Panel */}
              {showRules && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="border-t border-white/10 overflow-hidden"
                >
                  <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
                    <h3 className="text-sm font-bold text-white mb-3">Notification Rules</h3>
                    {rules.map((rule) => (
                      <div key={rule.id} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                        <div>
                          <p className="text-sm text-white">{rule.name}</p>
                          <p className="text-xs text-gray-500">
                            {rule.type} • {rule.condition}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setRules((prev) =>
                              prev.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r))
                            );
                            toast.success(rule.enabled ? 'Rule disabled' : 'Rule enabled');
                          }}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            rule.enabled
                              ? 'bg-neon-green/20 text-neon-green'
                              : 'bg-white/10 text-gray-400'
                          }`}
                        >
                          {rule.enabled ? 'On' : 'Off'}
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
