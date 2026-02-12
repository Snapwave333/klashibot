import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Square, XOctagon, ArrowDownToLine } from 'lucide-react';
import { useTradingStore } from '../context/TradingContext';

interface EmergencyControlsProps {
  onCommand: (command: string) => void;
}

/**
 * One-click emergency controls panel for critical trading actions.
 * Provides immediate access to:
 * - Emergency Stop: Halt all trading immediately
 * - Strategy Override: Manual intervention mode
 * - Liquidate All: Exit all positions (requires double confirmation)
 */
export const EmergencyControls: React.FC<EmergencyControlsProps> = ({ onCommand }) => {
  const { emergencyStop, setEmergencyStop, tradingMode, botState } = useTradingStore();
  const [showLiquidateConfirm, setShowLiquidateConfirm] = React.useState(false);
  const [liquidateCountdown, setLiquidateCountdown] = React.useState(3);

  const handleEmergencyStop = () => {
    setEmergencyStop(true);
    onCommand('EMERGENCY_STOP');
  };

  const handleStrategyOverride = () => {
    onCommand('STRATEGY_OVERRIDE');
  };

  const handleLiquidateClick = () => {
    if (!showLiquidateConfirm) {
      setShowLiquidateConfirm(true);
      setLiquidateCountdown(3);
      const interval = setInterval(() => {
        setLiquidateCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (liquidateCountdown === 0) {
      onCommand('LIQUIDATE_ALL');
      setShowLiquidateConfirm(false);
    }
  };

  const isLive = tradingMode === 'live';
  const isActive = botState === 'RUNNING';

  return (
    <div
      className={`
      rounded-xl p-4 border backdrop-blur-md
      ${isLive ? 'bg-live-bg/80 border-live-border' : 'bg-paper-bg/80 border-paper-border'}
    `}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className={`w-5 h-5 ${isLive ? 'text-live-accent' : 'text-paper-accent'}`} />
        <span className="font-semibold text-white">Emergency Controls</span>
        {emergencyStop && (
          <span className="bg-neon-red/20 ml-auto px-2 py-0.5 rounded-full text-neon-red text-xs animate-pulse">
            STOPPED
          </span>
        )}
      </div>

      {/* Control Buttons */}
      <div className="flex flex-col gap-3">
        {/* Emergency Stop */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleEmergencyStop}
          disabled={emergencyStop}
          className={`
            flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium
            transition-all duration-200
            ${
              emergencyStop
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-neon-red/20 text-neon-red border border-neon-red/40 hover:bg-neon-red/30'
            }
          `}
        >
          <Square className="w-5 h-5" />
          {emergencyStop ? 'Trading Halted' : 'Emergency Stop'}
        </motion.button>

        {/* Strategy Override */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleStrategyOverride}
          disabled={!isActive}
          className={`
            flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium
            transition-all duration-200
            ${
              !isActive
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-neon-amber/20 text-neon-amber border border-neon-amber/40 hover:bg-neon-amber/30'
            }
          `}
        >
          <XOctagon className="w-5 h-5" />
          Strategy Override
        </motion.button>

        {/* Liquidate All (with double-confirm) */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLiquidateClick}
          onBlur={() => {
            setShowLiquidateConfirm(false);
            setLiquidateCountdown(3);
          }}
          className={`
            flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium
            transition-all duration-200
            ${
              showLiquidateConfirm && liquidateCountdown === 0
                ? 'bg-neon-red text-white animate-pulse'
                : 'bg-neon-red/10 text-neon-red border border-neon-red/30 hover:bg-neon-red/20'
            }
          `}
        >
          <ArrowDownToLine className="w-5 h-5" />
          {showLiquidateConfirm
            ? liquidateCountdown > 0
              ? `Confirm in ${liquidateCountdown}s...`
              : 'CLICK TO CONFIRM'
            : 'Liquidate All Positions'}
        </motion.button>
      </div>

      {/* Mode Warning */}
      {isLive && (
        <div className="bg-live-warning/10 mt-4 p-3 border border-live-warning/30 rounded-lg">
          <p className="flex items-center gap-2 text-live-warning text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium">LIVE TRADING ACTIVE</span>
          </p>
          <p className="mt-1 text-gray-400 text-xs">
            Actions will affect real positions and capital
          </p>
        </div>
      )}
    </div>
  );
};
