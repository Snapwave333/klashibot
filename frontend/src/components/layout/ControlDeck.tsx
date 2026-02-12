import React from 'react';
import { Play, Pause, Square, Volume2, VolumeX } from 'lucide-react';
import { useTradingStore } from '../../context/TradingContext';
import { useAudio } from '../../context/AudioContext';
import { PipelineVisualizer } from '../visualizations/PipelineVisualizer';
import { cn } from '../../utils/cn';

type ControlDeckProps = {
  onCommand?: (cmd: string) => void;
};

export const ControlDeck: React.FC<ControlDeckProps> = ({ onCommand }) => {
  const { botState, health } = useTradingStore();
  const { volume, setVolume, isMuted, setIsMuted } = useAudio();

  return (
    <div className="z-[90] flex flex-shrink-0 justify-between items-center bg-[#0a0a0f]/60 backdrop-blur-md mx-4 mb-2 px-4 border border-white/5 rounded-xl h-14">
      
      {/* LEFT: Bot Controls */}
      <div className="flex items-center gap-3">
        <span className="mr-2 font-mono font-bold text-[10px] text-gray-500 uppercase tracking-widest">Neural Engine</span>
        <div className="flex items-center gap-1 bg-black/40 p-1 border border-white/5 rounded-lg">
            <button
                onClick={() => onCommand?.('START')}
                disabled={botState === 'RUNNING'}
                className={cn(
                    "p-1.5 rounded-md transition-all",
                    botState === 'RUNNING' 
                        ? "bg-neon-green/20 text-neon-green shadow-[0_0_10px_rgba(0,255,136,0.2)]" 
                        : "text-gray-400 hover:text-white hover:bg-white/10"
                )}
                title="Start Agent"
            >
                <Play className="fill-current w-3.5 h-3.5" />
            </button>
            <button
                onClick={() => onCommand?.('PAUSE')}
                disabled={botState !== 'RUNNING'}
                className={cn(
                    "p-1.5 rounded-md transition-all",
                    botState === 'PAUSED'
                        ? "bg-yellow-500/20 text-yellow-500"
                        : "text-gray-400 hover:text-white hover:bg-white/10"
                )}
                title="Pause Agent"
            >
                <Pause className="fill-current w-3.5 h-3.5" />
            </button>
            <button
                onClick={() => onCommand?.('STOP')}
                className="hover:bg-red-500/20 p-1.5 rounded-md text-gray-400 hover:text-red-500 transition-all"
                title="Stop Agent"
            >
                <Square className="fill-current w-3.5 h-3.5" />
            </button>
        </div>
        
        {/* Status Text Display */}
        <div className="flex items-center bg-black/20 px-3 py-1 border border-white/5 rounded">
             <div className={cn("mr-2 rounded-full w-1.5 h-1.5", 
                botState === 'RUNNING' ? "bg-neon-green animate-pulse" : 
                botState === 'PAUSED' ? "bg-yellow-500" : "bg-red-500"
             )} />
             <span className="font-mono text-gray-300 text-xs">{botState}</span>
        </div>
      </div>

      {/* CENTER: Pipeline Indicators */}
      <div className="flex flex-1 justify-center">
         <PipelineVisualizer health={health} small={true} className="!bg-transparent !shadow-none !p-0 !border-none" />
      </div>

      {/* RIGHT: Audio Controls */}
      <div className="flex items-center gap-3">
        <span className="mr-2 font-mono font-bold text-[10px] text-gray-500 uppercase tracking-widest">Voice Synthesis</span>
        <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 border border-white/5 rounded-full">
            <button 
                onClick={() => setIsMuted(!isMuted)}
                className={cn("hover:bg-white/10 p-1 rounded-full transition-colors", isMuted ? "text-red-400" : "text-neon-cyan")}
            >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>
            <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value={isMuted ? 0 : volume} 
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-1 accent-neon-cyan cursor-pointer" 
            />
        </div>
      </div>

    </div>
  );
};
