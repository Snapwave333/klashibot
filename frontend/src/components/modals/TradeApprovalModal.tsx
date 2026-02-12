import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Check, X, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { GlassCard } from '../ui/GlassCard';

export interface PendingTrade {
  id: string;
  ticker: string;
  action: 'BUY' | 'SELL';
  side: 'YES' | 'NO';
  price: number;
  quantity: number;
  estimatedCost: number;
  portfolioImpact: number; // % of portfolio
  reasoning: string;
  timestamp: number;
}

interface TradeApprovalModalProps {
  trade: PendingTrade | null;
  isOpen: boolean;
  onApprove: (tradeId: string) => void;
  onReject: (tradeId: string) => void;
  onClose: () => void;
  autoApproveEnabled?: boolean;
  countdownSeconds?: number;
}

export const TradeApprovalModal: React.FC<TradeApprovalModalProps> = ({
  trade,
  isOpen,
  onApprove,
  onReject,
  onClose,
  autoApproveEnabled = false,
  countdownSeconds = 30,
}) => {
  const [countdown, setCountdown] = React.useState(countdownSeconds);
  const [autoApprove, setAutoApprove] = React.useState(autoApproveEnabled);

  React.useEffect(() => {
    if (!isOpen || !trade || !autoApprove) {
      setCountdown(countdownSeconds);
      return undefined;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onApprove(trade.id);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, trade, autoApprove, onApprove, countdownSeconds]);

  if (!trade) return null;

  const isLargeTrade = trade.portfolioImpact > 10;
  const isCriticalTrade = trade.portfolioImpact > 25;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="z-50 fixed inset-0 bg-[var(--bg-overlay)] backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="z-50 fixed inset-0 flex justify-center items-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="pointer-events-auto w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <GlassCard noPadding className="overflow-hidden">
                {/* Warning Banner */}
                <div
                  className={`flex items-center gap-3 px-6 py-4 border-b ${
                    isCriticalTrade
                      ? 'bg-[var(--color-danger)]/20 border-[var(--color-danger)]/30'
                      : isLargeTrade
                        ? 'bg-[var(--color-warning)]/20 border-[var(--color-warning)]/30'
                        : 'bg-[var(--primary-500)]/20 border-[var(--primary-500)]/30'
                  }`}
                >
                  <AlertTriangle
                    className={`w-6 h-6 ${
                      isCriticalTrade
                        ? 'text-[var(--color-danger)]'
                        : isLargeTrade
                          ? 'text-[var(--color-warning)]'
                          : 'text-[var(--primary-500)]'
                    }`}
                  />
                  <div className="flex-1">
                    <h2 className="font-bold text-[var(--neutral-0)] text-xl">
                      {isCriticalTrade
                        ? 'CRITICAL TRADE APPROVAL REQUIRED'
                        : 'Trade Approval Required'}
                    </h2>
                    <p className="text-[var(--neutral-300)] text-sm">
                      This trade requires manual approval ({trade.portfolioImpact.toFixed(1)}% of
                      portfolio)
                    </p>
                  </div>
                  {autoApprove && countdown > 0 && (
                    <div className="flex flex-col items-center">
                      <span className="font-mono text-[var(--color-warning)] text-2xl">{countdown}s</span>
                      <span className="text-[var(--neutral-400)] text-xs">auto-approve</span>
                    </div>
                  )}
                </div>

                {/* Trade Details */}
                <div className="p-6 space-y-6">
                  {/* Ticker & Action */}
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-mono font-bold text-[var(--neutral-0)] text-3xl">{trade.ticker}</h3>
                        <Badge variant={trade.side === 'YES' ? 'success' : 'destructive'}>
                          {trade.side}
                        </Badge>
                      </div>
                      <p className="text-[var(--neutral-400)] text-sm">
                        {new Date(trade.timestamp).toLocaleString()}
                      </p>
                    </div>

                    <div
                      className={`flex items-center gap-2 px-4 py-2 border rounded-lg ${
                        trade.action === 'BUY'
                          ? 'bg-[var(--color-success)]/10 border-[var(--color-success)]/30'
                          : 'bg-[var(--color-danger)]/10 border-[var(--color-danger)]/30'
                      }`}
                    >
                      {trade.action === 'BUY' ? (
                        <TrendingUp className="w-5 h-5 text-[var(--color-success)]" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-[var(--color-danger)]" />
                      )}
                      <span
                        className={`font-bold text-lg ${
                          trade.action === 'BUY' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
                        }`}
                      >
                        {trade.action}
                      </span>
                    </div>
                  </div>

                  {/* Trade Metrics */}
                  <div className="gap-4 grid grid-cols-3">
                    <div className="bg-[var(--bg-card)] p-4 border border-[var(--border-subtle)] rounded-lg">
                      <p className="mb-1 font-bold text-[var(--neutral-400)] text-xs uppercase">Price</p>
                      <p className="font-mono font-bold text-[var(--neutral-0)] text-xl">${trade.price}</p>
                    </div>
                    <div className="bg-[var(--bg-card)] p-4 border border-[var(--border-subtle)] rounded-lg">
                      <p className="mb-1 font-bold text-[var(--neutral-400)] text-xs uppercase">Quantity</p>
                      <p className="font-mono font-bold text-[var(--neutral-0)] text-xl">{trade.quantity}</p>
                    </div>
                    <div className="bg-[var(--bg-card)] p-4 border border-[var(--border-subtle)] rounded-lg">
                      <p className="mb-1 font-bold text-[var(--neutral-400)] text-xs uppercase">Total Cost</p>
                      <p className="font-mono font-bold text-[var(--neutral-0)] text-xl">
                        ${trade.estimatedCost.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Portfolio Impact */}
                  <div
                    className={`p-4 border rounded-lg ${
                      isCriticalTrade
                        ? 'bg-[var(--color-danger)]/10 border-[var(--color-danger)]/30'
                        : isLargeTrade
                          ? 'bg-[var(--color-warning)]/10 border-[var(--color-warning)]/30'
                          : 'bg-[var(--primary-500)]/10 border-[var(--primary-500)]/30'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="flex items-center gap-2 font-bold text-[var(--neutral-300)] text-sm uppercase">
                        <DollarSign className="w-4 h-4" />
                        Portfolio Impact
                      </span>
                      <span
                        className={`font-mono font-bold text-2xl ${
                          isCriticalTrade
                            ? 'text-[var(--color-danger)]'
                            : isLargeTrade
                              ? 'text-[var(--color-warning)]'
                              : 'text-[var(--primary-500)]'
                        }`}
                      >
                        {trade.portfolioImpact.toFixed(1)}%
                      </span>
                    </div>
                    <div className="relative bg-[var(--neutral-0)]/10 rounded-full w-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(trade.portfolioImpact, 100)}%` }}
                        className={`absolute inset-y-0 left-0 ${
                          isCriticalTrade
                            ? 'bg-[var(--color-danger)]'
                            : isLargeTrade
                              ? 'bg-[var(--color-warning)]'
                              : 'bg-[var(--primary-500)]'
                        }`}
                      />
                    </div>
                  </div>

                  {/* AI Reasoning */}
                  <div className="bg-[var(--bg-card)] p-4 border border-[var(--border-subtle)] rounded-lg">
                    <p className="mb-2 font-bold text-[var(--neutral-400)] text-xs uppercase">AI Reasoning</p>
                    <p className="text-[var(--neutral-300)] text-sm leading-relaxed">{trade.reasoning}</p>
                  </div>

                  {/* Auto-approve Toggle */}
                  <div className="flex justify-between items-center bg-[var(--neutral-900)]/20 p-3 border border-[var(--border-subtle)] rounded-lg">
                    <div>
                      <p className="font-bold text-[var(--neutral-0)] text-sm">Enable Auto-Approve</p>
                      <p className="text-[var(--neutral-400)] text-xs">
                        Automatically approve after {countdownSeconds}s countdown
                      </p>
                    </div>
                    <button
                      onClick={() => setAutoApprove(!autoApprove)}
                      className={`relative rounded-full w-14 h-7 transition-colors ${
                        autoApprove ? 'bg-[var(--color-success)]' : 'bg-[var(--neutral-600)]'
                      }`}
                    >
                      <motion.div
                        animate={{ x: autoApprove ? 28 : 4 }}
                        className="absolute top-1 bg-white shadow-lg rounded-full w-5 h-5"
                      />
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 bg-[var(--neutral-900)]/20 p-6 border-[var(--border-subtle)] border-t">
                  <Button
                    onClick={() => onReject(trade.id)}
                    variant="destructive"
                    className="flex-1 h-12 text-base"
                    leftIcon={<X className="w-5 h-5" />}
                  >
                    Reject Trade
                  </Button>
                  <Button
                    onClick={() => onApprove(trade.id)}
                    variant="neon"
                    className="flex-1 h-12 text-base"
                    leftIcon={<Check className="w-5 h-5" />}
                  >
                    Approve Trade
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
