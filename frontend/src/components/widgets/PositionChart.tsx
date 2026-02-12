import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';
import { useTradingStore } from '../../context/TradingContext';

interface PositionData {
  ticker: string;
  side: 'YES' | 'NO';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  priceHistory: { time: string; price: number }[];
}

/**
 * Position Chart Widget - Real-time yes/no position visualization.
 *
 * Features:
 * - Live price tracking with area chart
 * - Color-coded P&L indicators
 * - Entry price reference line
 * - Compact card layout
 */
export const PositionChart: React.FC<{ position: PositionData }> = React.memo(({ position }) => {
  // Memoize calculated values to avoid recalculation on every render
  const isProfitable = useMemo(() => position.unrealizedPnL >= 0, [position.unrealizedPnL]);
  const pnlPct = useMemo(
    () => ((position.currentPrice - position.entryPrice) / position.entryPrice) * 100,
    [position.currentPrice, position.entryPrice]
  );

  // Memoize gradient ID to avoid unnecessary recalculations
  const gradientId = useMemo(() => `gradient-${position.ticker}`, [position.ticker]);

  // Decimated price history for better performance (limit to 50 points max)
  const optimizedHistory = useMemo(() => {
    if (position.priceHistory.length <= 50) return position.priceHistory;
    const step = Math.ceil(position.priceHistory.length / 50);
    return position.priceHistory.filter((_, i) => i % step === 0);
  }, [position.priceHistory]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        glass-card rounded-xl p-4 border-l-4
        ${isProfitable ? 'border-l-neon-green' : 'border-l-neon-red'}
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`
            px-2 py-0.5 text-xs font-bold rounded
            ${position.side === 'YES' ? 'bg-neon-green/20 text-neon-green' : 'bg-neon-red/20 text-neon-red'}
          `}
          >
            {position.side}
          </span>
          <span className="max-w-[150px] font-medium text-white truncate">{position.ticker}</span>
        </div>
        <span className="text-gray-400 text-xs">{position.quantity} contracts</span>
      </div>

      {/* Price Chart */}
      <div className="mb-3 h-20">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={optimizedHistory}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor={isProfitable ? '#00ff88' : '#ff3366'}
                  stopOpacity={0.3}
                />
                <stop
                  offset="100%"
                  stopColor={isProfitable ? '#00ff88' : '#ff3366'}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="price"
              stroke={isProfitable ? '#00ff88' : '#ff3366'}
              strokeWidth={2}
              fill={`url(#${gradientId})`}
              isAnimationActive={false} // Disable animation for better performance
            />
            <ReferenceLine y={position.entryPrice} stroke="#6b7280" strokeDasharray="3 3" />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0a0a0f',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#9ca3af' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Row */}
      <div className="flex justify-between text-sm">
        <div className="flex items-center gap-1">
          <DollarSign className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400">Entry:</span>
          <span className="font-mono text-white">{(position.entryPrice * 100).toFixed(0)}¢</span>
        </div>
        <div className="flex items-center gap-1">
          <Activity className="w-4 h-4 text-gray-400" />
          <span className="text-gray-400">Current:</span>
          <span className="font-mono text-white">{(position.currentPrice * 100).toFixed(0)}¢</span>
        </div>
        <div
          className={`flex items-center gap-1 ${isProfitable ? 'text-neon-green' : 'text-neon-red'}`}
        >
          {isProfitable ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          <span className="font-mono font-bold">
            {isProfitable ? '+' : ''}
            {pnlPct.toFixed(1)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
});

/**
 * Positions Grid - Display all active positions with real-time charts.
 */
export const PositionsGrid: React.FC = () => {
  const { positions } = useTradingStore();

  // Generate mock price history for each position (in production, this comes from WebSocket)
  const enrichedPositions: PositionData[] = positions.map((pos) => {
    const history = Array.from({ length: 20 }, (_, i) => ({
      time: `${i}m`,
      price: pos.entry_price + (Math.random() - 0.5) * 0.1,
    }));
    history.push({ time: 'now', price: pos.current_price });

    return {
      ticker: pos.ticker,
      side: pos.side,
      quantity: pos.quantity,
      entryPrice: pos.entry_price,
      currentPrice: pos.current_price,
      unrealizedPnL: pos.unrealized_pnl,
      priceHistory: history,
    };
  });

  if (enrichedPositions.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-48 text-gray-500">
        <Activity className="opacity-50 mb-3 w-12 h-12" />
        <p className="text-sm">No active positions</p>
        <p className="mt-1 text-xs">Positions will appear here when opened</p>
      </div>
    );
  }

  return (
    <div className="gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {enrichedPositions.map((position) => (
        <PositionChart key={position.ticker} position={position} />
      ))}
    </div>
  );
};
