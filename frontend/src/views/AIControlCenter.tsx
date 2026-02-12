import React from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Sliders,
  Filter,
  Zap,
  Bot,
  RefreshCw,
  GraduationCap,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useTradingStore } from '../context/TradingContext';

/**
 * AI Control Center - Comprehensive AI agent control modules.
 *
 * Provides control over:
 * - Trading parameters (risk tolerance, position sizing)
 * - Market filters (liquidity, spread, volatility)
 * - Execution protocols (order type, aggressiveness)
 * - Autonomous settings (self-adjust, rebalance, learning)
 */
export const AIControlCenter: React.FC = () => {
  const { aiConfig, updateAIConfig, tradingMode } = useTradingStore();
  const isLive = tradingMode === 'live';

  const SliderControl: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    suffix?: string;
    onChange: (value: number) => void;
    tooltip?: string;
  }> = ({ label, value, min, max, step = 1, suffix = '', onChange, tooltip }) => (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="flex items-center gap-1 text-gray-300 text-sm">
          {label}
          {tooltip && (
            <span className="group relative">
              <Info className="w-3 h-3 text-gray-500 cursor-help" />
              <span className="bottom-full left-1/2 z-10 absolute bg-void opacity-0 group-hover:opacity-100 mb-2 px-2 py-1 rounded text-gray-300 text-xs whitespace-nowrap transition-opacity -translate-x-1/2">
                {tooltip}
              </span>
            </span>
          )}
        </span>
        <span className="font-mono text-neon-cyan text-sm">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="bg-gray-700 rounded-lg w-full h-2 accent-neon-cyan appearance-none cursor-pointer"
      />
    </div>
  );

  const SelectControl: React.FC<{
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
  }> = ({ label, value, options, onChange }) => (
    <div className="space-y-2">
      <span className="text-gray-300 text-sm">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-void px-3 py-2 border border-glass-border focus:border-neon-cyan rounded-lg focus:outline-none w-full text-white text-sm"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  const ToggleControl: React.FC<{
    label: string;
    description: string;
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    icon: React.ReactNode;
    warning?: boolean;
  }> = ({ label, description, enabled, onChange, icon, warning }) => (
    <div
      className={`
        flex items-center justify-between p-3 rounded-lg border cursor-pointer
        transition-all duration-200
        ${
          enabled
            ? warning
              ? 'bg-neon-amber/10 border-neon-amber/30'
              : 'bg-neon-cyan/10 border-neon-cyan/30'
            : 'bg-glass-bg border-glass-border hover:bg-glass-hover'
        }
      `}
      onClick={() => onChange(!enabled)}
    >
      <div className="flex items-center gap-3">
        <div
          className={enabled ? (warning ? 'text-neon-amber' : 'text-neon-cyan') : 'text-gray-500'}
        >
          {icon}
        </div>
        <div>
          <span className="font-medium text-white text-sm">{label}</span>
          <p className="text-gray-400 text-xs">{description}</p>
        </div>
      </div>
      <div
        className={`
        w-10 h-6 rounded-full p-1 transition-colors duration-200
        ${enabled ? (warning ? 'bg-neon-amber' : 'bg-neon-cyan') : 'bg-gray-600'}
      `}
      >
        <motion.div
          className="bg-white rounded-full w-4 h-4"
          animate={{ x: enabled ? 16 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6 h-full overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Brain className="w-6 h-6 text-neon-teal" />
        <h2 className="font-bold text-white text-xl">AI Control Center</h2>
        <span
          className={`ml-auto px-2 py-1 text-xs rounded-full ${
            isLive ? 'bg-live-accent/20 text-live-accent' : 'bg-paper-accent/20 text-paper-accent'
          }`}
        >
          {isLive ? 'LIVE' : 'PAPER'}
        </span>
      </div>

      {/* Section: Trading Parameters */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 p-4 rounded-xl glass-card"
      >
        <div className="flex items-center gap-2 text-neon-cyan">
          <Sliders className="w-5 h-5" />
          <h3 className="font-semibold">Trading Parameters</h3>
        </div>

        <SliderControl
          label="Max Position Size"
          value={aiConfig.maxPositionSizePct}
          min={1}
          max={25}
          suffix="%"
          onChange={(v) => updateAIConfig({ maxPositionSizePct: v })}
          tooltip="Maximum portfolio % per position"
        />

        <SelectControl
          label="Risk Tolerance"
          value={aiConfig.riskTolerance}
          options={[
            { value: 'low', label: 'Low (Conservative)' },
            { value: 'medium', label: 'Medium (Balanced)' },
            { value: 'high', label: 'High (Aggressive)' },
          ]}
          onChange={(v) => updateAIConfig({ riskTolerance: v as any })}
        />

        <SliderControl
          label="Daily Loss Limit"
          value={aiConfig.maxDailyLossPct}
          min={1}
          max={10}
          suffix="%"
          onChange={(v) => updateAIConfig({ maxDailyLossPct: v })}
          tooltip="Triggers kill switch if exceeded"
        />
      </motion.section>

      {/* Section: Market Filters */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4 p-4 rounded-xl glass-card"
      >
        <div className="flex items-center gap-2 text-neon-green">
          <Filter className="w-5 h-5" />
          <h3 className="font-semibold">Market Filters</h3>
        </div>

        <SliderControl
          label="Min Liquidity"
          value={aiConfig.minLiquidity}
          min={10}
          max={500}
          step={10}
          suffix=" contracts"
          onChange={(v) => updateAIConfig({ minLiquidity: v })}
        />

        <SliderControl
          label="Max Spread"
          value={Math.round(aiConfig.maxSpread * 100)}
          min={1}
          max={20}
          suffix="¢"
          onChange={(v) => updateAIConfig({ maxSpread: v / 100 })}
        />

        <SelectControl
          label="Volatility Threshold"
          value={aiConfig.volatilityThreshold}
          options={[
            { value: 'low', label: 'Low Only' },
            { value: 'medium', label: 'Low to Medium' },
            { value: 'high', label: 'Up to High' },
            { value: 'any', label: 'Any Volatility' },
          ]}
          onChange={(v) => updateAIConfig({ volatilityThreshold: v as any })}
        />
      </motion.section>

      {/* Section: Execution Protocols */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4 p-4 rounded-xl glass-card"
      >
        <div className="flex items-center gap-2 text-neon-amber">
          <Zap className="w-5 h-5" />
          <h3 className="font-semibold">Execution Protocols</h3>
        </div>

        <SelectControl
          label="Order Type"
          value={aiConfig.orderType}
          options={[
            { value: 'limit', label: 'Limit Orders (Passive)' },
            { value: 'market', label: 'Market Orders (Immediate)' },
            { value: 'adaptive', label: 'Adaptive (AI Decides)' },
          ]}
          onChange={(v) => updateAIConfig({ orderType: v as any })}
        />

        <SliderControl
          label="Aggressiveness"
          value={aiConfig.aggressiveness}
          min={1}
          max={10}
          onChange={(v) => updateAIConfig({ aggressiveness: v })}
          tooltip="1 = Very Passive, 10 = Very Aggressive"
        />
      </motion.section>

      {/* Section: Autonomous Settings */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3 p-4 rounded-xl glass-card"
      >
        <div className="flex items-center gap-2 text-neon-teal">
          <Bot className="w-5 h-5" />
          <h3 className="font-semibold">Autonomous Capabilities</h3>
        </div>

        <ToggleControl
          label="Self-Adjustment"
          description="AI can modify its own risk parameters"
          enabled={aiConfig.selfAdjustEnabled}
          onChange={(v) => updateAIConfig({ selfAdjustEnabled: v })}
          icon={<Sliders className="w-4 h-4" />}
          warning={true}
        />

        <ToggleControl
          label="Auto-Rebalance"
          description="Automatically rebalance portfolio allocations"
          enabled={aiConfig.autoRebalance}
          onChange={(v) => updateAIConfig({ autoRebalance: v })}
          icon={<RefreshCw className="w-4 h-4" />}
        />

        <ToggleControl
          label="ML Optimization"
          description="Enable machine learning for strategy optimization"
          enabled={aiConfig.learningEnabled}
          onChange={(v) => updateAIConfig({ learningEnabled: v })}
          icon={<GraduationCap className="w-4 h-4" />}
        />

        {(aiConfig.selfAdjustEnabled || aiConfig.autoRebalance || aiConfig.learningEnabled) && (
          <div className="flex items-center gap-2 bg-neon-amber/10 mt-2 p-3 border border-neon-amber/30 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-neon-amber" />
            <span className="text-neon-amber text-xs">
              Autonomous features enabled. AI will make decisions without confirmation.
            </span>
          </div>
        )}
      </motion.section>
    </div>
  );
};
