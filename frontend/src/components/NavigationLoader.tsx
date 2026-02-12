import React from 'react';
import { motion } from 'framer-motion';
import { AuraMascot } from './ui/AuraMascot';

export const NavigationLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-[var(--bg-overlay)] backdrop-blur-sm z-[90] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="glass-card px-8 py-6 flex items-center gap-4 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
      >
        {/* Animated Mascot */}
        <AuraMascot state="thinking" size="md" />

        {/* Loading Text */}
        <div className="flex flex-col">
          <span className="text-[var(--neutral-0)] font-medium text-lg tracking-wide">INITIALIZING VIEW...</span>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="h-0.5 bg-gradient-to-r from-[var(--primary-500)] via-[var(--color-info)] to-transparent rounded-full mt-2"
          />
        </div>
      </motion.div>
    </div>
  );
};

// Alternative minimal loader
export const MinimalLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-[var(--bg-overlay)] backdrop-blur-sm z-[90] flex items-center justify-center">
      <AuraMascot state="thinking" size="sm" />
    </div>
  );
};

// Inline loader for smaller contexts
export const InlineLoader: React.FC<{ text?: string }> = ({ text = 'Processing...' }) => {
  return (
    <div className="flex items-center gap-3 text-[var(--neutral-400)]">
      <div className="w-4 h-4 border-2 border-[var(--primary-500)] border-t-transparent rounded-full animate-spin" />
      <span className="text-sm tracking-wide uppercase">{text}</span>
    </div>
  );
};
