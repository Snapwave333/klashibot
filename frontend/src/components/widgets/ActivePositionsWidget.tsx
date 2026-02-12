import React from 'react';
import { useTradingStore } from '../../context/TradingContext';
import { TrendingUp, TrendingDown, Clock, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { MarketImagePreview } from '../ui/MarketImagePreview';

export const ActivePositionsWidget: React.FC = () => {
  const { positions } = useTradingStore();

  const formatPNL = (val: number) => {
    const absVal = Math.abs(val).toFixed(2);
    return val >= 0 ? `+$${absVal}` : `-$${absVal}`;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {positions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col justify-center items-center gap-3 opacity-40 h-full"
            >
              <div className="flex justify-center items-center border-[var(--neutral-600)] border-2 border-dashed rounded-full w-12 h-12">
                <Minus className="w-5 h-5 text-[var(--neutral-500)]" />
              </div>
              <span className="text-[var(--neutral-500)] text-xs">No active positions</span>
            </motion.div>
          ) : (
            <div className="divide-[var(--border-subtle)] divide-y">
              {positions.map((pos) => (
                <motion.div
                  key={pos.ticker}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group hover:bg-white/2 p-[var(--space-m)] border-white/5 last:border-0 border-b transition-all"
                >
                  <div className="flex gap-3 mb-2">
                    {/* Market Image */}
                    <div className="flex-shrink-0">
                      <MarketImagePreview ticker={pos.ticker} initialUrl={pos.image_url} />
                    </div>

                    <div className="flex flex-1 justify-between items-start">
                      <div className="flex flex-col gap-[var(--space-xs)]">
                        <div className="flex items-center gap-[var(--space-s)]">
                          <span className="font-mono font-bold text-white text-sm tracking-tight">
                            {pos.ticker}
                          </span>
                          <span
                            className={`badge-retro ${
                              pos.side === 'YES'
                                ? 'badge-success'
                                : 'badge-danger'
                            }`}
                          >
                            {pos.side}
                          </span>
                        </div>
                        <div className="flex items-center gap-[var(--space-s)] font-medium text-[9px] text-gray-500 uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <Clock className="opacity-50 w-3 h-3" />
                            {Math.floor(pos.time_held_seconds / 60)}m active
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-[var(--space-xs)] text-right">
                        <div
                          className={`text-sm font-bold flex items-center justify-end gap-1 tracking-tighter ${
                            pos.unrealized_pnl >= 0 ? 'text-neon-green' : 'text-neon-red'
                          }`}
                        >
                          {pos.unrealized_pnl >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {formatPNL(pos.unrealized_pnl)}
                        </div>
                        <div className="font-mono font-bold text-[10px] text-gray-600">
                          {pos.unrealized_pnl_pct.toFixed(2)}% ROI
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Visual Progress Bar - ISABP Optimized */}
                  <div className="flex flex-col gap-[var(--space-xs)] pt-[var(--space-s)]">
                    <div className="flex justify-between font-bold text-[8px] uppercase tracking-widest">
                      <span className="text-gray-600">
                        Entry:{' '}
                        <span className="font-mono text-white/60">
                          ${pos.entry_price.toFixed(2)}
                        </span>
                      </span>
                      <span className="text-gray-600">
                        Current:{' '}
                        <span className="font-mono text-white/60">
                          ${pos.current_price.toFixed(2)}
                        </span>
                      </span>
                    </div>
                    <div className="relative bg-white/5 rounded-full w-full h-[2px] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(Math.abs(pos.unrealized_pnl_pct) * 10, 100)}%` }}
                        className={`absolute inset-y-0 left-0 ${
                          pos.unrealized_pnl >= 0 ? 'bg-neon-green' : 'bg-neon-red'
                        }`}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>


    </div>
  );
};
