import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Zap, AlertTriangle, User, Search, Filter, Activity, GitBranch, Terminal,
  Bot, Cpu, Volume2, VolumeX, Play, Pause, Square, Wallet, ArrowUpRight,
  TrendingDown, Mic, Sparkles, Send
} from 'lucide-react';
import { formatAIResponse } from '../utils/aiResponseFormatter';
import { AudioWaveform } from '../components/ui/AudioWaveform';
import { PipelineVisualizer } from '../components/visualizations/PipelineVisualizer';
import { useTradingStore } from '../context/TradingContext';
import { useAudio } from '../context/AudioContext';
import { cn } from '../utils/cn';
import { format } from 'date-fns';
import { generateUniqueId } from '../utils/uniqueId';

// --- Types ---
type EventType = 'thought' | 'action' | 'system' | 'user' | 'error' | 'subagent' | 'decision';

interface AgentEvent {
  id: string;
  timestamp: Date;
  type: EventType;
  agent: string;
  content: string;
  details?: Record<string, unknown>;
  confidence?: number;
  duration?: number;
}

// --- Constants & Config ---
const eventColors: Record<EventType, { bg: string; border: string; text: string; icon: string }> = {
  thought: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', icon: 'text-orange-400' },
  action: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: 'text-red-400' },
  system: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', icon: 'text-amber-400' },
  user: { bg: 'bg-linen/10', border: 'border-linen/30', text: 'text-linen', icon: 'text-linen' },
  error: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: 'text-red-400' },
  subagent: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', icon: 'text-orange-400' },
  decision: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', icon: 'text-orange-400' },
};

const eventIcons: Record<EventType, React.ReactNode> = {
  thought: <Brain className="w-4 h-4" />,
  action: <Zap className="w-4 h-4" />,
  system: <Terminal className="w-4 h-4" />,
  user: <User className="w-4 h-4" />,
  error: <AlertTriangle className="w-4 h-4" />,
  subagent: <Bot className="w-4 h-4" />,
  decision: <GitBranch className="w-4 h-4" />,
};

// --- Sub-Components ---

