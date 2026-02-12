import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Command,
  Brain,
  LayoutDashboard,
  AlertTriangle,
  ScrollText,
  Settings,
  Play,
  Pause,
  Square,
  Download,
  TrendingUp,
  ChevronRight,
  Star,
  Clock,
  Zap,
  Columns,
} from 'lucide-react';
import { useTradingStore } from '../context/TradingContext';

interface CommandItem {
  id: string;
  label: string;
  category: 'navigation' | 'action' | 'bot' | 'layout' | 'recent';
  icon: React.ElementType;
  action: () => void;
  keywords: string[];
  shortcut?: string;
  badge?: string;
}

interface CommandPaletteProps {
  onNavigate?: (viewId: string) => void;
  onCommand?: (cmd: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ onNavigate, onCommand }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const {
    setCurrentView,
    setBotState,
    setCurrentLayout,
    favoriteViews,
    recentViews,
  } = useTradingStore();

  // Define all commands
  const commands: CommandItem[] = useMemo(
    () => [
      // Navigation
      {
        id: 'nav-ai-brain',
        label: 'Neural Core',
        category: 'navigation',
        icon: Brain,
        action: () => {
          setCurrentView('ai-brain');
          if (onNavigate) onNavigate('ai-brain');
        },
        keywords: ['ai', 'brain', 'neural', 'core', 'intelligence', 'thinking'],
        shortcut: 'Cmd+1',
      },
      {
        id: 'nav-portfolio',
        label: 'Portfolio View',
        category: 'navigation',
        icon: LayoutDashboard,
        action: () => {
          setCurrentView('paper-trading');
          if (onNavigate) onNavigate('paper-trading');
        },
        keywords: ['portfolio', 'dashboard', 'positions', 'holdings'],
        shortcut: 'Cmd+2',
      },
      {
        id: 'nav-risk',
        label: 'Risk Protection',
        category: 'navigation',
        icon: AlertTriangle,
        action: () => {
          setCurrentView('risk');
          if (onNavigate) onNavigate('risk');
        },
        keywords: ['risk', 'protection', 'safety', 'limits', 'exposure'],
        shortcut: 'Cmd+3',
      },
      {
        id: 'nav-logs',
        label: 'System Logs',
        category: 'navigation',
        icon: ScrollText,
        action: () => {
          setCurrentView('logs');
          if (onNavigate) onNavigate('logs');
        },
        keywords: ['logs', 'history', 'events', 'system', 'console'],
        shortcut: 'Cmd+4',
      },
      {
        id: 'nav-settings',
        label: 'Settings',
        category: 'navigation',
        icon: Settings,
        action: () => {
          setCurrentView('settings');
          if (onNavigate) onNavigate('settings');
        },
        keywords: ['settings', 'config', 'configuration', 'preferences'],
        shortcut: 'Cmd+,',
      },

      // Bot Control Actions
      {
        id: 'bot-play',
        label: 'Start Bot',
        category: 'bot',
        icon: Play,
        action: () => {
          setBotState('RUNNING');
          if (onCommand) onCommand('PLAY');
        },
        keywords: ['start', 'play', 'run', 'bot', 'activate'],
        shortcut: 'Cmd+P',
      },
      {
        id: 'bot-pause',
        label: 'Pause Bot',
        category: 'bot',
        icon: Pause,
        action: () => {
          setBotState('PAUSED');
          if (onCommand) onCommand('PAUSE');
        },
        keywords: ['pause', 'hold', 'bot', 'wait'],
        shortcut: 'Cmd+Shift+P',
      },
      {
        id: 'bot-stop',
        label: 'Stop Bot',
        category: 'bot',
        icon: Square,
        action: () => {
          setBotState('STOPPED');
          if (onCommand) onCommand('STOP');
        },
        keywords: ['stop', 'halt', 'bot', 'end'],
        shortcut: 'Cmd+S',
      },

      // Quick Actions
      {
        id: 'action-export-logs',
        label: 'Export Logs',
        category: 'action',
        icon: Download,
        action: () => {
          // Trigger log export
          console.log('Exporting logs...');
        },
        keywords: ['export', 'download', 'logs', 'save', 'backup'],
        shortcut: 'Cmd+D',
      },
      {
        id: 'action-new-position',
        label: 'New Position',
        category: 'action',
        icon: TrendingUp,
        action: () => {
          console.log('Opening new position dialog...');
        },
        keywords: ['new', 'position', 'trade', 'buy', 'open'],
        shortcut: 'Cmd+N',
      },

      // Layout Presets
      {
        id: 'layout-default',
        label: 'Default Layout',
        category: 'layout',
        icon: LayoutDashboard,
        action: () => setCurrentLayout('default'),
        keywords: ['layout', 'default', 'standard', 'dashboard'],
        shortcut: 'Cmd+L D',
      },
      {
        id: 'layout-focus',
        label: 'Focus Layout',
        category: 'layout',
        icon: Zap,
        action: () => setCurrentLayout('focus'),
        keywords: ['layout', 'focus', 'concentrated', 'single'],
        shortcut: 'Cmd+L F',
      },
      {
        id: 'layout-split',
        label: 'Split Layout',
        category: 'layout',
        icon: Columns,
        action: () => setCurrentLayout('split'),
        keywords: ['layout', 'split', 'dual', 'side by side'],
        shortcut: 'Cmd+L S',
      },
    ],
    [setCurrentView, setBotState, setCurrentLayout, onNavigate, onCommand]
  );

  // Fuzzy search filter
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;

