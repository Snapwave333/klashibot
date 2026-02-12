import React from 'react';
import { motion } from 'framer-motion';
import { Server, Brain, Monitor, X, Check, Database, Globe } from 'lucide-react';
import { cn } from '../../utils/cn';
import { HealthMetrics } from '../../context/TradingContext';

type PipelineVisualizerProps = {
  health?: HealthMetrics;
  className?: string;
  small?: boolean;
};

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({
  health,
  className = '',
  small = false,
}) => {
  if (!health) return null;

  const { ai_agent_status, database, mcp, websocket_connected } = health;

  const isAiActive = ai_agent_status === 'ACTIVE';
  const isAiError = ai_agent_status === 'ERROR';
  const isAiStarting = ai_agent_status === 'WARMING_UP';

  // Helper to render connection line - improved visibility
  const Connection = ({ active }: { active: boolean }) => (
    <div className={cn(
        "flex flex-1 justify-center items-center",
        small ? "min-w-[14px] max-w-[24px]" : "min-w-[28px] max-w-[48px]"
    )}>
      {active ? (
        <div className={cn("relative bg-gray-700/60 rounded-full w-full overflow-hidden", small ? "h-[2px]" : "h-[3px]")}>
          <motion.div
            className="top-0 left-0 absolute bg-orange-500 w-1/2 h-full"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />
        </div>
      ) : (
        <div className="flex justify-center items-center bg-red-500/40 w-full h-[3px]">
          <X className="w-3 h-3 text-red-500" />
        </div>
      )}
    </div>
  );

  // Helper for Status Badge
  const StatusBadge = ({ status }: { status: boolean | 'ok' | 'error' | 'n/a' }) => {
    if (status === true || status === 'ok') {
        return (
            <div className="-top-1 -right-1 absolute bg-neon-green shadow-[0_0_5px_rgba(0,255,136,0.3)] p-0.5 border border-black rounded-full">
                <Check className="w-2 h-2 text-black" />
            </div>
        );
    }
    return (
        <div className="-top-1 -right-1 absolute bg-red-500 p-0.5 border border-black rounded-full">
            <X className="w-3 h-3 text-white" />
        </div>
    );
  };

  return (
    <div className={`flex items-center gap-4 bg-[#1C1917] px-6 py-3 border-2 border-[#5D4037] rounded-xl shadow-lg relative z-20 ${className}`}>
      
      {/* CRT Scanline Overlay for this specific panel */}
      <div className="z-0 absolute inset-0 bg-[length:100%_2px,3px_100%] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] pointer-events-none" />

      {/* Node 1: Backend */}
      <div className={cn("group z-10 relative flex flex-col items-center gap-2 cursor-help", small ? "w-[40px]" : "w-[60px]")}>
         <div className={cn(
            "rounded border-2 transition-all duration-300 shadow-md",
            small ? "p-1.5" : "p-2.5",
            websocket_connected
            ? 'bg-[#3E2723] border-[#E65100] text-[#FFB74D] shadow-[#E65100]/20'
            : 'bg-[#2A2422] border-[#3E2723] text-[#5D4037]'
         )}>
           <Server className={small ? "w-3 h-3" : "w-5 h-5"} />
         </div>
         {!small && <span className="font-mono font-bold text-[#8D6E63] text-[10px] uppercase tracking-widest">Backend</span>}
         <StatusBadge status={websocket_connected} />

          <div className="top-full left-1/2 z-50 absolute bg-[#2D2420] opacity-0 group-hover:opacity-100 shadow-xl mt-2 px-3 py-2 border border-[#5D4037] rounded w-max text-[#D4C4A8] text-xs transition-opacity -translate-x-1/2 pointer-events-none transform">
            <div className="mb-1 font-bold text-[#FFB74D]">Trading Engine</div>
            <div>WS Connected: {websocket_connected ? 'YES' : 'NO'}</div>
            <div>Latency: {health?.api_latency_ms || 0}ms</div>
         </div>
      </div>

      <Connection active={websocket_connected} />

      {/* Node 2: MCP / Kalshi */}
      <div className={cn("group z-10 relative flex flex-col items-center gap-2 cursor-help", small ? "w-[40px]" : "w-[60px]")}>
         <div className={cn(
            "rounded border-2 transition-all duration-300 shadow-md",
            small ? "p-1.5" : "p-2.5",
            mcp?.status === 'ok'
            ? 'bg-[#1B5E20] border-[#43A047] text-[#A5D6A7] shadow-[#43A047]/20' // Forest Green
            : 'bg-[#2A2422] border-[#3E2723] text-[#5D4037]'
         )}>
           <Globe className={small ? "w-3 h-3" : "w-5 h-5"} />
         </div>
         {!small && <span className="font-mono font-bold text-[#8D6E63] text-[10px] uppercase tracking-widest">MCP</span>}
         <StatusBadge status={mcp?.status || 'error'} />

         <div className="top-full left-1/2 z-50 absolute bg-[#2D2420] opacity-0 group-hover:opacity-100 shadow-xl mt-2 px-3 py-2 border border-[#5D4037] rounded w-max text-[#D4C4A8] text-xs transition-opacity -translate-x-1/2 pointer-events-none transform">
            <div className="mb-1 font-bold text-[#A5D6A7]">MCP / Kalshi API</div>
            <div>Status: {mcp?.status === 'ok' ? 'Connected' : 'Disconnected'}</div>
            <div>Latency: {mcp?.latency}ms</div>
            <div className="text-[#8D6E63] italic">{mcp?.message}</div>
         </div>
      </div>

      <Connection active={mcp?.status === 'ok'} />

      {/* Node 3: Database */}
      <div className={cn("group z-10 relative flex flex-col items-center gap-2 cursor-help", small ? "w-[40px]" : "w-[60px]")}>
         <div className={cn(
            "rounded border-2 transition-all duration-300 shadow-md",
            small ? "p-1.5" : "p-2.5",
            database?.status === 'ok'
            ? 'bg-[#F57F17] border-[#FFCA28] text-[#FFF59D] shadow-[#FFCA28]/20' // Gold
            : 'bg-[#2A2422] border-[#3E2723] text-[#5D4037]'
         )}>
           <Database className={small ? "w-3 h-3" : "w-5 h-5"} />
         </div>
         {!small && <span className="font-mono font-bold text-[#8D6E63] text-[10px] uppercase tracking-widest">DB</span>}
         <StatusBadge status={database?.status || 'n/a'} />

         <div className="top-full left-1/2 z-50 absolute bg-[#2D2420] opacity-0 group-hover:opacity-100 shadow-xl mt-2 px-3 py-2 border border-[#5D4037] rounded w-max text-[#D4C4A8] text-xs transition-opacity -translate-x-1/2 pointer-events-none transform">
            <div className="mb-1 font-bold text-[#FFF59D]">Redis / Cache</div>
            <div>Status: {database?.status.toUpperCase()}</div>
            <div>Latency: {database?.latency}ms</div>
            <div className="text-[#8D6E63] italic">{database?.message}</div>
         </div>
      </div>

      <Connection active={database?.status === 'ok'} />

      {/* Node 4: AI Mind */}
      <div className={cn("z-10 relative flex flex-col items-center gap-1", small ? "w-[40px]" : "w-[60px]")}>
          <div className={cn(
            "shadow-md border-2 rounded transition-all duration-300",
            small ? "p-1.5" : "p-2.5",
            isAiActive && 'bg-[#BF360C] border-[#FF5722] text-[#FFAB91] shadow-[#FF5722]/20 animate-pulse', // Deep Orange
            isAiStarting && 'bg-[#E65100] border-[#FF9800] text-[#FFE0B2] animate-pulse',
            isAiError && 'bg-[#B71C1C] border-[#F44336] text-[#FFCDD2]',
            !isAiActive && !isAiStarting && !isAiError && 'bg-[#2A2422] border-[#3E2723] text-[#5D4037]'
          )}>
            <Brain className={cn(small ? "w-3 h-3" : "w-5 h-5", isAiActive ? 'animate-pulse' : '')} />
         </div>
          {!small && <span className="font-mono font-bold text-[#8D6E63] text-[10px] uppercase tracking-widest">AI</span>}
          <StatusBadge status={!isAiError && !isAiStarting && ai_agent_status !== 'STOPPED'} />
      </div>

      <Connection active={isAiActive || isAiStarting || ai_agent_status === 'STANDBY' || ai_agent_status === 'PAUSED'} />

      {/* Node 5: UI */}
      <div className={cn("z-10 relative flex flex-col items-center gap-1", small ? "w-[40px]" : "w-[60px]")}>
         <div className={cn(
            "bg-[#3E2723] shadow-[#FF5722]/20 shadow-md border-[#FF5722] border-2 rounded text-[#FFCCBC]",
            small ? "p-1.5" : "p-2.5"
         )}>
            <Monitor className={small ? "w-3 h-3" : "w-5 h-5"} />
         </div>
         {!small && <span className="font-mono font-bold text-[#8D6E63] text-[10px] uppercase tracking-widest">UI</span>}
         <StatusBadge status={true} />
      </div>

    </div>
  );
};
