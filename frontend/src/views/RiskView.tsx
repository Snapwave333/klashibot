import React from 'react';
import { Shield, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { useTradingStore } from '../context/TradingContext';

export const RiskView: React.FC = () => {
  const { aiConfig, portfolio } = useTradingStore();

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-auto">
      <div className="flex justify-between items-center">
        <h2 className="flex items-center gap-3 font-bold text-white text-xl">
          <Shield className="w-6 h-6 text-neon-cyan" />
          Risk Analysis & Controls
        </h2>
        <div className="bg-neon-cyan/10 px-4 py-2 border border-neon-cyan/30 rounded-xl">
          <span className="font-bold text-neon-cyan text-sm uppercase tracking-wider">
            Risk Mode: {aiConfig.riskTolerance}
          </span>
        </div>
      </div>

      <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {/* Risk Metrics */}
        <div className="bg-black/30 p-5 border border-white/10 rounded-2xl">
          <h3 className="mb-4 font-bold text-gray-400 text-xs uppercase tracking-wider">Drawdown Monitor</h3>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <span className="font-bold text-white text-2xl">-{portfolio.max_drawdown.toFixed(2)}%</span>
              <span className="mb-1 text-gray-500 text-xs">Max Drawdown</span>
            </div>
            <div className="bg-white/5 rounded-full w-full h-2 overflow-hidden">
              <div 
                className="bg-neon-cyan h-full transition-all duration-500" 
                style={{ width: `${Math.min(portfolio.max_drawdown * 10, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-black/30 p-5 border border-white/10 rounded-2xl">
          <h3 className="mb-4 font-bold text-gray-400 text-xs uppercase tracking-wider">Daily Loss Limit</h3>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <span className="font-bold text-white text-2xl">{aiConfig.maxDailyLossPct}%</span>
              <span className="mb-1 text-gray-500 text-xs">Hard Limit</span>
            </div>
            <div className="bg-white/5 rounded-full w-full h-2 overflow-hidden">
              <div 
                className="bg-red-500 h-full transition-all duration-500" 
                style={{ width: `${aiConfig.maxDailyLossPct * 10}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-black/30 p-5 border border-white/10 rounded-2xl">
          <h3 className="mb-4 font-bold text-gray-400 text-xs uppercase tracking-wider">Position Ceiling</h3>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <span className="font-bold text-white text-2xl">{aiConfig.maxPositionSizePct}%</span>
              <span className="mb-1 text-gray-500 text-xs">Per Market</span>
            </div>
            <div className="bg-white/5 rounded-full w-full h-2 overflow-hidden">
              <div 
                className="bg-neon-green h-full transition-all duration-500" 
                style={{ width: `${aiConfig.maxPositionSizePct * 4}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Constraints & Checks */}
      <div className="flex-1 bg-black/30 p-6 border border-white/10 rounded-2xl">
        <h3 className="mb-6 font-bold text-white text-lg">Active Risk Constraints</h3>
        <div className="space-y-4">
          <RiskConstraintItem 
            title="Slippage Mitigation" 
            status="active" 
            description="Adaptive limit orders enabled with 0.02% offset" 
          />
          <RiskConstraintItem 
            title="Liquidity Filter" 
            status="active" 
            description={`Markets require min ${aiConfig.minLiquidity} contracts outstanding`} 
          />
          <RiskConstraintItem 
            title="Spread Enforcement" 
            status="active" 
            description={`Maximum bid-ask spread limited to ${aiConfig.maxSpread * 100}%`} 
          />
          <RiskConstraintItem 
            title="Volatility Brake" 
            status="warning" 
            description="Throttling entries due to high market volatility" 
          />
        </div>
      </div>
    </div>
  );
};

interface RiskConstraintItemProps {
  title: string;
  status: 'active' | 'warning' | 'alert';
  description: string;
}

const RiskConstraintItem: React.FC<RiskConstraintItemProps> = ({ title, status, description }) => {
  return (
    <div className="flex items-start gap-4 bg-white/5 hover:bg-white/10 p-4 border border-white/5 rounded-xl transition-all">
      <div className={`mt-1 p-2 rounded-lg ${
        status === 'active' ? 'bg-neon-green/10 text-neon-green' : 
        status === 'warning' ? 'bg-neon-amber/10 text-neon-amber' : 
        'bg-red-500/10 text-red-500'
      }`}>
        {status === 'active' ? <CheckCircle className="w-5 h-5" /> : 
         status === 'warning' ? <Info className="w-5 h-5" /> : 
         <AlertCircle className="w-5 h-5" />}
      </div>
      <div>
        <h4 className="font-bold text-white text-sm">{title}</h4>
        <p className="text-gray-400 text-xs">{description}</p>
      </div>
    </div>
  );
};

export default RiskView;
