import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useTradingStore } from '../context/TradingContext';
import { Filter, Search, Pause, ArrowDown, Terminal, Cpu, AlertTriangle, Shield, Activity, Zap, Info, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { LogEntry } from '../context/TradingContext';

// Define log levels for filtering
const LOG_LEVELS: string[] = ['INFO', 'SUCCESS', 'WARNING', 'ERROR', 'EXEC'];

export const LogsView: React.FC = () => {
  const { logs } = useTradingStore();
  const [filterLevel, setFilterLevel] = useState<string | null>(null);
  const [activeTagDetails, setActiveTagDetails] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  
  const systemScrollRef = useRef<HTMLDivElement>(null);
  const aiScrollRef = useRef<HTMLDivElement>(null);

  // Extract all unique tags from logs for filter suggestions
  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    logs.forEach(log => {
      log.tags?.forEach(t => tags.add(t.toUpperCase()));
    });
    return Array.from(tags).sort();
  }, [logs]);

  // Memoize filtered logs first
  const allFilteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesLevel = filterLevel ? log.level === filterLevel : true;
      const matchesTag = activeTagDetails ? log.tags?.some(t => t.toUpperCase() === activeTagDetails) : true;
      
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        log.message.toLowerCase().includes(searchLower) ||
        (log.strategy && log.strategy.toLowerCase().includes(searchLower)) ||
        (log.tags && log.tags.some(tag => tag.toLowerCase().includes(searchLower))) ||
        false;
        
      return matchesLevel && matchesSearch && matchesTag;
    });
  }, [logs, filterLevel, searchQuery, activeTagDetails]);

  // Split logs into System and AI
  const { systemLogs, aiLogs } = useMemo(() => {
    const system: LogEntry[] = [];
    const ai: LogEntry[] = [];

    allFilteredLogs.forEach(log => {
      // Robust AI detection: Check level, strategy, or specific tags
      // Now using uppercase comparison for robustness
      const tagsUpper = log.tags?.map(t => t.toUpperCase()) || [];
      const isAI = 
        log.level === 'EXEC' || 
        !!log.strategy || 
        tagsUpper.includes('AI') ||
        tagsUpper.includes('BRAIN') ||
        tagsUpper.includes('SIGNAL') ||
        tagsUpper.includes('STRATEGY') ||
        tagsUpper.includes('NEURAL');
      
      if (isAI) {
        ai.push(log);
      } else {
        system.push(log);
      }
    });

    return { systemLogs: system, aiLogs: ai };
  }, [allFilteredLogs]);

  // Auto-scroll logic for both columns
  useEffect(() => {
    if (autoScroll) {
      if (systemScrollRef.current) {
        systemScrollRef.current.scrollTop = systemScrollRef.current.scrollHeight;
      }
      if (aiScrollRef.current) {
        aiScrollRef.current.scrollTop = aiScrollRef.current.scrollHeight;
      }
    }
  }, [systemLogs, aiLogs, autoScroll]);

  const renderLogMessage = (message: string) => {
    const parts = message.split(/(\$[0-9,]+(?:\.[0-9]{2})?|\bYES\b|\bNO\b|\b[A-Z]{2,5}-[0-9]{2}[A-Z]{3}[0-9]{2}\b)/g);
    
    return (
      <span className="font-mono text-[#D4C4A8] text-xs break-words leading-relaxed">
        {parts.map((part, i) => {
          if (part.startsWith('$')) {
            return <span key={i} className="drop-shadow-[0_0_2px_rgba(255,215,0,0.5)] font-bold text-[#FFD700]">{part}</span>;
          }
          if (part === 'YES') {
            return <span key={i} className="drop-shadow-[0_0_2px_rgba(0,230,118,0.5)] font-bold text-[#00E676]">{part}</span>;
          }
          if (part === 'NO') {
            return <span key={i} className="drop-shadow-[0_0_2px_rgba(255,82,82,0.5)] font-bold text-[#FF5252]">{part}</span>;
          }
          if (/^[A-Z]{2,5}-[0-9]{2}[A-Z]{3}[0-9]{2}$/.test(part)) {
             return <span key={i} className="bg-[#3E2723] px-1 border border-[#5D4037] rounded font-bold text-[#FFB74D]">{part}</span>;
          }
          return part;
        })}
      </span>
    );
  };

  const getTagIcon = (tag: string) => {
      const upper = tag.toUpperCase();
      if (upper === 'AI') return <Cpu className="w-2.5 h-2.5" />;
      if (upper === 'SYSTEM') return <Terminal className="w-2.5 h-2.5" />;
      if (upper === 'ERROR' || upper === 'CRIT') return <AlertTriangle className="w-2.5 h-2.5" />;
      if (upper === 'SECURITY') return <Shield className="w-2.5 h-2.5" />;
      if (upper === 'TRADING' || upper === 'EXEC') return <Activity className="w-2.5 h-2.5" />;
      if (upper === 'SIGNAL') return <Zap className="w-2.5 h-2.5" />;
      if (upper === 'SUCCESS') return <CheckCircle className="w-2.5 h-2.5" />;
      return <Info className="w-2.5 h-2.5" />;
  };

  const LogList = ({ title, icon: Icon, logs, scrollRef, type }: { title: string, icon: any, logs: LogEntry[], scrollRef: React.RefObject<HTMLDivElement>, type: 'system' | 'ai' }) => (
    <div className={`relative flex flex-col flex-1 border-2 rounded overflow-hidden ${type === 'ai' ? 'bg-[#0D1117] border-[#1F6FEB]' : 'bg-[#1C1917] border-[#5D4037]'}`}>
      {/* Header */}
      <div className={`flex items-center gap-2 p-2 border-b ${type === 'ai' ? 'bg-[#161B22] border-[#1F6FEB]' : 'bg-[#2D2420] border-[#3E2723]'}`}>
        <Icon className={`w-4 h-4 ${type === 'ai' ? 'text-[#58A6FF]' : 'text-[#FFB74D]'}`} />
        <span className={`font-bold text-xs tracking-widest ${type === 'ai' ? 'text-[#58A6FF]' : 'text-[#D4C4A8]'}`}>{title}</span>
        <span className={`ml-auto px-1.5 rounded font-mono text-[9px] ${type === 'ai' ? 'bg-[#1F6FEB]/20 text-[#58A6FF]' : 'bg-[#3E2723] text-[#A1887F]'}`}>
          {logs.length}
        </span>
      </div>

      {/* CRT Overlay */}
      <div className="z-10 absolute inset-0 bg-[length:100%_2px,3px_100%] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] pointer-events-none" />

      {/* List */}
      <div 
        ref={scrollRef}
        className="relative flex-1 space-y-px p-2 overflow-y-auto custom-scrollbar"
      >
        {logs.length > 0 ? (
          logs.map((log) => {
            const isError = log.level === 'ERROR' || log.level === 'CRIT';
            const isSuccess = log.level === 'SUCCESS';
            const isWarning = log.level === 'WARNING' || log.level === 'WARN';
            const isExec = log.level === 'EXEC';
            
            let rowClass = "border-transparent hover:border-[#E65100]";
            if (isError) rowClass = "border-[#FF5252] bg-[#FF5252]/5";
            else if (isSuccess) rowClass = "border-[#00E676] bg-[#00E676]/5";
            else if (isWarning) rowClass = "border-[#FFAB00] bg-[#FFAB00]/5";
            else if (type === 'ai') rowClass = "border-[#1F6FEB] hover:border-[#58A6FF]";

            let badgeClass = "bg-[#2D2420] text-[#8D6E63] border border-[#3E2723]";
            if (isError) badgeClass = "badge-danger";
            else if (isSuccess) badgeClass = "badge-success";
            else if (isWarning) badgeClass = "badge-warning";
            else if (isExec) badgeClass = "bg-[#3E2723] text-[#FFB74D] border border-[#5D4037]";

            return (
            <div
              key={log.id}
              className={`group flex items-start gap-2 px-2 py-1.5 border-l-2 transition-all hover:bg-white/5 ${rowClass}`}
            >
              <span className="pt-0.5 font-mono text-[9px] text-white/40 select-none shrink-0">
                {format(new Date(log.timestamp), 'HH:mm:ss')}
              </span>

              <span className={`shrink-0 badge-retro w-12 text-[8px] text-center ${badgeClass}`}>
                {log.level}
              </span>

              <div className="flex-1 min-w-0">
                {renderLogMessage(log.message)}
                
                {/* Render Tags */}
                <div className="flex flex-wrap gap-1 mt-1">
                    {log.strategy && (
                       <span className="flex items-center gap-1 bg-[#3E2723] px-1 border border-[#5D4037] rounded font-mono text-[#FFB74D] text-[8px]">
                         <Activity className="w-2.5 h-2.5" />
                         {log.strategy}
                       </span>
                    )}
                    {log.tags && log.tags.map((tag, idx) => {
                        const tagUpper = tag.toUpperCase();
                        let tagClass = 'bg-[#2D2420] text-[#8D6E63] border-[#3E2723]';
                        
                        if (tagUpper === 'AI') tagClass = 'bg-[#1F6FEB]/20 text-[#58A6FF] border-[#1F6FEB]/50';
                        else if (tagUpper === 'SYSTEM') tagClass = 'bg-[#3E2723] text-[#A1887F] border-[#5D4037]';
                        else if (tagUpper === 'ERROR') tagClass = 'bg-[#B00020]/20 text-[#FF5252] border-[#B00020]/50';
                        else if (tagUpper === 'TRADING') tagClass = 'bg-[#E65100]/20 text-[#FFB74D] border-[#E65100]/50';
                        
                        return (
                        <span key={`${log.id}-tag-${idx}`} className={`flex items-center gap-1 px-1 rounded font-mono text-[8px] border opacity-80 ${tagClass}`}>
                            {getTagIcon(tag)}
                            {tag}
                        </span>
                        );
                    })}
                </div>
              </div>
            </div>
          );
          })
        ) : (
          <div className="flex flex-col justify-center items-center opacity-30 h-full text-[#5D4037]">
            <Filter className="mb-2 w-6 h-6" />
            <p className="font-mono text-[10px] uppercase tracking-widest">NO DATA</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-2 h-full overflow-hidden">
      
      {/* Global Controls */}
      <div className="z-10 flex flex-wrap items-center gap-2 bg-[#1C1917] shadow-lg p-2 border-[#5D4037] border-b-2 rounded shrink-0">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="top-2.5 left-3 absolute w-3.5 h-3.5 text-[#8D6E63]" />
          <input
            type="text"
            placeholder="SEARCH LOGS..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-[#2D2420] focus:bg-[#3E2723] pl-9 border-[#3E2723] focus:border-[#8D6E63] outline-none h-8 text-[#D4C4A8] text-[11px] placeholder:text-[#5D4037] uppercase tracking-wider transition-all input-field"
          />
        </div>

        {/* Level Filters */}
        <div className="flex items-center gap-0.5 bg-[#2D2420] p-0.5 border border-[#3E2723] rounded">
          {LOG_LEVELS.map((level) => (
            <button
              key={level}
              onClick={() => setFilterLevel(filterLevel === level ? null : level)}
              className={`
                px-2 py-1 rounded-[1px] text-[9px] font-bold font-mono uppercase tracking-wider transition-all
                ${filterLevel === level
                  ? 'bg-[#E65100] text-white shadow-sm' 
                  : 'text-[#8D6E63] hover:text-[#D4C4A8] hover:bg-[#3E2723]'
                }
              `}
            >
              {level}
            </button>
          ))}
        </div>

        {/* Tag Filters (Dynamic) */}
        {availableTags.length > 0 && (
            <div className="flex items-center gap-1 bg-[#2D2420] px-2 py-1 border border-[#3E2723] rounded max-w-[300px] overflow-x-auto custom-scrollbar">
                <span className="text-[#5D4037] text-[9px] uppercase">TAGS:</span>
                {availableTags.slice(0, 5).map(tag => (
                    <button
                        key={tag}
                        onClick={() => setActiveTagDetails(activeTagDetails === tag ? null : tag)}
                        className={`
                            px-1.5 py-0.5 rounded text-[8px] font-mono border transition-all whitespace-nowrap
                            ${activeTagDetails === tag 
                                ? 'bg-[#1F6FEB] border-[#1F6FEB] text-white' 
                                : 'bg-[#1C1917] border-[#3E2723] text-[#8D6E63] hover:border-[#8D6E63]'
                            }
                        `}
                    >
                        {tag}
                    </button>
                ))}
            </div>
        )}

        {/* Auto-scroll Toggle */}
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`
            p-1.5 rounded border transition-colors ml-auto
            ${autoScroll 
                ? 'bg-[#3E2723] border-[#5D4037] text-[#FFB74D] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)]' 
                : 'bg-transparent border-[#3E2723] text-[#5D4037] hover:border-[#8D6E63]'
            }
          `}
          title={autoScroll ? 'PAUSE SCROLL' : 'RESUME SCROLL'}
        >
          {autoScroll ? <Pause className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Two Column Layout */}
      <div className="flex flex-1 gap-2 overflow-hidden">
        <LogList 
            title="SYSTEM KERNEL" 
            icon={Terminal} 
            logs={systemLogs} 
            scrollRef={systemScrollRef}
            type="system"
        />
        <LogList 
            title="AI AGENT CORTEX" 
            icon={Cpu} 
            logs={aiLogs} 
            scrollRef={aiScrollRef}
            type="ai"
        />
      </div>
    </div>
  );
};

export default LogsView;
