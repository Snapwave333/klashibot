import React from 'react';
import { useTradingStore } from '../context/TradingContext';

const StrategiesView: React.FC = () => {
  const { strategies } = useTradingStore();

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="font-bold text-2xl text-neon-cyan uppercase tracking-wider">
          Strategy Monitor
        </h1>
      </div>

      <div className="gap-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {strategies.length === 0 ? (
          <div className="col-span-full p-8 text-center">
            <p className="text-gray-500">
              No strategies loaded yet. Waiting for bot initialization...
            </p>
          </div>
        ) : (
          strategies.map((strategy: any) => (
            <div
              key={strategy.name}
              className="glass-card border-white/10 hover:border-neon-cyan/50 p-6 border rounded-lg transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-white">{strategy.name}</h3>
                  <p className="text-gray-400 text-xs uppercase tracking-wide">
                    {strategy.enabled ? (
                      <span className="text-neon-green">● ACTIVE</span>
                    ) : (
                      <span className="text-gray-500">○ DISABLED</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-300">
                 <p>Win Rate: {(strategy.win_rate * 100).toFixed(1)}%</p>
                 <p>Trades: {strategy.trades_count}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default StrategiesView;
