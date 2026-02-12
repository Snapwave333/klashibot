import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  FileText,
  FileSpreadsheet,
  FileJson,
  Image,
  Calendar,
  Filter,
  CheckCircle,
  Loader,
} from 'lucide-react';
import { useTradingStore } from '../context/TradingContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

type ExportFormat = 'csv' | 'json' | 'pdf' | 'png';
type ExportData = 'positions' | 'trades' | 'logs' | 'performance' | 'full';

interface ExportReportingProps {
  className?: string;
}

export const ExportReporting: React.FC<ExportReportingProps> = ({ className }) => {
  const { positions, logs, portfolio } = useTradingStore();
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [selectedData, setSelectedData] = useState<ExportData>('full');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: format(new Date(Date.now() - 30 * 24 * 3600000), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  });
  const [isExporting, setIsExporting] = useState(false);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeMetrics, setIncludeMetrics] = useState(true);

  const exportFormats: Array<{ id: ExportFormat; name: string; icon: React.ElementType }> = [
    { id: 'csv', name: 'CSV', icon: FileSpreadsheet },
    { id: 'json', name: 'JSON', icon: FileJson },
    { id: 'pdf', name: 'PDF Report', icon: FileText },
    { id: 'png', name: 'PNG Image', icon: Image },
  ];

  const dataTypes: Array<{ id: ExportData; name: string; description: string }> = [
    { id: 'positions', name: 'Current Positions', description: 'Active trading positions' },
    { id: 'trades', name: 'Trade History', description: 'Historical trades and P&L' },
    { id: 'logs', name: 'System Logs', description: 'Bot activity logs' },
    { id: 'performance', name: 'Performance Metrics', description: 'Portfolio analytics' },
    { id: 'full', name: 'Full Report', description: 'Complete trading data' },
  ];

  const handleExport = async () => {
    setIsExporting(true);

    try {
      let data: any = {};
      let content: string = '';
      let filename: string = '';

      // Gather data based on selection
      if (selectedData === 'positions' || selectedData === 'full') {
        data.positions = positions.map((p) => ({
          ticker: p.ticker,
          position: p.quantity,
          avgPrice: (p.entry_price || 0) / 100, // Corrected from average_price
          marketPrice: (p.current_price || 0) / 100, // Corrected from market_price if needed, checking context
          pnl: (p.unrealized_pnl || 0) / 100, // Corrected from total_pnl? Use unrealized_pnl
          exposure: (p.quantity * p.current_price || 0) / 100, // derived or property?
        }));
      }

      if (selectedData === 'logs' || selectedData === 'full') {
        data.logs = logs.map((l) => ({
          timestamp: l.timestamp,
          level: l.level,
          message: l.message,
        }));
      }

      if (selectedData === 'performance' || selectedData === 'full') {
        data.performance = {
          totalEquity: (portfolio.total_equity || 0) / 100,
          dailyPnL: (portfolio.daily_pnl || 0) / 100,
          winRate: (portfolio.win_rate || 0) * 100,
          sharpeRatio: portfolio.sharpe_ratio || 0,
          totalTrades: 0, // Not available in Portfolio type
          avgTradesPerDay: 0, // Not available in Portfolio type
          exportDate: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
        };
      }

      // Format data based on export format
      if (selectedFormat === 'csv') {
        if (selectedData === 'positions') {
          content = [
            ['Ticker', 'Position', 'Avg Price', 'Market Price', 'P&L', 'Exposure'],
            ...data.positions.map((p: any) => [
              p.ticker,
              p.position,
              p.avgPrice.toFixed(2),
              p.marketPrice.toFixed(2),
              p.pnl.toFixed(2),
              p.exposure.toFixed(2),
            ]),
          ]
            .map((row) => row.join(','))
            .join('\n');
        } else if (selectedData === 'logs') {
          content = [
            ['Timestamp', 'Level', 'Message'],
            ...data.logs.map((l: any) => [l.timestamp, l.level, `"${l.message}"`]),
          ]
            .map((row) => row.join(','))
            .join('\n');
        } else {
          content = JSON.stringify(data, null, 2);
        }
        filename = `kalashi-${selectedData}-${format(new Date(), 'yyyyMMdd-HHmmss')}.csv`;
      } else if (selectedFormat === 'json') {
        content = JSON.stringify(data, null, 2);
        filename = `kalashi-${selectedData}-${format(new Date(), 'yyyyMMdd-HHmmss')}.json`;
      } else if (selectedFormat === 'pdf') {
        // In real implementation, generate PDF using jsPDF or similar
        content = generateHTMLReport(data);
        filename = `kalashi-report-${format(new Date(), 'yyyyMMdd-HHmmss')}.html`;
        toast('PDF export requires backend processing. Downloading HTML preview instead.', {
          icon: '⚠️',
        });
      } else if (selectedFormat === 'png') {
        toast('PNG export requires html2canvas. Use browser screenshot for now.', { icon: '📸' });
        setIsExporting(false);
        return;
      }

      // Download file
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`Exported ${selectedData} as ${selectedFormat.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.');
    } finally {
      setTimeout(() => setIsExporting(false), 1000);
    }
  };

  const generateHTMLReport = (data: any): string => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Kalashi Trading Report</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0a0a0f; color: #fff; padding: 40px; }
    .header { text-align: center; margin-bottom: 40px; }
    .header h1 { color: #00d4ff; font-size: 32px; margin: 0; }
    .header p { color: #9ca3af; margin-top: 8px; }
    .section { background: #141419; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin-bottom: 24px; }
    .section h2 { color: #00d4ff; font-size: 20px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    th { color: #9ca3af; font-weight: 600; text-transform: uppercase; font-size: 12px; }
    .metric { display: inline-block; margin: 8px 16px 8px 0; }
    .metric-label { color: #9ca3af; font-size: 12px; }
    .metric-value { color: #fff; font-size: 24px; font-weight: 700; }
    .positive { color: #00ff88; }
    .negative { color: #ff3366; }
  </style>
</head>
<body>
  <div class="header">
    <h1>⚡ Kalashi Trading Report</h1>
    <p>Generated on ${format(new Date(), 'MMMM dd, yyyy • HH:mm:ss')}</p>
  </div>

  ${
    data.performance
      ? `
  <div class="section">
    <h2>📊 Performance Summary</h2>
    <div class="metric">
      <div class="metric-label">Total Equity</div>
      <div class="metric-value">$${data.performance.totalEquity.toFixed(2)}</div>
    </div>
    <div class="metric">
      <div class="metric-label">Daily P&L</div>
      <div class="metric-value ${data.performance.dailyPnL >= 0 ? 'positive' : 'negative'}">
        $${data.performance.dailyPnL.toFixed(2)}
      </div>
    </div>
    <div class="metric">
      <div class="metric-label">Win Rate</div>
      <div class="metric-value">${data.performance.winRate.toFixed(1)}%</div>
    </div>
    <div class="metric">
      <div class="metric-label">Sharpe Ratio</div>
      <div class="metric-value">${data.performance.sharpeRatio.toFixed(2)}</div>
    </div>
  </div>
  `
      : ''
  }

  ${
    data.positions
      ? `
  <div class="section">
    <h2>📈 Current Positions</h2>
    <table>
      <thead>
        <tr>
          <th>Ticker</th>
          <th>Position</th>
          <th>Avg Price</th>
          <th>Market Price</th>
          <th>P&L</th>
          <th>Exposure</th>
        </tr>
      </thead>
      <tbody>
        ${data.positions
          .map(
            (p: any) => `
          <tr>
            <td><strong>${p.ticker}</strong></td>
            <td>${p.position}</td>
            <td>$${p.avgPrice.toFixed(2)}</td>
            <td>$${p.marketPrice.toFixed(2)}</td>
            <td class="${p.pnl >= 0 ? 'positive' : 'negative'}">$${p.pnl.toFixed(2)}</td>
            <td>$${p.exposure.toFixed(2)}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </div>
  `
      : ''
  }

  ${
    data.logs
      ? `
  <div class="section">
    <h2>📝 Recent Logs (Last 20)</h2>
    <table>
      <thead>
        <tr>
          <th>Time</th>
          <th>Level</th>
          <th>Message</th>
        </tr>
      </thead>
      <tbody>
        ${data.logs
          .slice(0, 20)
          .map(
            (l: any) => `
          <tr>
            <td>${format(new Date(l.timestamp), 'HH:mm:ss')}</td>
            <td><span style="color: ${
              l.level === 'ERROR' ? '#ff3366' : l.level === 'WARNING' ? '#ffaa00' : '#00d4ff'
            }">${l.level}</span></td>
            <td>${l.message}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </div>
  `
      : ''
  }

  <div style="text-align: center; margin-top: 40px; color: #6b7280; font-size: 12px;">
    <p>Generated by Kalashi AI Trading System</p>
  </div>
</body>
</html>
    `;
  };

  return (
    <div className={`flex flex-col bg-black/20 rounded-2xl border border-white/10 p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="flex items-center gap-2 font-bold text-white text-2xl">
          <Download className="w-6 h-6 text-neon-cyan" />
          Export & Reporting
        </h2>
        <p className="mt-1 text-gray-400 text-sm">
          Export your trading data in various formats
        </p>
      </div>

      {/* Export Format Selection */}
      <div className="mb-6">
        <label className="block mb-3 font-medium text-gray-300 text-sm">Export Format</label>
        <div className="gap-3 grid grid-cols-2 sm:grid-cols-4">
          {exportFormats.map((format) => {
            const Icon = format.icon;
            return (
              <button
                key={format.id}
                onClick={() => setSelectedFormat(format.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all hover:scale-105 ${
                  selectedFormat === format.id
                    ? 'bg-neon-cyan/10 border-neon-cyan/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <Icon
                  className={`w-6 h-6 ${
                    selectedFormat === format.id ? 'text-neon-cyan' : 'text-gray-400'
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    selectedFormat === format.id ? 'text-neon-cyan' : 'text-gray-300'
                  }`}
                >
                  {format.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Data Type Selection */}
      <div className="mb-6">
        <label className="block mb-3 font-medium text-gray-300 text-sm">Data to Export</label>
        <div className="space-y-2">
          {dataTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedData(type.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all hover:scale-[1.01] ${
                selectedData === type.id
                  ? 'bg-neon-cyan/10 border-neon-cyan/50'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="text-left">
                <div
                  className={`text-sm font-medium ${
                    selectedData === type.id ? 'text-neon-cyan' : 'text-white'
                  }`}
                >
                  {type.name}
                </div>
                <div className="text-gray-500 text-xs">{type.description}</div>
              </div>
              {selectedData === type.id && <CheckCircle className="w-5 h-5 text-neon-cyan" />}
            </button>
          ))}
        </div>
      </div>

      {/* Date Range (for trades/logs) */}
      {(selectedData === 'trades' || selectedData === 'logs' || selectedData === 'full') && (
        <div className="mb-6">
          <label className="block mb-3 font-medium text-gray-300 text-sm">Date Range</label>
          <div className="gap-3 grid grid-cols-2">
            <div>
              <label className="block mb-1 text-gray-500 text-xs">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="bg-white/5 px-3 py-2 border border-white/10 focus:border-neon-cyan/50 rounded-lg focus:outline-none w-full text-white"
              />
            </div>
            <div>
              <label className="block mb-1 text-gray-500 text-xs">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="bg-white/5 px-3 py-2 border border-white/10 focus:border-neon-cyan/50 rounded-lg focus:outline-none w-full text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* Options (for PDF/PNG) */}
      {(selectedFormat === 'pdf' || selectedFormat === 'png') && (
        <div className="mb-6">
          <label className="block mb-3 font-medium text-gray-300 text-sm">Report Options</label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCharts}
                onChange={(e) => setIncludeCharts(e.target.checked)}
                className="bg-white/5 border-white/10 rounded focus:ring-neon-cyan w-4 h-4 text-neon-cyan"
              />
              <span className="text-gray-300 text-sm">Include charts and graphs</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeMetrics}
                onChange={(e) => setIncludeMetrics(e.target.checked)}
                className="bg-white/5 border-white/10 rounded focus:ring-neon-cyan w-4 h-4 text-neon-cyan"
              />
              <span className="text-gray-300 text-sm">Include performance metrics</span>
            </label>
          </div>
        </div>
      )}

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="flex justify-center items-center gap-2 bg-neon-cyan/10 hover:bg-neon-cyan/20 disabled:opacity-50 px-6 py-3 border border-neon-cyan/30 hover:border-neon-cyan/50 rounded-lg w-full font-medium text-neon-cyan hover:scale-[1.02] transition-all disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <>
            <Loader className="w-5 h-5 animate-spin" />
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            <span>Export {selectedFormat.toUpperCase()}</span>
          </>
        )}
      </button>

      {/* Info Text */}
      <p className="mt-4 text-gray-500 text-xs text-center">
        Exports are saved to your Downloads folder
      </p>
    </div>
  );
};
