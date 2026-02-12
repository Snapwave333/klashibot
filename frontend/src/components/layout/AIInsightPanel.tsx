import React, { useState } from 'react';
import { Brain, AlertCircle, Shield, ChevronRight, Activity, Terminal } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';
import { useTradingStore } from '../../context/TradingContext';
import { motion, AnimatePresence } from 'framer-motion';

export const AIInsightPanel: React.FC = () => {
  const { aiInsights, health } = useTradingStore();
  const [command, setCommand] = useState('');

  const riskPostureColors = {
    conservative: 'text-neon-green',
    moderate: 'text-neon-amber',
    aggressive: 'text-neon-red',
  };

  const riskPostureGlows = {
    conservative: 'shadow-[0_0_20px_rgba(0,255,136,0.1)]',
    moderate: 'shadow-[0_0_20px_rgba(255,170,0,0.1)]',
    aggressive: 'shadow-[0_0_20px_rgba(255,51,102,0.1)]',
  };

  return (
    <div className="z-20 flex flex-col bg-glass-bg backdrop-blur-xl border-glass-border border-l w-96 h-full overflow-hidden">
      {/* ISABP: Optical Padding: Top padding (20px) < Bottom/Side (24px) */}
      <div className="flex-1 space-y-6 px-6 pt-5 pb-6 overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg transition-colors ${
                health.ai_agent_status === 'ACTIVE'
                  ? 'bg-neon-cyan/10'
                  : health.ai_agent_status === 'WARMING_UP'
                    ? 'bg-neon-amber/10'
                    : health.ai_agent_status === 'DISABLED'
                      ? 'bg-gray-800'
                      : 'bg-neon-red/10'
              }`}
            >
              <Brain
                className={`w-5 h-5 ${
                  health.ai_agent_status === 'ACTIVE'
                    ? 'text-neon-cyan'
                    : health.ai_agent_status === 'WARMING_UP'
                      ? 'text-neon-amber animate-pulse'
                      : health.ai_agent_status === 'DISABLED'
                        ? 'text-gray-500'
                        : 'text-neon-red'
                }`}
              />
            </div>
            <div>
              {/* ISABP: Strong bond Title -> Subtitle */}
              <h2 className="mb-0.5 font-bold text-white text-sm uppercase tracking-wider">
                AI Core
              </h2>
              <p
                className={`font-mono text-[10px] uppercase font-bold ${
                  health.ai_agent_status === 'ACTIVE'
                    ? 'text-neon-cyan'
                    : health.ai_agent_status === 'WARMING_UP'
                      ? 'text-neon-amber'
                      : health.ai_agent_status === 'DISABLED'
                        ? 'text-gray-500'
                        : 'text-neon-red'
                }`}
              >
                {health.ai_agent_status.replace('_', ' ')}
              </p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            className="flex justify-center items-center -mr-2 border border-neon-cyan/20 border-t-neon-cyan rounded-full w-16 h-16"
          >
            <div className="opacity-50 border border-neon-cyan/10 border-b-neon-cyan rounded-full w-12 h-12" />
          </motion.div>
        </div>

        {/* Confidence Meter */}
        <GlassCard className="group relative overflow-hidden">
          <div className="absolute inset-0 bg-neon-cyan/5 group-hover:bg-neon-cyan/10 transition-colors duration-500" />

          <div className="z-10 relative">
            {/* ISABP: XS Gap (4px) for Title -> Value */}
            <div className="flex justify-between items-center mb-1">
              <p className="font-bold text-[10px] text-gray-400 uppercase tracking-widest">
                Model Confidence
              </p>
              <Activity className="w-4 h-4 text-neon-cyan animate-pulse" />
            </div>

            {/* ISABP: M Gap (12px) from Value to Bar */}
            <div className="flex items-baseline gap-1 mb-3">
              <span className="font-mono font-bold text-white text-5xl leading-none tracking-tighter">
                {aiInsights.confidence}
              </span>
              <span className="font-mono text-neon-cyan text-sm">%</span>
            </div>

            <div className="bg-black/50 rounded-full w-full h-1.5 overflow-hidden">
              <motion.div
                className="bg-gradient-to-r from-neon-cyan to-neon-green shadow-[0_0_10px_#00d9ff] h-full"
                initial={{ width: 0 }}
                animate={{ width: `${aiInsights.confidence}%` }}
                transition={{ duration: 1, ease: 'circOut' }}
              />
            </div>
          </div>
        </GlassCard>

        {/* Market Bias & Intent */}
        <div className="gap-4 grid grid-cols-1">
          <GlassCard>
            {/* ISABP: S Gap (8px) Title -> Content */}
            <div className="flex items-center gap-2 mb-2">
              <TrendingDownIcon className="w-4 h-4 text-neon-cyan" />
              <p className="font-bold text-[10px] text-gray-400 uppercase tracking-widest">
                Market Bias
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {aiInsights.market_bias.length > 0 ? (
                aiInsights.market_bias.map((bias, i) => (
                  <span
                    key={`bias-${bias}-${i}`}
                    className="bg-white/5 px-3 py-1 border border-white/10 rounded-full font-medium text-gray-200 text-xs"
                  >
                    {bias}
                  </span>
                ))
              ) : (
                <span className="text-gray-600 text-xs italic">No bias detected</span>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Risk Posture */}
        <GlassCard
          className={`transition-all duration-300 ${riskPostureGlows[aiInsights.risk_posture]}`}
          glow={
            aiInsights.risk_posture === 'aggressive'
              ? 'red'
              : aiInsights.risk_posture === 'moderate'
                ? 'amber'
                : 'green'
          }
        >
          {/* ISABP: S Gap (8px) Title -> Content */}
          <div className="flex justify-between items-center mb-2">
            <p className="font-bold text-[10px] text-gray-400 uppercase tracking-widest">
              Risk Protocol
            </p>
            <Shield className={`w-4 h-4 ${riskPostureColors[aiInsights.risk_posture]}`} />
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`w-2 h-2 rounded-full ${aiInsights.risk_posture === 'aggressive' ? 'bg-neon-red' : aiInsights.risk_posture === 'moderate' ? 'bg-neon-amber' : 'bg-neon-green'} shadow-[0_0_10px_currentColor]`}
            />
            <span
              className={`text-xl font-bold uppercase tracking-tight ${riskPostureColors[aiInsights.risk_posture]}`}
            >
              {aiInsights.risk_posture}
            </span>
          </div>
        </GlassCard>

        {/* Anomalies List */}
        <div>
          {/* ISABP: S Gap (8px) Title -> List */}
          <div className="flex justify-between items-center mb-2">
            <p className="font-bold text-[10px] text-gray-500 uppercase tracking-widest">
              Live Anomalies
            </p>
            <span className="tabular-nums text-[10px] text-gray-600">
              {aiInsights.anomalies.length} ACTIVE
            </span>
          </div>

          <div className="space-y-2">
            <AnimatePresence>
              {aiInsights.anomalies.length > 0 ? (
                aiInsights.anomalies.map((anomaly, index) => (
                  <motion.div
                    key={`anomaly-${anomaly.type}-${anomaly.timestamp}-${index}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`p-3 rounded-lg border backdrop-blur-md ${
                      anomaly.severity === 'high'
                        ? 'bg-neon-red/10 border-neon-red/30'
                        : 'bg-neon-amber/10 border-neon-amber/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle
                        className={`w-4 h-4 mt-0.5 ${
                          anomaly.severity === 'high' ? 'text-neon-red' : 'text-neon-amber'
                        }`}
                      />
                      <div>
                        <p
                          className={`text-xs font-bold uppercase mb-1 ${
                            anomaly.severity === 'high' ? 'text-neon-red' : 'text-neon-amber'
                          }`}
                        >
                          {anomaly.type}
                        </p>
                        <p className="text-gray-300 text-xs leading-relaxed">{anomaly.message}</p>
                        <p className="mt-2 font-mono text-[10px] text-gray-500">
                          {anomaly.timestamp}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col justify-center items-center p-8 border border-gray-800 border-dashed rounded-xl text-center">
                  <div className="bg-gray-600 mb-2 rounded-full w-2 h-2" />
                  <p className="text-gray-600 text-xs">No anomalies detected</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Natural Language Command */}
      <div className="bg-black/20 p-4 border-glass-border border-t">
        <label className="flex items-center gap-3 bg-white/5 focus-within:bg-white/10 p-3 border border-white/10 focus-within:border-neon-cyan/50 rounded-xl transition-all duration-300">
          <Terminal className="w-4 h-4 text-neon-cyan" />
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Ask AI..."
            className="flex-1 bg-transparent border-none outline-none font-mono text-white text-sm placeholder-gray-600"
          />
          <button className="bg-neon-cyan/20 hover:bg-neon-cyan p-1.5 rounded-lg text-neon-cyan hover:text-black transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </label>
      </div>
    </div>
  );
};

// Helper for icon
const TrendingDownIcon = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline>
    <polyline points="17 18 23 18 23 12"></polyline>
  </svg>
);
