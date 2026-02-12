import React from 'react';
import { useTradingStore } from '../../context/TradingContext';
import { GlassCard } from '../ui/GlassCard';
import { ShieldCheck, AlertOctagon } from 'lucide-react';
import { motion } from 'framer-motion';

export const ReliabilityWidget: React.FC = () => {
  const { health } = useTradingStore();

  const score = health.reliability_score ?? 100;

  return (
    <GlassCard className="relative flex flex-col justify-between col-span-1 h-64 overflow-hidden">
      <div className="z-10 flex justify-between items-start">
        <div>
          <h3 className="font-bold text-gray-400 text-xs uppercase tracking-widest">
            System Trust
          </h3>
          <p className="mt-1 text-[10px] text-gray-500">
            LAST INCIDENT: {health.last_incident_timestamp || 'NONE'}
          </p>
        </div>
        <ShieldCheck className={`w-5 h-5 ${score > 90 ? 'text-neon-green' : 'text-neon-amber'}`} />
      </div>

      <div className="z-10 flex items-end gap-2 mt-4">
        <span
          className={`text-4xl font-mono font-bold ${score > 90 ? 'text-neon-green' : 'text-neon-amber'}`}
        >
          {score}
        </span>
        <span className="mb-1 text-gray-500 text-sm">/100</span>
      </div>

      {/* Visual Ring */}
      <div className="-right-4 -bottom-4 absolute flex justify-center items-center border-4 border-white/5 rounded-full w-24 h-24">
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          className={`w-full h-full rounded-full border-t-4 ${score > 90 ? 'border-t-neon-green' : 'border-t-neon-amber'} opacity-20`}
        />
      </div>
    </GlassCard>
  );
};
