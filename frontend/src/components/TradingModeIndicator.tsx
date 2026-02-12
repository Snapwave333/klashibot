import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, TestTube2, Wallet } from 'lucide-react';
import { useTradingStore } from '../context/TradingContext';

/**
 * Prominent trading mode indicator with visual differentiation.
 * - Paper mode: Amber styling with development warning
 * - Live mode: Red styling with prominent warnings
 */
export const TradingModeIndicator: React.FC = () => {
  const { tradingMode, setTradingMode, emergencyStop } = useTradingStore();
  const [showSwitchConfirm, setShowSwitchConfirm] = React.useState(false);

  const isPaper = tradingMode === 'paper';

  const handleModeSwitch = () => {
    if (isPaper) {
      // Switching to live requires confirmation
      setShowSwitchConfirm(true);
    } else {
      // Switching to paper is always safe
      setTradingMode('paper');
    }
  };

  const confirmLiveSwitch = () => {
    setTradingMode('live');
    setShowSwitchConfirm(false);
  };

  return (
    <>
      {/* Mode Indicator Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`
          relative flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer
          border backdrop-blur-md transition-all duration-300
          ${
            isPaper
              ? 'bg-paper-glow border-paper-border hover:bg-paper-accent/10'
              : 'bg-live-glow border-live-border hover:bg-live-accent/10'
          }
        `}
        onClick={handleModeSwitch}
      >
        {/* Mode Icon */}
        {isPaper ? (
          <TestTube2 className="w-5 h-5 text-paper-accent" />
        ) : (
          <Wallet className="w-5 h-5 text-live-accent" />
        )}

        {/* Mode Label */}
        <div className="flex flex-col">
          <span
            className={`text-xs font-bold uppercase tracking-wider ${
              isPaper ? 'text-paper-accent' : 'text-live-accent'
            }`}
          >
            {isPaper ? 'Paper Trading' : 'Live Trading'}
          </span>
          <span className="text-gray-400 text-xs">
            {isPaper ? 'Simulated Capital' : 'Real Capital'}
          </span>
        </div>

        {/* Status Dot */}
        <div
          className={`
          w-2 h-2 rounded-full ml-2
          ${
            emergencyStop
              ? 'bg-gray-500'
              : isPaper
                ? 'bg-paper-accent animate-pulse'
                : 'bg-live-accent animate-pulse'
          }
        `}
        />
      </motion.div>

      {/* Live Switch Confirmation Modal */}
      {showSwitchConfirm && (
        <div className="z-50 fixed inset-0 flex justify-center items-center bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-void-darker mx-4 p-6 border border-live-border rounded-xl max-w-md"
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-live-accent" />
              <h3 className="font-bold text-white text-xl">Switch to Live Trading?</h3>
            </div>

            <div className="space-y-3 mb-6">
              <p className="text-gray-300">
                You are about to switch to{' '}
                <span className="font-bold text-live-accent">LIVE TRADING MODE</span>.
              </p>
              <ul className="space-y-1 text-gray-400 text-sm">
                <li className="flex items-center gap-2">
                  <span className="bg-live-accent rounded-full w-1 h-1" />
                  All trades will use REAL capital
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-live-accent rounded-full w-1 h-1" />
                  Orders will be submitted to Kalshi
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-live-accent rounded-full w-1 h-1" />
                  Profits and losses are REAL
                </li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowSwitchConfirm(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLiveSwitch}
                className="flex-1 bg-live-accent hover:bg-red-500 px-4 py-2 rounded-lg font-medium text-white transition-colors"
              >
                Confirm Live Mode
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};
