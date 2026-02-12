import React, { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  AreaChart, Area,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { 
  Database, Cpu, HardDrive, FileVideo, FileText, 
  LayoutGrid, BarChart2, Activity, Hexagon, 
  AlertCircle, FolderOpen, Layers, Terminal, Server,
  DollarSign, TrendingUp, TrendingDown, Target
} from 'lucide-react';

// --- Icon Mapping System ---
const IconMap: Record<string, React.ReactNode> = {
  cpu: <Cpu size={16} />,
  database: <Database size={16} />,
  video: <FileVideo size={16} />,
  doc: <FileText size={16} />,
  folder: <FolderOpen size={16} />,
  layers: <Layers size={16} />,
  system: <HardDrive size={16} />,
  money: <DollarSign size={16} />,
  trend: <TrendingUp size={16} />,
  target: <Target size={16} />,
  default: <HardDrive size={16} />
};

const getIcon = (key: string) => IconMap[key] || IconMap.default;

interface DataItem {
  name: string;
  value: number;
  color: string;
  iconKey: string;
  isHero?: boolean;
}

interface SystemMonitorProps {
  data?: DataItem[];
  totalCapacity?: number;
  label?: string;
  unit?: string;
}

/**
 * System Monitor Console (Adapted from StorageConsole)
 * Visualizes Portfolio Allocation and Risk Metrics
 */
const SystemMonitor: React.FC<SystemMonitorProps> = ({ 
  data = [], 
  totalCapacity = 100, 
  label = "Portfolio Allocation",
  unit = "%"
}) => {
  const [activeChart, setActiveChart] = useState('donut');
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  // --- Derived State ---
  const usedSize = useMemo(() => data.reduce((acc, curr) => acc + curr.value, 0), [data]);
  const freeSize = Math.max(0, totalCapacity - usedSize);
  const percentage = totalCapacity > 0 ? Math.round((usedSize / totalCapacity) * 100) : 0;
  
  // Find Hero Item
  const heroItem = useMemo(() => {
    if (!data.length) return null;
    return data.find(d => d.isHero) || data.reduce((prev, current) => (prev.value > current.value) ? prev : current);
  }, [data]);

  // Generate Gradients
  const chartData = useMemo(() => {
    return data.map(item => ({
        ...item,
        gradient: [item.color, item.color] 
    }));
  }, [data]);

  // --- Render Helpers ---

  const NavButton = ({ id, icon: Icon, label }: { id: string; icon: any; label: string }) => (
    <button
      onClick={() => setActiveChart(id)}
      className={`w-full aspect-square flex flex-col items-center justify-center gap-2 rounded-xl transition-all duration-200 group relative ${
        activeChart === id 
          ? 'bg-white/10 text-white shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] border-l-4 border-l-cyan-400' 
          : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
      }`}
      disabled={data.length === 0}
    >
      <Icon size={24} className={`transition-transform duration-300 ${activeChart === id ? 'scale-110 text-cyan-400' : ''}`} />
      <span className="bottom-2 absolute opacity-0 group-hover:opacity-100 font-bold text-[10px] uppercase tracking-widest transition-opacity">
        {label}
      </span>
    </button>
  );

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-slate-900/90 shadow-2xl backdrop-blur-xl p-3 border border-slate-700/50 rounded-lg min-w-[180px]">
          <div className="flex items-center gap-2 mb-2 pb-2 border-white/10 border-b">
            {getIcon(item.iconKey)}
            <span className="font-bold text-slate-100 text-sm">{item.name}</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="font-mono text-white text-2xl">{item.value}</span>
            <span className="mb-1 text-slate-400 text-xs">{unit}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // --- Chart Renderers ---
  const renderDonut = () => (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={100}
          outerRadius={160}
          paddingAngle={3}
          dataKey="value"
          stroke="none"
          onMouseEnter={(_, index) => setHoveredItem(index)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          {chartData.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color}
              className="outline-none transition-all duration-300"
              style={{ 
                opacity: hoveredItem !== null && hoveredItem !== index ? 0.2 : 1,
                transform: hoveredItem === index ? 'scale(1.05)' : 'scale(1)',
                transformOrigin: 'center center'
              }}
            />
          ))}
        </Pie>
        <RechartsTooltip content={<CustomTooltip />} />
        <text x="50%" y="48%" textAnchor="middle" fill="#64748b" className="font-bold text-xs uppercase tracking-[0.2em]">Active</text>
        <text x="50%" y="55%" textAnchor="middle" fill="white" className="font-mono font-bold text-5xl tracking-tighter">
          {percentage}%
        </text>
      </PieChart>
    </ResponsiveContainer>
  );

  const renderBar = () => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 40, left: 40, bottom: 20 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.2} />
        <XAxis type="number" hide />
        <YAxis 
          dataKey="name" 
          type="category" 
          width={140} 
          tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 500 }} 
          axisLine={false}
          tickLine={false}
        />
        <RechartsTooltip content={<CustomTooltip />} cursor={{fill: '#ffffff', opacity: 0.05}} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={28}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  const renderArea = () => (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 40, right: 20, left: 20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorFlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5}/>
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
        <RechartsTooltip content={<CustomTooltip />} />
        <Area 
          type="monotone" 
          dataKey="value" 
          stroke="#22d3ee" 
          strokeWidth={3}
          fill="url(#colorFlow)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  const renderRadar = () => (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={chartData}>
        <PolarGrid stroke="#475569" strokeDasharray="3 3" opacity={0.4} />
        {/* <PolarAngleAxis dataKey="name" /> */}
        <PolarRadiusAxis angle={30} domain={[0, totalCapacity / 4]} tick={false} axisLine={false} />
        <Radar
          name="Metric"
          dataKey="value"
          stroke="#22d3ee" 
          strokeWidth={3}
          fill="#22d3ee"
          fillOpacity={0.4}
        />
        <RechartsTooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  );

  return (
    <div className="flex justify-center items-center bg-slate-950 selection:bg-cyan-500/30 p-6 w-full font-sans">
      
      {/* --- Main Console Container --- */}
      <div className="flex bg-slate-900/50 shadow-[0_0_50px_-12px_rgba(0,0,0,0.7)] backdrop-blur-sm border border-slate-800 rounded-3xl w-full h-[600px] overflow-hidden">
        
        {/* 1. Left Navigation Rail */}
        <div className="z-20 flex flex-col items-center gap-6 bg-slate-900 py-6 border-white/5 border-r w-20">
            <div className="flex justify-center items-center bg-gradient-to-br from-sky-600 to-cyan-500 shadow-cyan-500/20 shadow-lg mb-4 rounded-lg w-10 h-10">
                <Terminal className="text-white" size={20} />
            </div>
            
            <div className="flex flex-col flex-1 gap-4 px-2 w-full">
                <NavButton id="donut" icon={LayoutGrid} label="Pie" />
                <NavButton id="bar" icon={BarChart2} label="List" />
                <NavButton id="radar" icon={Hexagon} label="Net" />
                <NavButton id="area" icon={Activity} label="Wave" />
            </div>
        </div>

        {/* 2. Center Visualization */}
        <div className="relative flex-1 bg-slate-950/50">
            {/* Top Bar */}
            <div className="top-6 right-8 left-8 z-10 absolute flex justify-between items-start pointer-events-none">
                 <div>
                    <h2 className="font-bold text-white text-xl tracking-tight">{label}</h2>
                 </div>
            </div>

            {/* Background Grid */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
            />

            {/* Charts or Empty State */}
            <div className="p-8 pt-16 w-full h-full">
                {data.length > 0 ? (
                    <>
                        {activeChart === 'donut' && renderDonut()}
                        {activeChart === 'bar' && renderBar()}
                        {activeChart === 'radar' && renderRadar()}
                        {activeChart === 'area' && renderArea()}
                    </>
                ) : (
                    <div className="flex flex-col justify-center items-center w-full h-full text-slate-500">
                        <Server size={48} className="opacity-50 mb-4" />
                        <p className="font-mono text-sm">Waiting for System Data...</p>
                    </div>
                )}
            </div>
        </div>

        {/* 3. Right Data HUD */}
        <div className="flex flex-col bg-slate-900/80 border-white/5 border-l w-[340px]">
            
            {/* Capacity Header */}
            <div className="p-6 border-white/5 border-b">
                <div className="flex justify-between items-end mb-2">
                    <span className="font-semibold text-slate-400 text-sm uppercase tracking-wider">Allocation</span>
                </div>
                <div className="bg-slate-800 rounded-full w-full h-2 overflow-hidden">
                    <div 
                        className="bg-slate-200 h-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                    />
                </div>
                <div className="flex justify-between mt-2 font-mono text-xs">
                    <span className="text-white">{usedSize}{unit} Allocation</span>
                    <span className="text-slate-500">{freeSize}{unit} Cash</span>
                </div>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
                
                {/* HERO CARD (Dynamic) */}
                {heroItem && (
                    <div className="group relative bg-gradient-to-br from-sky-900/20 to-cyan-900/20 mb-4 p-5 border border-cyan-500/30 hover:border-cyan-400/50 rounded-xl overflow-hidden transition-colors">
                        <div className="top-0 right-0 absolute opacity-20 group-hover:opacity-40 p-3 transition-opacity">
                            {getIcon(heroItem.iconKey)} 
                        </div>
                        
                        <div className="z-10 relative">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="bg-cyan-600 shadow-[0_0_10px_rgba(8,145,178,0.4)] px-1.5 py-0.5 rounded font-bold text-[10px] text-white">MAIN FOCUS</span>
                            </div>
                            <h3 className="mb-1 font-bold text-white text-lg leading-tight">{heroItem.name}</h3>
                            <div className="flex items-end gap-2 mt-4">
                                <span className="font-mono font-bold text-white text-3xl">{heroItem.value}</span>
                                <span className="mb-1 text-cyan-200 text-sm">{unit}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* List Items */}
                <div className="space-y-2">
                    {data.filter(d => d !== heroItem).map((item, idx) => (
                        <div 
                            key={idx} 
                            className="group flex justify-between items-center bg-white/5 hover:bg-white/10 p-3 border border-transparent hover:border-white/5 rounded-lg transition-all cursor-default"
                        >
                            <div className="flex items-center gap-3">
                                <div className="bg-slate-800 p-2 rounded text-slate-400 group-hover:text-white transition-colors">
                                    {getIcon(item.iconKey)}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium text-slate-200 text-sm">{item.name}</span>
                                </div>
                            </div>
                            <span className="font-mono font-semibold text-slate-500 group-hover:text-slate-300 text-sm">
                                {item.value} {unit}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Footer */}
            <div className="bg-slate-900/50 p-4 border-white/5 border-t text-center">
                 <button className="py-2 border border-slate-700 hover:border-slate-500 rounded-lg w-full font-semibold text-slate-400 hover:text-white text-xs uppercase tracking-widest transition-colors">
                    Manage Assets
                 </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SystemMonitor;
