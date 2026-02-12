import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';

// Omit ref to avoid type conflicts with strict React/Framer versions
interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  children: React.ReactNode;
  className?: string;
  glow?: 'cyan' | 'green' | 'amber' | 'red' | 'none';
  noPadding?: boolean;
  onClick?: () => void;
  role?: string;
  tabIndex?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  glow = 'none',
  noPadding = false,
  onClick,
  role,
  tabIndex,
  ...motionProps
}) => {
  const glowClasses = {
    cyan: '',
    green: '',
    amber: '',
    red: '',
    none: '',
  };

  const isInteractive = !!onClick;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <motion.div
      className={cn(
        'glass-card',
        // ISABP Rule: Optical Correction Protocol
        // Top padding (20px) < Bottom/Side padding (24px) to account for font line-height
        !noPadding && 'pt-5 pb-6 px-6',
        glowClasses[glow],
        isInteractive && 'cursor-pointer hover:border-[var(--border-focus)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary-500)]',
        className
      )}
      onClick={onClick}
      onKeyDown={isInteractive ? handleKeyDown : undefined}
      role={role || (isInteractive ? 'button' : undefined)}
      tabIndex={tabIndex ?? (isInteractive ? 0 : undefined)}
      whileHover={isInteractive ? { scale: 1.02 } : undefined}
      whileTap={isInteractive ? { scale: 0.98 } : undefined}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};
