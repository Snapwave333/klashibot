import React from 'react';
import { useTradingStore } from '../context/TradingContext';
import { EquityWidget } from '../components/widgets/EquityWidget';
import { PerformanceWidget } from '../components/widgets/PerformanceWidget';

const OverviewView: React.FC = () => {
  const { tradingMode } = useTradingStore();

  return (
    <div className="space-y-6 p-6 h-full overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-white text-xl tracking-tight">Portfolio Command Center</h2>
        <span className="text-gray-500 text-xs">MODE: {tradingMode.toUpperCase()}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-[300px]">
            <EquityWidget />
        </div>
        <div className="h-[300px]">
            <PerformanceWidget />
        </div>
      </div>
    </div>
  );
};

export default OverviewView;
