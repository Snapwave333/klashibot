import React from 'react';
import { useTradingStore } from '../../context/TradingContext';
import { GlassCard } from '../ui/GlassCard';
import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const EquityWidget: React.FC = () => {
  const { portfolio, initialCapital } = useTradingStore();

  // Safe access to nested properties
  const total_equity = portfolio?.total_equity ?? 0;
  const free_margin = portfolio?.free_margin ?? 0;
  const daily_pnl = portfolio?.daily_pnl ?? 0;

  // Safe margin calculation
  const usedMargin = total_equity > 0 ? total_equity - free_margin : 0;
  const usagePercent = total_equity > 0 ? (usedMargin / total_equity) * 100 : 0;

  return (
    <GlassCard className="group relative hover:border-[rgb(205,148,65)]/50 h-full overflow-hidden transition-colors duration-300">
      <div className="flex flex-col gap-[var(--space-m)] h-full">
        {/* Header */}
        <div className="flex justify-between items-start shrink-0">
          <div className="flex items-center gap-[var(--space-s)]">
            <div className="flex justify-center items-center bg-[rgb(205,148,65)]/10 p-[var(--space-xs)] rounded-lg shrink-0">
              <DollarSign className="w-4 h-4 text-[rgb(205,148,65)]" />
            </div>
            <h3 className="pt-[var(--optical-top-adj)] font-bold text-[10px] text-gray-500 uppercase tracking-widest">
              Total Equity
            </h3>
          </div>
          <span
            className={`flex items-center gap-1 font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
              daily_pnl >= 0 ? 'text-[var(--color-success)] bg-[var(--color-success)]/10' : 'text-[var(--color-danger)] bg-[var(--color-danger)]/10'
            } shrink-0`}
          >
            {daily_pnl >= 0 ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {formatCurrency(daily_pnl)}
          </span>
        </div>

        {/* Main Value - Applying Larger Element Rule for margin-bottom */}
        <div className="mb-[var(--space-s)] shrink-0">
          <span
            className="block font-mono font-bold text-white text-3xl truncate tracking-tighter"
            title={formatCurrency(total_equity)}
          >
            {formatCurrency(total_equity)}
          </span>
        </div>

        {/* Sub-metrics Grid - ISABP Spacing */}
        <div className="gap-[var(--space-s)] grid grid-cols-2">
          <div className="bg-white/5 p-[var(--space-s)] rounded-xl min-w-0">
            <span className="block mb-[var(--space-xs)] font-medium text-[9px] text-gray-500 truncate uppercase tracking-tight">
              Free Margin
            </span>
            <span
              className="block font-mono font-bold text-white text-sm truncate"
              title={formatCurrency(free_margin)}
            >
              {formatCurrency(free_margin)}
            </span>
          </div>
          <div className="bg-white/5 p-[var(--space-s)] rounded-xl min-w-0">
            <span className="block mb-[var(--space-xs)] font-medium text-[9px] text-gray-500 truncate uppercase tracking-tight">
              Used
            </span>
            <span
              className="block font-mono font-bold text-white text-sm truncate"
              title={formatCurrency(usedMargin)}
            >
              {formatCurrency(usedMargin)}
            </span>
          </div>
        </div>

        {/* Margin Usage Bar */}
        <div className="bg-white/10 rounded-full w-full h-[2px] overflow-hidden shrink-0">
          <div
            className="bg-[rgb(205,148,65)] shadow-[0_0_10px_rgba(205,148,65,0.3)] h-full transition-all duration-500"
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
      </div>

      {/* Decorative Background */}
      <div className="top-0 right-0 absolute bg-[var(--primary-500)]/5 blur-3xl rounded-full w-32 h-32 pointer-events-none" />
    </GlassCard>
  );
};
