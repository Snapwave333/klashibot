import React from 'react';
import { useTradingStore } from '../../context/TradingContext';
import { Activity, Database, Zap, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  const { health, botState, portfolio } = useTradingStore();

  return (
    <footer className="z-30 flex flex-col bg-black/40 backdrop-blur-xl border-glass-border border-t w-full">
      {/* Top Section: System Monitor Bar */}
      <div className="flex justify-between items-center px-4 border-glass-border/50 border-b h-8 text-[10px] text-gray-500 uppercase tracking-widest">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Cpu className="w-3 h-3 text-neon-cyan" />
            <span>
              Engine: <span className="text-gray-300">{botState}</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="w-3 h-3 text-neon-green" />
            <span>
              Sync: <span className="text-gray-300">Active (60s)</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-3 h-3 text-neon-amber" />
            <span>
              Mode: <span className="text-gray-300">Prediction Alpha</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3 text-neon-cyan" />
            <span>
              Latency: <span className="text-gray-300">{health.api_latency_ms || '--'}ms</span>
            </span>
          </div>
          <div className="pl-4 border-glass-border border-l h-4" />
          <span>
            Uptime: <span className="text-gray-300">{portfolio.uptime_seconds || 0}s</span>
          </span>
        </div>
      </div>

    </footer>
  );
};
