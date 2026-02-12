import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis } from 'recharts';
import { useTradingStore } from '../../context/TradingContext';
import { GlassCard } from '../ui/GlassCard';

export const LatencyWidget: React.FC = () => {
  const { health } = useTradingStore();

  const history = health?.latency_history || [];
  const data =
    history.length > 0
      ? history
      : Array(20)
          .fill(0)
          .map((_, i) => ({ time: i, value: 50 + Math.random() * 20 }));

  const currentLatency = health?.api_latency_ms ?? 0;
  const isHighLatency = currentLatency > 150;

  return (
    <GlassCard className="relative flex flex-col h-full min-h-[200px] overflow-hidden">
      <div className="z-10 flex justify-between items-center mb-4">
        <div>
          <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest">
            Network Latency
          </h3>
          <p
            className={`text-2xl font-mono font-bold ${isHighLatency ? 'text-neon-amber' : 'text-neon-green'}`}
          >
            {currentLatency}
            <span className="ml-1 text-gray-500 text-sm">ms</span>
          </p>
        </div>
        <div className="flex flex-col items-end">
          <span className="font-bold text-[10px] text-gray-500 uppercase">Protocol</span>
          <span className="font-mono text-neon-cyan text-xs">WSS/TLS</span>
        </div>
      </div>

      <div className="top-10 bottom-0 absolute inset-0 opacity-30">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="latencyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isHighLatency ? '#ffaa00' : '#00ff88'}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={isHighLatency ? '#ffaa00' : '#00ff88'}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis hide domain={['auto', 'auto']} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isHighLatency ? '#ffaa00' : '#00ff88'}
              strokeWidth={2}
              fill="url(#latencyGradient)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};
