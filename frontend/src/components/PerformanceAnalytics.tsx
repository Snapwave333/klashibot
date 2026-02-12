import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Target,
  Zap,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { useTradingStore } from '../context/TradingContext';
import { format } from 'date-fns';

interface PerformanceMetric {
  label: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}

export const PerformanceAnalytics: React.FC = () => {
  const { portfolio, positions } = useTradingStore();

  // Calculate performance metrics
  const metrics = useMemo<PerformanceMetric[]>(() => {
    const totalValue = portfolio.total_equity || 0;
    const dailyPnL = portfolio.daily_pnl || 0;
    const dailyReturn = portfolio.daily_pnl_pct || 0;
    const winRate = portfolio.win_rate || 0;
    const sharpeRatio = portfolio.sharpe_ratio || 0;
    const maxDrawdown = portfolio.max_drawdown || 0;

    return [
      {
        label: 'Total Equity',
        value: `$${(totalValue / 100).toFixed(2)}`,
        change: dailyReturn,
        icon: DollarSign,
        color: 'neon-cyan',
        trend: dailyReturn > 0 ? 'up' : dailyReturn < 0 ? 'down' : 'neutral',
      },
      {
        label: 'Daily P&L',
        value: `$${(dailyPnL / 100).toFixed(2)}`,
        change: dailyReturn,
        icon: dailyPnL >= 0 ? TrendingUp : TrendingDown,
        color: dailyPnL >= 0 ? 'neon-green' : 'neon-red',
        trend: dailyPnL >= 0 ? 'up' : 'down',
      },
      {
        label: 'Win Rate',
        value: `${(winRate * 100).toFixed(1)}%`,
        icon: Target,
        color: winRate > 0.6 ? 'neon-green' : winRate > 0.5 ? 'neon-amber' : 'neon-red',
        trend: winRate > 0.55 ? 'up' : 'down',
      },
      {
        label: 'Sharpe Ratio',
        value: sharpeRatio.toFixed(2),
        icon: Activity,
        color: sharpeRatio > 1.5 ? 'neon-green' : sharpeRatio > 1.0 ? 'neon-amber' : 'neon-red',
        trend: sharpeRatio > 1.0 ? 'up' : 'down',
      },
      {
        label: 'Max Drawdown',
        value: `${maxDrawdown.toFixed(1)}%`,
        icon: TrendingDown,
        color: maxDrawdown < 5 ? 'neon-green' : maxDrawdown < 10 ? 'neon-amber' : 'neon-red',
        trend: maxDrawdown < 7 ? 'up' : 'down',
      },
      {
        label: 'Active Positions',
        value: positions.length,
        icon: Zap,
        color: 'neon-cyan',
        trend: 'neutral',
      },
    ];
  }, [portfolio, positions]);

  // Generate P&L chart data (mock data - replace with real historical data)
  const pnlChartData = useMemo(() => {
    const data = [];
    let cumulative = 0;
    for (let i = 0; i < 30; i++) {
      const change = (Math.random() - 0.45) * 5; // Slight upward bias
      cumulative += change;
      data.push({
        day: i + 1,
        pnl: cumulative,
        date: format(new Date(Date.now() - (29 - i) * 86400000), 'MMM dd'),
      });
    }
    return data;
  }, []);

  // Strategy distribution data
  const strategyData = useMemo(() => {
    return [
      { name: 'Arbitrage', value: 35, color: '#00ffff' },
      { name: 'Momentum', value: 25, color: '#00ff88' },
      { name: 'Mean Reversion', value: 20, color: '#ffaa00' },
      { name: 'Spread Trading', value: 15, color: '#ff3366' },
      { name: 'Other', value: 5, color: '#a855f7' },
    ];
  }, []);

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          const colorClass = `text-${metric.color}`;
          const bgColorClass = `bg-${metric.color}/10`;
          const borderColorClass = `border-${metric.color}/30`;

          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`bg-black/40 backdrop-blur-xl border ${borderColorClass} rounded-xl p-4 hover:border-${metric.color}/50 transition-all`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${bgColorClass}`}>
                  <Icon className={`w-5 h-5 ${colorClass}`} />
                </div>
                {metric.trend && metric.trend !== 'neutral' && (
                  <div
                    className={`flex items-center gap-1 text-xs font-medium ${
                      metric.trend === 'up' ? 'text-neon-green' : 'text-neon-red'
                    }`}
                  >
                    {metric.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {metric.change !== undefined && `${Math.abs(metric.change).toFixed(2)}%`}
                  </div>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500 uppercase tracking-wider">{metric.label}</p>
                <p className={`text-2xl font-bold ${colorClass}`}>{metric.value}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* P&L Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-neon-cyan" />
              <h3 className="text-lg font-bold text-white">P&L Trend (30 Days)</h3>
            </div>
            <div className="text-xs text-gray-500">Last updated: {format(new Date(), 'HH:mm:ss')}</div>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={pnlChartData}>
              <defs>
                <linearGradient id="pnlGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ffff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00ffff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="date" stroke="#666" style={{ fontSize: '10px' }} />
              <YAxis stroke="#666" style={{ fontSize: '10px' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#000000dd',
                  border: '1px solid #ffffff20',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#ffffff' }}
              />
              <Area type="monotone" dataKey="pnl" stroke="#00ffff" fill="url(#pnlGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Strategy Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-neon-green" />
            <h3 className="text-lg font-bold text-white">Strategy Distribution</h3>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <RePieChart>
              <Pie
                data={strategyData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
              >
                {strategyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#000000dd',
                  border: '1px solid #ffffff20',
                  borderRadius: '8px',
                }}
              />
            </RePieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            {strategyData.map((strategy) => (
              <div key={strategy.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: strategy.color }} />
                <span className="text-xs text-gray-400">
                  {strategy.name} ({strategy.value}%)
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Performance Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6"
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-neon-amber" />
          Performance Insights
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Avg Trade Duration</p>
            <p className="text-xl font-bold text-white">2.5 hours</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Best Strategy</p>
            <p className="text-xl font-bold text-neon-green">Arbitrage</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Profit Factor</p>
            <p className="text-xl font-bold text-neon-cyan">1.85</p>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Total Trades</p>
            <p className="text-xl font-bold text-white">{positions.length * 10}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
