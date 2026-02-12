import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  TrendingUp,
  TrendingDown,
  Filter,
  RefreshCw,
  Zap,
  Target,
  AlertTriangle,
  DollarSign,
  Activity,
} from 'lucide-react';
import { useTradingStore } from '../context/TradingContext';
import toast from 'react-hot-toast';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { cn } from '../utils/cn';

interface ScanResult {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  openInterest: number;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  strength: number; // 0-100
  category: string;
  timeframe: string;
}

interface ScanFilter {
  minVolume: number;
  minChange: number;
  maxChange: number;
  categories: string[];
  signals: Array<'BUY' | 'SELL' | 'NEUTRAL'>;
}

interface MarketScannerProps {
  onCommand?: (cmd: string) => void;
  className?: string;
}

export const MarketScanner: React.FC<MarketScannerProps> = ({ onCommand, className }) => {
  const { positions } = useTradingStore();
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [autoScan, setAutoScan] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [selectedResult, setSelectedResult] = useState<ScanResult | null>(null);

  const [filters, setFilters] = useState<ScanFilter>({
    minVolume: 100,
    minChange: -10,
    maxChange: 10,
    categories: ['all'],
    signals: ['BUY', 'SELL', 'NEUTRAL'],
  });

  // Generate mock scan results (in real implementation, fetch from API)
  const generateScanResults = (): ScanResult[] => {
    const tickers = [
      'PRES2024-BIDEN', 'PRES2024-TRUMP', 'FED-RATE-UP', 'FED-RATE-DOWN',
      'SPY-ABOVE-500', 'SPY-BELOW-500', 'BTC-100K-YES', 'BTC-100K-NO',
      'RECESSION-2024', 'INFLATION-HIGH', 'JOBS-STRONG', 'GDP-GROWTH',
      'WAR-ESCALATE', 'PEACE-DEAL', 'TECH-RALLY', 'MARKET-CRASH'
    ];

    return tickers.map((ticker) => {
      const changePercent = (Math.random() - 0.5) * 20;
      const price = 50 + changePercent;
      const volume = Math.floor(Math.random() * 10000) + 100;
      const openInterest = Math.floor(Math.random() * 5000) + 50;
      const strength = Math.floor(Math.random() * 100);

      let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
      if (changePercent > 5 && strength > 60) signal = 'BUY';
      else if (changePercent < -5 && strength > 60) signal = 'SELL';

      return {
        ticker,
        price,
        change: price - 50,
        changePercent,
        volume,
        openInterest,
        signal,
        strength,
        category: ticker.includes('PRES') ? 'politics' : 'market',
        timeframe: '5m',
      };
    });
  };

  const runScan = React.useCallback(() => {
    setIsScanning(true);
    toast('Scanning markets...', { icon: '🔍' });

    setTimeout(() => {
      const results = generateScanResults();
      setScanResults(results);
      setLastScanTime(new Date());
      setIsScanning(false);
      toast.success(`Found ${results.length} opportunities`);
    }, 1500);
  }, []);

  // Auto-scan every 30 seconds
  useEffect(() => {
    if (!autoScan) return undefined;

    runScan(); // Initial scan
    const interval = setInterval(runScan, 30000);

    return () => clearInterval(interval);
  }, [autoScan, runScan]);

  // Filter results
  const filteredResults = useMemo(() => {
    return scanResults.filter((result) => {
      if (result.volume < filters.minVolume) return false;
      if (result.changePercent < filters.minChange || result.changePercent > filters.maxChange) return false;
      if (!filters.categories.includes('all') && !filters.categories.includes(result.category)) return false;
      if (!filters.signals.includes(result.signal)) return false;
      return true;
    });
  }, [scanResults, filters]);

  // Sort by signal strength
  const sortedResults = useMemo(() => {
    return [...filteredResults].sort((a, b) => b.strength - a.strength);
  }, [filteredResults]);

  const getSignalColor = (signal: string) => {
    if (signal === 'BUY') return 'text-[var(--color-success)] bg-[var(--color-success)]/10 border-[var(--color-success)]/30';
    if (signal === 'SELL') return 'text-[var(--color-danger)] bg-[var(--color-danger)]/10 border-[var(--color-danger)]/30';
    return 'text-[var(--neutral-400)] bg-[var(--neutral-500)]/10 border-[var(--neutral-500)]/30';
  };

  const getSignalIcon = (signal: string) => {
    if (signal === 'BUY') return TrendingUp;
    if (signal === 'SELL') return TrendingDown;
    return Activity;
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex sm:flex-row flex-col justify-between sm:items-center gap-4 p-6 border-[var(--border-subtle)] border-b">
        <div>
          <h2 className="flex items-center gap-2 font-bold text-[var(--neutral-0)] text-2xl">
            <Search className="w-6 h-6 text-[var(--primary-500)]" />
            Market Scanner
          </h2>
          <p className="mt-1 text-[var(--neutral-400)] text-sm">
            {sortedResults.length} opportunities • {lastScanTime ? `Last scan: ${lastScanTime.toLocaleTimeString()}` : 'Not scanned'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-2 border border-[var(--border-subtle)] rounded-lg transition-colors cursor-pointer">
            <input
              type="checkbox"
              checked={autoScan}
              onChange={(e) => setAutoScan(e.target.checked)}
              className="rounded w-4 h-4 accent-[var(--primary-500)]"
            />
            <span className="text-[var(--neutral-300)] text-sm">Auto-scan</span>
          </label>

          <Button
            onClick={runScan}
            disabled={isScanning}
            variant="neon"
            size="sm"
            isLoading={isScanning}
            leftIcon={!isScanning && <RefreshCw className="w-4 h-4" />}
          >
            {isScanning ? 'Scanning...' : 'Scan Now'}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[var(--bg-card)] p-4 border-[var(--border-subtle)] border-b">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-[var(--neutral-500)]" />
          <span className="font-medium text-[var(--neutral-300)] text-sm">Filters</span>
        </div>

        <div className="gap-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Input
              type="number"
              label="Min Volume"
              value={filters.minVolume}
              onChange={(e) => setFilters({ ...filters, minVolume: Number.parseInt(e.target.value, 10) || 0 })}
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-500 text-xs">Min Change %</label>
            <input
              type="number"
              value={filters.minChange}
              onChange={(e) => setFilters({ ...filters, minChange: parseFloat(e.target.value) || -100 })}
              className="bg-white/5 px-3 py-2 border border-white/10 focus:border-neon-cyan/50 rounded-lg focus:outline-none w-full text-white text-sm"
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-500 text-xs">Max Change %</label>
            <input
              type="number"
              value={filters.maxChange}
              onChange={(e) => setFilters({ ...filters, maxChange: parseFloat(e.target.value) || 100 })}
              className="bg-white/5 px-3 py-2 border border-white/10 focus:border-neon-cyan/50 rounded-lg focus:outline-none w-full text-white text-sm"
            />
          </div>

          <div>
            <label className="block mb-1 text-gray-500 text-xs">Signal</label>
            <select
              value={filters.signals.join(',')}
              onChange={(e) => {
                const values = e.target.value.split(',') as Array<'BUY' | 'SELL' | 'NEUTRAL'>;
                setFilters({ ...filters, signals: values });
              }}
              className="bg-white/5 px-3 py-2 border border-white/10 focus:border-neon-cyan/50 rounded-lg focus:outline-none w-full text-white text-sm"
            >
              <option value="BUY,SELL,NEUTRAL">All Signals</option>
              <option value="BUY">Buy Only</option>
              <option value="SELL">Sell Only</option>
              <option value="BUY,SELL">Buy & Sell</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1 overflow-auto">
        {sortedResults.length === 0 ? (
          <div className="flex flex-col justify-center items-center p-12 h-full text-center">
            <Search className="mb-4 w-16 h-16 text-gray-600" />
            <p className="text-gray-500 text-sm">No scan results</p>
            <p className="mt-1 text-gray-600 text-xs">Click "Scan Now" to find opportunities</p>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {sortedResults.map((result, idx) => {
              const SignalIcon = getSignalIcon(result.signal);
              return (
                <motion.div
                  key={result.ticker}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedResult(result)}
                  className="bg-white/5 hover:bg-white/10 p-4 border border-white/10 rounded-lg hover:scale-[1.01] transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start gap-4">
                    {/* Left: Ticker & Signal */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono font-bold text-white">{result.ticker}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getSignalColor(result.signal)}`}>
                          <div className="flex items-center gap-1">
                            <SignalIcon className="w-3 h-3" />
                            {result.signal}
                          </div>
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-gray-400 text-xs">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          ${result.price.toFixed(2)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          Vol: {result.volume}
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          OI: {result.openInterest}
                        </div>
                      </div>
                    </div>

                    {/* Right: Change & Strength */}
                    <div className="text-right">
                      <div className={`text-lg font-bold ${result.changePercent >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                        {result.changePercent >= 0 ? '+' : ''}
                        {result.changePercent.toFixed(2)}%
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="bg-white/10 rounded-full w-16 h-1.5 overflow-hidden">
                          <motion.div
                            className="bg-neon-cyan h-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${result.strength}%` }}
                            transition={{ duration: 0.5 }}
                          />
                        </div>
                        <span className="text-gray-500 text-xs">{result.strength}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Result Detail Modal */}
      <AnimatePresence>
        {selectedResult && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="z-50 fixed inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setSelectedResult(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="top-1/2 left-1/2 z-51 fixed bg-black/95 shadow-2xl backdrop-blur-xl p-6 border border-white/10 rounded-2xl w-full max-w-lg -translate-x-1/2 -translate-y-1/2"
            >
              <h3 className="mb-4 font-bold text-white text-xl">{selectedResult.ticker}</h3>

              <div className="gap-4 grid grid-cols-2 mb-6">
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="mb-1 text-gray-500 text-xs">Price</div>
                  <div className="font-bold text-white text-2xl">${selectedResult.price.toFixed(2)}</div>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="mb-1 text-gray-500 text-xs">Change</div>
                  <div className={`text-2xl font-bold ${selectedResult.changePercent >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                    {selectedResult.changePercent >= 0 ? '+' : ''}
                    {selectedResult.changePercent.toFixed(2)}%
                  </div>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="mb-1 text-gray-500 text-xs">Volume</div>
                  <div className="font-bold text-white text-lg">{selectedResult.volume}</div>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <div className="mb-1 text-gray-500 text-xs">Signal Strength</div>
                  <div className="font-bold text-neon-cyan text-lg">{selectedResult.strength}/100</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    toast.success(`Opening position for ${selectedResult.ticker}`);
                    setSelectedResult(null);
                  }}
                  className="flex-1 bg-neon-cyan/10 hover:bg-neon-cyan/20 px-4 py-2 border border-neon-cyan/30 rounded-lg font-medium text-neon-cyan transition-colors"
                >
                  Trade Now
                </button>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="hover:bg-white/10 px-4 py-2 rounded-lg text-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
