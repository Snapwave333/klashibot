import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Hash,
  FileText,
  Download,
  Filter,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
  Tag,
  Edit3,
  Save,
} from 'lucide-react';
import { useTradingStore } from '../context/TradingContext';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import toast from 'react-hot-toast';

interface Trade {
  id: string;
  ticker: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  entryPrice: number;
  exitPrice?: number;
  entryTime: Date;
  exitTime?: Date;
  pnl?: number;
  pnlPercent?: number;
  status: 'OPEN' | 'CLOSED';
  strategy?: string;
  notes?: string;
  tags?: string[];
}

interface TradeJournalProps {
  className?: string;
}

export const TradeJournal: React.FC<TradeJournalProps> = ({ className }) => {
  const { positions, logs, portfolio } = useTradingStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'OPEN' | 'CLOSED'>('all');
  const [filterSide, setFilterSide] = useState<'all' | 'BUY' | 'SELL'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'pnl' | 'ticker'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [dateRange, setDateRange] = useState<{ start?: Date; end?: Date }>({});

  // Generate trade history from positions and logs
  const trades = useMemo<Trade[]>(() => {
    const tradeList: Trade[] = [];

    // Convert current positions to trades
    positions.forEach((position) => {
      const entryLog = logs.find(
        (l) =>
          l.message?.includes(position.ticker || '') &&
          l.message?.includes('TRADE EXECUTED')
      );

      tradeList.push({
        id: `trade-${position.ticker}-${Date.now()}`,
        ticker: position.ticker || 'UNKNOWN',
        side: (position.quantity || 0) > 0 ? 'BUY' : 'SELL',
        quantity: Math.abs(position.quantity || 0),
        entryPrice: (position.entry_price || 0) / 100,
        entryTime: entryLog?.timestamp ? parseISO(entryLog.timestamp) : new Date(),
        pnl: (position.unrealized_pnl || 0) / 100,
        pnlPercent: ((position.unrealized_pnl || 0) / ((position.quantity * position.current_price) || 1)) * 100,
        status: 'OPEN',
        strategy: 'AI-Driven',
        notes: '',
        tags: ['active', position.ticker || ''],
      });
    });

    // Parse closed trades from logs
    logs
      .filter((l) => l.message?.includes('TRADE CLOSED') || l.message?.includes('Position closed'))
      .slice(0, 50) // Last 50 closed trades
      .forEach((log, idx) => {
        const match = log.message?.match(/(\w+).*?(\d+(?:\.\d+)?)/);
        const ticker = match?.[1] || `TRADE-${idx}`;
        const pnl = parseFloat(match?.[2] || '0');

        tradeList.push({
          id: `closed-trade-${idx}`,
          ticker,
          side: pnl > 0 ? 'BUY' : 'SELL',
          quantity: 1,
          entryPrice: 50,
          exitPrice: 50 + pnl,
          entryTime: new Date(Date.now() - idx * 3600000),
          exitTime: log.timestamp ? parseISO(log.timestamp) : new Date(),
          pnl,
          pnlPercent: (pnl / 50) * 100,
          status: 'CLOSED',
          strategy: 'AI-Driven',
          notes: '',
          tags: ['closed', ticker],
        });
      });

    return tradeList;
  }, [positions, logs]);

  // Filter and sort trades
  const filteredTrades = useMemo(() => {
    let filtered = trades;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.ticker.toLowerCase().includes(query) ||
          t.strategy?.toLowerCase().includes(query) ||
          t.notes?.toLowerCase().includes(query) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((t) => t.status === filterStatus);
    }

    // Side filter
    if (filterSide !== 'all') {
      filtered = filtered.filter((t) => t.side === filterSide);
    }

    // Date range filter
    if (dateRange.start) {
      filtered = filtered.filter((t) => isAfter(t.entryTime, dateRange.start!));
    }
    if (dateRange.end) {
      filtered = filtered.filter((t) => isBefore(t.entryTime, dateRange.end!));
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'date') {
        comparison = a.entryTime.getTime() - b.entryTime.getTime();
      } else if (sortBy === 'pnl') {
        comparison = (a.pnl || 0) - (b.pnl || 0);
      } else if (sortBy === 'ticker') {
        comparison = a.ticker.localeCompare(b.ticker);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [trades, searchQuery, filterStatus, filterSide, sortBy, sortOrder, dateRange]);

  // Summary statistics
  const stats = useMemo(() => {
    const closedTrades = filteredTrades.filter((t) => t.status === 'CLOSED');
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const winningTrades = closedTrades.filter((t) => (t.pnl || 0) > 0).length;
    const losingTrades = closedTrades.filter((t) => (t.pnl || 0) < 0).length;
    const winRate = closedTrades.length > 0 ? (winningTrades / closedTrades.length) * 100 : 0;
    const avgWin =
      winningTrades > 0
        ? closedTrades.filter((t) => (t.pnl || 0) > 0).reduce((sum, t) => sum + (t.pnl || 0), 0) /
          winningTrades
        : 0;
    const avgLoss =
      losingTrades > 0
        ? Math.abs(
            closedTrades
              .filter((t) => (t.pnl || 0) < 0)
              .reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades
          )
        : 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

    return {
      totalTrades: filteredTrades.length,
      openTrades: filteredTrades.filter((t) => t.status === 'OPEN').length,
      closedTrades: closedTrades.length,
      totalPnL,
      winRate,
      winningTrades,
      losingTrades,
      avgWin,
      avgLoss,
      profitFactor,
    };
  }, [filteredTrades]);

  const handleExport = () => {
    const csv = [
      ['Date', 'Ticker', 'Side', 'Quantity', 'Entry', 'Exit', 'P&L', 'Status', 'Strategy', 'Notes'],
      ...filteredTrades.map((t) => [
        format(t.entryTime, 'yyyy-MM-dd HH:mm'),
        t.ticker,
        t.side,
        t.quantity,
        t.entryPrice.toFixed(2),
        t.exitPrice?.toFixed(2) || '-',
        t.pnl?.toFixed(2) || '-',
        t.status,
        t.strategy || '',
        t.notes || '',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trade-journal-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Trade journal exported');
  };

  const handleSaveNotes = (tradeId: string) => {
    // In real implementation, save to backend
    console.log(`Saving notes for ${tradeId}:`, noteText);
    setEditingNotes(null);
    toast.success('Notes saved');
  };

  const toggleSort = (field: 'date' | 'pnl' | 'ticker') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b border-white/10">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-neon-cyan" />
            Trade Journal
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {stats.totalTrades} trades • {stats.openTrades} open • {stats.closedTrades} closed
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/30 rounded-lg text-neon-cyan transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Statistics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 p-4 bg-white/5 border-b border-white/10">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Total P&L</div>
          <div
            className={`text-lg font-bold ${
              stats.totalPnL >= 0 ? 'text-neon-green' : 'text-neon-red'
            }`}
          >
            ${stats.totalPnL.toFixed(2)}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Win Rate</div>
          <div className="text-lg font-bold text-neon-cyan">{stats.winRate.toFixed(1)}%</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Avg Win</div>
          <div className="text-lg font-bold text-neon-green">${stats.avgWin.toFixed(2)}</div>
        </div>
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Avg Loss</div>
          <div className="text-lg font-bold text-neon-red">${stats.avgLoss.toFixed(2)}</div>
        </div>
        <div className="text-center col-span-2 sm:col-span-4 lg:col-span-1">
          <div className="text-xs text-gray-500 mb-1">Profit Factor</div>
          <div className="text-lg font-bold text-neon-amber">{stats.profitFactor.toFixed(2)}</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 border-b border-white/10">
        {/* Search */}
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search trades..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-neon-cyan/50"
          />
        </div>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-cyan/50"
        >
          <option value="all">All Status</option>
          <option value="OPEN">Open</option>
          <option value="CLOSED">Closed</option>
        </select>

        {/* Side Filter */}
        <select
          value={filterSide}
          onChange={(e) => setFilterSide(e.target.value as any)}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-neon-cyan/50"
        >
          <option value="all">All Sides</option>
          <option value="BUY">Buy</option>
          <option value="SELL">Sell</option>
        </select>
      </div>

      {/* Trade List */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-black/90 backdrop-blur-xl z-10">
            <tr className="border-b border-white/10">
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-neon-cyan"
                onClick={() => toggleSort('date')}
              >
                <div className="flex items-center gap-1">
                  Date
                  {sortBy === 'date' &&
                    (sortOrder === 'asc' ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    ))}
                </div>
              </th>
              <th
                className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-neon-cyan"
                onClick={() => toggleSort('ticker')}
              >
                <div className="flex items-center gap-1">
                  Ticker
                  {sortBy === 'ticker' &&
                    (sortOrder === 'asc' ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    ))}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                Side
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Qty
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Entry
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                Exit
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:text-neon-cyan"
                onClick={() => toggleSort('pnl')}
              >
                <div className="flex items-center justify-end gap-1">
                  P&L
                  {sortBy === 'pnl' &&
                    (sortOrder === 'asc' ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    ))}
                </div>
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTrades.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No trades found</p>
                  <p className="text-xs mt-1">Try adjusting your filters</p>
                </td>
              </tr>
            ) : (
              filteredTrades.map((trade) => (
                <motion.tr
                  key={trade.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => setSelectedTrade(trade)}
                >
                  <td className="px-4 py-3 text-sm text-gray-300">
                    {format(trade.entryTime, 'MMM dd, HH:mm')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Hash className="w-3 h-3 text-gray-600" />
                      <span className="font-mono font-medium text-white">{trade.ticker}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        trade.side === 'BUY'
                          ? 'bg-neon-green/10 text-neon-green'
                          : 'bg-neon-red/10 text-neon-red'
                      }`}
                    >
                      {trade.side === 'BUY' ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {trade.side}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-300">{trade.quantity}</td>
                  <td className="px-4 py-3 text-right text-sm font-mono text-gray-300">
                    ${trade.entryPrice.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-mono text-gray-300">
                    {trade.exitPrice ? `$${trade.exitPrice.toFixed(2)}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {trade.pnl !== undefined && (
                      <div className="flex flex-col items-end">
                        <span
                          className={`text-sm font-bold ${
                            trade.pnl >= 0 ? 'text-neon-green' : 'text-neon-red'
                          }`}
                        >
                          ${trade.pnl.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {trade.pnlPercent?.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        trade.status === 'OPEN'
                          ? 'bg-neon-cyan/10 text-neon-cyan'
                          : 'bg-gray-500/10 text-gray-400'
                      }`}
                    >
                      {trade.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingNotes(trade.id);
                        setNoteText(trade.notes || '');
                      }}
                      className="p-1.5 hover:bg-white/10 rounded transition-colors"
                    >
                      <Edit3 className="w-4 h-4 text-gray-400 hover:text-neon-cyan" />
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Trade Detail Modal */}
      <AnimatePresence>
        {selectedTrade && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setSelectedTrade(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-black/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-51 p-6"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Hash className="w-5 h-5 text-neon-cyan" />
                    {selectedTrade.ticker}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {format(selectedTrade.entryTime, 'MMMM dd, yyyy • HH:mm:ss')}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTrade(null)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">Side</div>
                  <div
                    className={`text-lg font-bold ${
                      selectedTrade.side === 'BUY' ? 'text-neon-green' : 'text-neon-red'
                    }`}
                  >
                    {selectedTrade.side}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">Quantity</div>
                  <div className="text-lg font-bold text-white">{selectedTrade.quantity}</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">Entry Price</div>
                  <div className="text-lg font-bold text-white font-mono">
                    ${selectedTrade.entryPrice.toFixed(2)}
                  </div>
                </div>
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-xs text-gray-500 mb-1">Exit Price</div>
                  <div className="text-lg font-bold text-white font-mono">
                    {selectedTrade.exitPrice
                      ? `$${selectedTrade.exitPrice.toFixed(2)}`
                      : 'Still Open'}
                  </div>
                </div>
                {selectedTrade.pnl !== undefined && (
                  <div className="bg-white/5 rounded-lg p-4 col-span-2">
                    <div className="text-xs text-gray-500 mb-1">Profit & Loss</div>
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-2xl font-bold ${
                          selectedTrade.pnl >= 0 ? 'text-neon-green' : 'text-neon-red'
                        }`}
                      >
                        ${selectedTrade.pnl.toFixed(2)}
                      </span>
                      <span
                        className={`text-lg ${
                          (selectedTrade.pnlPercent || 0) >= 0 ? 'text-neon-green' : 'text-neon-red'
                        }`}
                      >
                        {selectedTrade.pnlPercent?.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-white/5 rounded-lg p-4 mb-4">
                <div className="text-xs text-gray-500 mb-2">Strategy</div>
                <div className="text-sm text-white">{selectedTrade.strategy || 'N/A'}</div>
              </div>

              {selectedTrade.tags && selectedTrade.tags.length > 0 && (
                <div className="bg-white/5 rounded-lg p-4 mb-4">
                  <div className="text-xs text-gray-500 mb-2">Tags</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedTrade.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-neon-cyan/10 text-neon-cyan rounded text-xs font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-xs text-gray-500 mb-2">Notes</div>
                {editingNotes === selectedTrade.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-neon-cyan/50 resize-none"
                      rows={3}
                      placeholder="Add trade notes..."
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveNotes(selectedTrade.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/30 rounded text-neon-cyan text-xs font-medium transition-colors"
                      >
                        <Save className="w-3 h-3" />
                        Save
                      </button>
                      <button
                        onClick={() => setEditingNotes(null)}
                        className="px-3 py-1.5 hover:bg-white/10 rounded text-gray-400 text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-300 flex-1">
                      {selectedTrade.notes || 'No notes added'}
                    </p>
                    <button
                      onClick={() => {
                        setEditingNotes(selectedTrade.id);
                        setNoteText(selectedTrade.notes || '');
                      }}
                      className="flex-shrink-0 p-1.5 hover:bg-white/10 rounded transition-colors"
                    >
                      <Edit3 className="w-4 h-4 text-gray-400 hover:text-neon-cyan" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
