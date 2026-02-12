import React from 'react';
import { useTradingStore } from '../../context/TradingContext';

export const ExposureMapWidget: React.FC = () => {
  const { positions } = useTradingStore();

  const totalValue = positions.reduce((acc, p) => acc + p.current_price * p.quantity, 0);

  return (
    <div className="flex flex-col gap-[var(--space-m)] p-[var(--space-m)] h-full overflow-hidden">
      <div className="flex flex-1 gap-1 bg-black/20 rounded-lg w-full h-full overflow-hidden">
        {positions.length > 0 ? (
          positions.map((pos) => {
            const widthPct = ((pos.quantity * pos.current_price) / totalValue) * 100;
            return (
              <div
                key={pos.ticker}
                style={{ width: `${widthPct}%` }}
                className="group relative hover:brightness-125 h-full transition-all duration-300"
              >
                <div
                  className={`absolute inset-0 border-r border-[#5D4037] ${pos.unrealized_pnl >= 0 ? 'bg-[var(--status-success)]/20' : 'bg-[var(--status-error)]/20'}`}
                />
                <div className="absolute inset-0 flex flex-col justify-center items-center bg-black/80 opacity-0 group-hover:opacity-100 p-2 text-center transition-opacity">
                  <span className="font-bold text-white text-xs">{pos.ticker}</span>
                  <span
                    className={`text-xs ${pos.unrealized_pnl >= 0 ? 'text-neon-green' : 'text-neon-red'}`}
                  >
                    {pos.unrealized_pnl >= 0 ? '+' : ''}{pos.unrealized_pnl.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
             <div className="flex justify-center items-center w-full h-full text-gray-500 text-xs uppercase tracking-wider">
                No Exposure
             </div>
        )}
      </div>
      
      {/* Footer Info */}
      <div className="flex justify-between items-center shrink-0">
        <span className="font-medium text-[9px] text-gray-500 uppercase tracking-wider">Total Exposure</span>
        <span className="font-mono font-bold text-white text-xs">
          ${totalValue.toFixed(2)}
        </span>
      </div>
    </div>
  );
};
