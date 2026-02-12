import React from 'react';
import { useTradingStore } from '../../context/TradingContext';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const PerformanceWidget: React.FC = () => {
  const { portfolio } = useTradingStore();

  // Use mock data if history is empty for visualization
  const data =
    portfolio.metrics_history.pnl_7d.length > 0
      ? portfolio.metrics_history.pnl_7d.map((val, i) => ({ i, val }))
      : Array(10)
          .fill(0)
          .map((_, i) => ({ i, val: Math.random() * 100 }));

  return (
    <div className="flex flex-col justify-between gap-[var(--space-m)] p-[var(--space-m)] h-full overflow-hidden">
      <div className="gap-[var(--space-m)] grid grid-cols-2">
        <div className="min-w-0">
          <p className="mb-[var(--space-xs)] text-[9px] text-gray-500 truncate uppercase tracking-wider">Sharpe Ratio</p>
          <p
            className="font-mono font-bold text-white text-2xl truncate tracking-tighter"
            title={portfolio.sharpe_ratio.toFixed(2)}
          >
            {portfolio.sharpe_ratio.toFixed(2)}
          </p>
        </div>
        <div className="min-w-0">
          <p className="mb-[var(--space-xs)] text-[9px] text-gray-500 truncate uppercase tracking-wider">Win Rate</p>
          <div className="flex items-center gap-[var(--space-s)]">
              <p
              className="font-mono font-bold text-neon-green text-2xl truncate tracking-tighter"
              title={`${portfolio.win_rate}%`}
              >
              {portfolio.win_rate}%
              </p>
              {portfolio.win_rate > 50 ? (
                  <TrendingUp className="w-4 h-4 text-neon-green" />
              ) : (
                  <TrendingDown className="w-4 h-4 text-neon-red" />
              )}
          </div>
        </div>
        <div className="min-w-0">
          <p className="mb-[var(--space-xs)] text-[9px] text-gray-500 truncate uppercase tracking-wider">Drawdown</p>
          <p
            className="font-mono font-bold text-neon-red text-2xl truncate tracking-tighter"
            title={`-${portfolio.max_drawdown.toFixed(2)}%`}
          >
            -{portfolio.max_drawdown.toFixed(2)}%
          </p>
        </div>
        <div className="min-w-0">
          <p className="mb-[var(--space-xs)] text-[9px] text-gray-500 truncate uppercase tracking-wider">Orders/Sec</p>
          <p
            className="font-mono font-bold text-[rgb(205,148,65)] text-2xl truncate tracking-tighter"
            title={portfolio.orders_per_sec.toString()}
          >
            {portfolio.orders_per_sec}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <Line
                type="monotone"
                dataKey="val"
                stroke="rgb(205,148,65)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
      </div>
    </div>
  );
};
