import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface AuraMascotProps {
  state?: 'idle' | 'thinking' | 'action' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const AuraMascot: React.FC<AuraMascotProps> = ({ 
  state = 'idle', 
  size = 'md',
  className 
}) => {
  // Size mapping
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-24 h-24',
    xl: 'w-48 h-48',
  };

  // State colors
  const colorMap = {
    idle: 'bg-sunray shadow-sunray/50',
    thinking: 'bg-linen shadow-sunray/80',
    action: 'bg-magma shadow-magma/60',
    warning: 'bg-sienna shadow-sienna/60',
    error: 'bg-red-500 shadow-red-500/60',
  };

  const coreColor = colorMap[state];

  return (
    <div className={cn('relative flex justify-center items-center', sizeMap[size], className)}>
      {/* Outer Orbit Ring */}
      <motion.div
        className="absolute inset-0 border border-white/20 rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 10, ease: "linear", repeat: Infinity }}
      />
      
      {/* Inner Fast Ring (Visible when thinking/active) */}
      {(state === 'thinking' || state === 'action') && (
        <motion.div
          className="absolute inset-1 border-white/60 border-t-2 border-b-2 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 2, ease: "linear", repeat: Infinity }}
        />
      )}

      {/* Core Sphere - The "Soul" */}
      <motion.div
        className={cn(
          'relative shadow-[0_0_20px_currentColor] rounded-full transition-colors duration-500',
          size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-4 h-4' : 'w-8 h-8',
          coreColor
        )}
        animate={{
          scale: state === 'thinking' ? 1.2 : state === 'error' ? 0.9 : 1,
        }}
        transition={{
          duration: state === 'thinking' ? 1.5 : 0.5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Holographic Glitch Effect (Error State) */}
      {state === 'error' && (
        <motion.div
          className="absolute inset-0 bg-red-500/20 mix-blend-overlay"
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 0.2, repeat: Infinity, repeatDelay: 3 }}
        />
      )}
    </div>
  );
};