const EventItem: React.FC<{ event: AgentEvent; isExpanded: boolean; onToggle: () => void; }> = ({ event, isExpanded, onToggle }) => {
  const colors = eventColors[event.type] || eventColors.system;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="group relative pb-6 pl-8"
    >
      {/* Connector Line */}
      <div className="group-last:hidden top-8 left-3.5 absolute bg-white/10 w-0.5 h-full" />

      {/* Icon Node */}
      <div
        className={`absolute left-0 top-1 w-8 h-8 rounded-full border-2 ${colors.border} ${colors.bg} flex items-center justify-center z-10 transition-transform group-hover:scale-110 cursor-pointer`}
        onClick={onToggle}
        role="button"
        tabIndex={0}
      >
        <span className={colors.icon}>{eventIcons[event.type]}</span>
      </div>

      {/* Content Card */}
      <div
        className="relative bg-black/40 hover:bg-white/5 p-4 border border-white/10 rounded-xl overflow-hidden transition-colors duration-200 cursor-pointer"
        onClick={onToggle}
        role="button"
        tabIndex={0}
      >
        <div className="z-10 relative flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5 mb-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-px rounded-full bg-white/5 border border-white/5 ${colors.text} translate-y-px`}>
                {event.agent}
              </span>
              <span className="font-mono text-[10px] text-gray-500">
                {format(event.timestamp, 'HH:mm:ss')} <span className="text-gray-700">.{format(event.timestamp, 'SSS')}</span>
              </span>
            </div>
            
            {/* Content Rendering */}
            {event.type === 'thought' ? (
              <div className="space-y-3 font-light text-gray-300 text-sm">
                {formatAIResponse(event.content).map((section, idx) => {
                   const key = `section-${event.id}-${idx}`;
                   if (section.type === 'header') return <div key={key} className="mt-2 mb-2 pb-1 border-orange-500/20 border-b font-bold text-orange-400 text-xs uppercase tracking-widest">{section.content}</div>;
                   if (section.type === 'key-value') return <div key={key} className="inline-flex items-center gap-2 bg-black/30 mr-2 mb-1 px-2 py-1 border border-orange-500/10 rounded-md"><span className="text-[9px] text-gray-500 uppercase tracking-wider">{section.label}</span><span className="font-mono text-xs">{section.content}</span></div>;
                   if (section.type === 'action') return <div key={key} className="flex items-center gap-3 bg-orange-500/5 my-1 p-2 border border-orange-500/20 rounded-lg"><Zap className="w-4 h-4 text-orange-400" /><span className="font-mono text-gray-200 text-xs">{section.content.replace('Executing tool: ', '')}</span></div>;
                   return <div key={key} className="leading-relaxed">{section.content}</div>;
                })}
              </div>
            ) : (
              <p className="font-light text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">{event.content}</p>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (event.details || event.duration) && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-white/5 border-t"
            >
              <div className="gap-3 grid grid-cols-2 md:grid-cols-3">
                {event.duration && (
                  <div className="bg-black/40 p-2.5 rounded-lg text-center">
                    <p className="mb-1 text-[9px] text-gray-500 uppercase tracking-wider">Latency</p>
                    <p className="font-mono text-teal-400 text-sm">{event.duration}ms</p>
                  </div>
                )}
                {event.details && Object.entries(event.details).map(([key, val]) => (
                    <div key={key} className="bg-black/40 p-2.5 rounded-lg overflow-hidden">
                      <p className="mb-1 text-[9px] text-gray-500 truncate uppercase tracking-wider" title={key}>{key}</p>
                      <p className="font-mono text-gray-300 text-xs truncate" title={String(val)}>{String(val)}</p>
                    </div>
                  ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// --- Main Component ---

interface AIBrainViewProps {
  onCommand?: (cmd: string) => void;
}

export const AIBrainView: React.FC<AIBrainViewProps> = ({ onCommand }) => {
  const { logs, health, aiInsights, ttsEnabled, setTtsEnabled, ttsPlaying, botState, setBotState, decisionTree, portfolio } = useTradingStore();
  const { volume, setVolume } = useAudio();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedNodeRef = useRef<string | null>(null);

  const [internalEvents, setInternalEvents] = useState<AgentEvent[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [activeFilters, setActiveFilters] = useState<Set<EventType>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  // --- Logic & Effects (Preserved) ---
  const logEvents = useMemo(() => {
    return logs.map((log) => ({
      id: log.id || generateUniqueId('log'),
      timestamp: new Date(log.timestamp),
      type: (log.level === 'CRIT' ? 'error' : log.level === 'EXEC' ? 'action' : 'system') as EventType,
      agent: log.level === 'EXEC' ? 'Trigger' : 'System',
      content: log.message,
    }));
  }, [logs]);

  useEffect(() => {
    if (aiInsights.thinking) {
      const thinkingEvent: AgentEvent = {
        id: generateUniqueId('think'),
        timestamp: new Date(),
        type: 'thought',
        agent: 'Atlas (Intelligence)',
        content: aiInsights.thinking,
        confidence: aiInsights.confidence ? aiInsights.confidence / 100 : 0.85,
      };
      setInternalEvents((prev) => {
        const lastEvent = prev.at(-1);
        if (lastEvent && lastEvent.content === aiInsights.thinking) return prev;
        return [...prev.slice(-49), thinkingEvent];
      });
    }
  }, [aiInsights.thinking, aiInsights.confidence]);

  useEffect(() => {
    if (decisionTree.length > 0) {
      const latestNode = decisionTree[0];
      if (lastProcessedNodeRef.current === latestNode.id) return;
      lastProcessedNodeRef.current = latestNode.id;

      const decisionEvent: AgentEvent = {
        id: latestNode.id,
        timestamp: new Date(latestNode.timestamp),
        type: latestNode.type === 'action' ? 'action' : 'decision',
        agent: 'NEURAL_LINK',
        content: latestNode.description,
        confidence: latestNode.confidence,
        details: latestNode.inputs as any
      };

      setInternalEvents((prev) => {
        if (prev.some(e => e.id === latestNode.id)) return prev;
        return [...prev.slice(-49), decisionEvent];
      });
    }
  }, [decisionTree]);

  const allEvents = useMemo(() => {
    return [...logEvents, ...internalEvents].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }, [logEvents, internalEvents]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      if (activeFilters.size > 0 && !activeFilters.has(event.type)) return false;
      if (searchQuery && !event.content.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [allEvents, activeFilters, searchQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filteredEvents]);

  const handleSendMessage = () => {
    if (!userMessage.trim()) return;
    const newEvent: AgentEvent = {
      id: generateUniqueId('user'),
      timestamp: new Date(),
      type: 'user',
      agent: 'User',
      content: userMessage,
    };
    setInternalEvents(prev => [...prev, newEvent]);
    const ws = (globalThis as unknown as Window & { __ws?: WebSocket }).__ws;
    if (ws && ws.readyState === WebSocket.OPEN) {
       ws.send(JSON.stringify({ type: 'CHAT_MESSAGE', payload: { message: userMessage } }));
    }
    setUserMessage('');
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };

  const toggleFilter = (type: EventType) => {
    setActiveFilters((prev) => {
      const s = new Set(prev);
      if (s.has(type)) s.delete(type); else s.add(type);
      return s;
    });
  };

  return (
    <div className="flex flex-col bg-[#0a0a0f] h-full overflow-hidden text-white">
      {/* HEADER - Fixed Height */}
      <div className="z-10 flex-none bg-[#0a0a0f]/95 backdrop-blur-md p-4 border-white/5 border-b w-full">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 rounded-full w-2 h-8" />
            <div>
               <h2 className="font-bold text-xl tracking-tight">AI Mind</h2>
               <div className="flex items-center gap-2">
                 <div className={`w-1.5 h-1.5 rounded-full ${botState === 'RUNNING' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                 <span className="text-gray-500 text-xs uppercase tracking-widest">{botState}</span>
                 {aiInsights.stage && <span className="ml-2 pl-2 border-white/10 border-l text-orange-500 text-xs">{aiInsights.stage}</span>}
               </div>
            </div>
          </div>
          <div className="flex gap-2">
             <button 
               onClick={() => setShowFilters(!showFilters)}
               className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-orange-500/20 text-orange-400' : 'hover:bg-white/5 text-gray-500'}`}
             >
               <Filter className="w-5 h-5" />
             </button>
             <div className="relative">
               <input 
                 type="text" 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Search thoughts..." 
                 className="bg-white/5 py-2 pr-4 pl-9 border border-white/10 focus:border-orange-500/50 rounded-lg focus:outline-none w-64 text-sm"
               />
               <Search className="top-2.5 left-3 absolute w-4 h-4 text-gray-500" />
             </div>
          </div>
        </div>

        {/* Filter Bar */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
               initial={{ height: 0, opacity: 0 }}
               animate={{ height: 'auto', opacity: 1 }}
               exit={{ height: 0, opacity: 0 }}
               className="flex gap-2 overflow-hidden"
            >
              {(Object.keys(eventColors) as EventType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => toggleFilter(type)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    activeFilters.has(type) || activeFilters.size === 0
                      ? `${eventColors[type].bg} ${eventColors[type].border} ${eventColors[type].text}`
                      : 'bg-transparent border-white/5 text-gray-600 hover:border-white/10'
                  }`}
                >
                  <span className="opacity-70 mr-1.5">{type === 'thought' ? '🧠' : type === 'action' ? '⚡' : '#'}</span>
                  {type.toUpperCase()}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CONTENT - Flex 1 (Takes remaining space) */}
      <div className="relative flex-1 min-h-0">
        <div className="absolute inset-0 px-4 pt-4 pb-20 overflow-y-auto custom-scrollbar"> {/* pb-20 for input room? No, Input is separate flex item */}
           <div className="space-y-2 mx-auto pb-4 max-w-4xl">
              {filteredEvents.map((event, idx) => (
                <EventItem 
                   key={event.id}
                   event={event}
                   isExpanded={expandedIds.has(event.id)}
                   onToggle={() => toggleExpand(event.id)}
                />
              ))}
              <div ref={messagesEndRef} className="h-4" />
           </div>
        </div>
      </div>

      {/* FOOTER (Input) - Fixed Height */}
      <div className="z-20 flex-none bg-gradient-to-t from-[#0a0a0f] to-[#0a0a0f]/90 p-4 pt-2 border-white/5 border-t">
        <div className="mx-auto max-w-4xl">
          <div className="relative">
            <textarea
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Ask Neural Core..."
              rows={1}
              className="relative bg-[#0a0a0f] shadow-inner py-4 pr-16 pl-5 border border-white/10 focus:border-orange-500/40 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500/20 w-full text-white text-base transition-all resize-none placeholder-gray-600"
            />
            <div className="right-2 bottom-2 absolute flex items-center gap-1">
              <button className="hover:bg-white/10 p-2 rounded-lg text-gray-500 hover:text-white transition-colors">
                 <Mic className="w-5 h-5" />
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!userMessage.trim()}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  userMessage.trim() 
                    ? "bg-orange-500 text-black shadow-[0_0_10px_rgba(249,115,22,0.4)] hover:bg-orange-400" 
                    : "bg-white/5 text-gray-600"
                )}
              >
                <ArrowUpRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIBrainView;
