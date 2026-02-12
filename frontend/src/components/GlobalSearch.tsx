import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Calendar,
  Hash,
  FileText,
  X,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTradingStore } from '../context/TradingContext';
import { format } from 'date-fns';

interface SearchResult {
  id: string;
  type: 'position' | 'log' | 'market' | 'action' | 'view';
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  action: () => void;
  metadata?: string;
  category: string;
}

interface GlobalSearchProps {
  onNavigate?: (path: string) => void;
}

export const GlobalSearch: React.FC<GlobalSearchProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const { positions, logs, portfolio } = useTradingStore();

  // Build searchable index
  const searchIndex = useMemo(() => {
    const results: SearchResult[] = [];

    // Add positions
    positions.forEach((position) => {
      results.push({
        id: `position-${position.ticker}`,
        type: 'position',
        title: position.ticker || 'Unknown Position',
        subtitle: `${position.quantity} contracts`,
        icon: TrendingUp,
        category: 'Positions',
        metadata: `$${((position.quantity * position.current_price) / 100).toFixed(2)}`,
        action: () => {
          navigate('/portfolio');
          setIsOpen(false);
        },
      });
    });

    // Add recent logs
    logs.slice(0, 20).forEach((log) => {
      results.push({
        id: `log-${log.id}`,
        type: 'log',
        title: log.message || 'Log entry',
        subtitle: format(new Date(log.timestamp), 'MMM dd, HH:mm:ss'),
        icon: FileText,
        category: 'Logs',
        metadata: log.level,
        action: () => {
          navigate('/logs');
          setIsOpen(false);
        },
      });
    });

    // Add quick actions
    const quickActions: SearchResult[] = [
      {
        id: 'action-new-position',
        type: 'action',
        title: 'New Position',
        subtitle: 'Open a new trading position',
        icon: TrendingUp,
        category: 'Actions',
        action: () => {
          console.log('Opening new position dialog...');
          setIsOpen(false);
        },
      },
      {
        id: 'action-export-logs',
        type: 'action',
        title: 'Export Logs',
        subtitle: 'Download system logs',
        icon: FileText,
        category: 'Actions',
        action: () => {
          console.log('Exporting logs...');
          setIsOpen(false);
        },
      },
      {
        id: 'action-risk-analysis',
        type: 'action',
        title: 'Risk Analysis',
        subtitle: 'View risk metrics',
        icon: AlertTriangle,
        category: 'Actions',
        action: () => {
          navigate('/risk');
          setIsOpen(false);
        },
      },
    ];

    results.push(...quickActions);

    // Add views
    const views: SearchResult[] = [
      {
        id: 'view-dashboard',
        type: 'view',
        title: 'Dashboard',
        subtitle: 'Main overview',
        icon: DollarSign,
        category: 'Views',
        action: () => {
          navigate('/');
          setIsOpen(false);
        },
      },
      {
        id: 'view-ai-brain',
        type: 'view',
        title: 'Neural Core',
        subtitle: 'AI decision engine',
        icon: DollarSign,
        category: 'Views',
        action: () => {
          navigate('/ai-brain');
          setIsOpen(false);
        },
      },
      {
        id: 'view-portfolio',
        type: 'view',
        title: 'Portfolio',
        subtitle: 'View positions',
        icon: TrendingUp,
        category: 'Views',
        action: () => {
          navigate('/portfolio');
          setIsOpen(false);
        },
      },
      {
        id: 'view-risk',
        type: 'view',
        title: 'Risk Protection',
        subtitle: 'Risk analysis',
        icon: AlertTriangle,
        category: 'Views',
        action: () => {
          navigate('/risk');
          setIsOpen(false);
        },
      },
      {
        id: 'view-logs',
        type: 'view',
        title: 'System Logs',
        subtitle: 'Event history',
        icon: FileText,
        category: 'Views',
        action: () => {
          navigate('/logs');
          setIsOpen(false);
        },
      },
    ];

    results.push(...views);

    return results;
  }, [positions, logs, navigate]);

  // Fuzzy search
  const filteredResults = useMemo(() => {
    if (!query.trim()) {
      // Show recent/popular items when no query
      return searchIndex.slice(0, 8);
    }

    const searchStr = query.toLowerCase().trim();
    return searchIndex.filter((result) => {
      return (
        result.title.toLowerCase().includes(searchStr) ||
        result.subtitle?.toLowerCase().includes(searchStr) ||
        result.category.toLowerCase().includes(searchStr) ||
        result.metadata?.toLowerCase().includes(searchStr)
      );
    });
  }, [query, searchIndex]);

  // Group results by category
  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {};
    filteredResults.forEach((result) => {
      if (!groups[result.category]) {
        groups[result.category] = [];
      }
      groups[result.category].push(result);
    });
    return groups;
  }, [filteredResults]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selectedResult = filteredResults[selectedIndex];
        if (selectedResult) {
          selectedResult.action();
        }
      }
    };

    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredResults]);

  // Global toggle (Cmd+Shift+F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'f') {
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

  const getIconColor = (type: string) => {
    switch (type) {
      case 'position':
        return 'text-neon-green';
      case 'log':
        return 'text-gray-400';
      case 'action':
        return 'text-neon-cyan';
      case 'view':
        return 'text-neon-amber';
      default:
        return 'text-gray-400';
    }
  };

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            onClick={() => {
              setIsOpen(false);
              setQuery('');
            }}
          />

          {/* Search Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-3xl z-[101] px-4"
          >
            <div className="bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
              {/* Search Input */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
                <Search className="w-5 h-5 text-neon-cyan" />
                <input
                  type="text"
                  placeholder="Search positions, logs, views, actions..."
                  className="flex-1 bg-transparent outline-none text-white placeholder:text-gray-500 text-lg"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                />
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {filteredResults.length === 0 ? (
                  <div className="py-12 text-center text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p className="text-sm">No results found</p>
                    <p className="text-xs mt-1">Try a different search term</p>
                  </div>
                ) : (
                  Object.entries(groupedResults).map(([category, items]) => (
                    <div key={category} className="mb-4 last:mb-0">
                      {/* Category Header */}
                      <div className="px-3 py-2 text-xs text-gray-500 uppercase font-bold tracking-wider">
                        {category}
                      </div>

                      {/* Result Items */}
                      <div className="space-y-1">
                        {items.map((result) => {
                          const globalIndex = filteredResults.findIndex((r) => r.id === result.id);
                          const isSelected = globalIndex === selectedIndex;
                          const Icon = result.icon;

                          return (
                            <motion.button
                              key={result.id}
                              className={`flex items-center justify-between w-full px-4 py-3 rounded-lg transition-all ${
                                isSelected
                                  ? 'bg-neon-cyan/10 border border-neon-cyan/30'
                                  : 'hover:bg-white/5'
                              }`}
                              onClick={result.action}
                              onMouseEnter={() => setSelectedIndex(globalIndex)}
                              whileHover={{ x: 2 }}
                            >
                              <div className="flex items-center gap-3 flex-1">
                                <div className={`p-2 rounded-lg bg-white/5 ${getIconColor(result.type)}`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="text-left flex-1">
                                  <div className={`font-medium ${isSelected ? 'text-neon-cyan' : 'text-white'}`}>
                                    {result.title}
                                  </div>
                                  {result.subtitle && (
                                    <div className="text-xs text-gray-500">{result.subtitle}</div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {result.metadata && (
                                  <span className="text-xs text-gray-500 font-mono">{result.metadata}</span>
                                )}
                                <ArrowRight className="w-4 h-4 text-gray-600" />
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-white/10 bg-white/5">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10 font-mono">↑↓</kbd>
                    <span>Navigate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10 font-mono">↵</kbd>
                    <span>Select</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10 font-mono">Esc</kbd>
                    <span>Close</span>
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10 font-mono">
                    Cmd+Shift+F
                  </kbd>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
