import { Settings, Brain, LayoutDashboard, ScrollText, AlertOctagon } from 'lucide-react';
import { useTradingStore } from '../../context/TradingContext';
import { Button } from '../ui/Button';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { AlertDialog } from '../AlertDialog';
import { useState } from 'react';
import auraLogo from '../../assets/aura_logo.png';


type TopBarProps = {
  onCommand?: (cmd: string) => void;
  onOpenSettings: () => void;
};

export const TopBar: React.FC<TopBarProps> = ({ onCommand, onOpenSettings }) => {
  const { setCurrentView, currentView, botState, health } = useTradingStore();

  const navigate = useNavigate();
  const location = useLocation();
  const [showKillConfirm, setShowKillConfirm] = useState(false);

  return (
    <header className="z-[100] relative flex flex-shrink-0 justify-between items-center bg-[#0a0a0f]/90 shadow-2xl backdrop-blur-xl px-4 border border-white/10 rounded-2xl h-20">
      
      {/* LEFT GROUP: Brand & Bot Controls */}
      <div className="flex items-center gap-6">
        {/* Brand */}
        <button
          className="group flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer"
          onClick={() => navigate('/')}
        >
          <div className="relative flex justify-center items-center w-10 h-10">
             <div className="absolute inset-0 bg-orange-500/20 opacity-50 group-hover:opacity-100 blur-lg rounded-full transition-opacity" />
             <img
              src={auraLogo}
              alt="Aura"
              className="relative drop-shadow-[0_0_10px_rgba(249,115,22,0.5)] w-full h-full object-contain"
              onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement!.innerText = '💠';
              }}
            />
          </div>
          <div className="flex flex-col">
            <h1 className="font-logo text-orange-400 text-2xl leading-none tracking-[0.2em]">AURA</h1>
            <span className="font-mono text-[9px] text-gray-500 uppercase tracking-widest">Neural Interface</span>
          </div>
        </button>


      </div>

      {/* CENTER GROUP: Navigation Tabs */}
      <nav className="top-1/2 left-1/2 absolute flex items-center gap-1 bg-white/5 p-1 border border-white/5 rounded-full -translate-x-1/2 -translate-y-1/2">
        {[
          { id: 'ai-brain', label: 'AI MIND', icon: Brain, path: '/ai-brain' },
          { id: 'paper-trading', label: 'PORTFOLIO', icon: LayoutDashboard, path: '/portfolio' },
          { id: 'logs', label: 'NEURAL LOGS', icon: ScrollText, path: '/logs' },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setCurrentView(item.id);
                navigate(item.path);
              }}
              className={cn(
                "relative flex items-center gap-2 px-5 py-2 rounded-full font-medium text-xs tracking-wide transition-all duration-300",
                isActive
                  ? "text-black bg-gradient-to-r from-orange-400 to-amber-300 shadow-[0_0_20px_rgba(251,146,60,0.3)]"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", isActive ? "stroke-[2.5px]" : "stroke-2")} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* RIGHT GROUP: Pipeline & System Controls */}
      <div className="flex justify-end items-center gap-4">
        

        
        {/* Kill Switch */}
        <button
          onClick={() => setShowKillConfirm(true)}
          className="group relative flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 border border-red-500/30 hover:border-red-500/50 rounded-lg overflow-hidden transition-all"
        >
          <div className="absolute inset-0 bg-red-500/20 transition-transform translate-y-full group-hover:translate-y-0 duration-300" />
          <AlertOctagon className="z-10 relative w-3.5 h-3.5 text-red-400 group-hover:text-red-300" />
          <span className="z-10 relative font-bold text-[10px] text-red-400 group-hover:text-red-300 tracking-wider">KILL</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="group relative p-2 rounded-xl overflow-hidden text-gray-400 hover:text-white"
        >
          <div className="absolute inset-0 bg-white/5 rounded-xl scale-0 group-hover:scale-100 transition-transform" />
          <Settings className="z-10 relative w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
        </button>
      </div>

      <AlertDialog
        open={showKillConfirm}
        onOpenChange={setShowKillConfirm}
        title="EMERGENCY STOP"
        description="Are you sure you want to trigger the Kill Switch? This will immediately attempt to close all open positions and halt the trading engine."
        actionLabel="EXECUTE KILL SWITCH"
        onAction={() => {
            if (onCommand) onCommand('KILL');
            setShowKillConfirm(false);
        }}
        variant="danger"
      />
    </header>
  );
};
