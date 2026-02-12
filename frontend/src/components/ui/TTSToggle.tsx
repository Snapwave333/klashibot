import React from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TTSToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  isPlaying?: boolean;
}

export const TTSToggle: React.FC<TTSToggleProps> = ({ enabled, onToggle, isPlaying = false }) => {
  return (
    <motion.button
      onClick={() => onToggle(!enabled)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`relative flex items-center gap-3 px-6 py-3 border-2 rounded-xl transition-all shadow-lg ${
        enabled
          ? 'bg-neon-green/20 border-neon-green/50 text-neon-green shadow-neon-green/30'
          : 'bg-white/5 border-white/10 text-gray-400 hover:text-gray-300 hover:border-white/20'
      }`}
      title={enabled ? 'Disable voice mode' : 'Enable voice mode'}
    >
      <div className="relative">
        {enabled ? (
          <>
            <Volume2 className="w-5 h-5" />
            {isPlaying && (
              <motion.div
                className="absolute -inset-1 bg-neon-green/30 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            )}
          </>
        ) : (
          <VolumeX className="w-5 h-5" />
        )}
      </div>

      <div className="flex flex-col items-start">
        <span className="font-black text-sm leading-none">
          {enabled ? 'VOICE MODE' : 'VOICE OFF'}
        </span>
        {enabled && (
          <motion.span
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] opacity-70 leading-none mt-1"
          >
            {isPlaying ? '🔊 Speaking...' : 'Ready'}
          </motion.span>
        )}
      </div>

      {/* Pulsing indicator */}
      <AnimatePresence>
        {enabled && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="absolute -right-2 -top-2"
          >
            <motion.div
              className="bg-neon-green rounded-full w-3 h-3 shadow-lg shadow-neon-green/50"
              animate={{
                scale: isPlaying ? [1, 1.3, 1] : [1, 1.2, 1],
                opacity: isPlaying ? [1, 0.7, 1] : 1,
              }}
              transition={{
                duration: isPlaying ? 0.8 : 2,
                repeat: Infinity,
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};
