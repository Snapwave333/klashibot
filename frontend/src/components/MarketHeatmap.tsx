import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Maximize2,
  Minimize2,
  RefreshCw,
  Filter,
  Grid as GridIcon,
  List,
} from 'lucide-react';
import { useTradingStore } from '../context/TradingContext';

interface MarketCell {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  category: string;
  correlation?: number;
}

interface MarketHeatmapProps {
  className?: string;
}

export const MarketHeatmap: React.FC<MarketHeatmapProps> = ({ className }) => {
  const { positions } = useTradingStore();
  const [viewMode, setViewMode] = useState<'heatmap' | 'correlation'>('heatmap');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cellSize, setCellSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [sortBy, setSortBy] = useState<'change' | 'volume' | 'ticker'>('change');

  // Generate market cells from positions and ticker data
  const marketCells = useMemo<MarketCell[]>(() => {
    const cells: MarketCell[] = [];

    // Add positions as market cells
    positions.forEach((position) => {
      const ticker = position.ticker || 'UNKNOWN';
        const price = (position.current_price || 0) / 100;
        const avgPrice = (position.entry_price || 0) / 100;
      const change = price - avgPrice;
      const changePercent = avgPrice > 0 ? (change / avgPrice) * 100 : 0;

      cells.push({
        ticker,
        price,
        change,
        changePercent,
        volume: Math.abs(position.quantity || 0),
        category: position.ticker?.includes('PRES') ? 'politics' : 'market',
        correlation: Math.random() * 2 - 1, // Mock correlation
      });
    });

    // Add mock market data for demonstration
    const mockTickers = [
      'SPY-UP', 'SPY-DOWN', 'BTC-YES', 'ETH-NO', 'NASDAQ-UP',
      'GOLD-UP', 'OIL-DOWN', 'BONDS-YES', 'VIX-HIGH', 'DXY-UP'
    ];

    mockTickers.forEach((ticker, idx) => {
      const change = (Math.random() - 0.5) * 10;
      const price = 50 + change;
      cells.push({
        ticker,
        price,
        change,
        changePercent: (change / 50) * 100,
        volume: Math.floor(Math.random() * 1000),
        category: ticker.includes('PRES') ? 'politics' : 'market',
        correlation: Math.random() * 2 - 1,
      });
    });

    return cells;
  }, [positions]);

  // Filter and sort
  const filteredCells = useMemo(() => {
    let filtered = marketCells;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((c) => c.category === selectedCategory);
    }

    filtered.sort((a, b) => {
      if (sortBy === 'change') return Math.abs(b.changePercent) - Math.abs(a.changePercent);
      if (sortBy === 'volume') return b.volume - a.volume;
      return a.ticker.localeCompare(b.ticker);
    });

    return filtered;
  }, [marketCells, selectedCategory, sortBy]);

  // Calculate correlation matrix
  const correlationMatrix = useMemo(() => {
    const tickers = filteredCells.map((c) => c.ticker);
    const matrix: { x: string; y: string; value: number }[] = [];

    tickers.forEach((tickerX, i) => {
      tickers.forEach((tickerY, j) => {
        if (i <= j) {
          const correlation =
            i === j ? 1 : (Math.random() * 2 - 1) * 0.8; // Mock correlation
          matrix.push({ x: tickerX, y: tickerY, value: correlation });
        }
      });
    });

    return matrix;
  }, [filteredCells]);

  const getColorFromChange = (changePercent: number): string => {
    if (changePercent > 5) return 'bg-neon-green/80';
    if (changePercent > 2) return 'bg-neon-green/60';
    if (changePercent > 0) return 'bg-neon-green/40';
    if (changePercent > -2) return 'bg-neon-red/40';
    if (changePercent > -5) return 'bg-neon-red/60';
    return 'bg-neon-red/80';
  };

  const getColorFromCorrelation = (correlation: number): string => {
    const abs = Math.abs(correlation);
    if (abs > 0.8) return correlation > 0 ? 'bg-neon-green/80' : 'bg-neon-red/80';
    if (abs > 0.5) return correlation > 0 ? 'bg-neon-green/60' : 'bg-neon-red/60';
    if (abs > 0.3) return correlation > 0 ? 'bg-neon-green/40' : 'bg-neon-red/40';
    return 'bg-gray-500/20';
  };

  const getCellDimensions = () => {
    if (cellSize === 'small') return { width: 80, height: 80, text: 'text-xs' };
    if (cellSize === 'medium') return { width: 120, height: 100, text: 'text-sm' };
    return { width: 160, height: 120, text: 'text-base' };
  };

  const dimensions = getCellDimensions();

  return (
    <div className={`flex flex-col h-full bg-black/20 ${className}`}>
      {/* Header */}
      <div className="flex sm:flex-row flex-col justify-between sm:items-center gap-4 p-6 border-white/10 border-b">
        <div>
          <h2 className="flex items-center gap-2 font-bold text-white text-2xl">
            <GridIcon className="w-6 h-6 text-neon-cyan" />
            Market Heatmap
          </h2>
          <p className="mt-1 text-gray-400 text-sm">
            {filteredCells.length} markets • {viewMode === 'heatmap' ? 'Price Changes' : 'Correlation Matrix'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-white/5 p-1 border border-white/10 rounded-lg">
            <button
              onClick={() => setViewMode('heatmap')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                viewMode === 'heatmap'
                  ? 'bg-neon-cyan/20 text-neon-cyan'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <GridIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('correlation')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                viewMode === 'correlation'
                  ? 'bg-neon-cyan/20 text-neon-cyan'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Cell Size */}
          <select
            value={cellSize}
            onChange={(e) => setCellSize(e.target.value as any)}
            className="bg-white/5 px-3 py-2 border border-white/10 focus:border-neon-cyan/50 rounded-lg focus:outline-none text-white text-sm"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>

          {/* Refresh */}
          <button
            onClick={() => console.log('Refreshing market data...')}
            className="hover:bg-white/10 p-2 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-5 h-5 text-gray-400 hover:text-neon-cyan" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 bg-white/5 p-4 border-white/10 border-b">
        <Filter className="w-4 h-4 text-gray-500" />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-white/5 px-3 py-1.5 border border-white/10 focus:border-neon-cyan/50 rounded-lg focus:outline-none text-white text-sm"
        >
          <option value="all">All Categories</option>
          <option value="politics">Politics</option>
          <option value="market">Markets</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="bg-white/5 px-3 py-1.5 border border-white/10 focus:border-neon-cyan/50 rounded-lg focus:outline-none text-white text-sm"
        >
          <option value="change">Sort by Change</option>
          <option value="volume">Sort by Volume</option>
          <option value="ticker">Sort by Ticker</option>
        </select>
      </div>

      {/* Legend */}
      <div className="flex justify-center items-center gap-6 bg-black/40 p-3 border-white/10 border-b text-xs">
        {viewMode === 'heatmap' ? (
          <>
            <div className="flex items-center gap-2">
              <div className="bg-neon-green/80 rounded w-4 h-4" />
              <span className="text-gray-400">Strong Gain (&gt;5%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-neon-green/40 rounded w-4 h-4" />
              <span className="text-gray-400">Gain (0-5%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-neon-red/40 rounded w-4 h-4" />
              <span className="text-gray-400">Loss (0-5%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-neon-red/80 rounded w-4 h-4" />
              <span className="text-gray-400">Strong Loss (&lt;-5%)</span>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="bg-neon-green/80 rounded w-4 h-4" />
              <span className="text-gray-400">Strong Positive</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-gray-500/20 rounded w-4 h-4" />
              <span className="text-gray-400">No Correlation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-neon-red/80 rounded w-4 h-4" />
              <span className="text-gray-400">Strong Negative</span>
            </div>
          </>
        )}
      </div>

      {/* Heatmap Grid */}
      {viewMode === 'heatmap' ? (
        <div className="flex-1 p-6 overflow-auto">
          <div className="gap-3 grid" style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${dimensions.width}px, 1fr))` }}>
            {filteredCells.map((cell, idx) => (
              <motion.div
                key={cell.ticker}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.02 }}
                className={`relative rounded-lg border border-white/10 p-3 cursor-pointer transition-all hover:scale-105 hover:z-10 hover:shadow-2xl ${getColorFromChange(
                  cell.changePercent
                )}`}
                style={{ minHeight: dimensions.height }}
                title={`${cell.ticker}: ${cell.changePercent.toFixed(2)}%`}
              >
                {/* Ticker */}
                <div className={`font-mono font-bold text-white mb-1 truncate ${dimensions.text}`}>
                  {cell.ticker}
                </div>

                {/* Price */}
                <div className={`text-white/80 font-medium mb-2 ${dimensions.text}`}>
                  ${cell.price.toFixed(2)}
                </div>

                {/* Change */}
                <div className="flex items-center gap-1">
                  {cell.changePercent >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-white" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-white" />
                  )}
                  <span className="font-bold text-white text-sm">
                    {cell.changePercent >= 0 ? '+' : ''}
                    {cell.changePercent.toFixed(2)}%
                  </span>
                </div>

                {/* Volume */}
                <div className="mt-1 text-white/60 text-xs">Vol: {cell.volume}</div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        // Correlation Matrix
        <div className="flex-1 p-6 overflow-auto">
          <div className="inline-block min-w-full">
            <table className="border-collapse">
              <thead>
                <tr>
                  <th className="top-0 left-0 z-20 sticky bg-black/90 p-2 border border-white/10 font-medium text-gray-400 text-xs">
                    Ticker
                  </th>
                  {filteredCells.map((cell) => (
                    <th
                      key={cell.ticker}
                      className="top-0 z-10 sticky bg-black/90 p-2 border border-white/10 min-w-[60px] font-medium text-gray-400 text-xs"
                    >
                      <div className="whitespace-nowrap -rotate-45 origin-left transform">
                        {cell.ticker}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCells.map((rowCell, rowIdx) => (
                  <tr key={rowCell.ticker}>
                    <td className="left-0 z-10 sticky bg-black/90 p-2 border border-white/10 font-medium text-white text-xs">
                      {rowCell.ticker}
                    </td>
                    {filteredCells.map((colCell, colIdx) => {
                      const correlationData = correlationMatrix.find(
                        (c) =>
                          (c.x === rowCell.ticker && c.y === colCell.ticker) ||
                          (c.x === colCell.ticker && c.y === rowCell.ticker)
                      );
                      const correlation = correlationData?.value ?? 0;

                      return (
                        <td
                          key={`${rowCell.ticker}-${colCell.ticker}`}
                          className={`border border-white/10 p-2 text-center transition-all hover:scale-110 hover:z-10 cursor-pointer ${getColorFromCorrelation(
                            correlation
                          )}`}
                          title={`${rowCell.ticker} vs ${colCell.ticker}: ${correlation.toFixed(3)}`}
                        >
                          <span className="font-medium text-white text-xs">
                            {correlation.toFixed(2)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
