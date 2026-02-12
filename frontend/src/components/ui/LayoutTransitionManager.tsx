/**
 * LayoutTransitionManager.tsx
 *
 * Clean, slick layout button animations.
 * Simple and elegant - no gimmicks.
 */

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

interface AnimatedLayoutButtonProps {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  index: number;
}

// ============================================================================
// SIMPLE ANIMATED LAYOUT BUTTON
// ============================================================================

export const AnimatedLayoutButton: React.FC<AnimatedLayoutButtonProps> = ({
  name,
  icon,
  isActive,
  onClick,
  index,
}) => {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative p-2.5 rounded-lg transition-all duration-200
        ${
          isActive
            ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 shadow-[0_0_12px_rgba(0,217,255,0.3)]'
            : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10 hover:text-gray-200'
        }
      `}
      title={name}
    >
      <motion.div animate={{ scale: isActive ? 1 : 1 }} className="z-10 relative">
        {icon}
      </motion.div>

      {/* Subtle glow indicator for active state */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute inset-0 bg-neon-cyan/10 rounded-lg pointer-events-none"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
    </motion.button>
  );
};

// ============================================================================
// BACKGROUND PARTICLE FIELD (Subtle ambient particles)
// ============================================================================

export const BackgroundParticleField: React.FC<{
  isActive: boolean;
  intensity: number;
}> = ({ isActive, intensity }) => {
  if (!isActive) return null;

  const particleCount = Math.floor(10 * intensity);

  return (
    <div className="absolute inset-0 opacity-30 overflow-hidden pointer-events-none">
      {Array.from({ length: particleCount }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-neon-cyan/50 rounded-full"
          style={{
            width: 2,
            height: 2,
            left: `${(i * 17) % 100}%`,
          }}
          animate={{
            top: ['-2%', '102%'],
          }}
          transition={{
            duration: 15 + (i % 10) * 2,
            repeat: Infinity,
            ease: 'linear',
            delay: i * 0.5,
          }}
        />
      ))}
    </div>
  );
};

// ============================================================================
// WIDGET TRANSITION WRAPPER (Unused export for compatibility)
// ============================================================================

export const AnimatedWidgetWrapper: React.FC<{
  children: React.ReactNode;
  layoutKey: string;
  index: number;
  isTransitioning: boolean;
}> = ({ children }) => {
  return <>{children}</>;
};

// ============================================================================
// LAYOUT BUTTON CONTAINER
// ============================================================================

export const AnimatedLayoutButtonContainer: React.FC<{
  presets: Array<{
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
  }>;
  currentPreset: string;
  onPresetChange: (presetId: string) => void;
}> = ({ presets, currentPreset, onPresetChange }) => {
  const handlePresetClick = useCallback(
    (presetId: string) => {
      if (presetId === currentPreset) return;
      onPresetChange(presetId);
    },
    [currentPreset, onPresetChange]
  );

  return (
    <div className="flex gap-1 bg-black/30 shadow-lg p-1.5 border border-white/10 rounded-xl">
      {presets.map((preset, index) => (
        <AnimatedLayoutButton
          key={preset.id}
          id={preset.id}
          name={preset.name}
          description={preset.description}
          icon={preset.icon}
          isActive={currentPreset === preset.id}
          onClick={() => handlePresetClick(preset.id)}
          index={index}
        />
      ))}
    </div>
  );
};

export default AnimatedLayoutButtonContainer;
