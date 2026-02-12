import React from 'react';
import { useTradingStore } from '../context/TradingContext';
import {
  Settings,
  Volume2,
  VolumeX,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Shield,
  Zap,
  Activity,
  Brain,
  Save,
  Sun,
  Moon,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface SettingsViewProps {
  onCommand?: (cmd: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onCommand }) => {
  const {
    aiConfig,
    updateAIConfig,
    ttsEnabled,
    setTtsEnabled,
    profitSoundEnabled,
    setProfitSoundEnabled,
    clearLogs,
    clearDecisionTree,
    setBotState,
    botState,
    tradingMode,
    setTradingMode,
    theme,
    toggleTheme,
  } = useTradingStore();

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all system data? This cannot be undone.')) {
      clearLogs();
      clearDecisionTree();
      // Add more reset logic if needed
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 h-full overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="flex items-center gap-3 font-bold text-white text-2xl">
          <Settings className="w-6 h-6 text-neon-cyan" />
          System Configuration
        </h1>
        <div className="flex items-center gap-2">
          <span className="bg-white/5 px-3 py-1 rounded text-gray-500 text-xs uppercase">
            Version 4.1.0
          </span>
        </div>
      </div>

      <div className="gap-6 grid grid-cols-1 lg:grid-cols-2">
        {/* Trading Mode & Bot Control */}
        <div className="space-y-6">
          <section className="p-6 border border-white/10 rounded-xl glass-card">
            <h2 className="flex items-center gap-2 mb-6 font-bold text-white text-lg">
              <Zap className="w-5 h-5 text-neon-amber" />
              Trading Mode
            </h2>

            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setTradingMode('paper')}
                className={`flex-1 p-4 rounded-lg border transition-all ${
                  tradingMode === 'paper'
                    ? 'bg-neon-cyan/10 border-neon-cyan text-neon-cyan'
                    : 'bg-black/20 border-white/5 text-gray-400 hover:border-white/20'
                }`}
              >
                <div className="font-bold text-lg">PAPER TRADING</div>
                <div className="opacity-70 text-xs">Simulation Environment</div>
              </button>
              <button
                onClick={() => setTradingMode('live')}
                className={`flex-1 p-4 rounded-lg border transition-all ${
                  tradingMode === 'live'
                    ? 'bg-neon-green/10 border-neon-green text-neon-green'
                    : 'bg-black/20 border-white/5 text-gray-400 hover:border-white/20'
                }`}
              >
                <div className="font-bold text-lg">LIVE TRADING</div>
                <div className="opacity-70 text-xs">Real Capital Execution</div>
              </button>
            </div>

            <div className="flex justify-between items-center bg-white/5 p-4 border border-white/10 rounded-lg">
              <div>
                <div className="font-bold text-white">System Status</div>
                <div className="text-gray-400 text-sm">Current bot execution state</div>
              </div>
              <div className={`px-3 py-1 rounded font-mono font-bold ${
                botState === 'RUNNING' ? 'text-neon-green' : 'text-red-500'
              }`}>
                {botState}
              </div>
            </div>
          </section>

          {/* AI Configuration */}
          <section className="p-6 border border-white/10 rounded-xl glass-card">
            <h2 className="flex items-center gap-2 mb-6 font-bold text-white text-lg">
              <Brain className="w-5 h-5 text-neon-purple" />
              AI Parameters
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block mb-1 text-gray-400 text-sm">Risk Tolerance</label>
                <div className="gap-2 grid grid-cols-3">
                  {(['low', 'medium', 'high'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => updateAIConfig({ riskTolerance: level })}
                      className={`py-2 rounded text-sm font-medium border transition-all ${
                        aiConfig.riskTolerance === level
                          ? 'bg-neon-purple/20 border-neon-purple text-neon-purple'
                          : 'bg-black/20 border-white/5 text-gray-500 hover:bg-white/5'
                      }`}
                    >
                      {level.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="gap-4 grid grid-cols-2">
                <div>
                  <label className="block mb-1 text-gray-400 text-sm">Max Position Size (%)</label>
                  <Input
                    type="number"
                    value={aiConfig.maxPositionSizePct}
                    onChange={(e) => updateAIConfig({ maxPositionSizePct: Number(e.target.value) })}
                    className="font-mono"
                  />
                </div>
                <div>
                  <label className="block mb-1 text-gray-400 text-sm">Max Daily Loss (%)</label>
                  <Input
                    type="number"
                    value={aiConfig.maxDailyLossPct}
                    onChange={(e) => updateAIConfig({ maxDailyLossPct: Number(e.target.value) })}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <span className="text-gray-300 text-sm">Self-Optimization</span>
                <button
                  onClick={() => updateAIConfig({ selfAdjustEnabled: !aiConfig.selfAdjustEnabled })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    aiConfig.selfAdjustEnabled ? 'bg-neon-green' : 'bg-gray-700'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    aiConfig.selfAdjustEnabled ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Interface & System */}
        <div className="space-y-6">
          <section className="p-6 border border-white/10 rounded-xl glass-card">
            <h2 className="flex items-center gap-2 mb-6 font-bold text-white text-lg">
              <Activity className="w-5 h-5 text-neon-cyan" />
              Interface Settings
            </h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white/5 p-4 border border-white/10 rounded-lg">
                <div className="flex items-center gap-3">
                  {ttsEnabled ? (
                    <Volume2 className="w-5 h-5 text-neon-cyan" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-gray-500" />
                  )}
                  <div>
                    <div className="font-medium text-white">Voice Synthesis</div>
                    <div className="text-gray-400 text-xs">AI vocal feedback and alerts</div>
                  </div>
                </div>
                <button
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  className={`px-3 py-1 rounded text-xs font-bold border transition-all ${
                    ttsEnabled
                      ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan'
                      : 'bg-transparent border-gray-600 text-gray-400'
                  }`}
                >
                  {ttsEnabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
              
              <div className="flex justify-between items-center bg-white/5 p-4 border border-white/10 rounded-lg">
                <div className="flex items-center gap-3">
                   <div className="bg-neon-green/10 p-2 rounded-full">
                      <span className="text-lg">💰</span>
                   </div>
                  <div>
                    <div className="font-medium text-white">Profit Chime</div>
                    <div className="text-gray-400 text-xs">Sound effect when profit is realized</div>
                  </div>
                </div>
                <button
                  onClick={() => setProfitSoundEnabled(!profitSoundEnabled)}
                  className={`px-3 py-1 rounded text-xs font-bold border transition-all ${
                    profitSoundEnabled
                      ? 'bg-neon-green/20 border-neon-green text-neon-green'
                      : 'bg-transparent border-gray-600 text-gray-400'
                  }`}
                >
                  {profitSoundEnabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>

              {/* Theme Toggle */}
              <div className="flex justify-between items-center bg-white/5 p-4 border border-white/10 rounded-lg">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon className="w-5 h-5 text-neon-cyan" />
                  ) : (
                    <Sun className="w-5 h-5 text-neon-amber" />
                  )}
                  <div>
                    <div className="font-medium text-white">Theme Mode</div>
                    <div className="text-gray-400 text-xs">Toggle light/dark appearance</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const nextTheme = theme === 'dark' ? 'light' : 'dark';
                    const nextColor = nextTheme === 'light' ? 'var(--primitive-linen)' : 'var(--primitive-umber)';
                    
                    // Create overlay
                    const overlay = document.createElement('div');
                    overlay.classList.add('melt-overlay');
                    overlay.style.backgroundColor = nextColor;
                    document.body.appendChild(overlay);

                    // Switch theme halfway through animation
                    setTimeout(() => {
                      toggleTheme();
                    }, 600);

                    // Cleanup
                    overlay.addEventListener('animationend', () => {
                      overlay.remove();
                    });
                  }}
                  className={`px-3 py-1 rounded text-xs font-bold border transition-all ${
                    theme === 'dark'
                      ? 'bg-black/40 border-gray-600 text-gray-400'
                      : 'bg-white/20 border-white text-white'
                  }`}
                >
                  {theme === 'dark' ? 'DARK' : 'LIGHT'}
                </button>
              </div>
            </div>
          </section>

          <section className="p-6 border border-white/10 rounded-xl glass-card">
            <h2 className="flex items-center gap-2 mb-6 font-bold text-white text-lg">
              <Shield className="w-5 h-5 text-red-500" />
              Danger Zone
            </h2>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="justify-start hover:border-white/30 w-full text-gray-400 hover:text-white"
                onClick={clearLogs}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Clear System Logs
              </Button>
              
              <Button
                variant="outline"
                className="justify-start hover:border-white/30 w-full text-gray-400 hover:text-white"
                onClick={clearDecisionTree}
                leftIcon={<RefreshCw className="w-4 h-4" />}
              >
                Reset Decision Tree
              </Button>

              <div className="bg-white/10 my-4 h-px" />

              <Button
                variant="destructive"
                className="justify-start bg-red-500/10 hover:bg-red-500/20 border-red-500/30 w-full text-red-500"
                onClick={handleReset}
                leftIcon={<AlertTriangle className="w-4 h-4" />}
              >
                Factory Reset System
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