    const searchStr = query.toLowerCase().trim();
    return commands.filter((cmd) => {
      return (
        cmd.label.toLowerCase().includes(searchStr) ||
        cmd.category.toLowerCase().includes(searchStr) ||
        cmd.keywords.some((kw) => kw.toLowerCase().includes(searchStr))
      );
    });
  }, [query, commands]);

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    filteredCommands.forEach((cmd) => {
      if (!groups[cmd.category]) {
        groups[cmd.category] = [];
      }
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  const categoryLabels: Record<string, { label: string; icon: React.ElementType }> = {
    navigation: { label: 'Navigation', icon: ChevronRight },
    bot: { label: 'Bot Controls', icon: Play },
    action: { label: 'Quick Actions', icon: Zap },
    layout: { label: 'Layouts', icon: LayoutDashboard },
    recent: { label: 'Recent', icon: Clock },
  };

  // Keyboard navigation
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          const selectedCommand = filteredCommands[selectedIndex];
          if (selectedCommand) {
            selectedCommand.action();
            setIsOpen(false);
            setQuery('');
          }
        }
      };

      globalThis.addEventListener('keydown', handleKeyDown);
      return () => globalThis.removeEventListener('keydown', handleKeyDown);
    }
    return undefined;
  }, [isOpen, selectedIndex, filteredCommands]);

  // Global toggle (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setQuery('');
        setSelectedIndex(0);
      }
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
        setQuery('');
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="z-[100] fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setIsOpen(false);
              setQuery('');
            }}
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="top-[15%] left-1/2 z-[101] fixed px-4 w-full max-w-2xl -translate-x-1/2"
          >
            <div className="bg-black/95 shadow-2xl backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-white/10 border-b">
                <Search className="w-5 h-5 text-neon-cyan" />
                <input
                  type="text"
                  placeholder="Search commands, views, actions..."
                  className="flex-1 bg-transparent outline-none text-white placeholder:text-gray-500 text-lg"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <kbd className="bg-white/5 px-2 py-1 border border-white/10 rounded font-mono text-gray-400 text-xs">
                    ↑↓
                  </kbd>
                  <kbd className="bg-white/5 px-2 py-1 border border-white/10 rounded font-mono text-gray-400 text-xs">
                    Esc
                  </kbd>
                </div>
              </div>

              {/* Results */}
              <div className="p-2 max-h-[60vh] overflow-y-auto">
                {filteredCommands.length === 0 ? (
                  <div className="py-12 text-gray-500 text-center">
                    <Search className="opacity-20 mx-auto mb-3 w-12 h-12" />
                    <p className="text-sm">No commands found</p>
                    <p className="mt-1 text-xs">Try a different search term</p>
                  </div>
                ) : (
                  Object.entries(groupedCommands).map(([category, items]) => (
                    <div key={category} className="mb-4 last:mb-0">
                      {/* Category Header */}
                      <div className="flex items-center gap-2 px-3 py-2 font-bold text-gray-500 text-xs uppercase tracking-wider">
                        {React.createElement(categoryLabels[category]?.icon || ChevronRight, {
                          className: 'w-3 h-3',
                        })}
                        {categoryLabels[category]?.label || category}
                      </div>

                      {/* Command Items */}
                      <div className="space-y-1">
                        {items.map((cmd) => {
                          const globalIndex = filteredCommands.findIndex((c) => c.id === cmd.id);
                          const isSelected = globalIndex === selectedIndex;
                          const Icon = cmd.icon;

                          return (
                            <motion.button
                              key={cmd.id}
                              className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all ${
                                isSelected
                                  ? 'bg-neon-cyan/10 border border-neon-cyan/30 shadow-lg shadow-neon-cyan/5'
                                  : 'hover:bg-white/5'
                              }`}
                              onClick={() => {
                                cmd.action();
                                setIsOpen(false);
                                setQuery('');
                              }}
                              onMouseEnter={() => setSelectedIndex(globalIndex)}
                              whileHover={{ x: 2 }}
                            >
                              <div className="flex items-center gap-3">
                                <Icon
                                  className={`w-5 h-5 ${isSelected ? 'text-neon-cyan' : 'text-gray-400'}`}
                                />
                                <div className="text-left">
                                  <span className={`${isSelected ? 'text-neon-cyan' : 'text-white'} font-medium`}>
                                    {cmd.label}
                                  </span>
                                  {cmd.badge && (
                                    <span className="bg-neon-green/20 ml-2 px-2 py-0.5 rounded-full text-[10px] text-neon-green">
                                      {cmd.badge}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {cmd.shortcut && (
                                <kbd className="bg-white/5 px-2 py-1 border border-white/10 rounded font-mono text-gray-400 text-xs whitespace-nowrap">
                                  {cmd.shortcut}
                                </kbd>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer Hint */}
              <div className="flex justify-between items-center bg-white/5 px-5 py-3 border-white/10 border-t">
                <div className="flex items-center gap-4 text-gray-500 text-xs">
                  <div className="flex items-center gap-1">
                    <kbd className="bg-white/5 px-1.5 py-0.5 border border-white/10 rounded font-mono">↑↓</kbd>
                    <span>Navigate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="bg-white/5 px-1.5 py-0.5 border border-white/10 rounded font-mono">
                      ↵
                    </kbd>
                    <span>Select</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="bg-white/5 px-1.5 py-0.5 border border-white/10 rounded font-mono">
                      Esc
                    </kbd>
                    <span>Close</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-gray-600 text-xs">
                  <Command className="w-3 h-3" />
                  <span>Command Palette</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
