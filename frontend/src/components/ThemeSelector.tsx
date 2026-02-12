import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Check, Moon, Sun, Sparkles } from 'lucide-react';
import { useTheme, themes } from '../context/ThemeContext';

interface ThemeSelectorProps {
  className?: string;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ className }) => {
  const { theme, setTheme, toggleMode } = useTheme();
  const currentTheme = theme;
  const availableThemes = Object.values(themes);
  const isDarkMode = theme.mode === 'dark';
  const toggleDarkMode = toggleMode;
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 border border-white/10 rounded-lg transition-colors"
        title="Change Theme"
      >
        <Palette className="w-5 h-5 text-gray-400" />
        <span className="hidden sm:inline text-gray-300 text-sm">{currentTheme.name}</span>
      </button>

      {/* Theme Selector Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="z-40 fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="top-full right-0 z-50 absolute bg-black/95 shadow-2xl backdrop-blur-xl mt-2 p-4 border border-white/10 rounded-xl w-80"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="flex items-center gap-2 font-bold text-white text-lg">
                  <Palette className="w-5 h-5 text-neon-cyan" />
                  Themes
                </h3>
                <button
                  onClick={toggleDarkMode}
                  className="hover:bg-white/10 p-2 rounded-lg transition-colors"
                  title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                  {isDarkMode ? (
                    <Sun className="w-4 h-4 text-yellow-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-blue-400" />
                  )}
                </button>
              </div>

              {/* Theme Grid */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableThemes.map((theme) => (
                  <motion.button
                    key={theme.id}
                    onClick={() => {
                      setTheme(theme.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all hover:scale-[1.02] ${
                      currentTheme.id === theme.id
                        ? 'bg-white/10 border-neon-cyan/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-3">
                      {/* Color Preview */}
                      <div className="flex gap-1">
                        <div
                          className="rounded w-3 h-8"
                          style={{ backgroundColor: theme.colors.primary }}
                        />
                        <div
                          className="rounded w-3 h-8"
                          style={{ backgroundColor: theme.colors.secondary }}
                        />
                        <div
                          className="rounded w-3 h-8"
                          style={{ backgroundColor: theme.colors.accent }}
                        />
                      </div>

                      {/* Theme Info */}
                      <div className="text-left">
                        <div className="flex items-center gap-2 font-medium text-white text-sm">
                          {theme.name}
                          {theme.id === 'neon' && <Sparkles className="w-3 h-3 text-neon-cyan" />}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {theme.mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
                        </div>
                      </div>
                    </div>

                    {/* Selected Indicator */}
                    {currentTheme.id === theme.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex-shrink-0"
                      >
                        <Check className="w-5 h-5 text-neon-cyan" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-white/10 border-t">
                <p className="text-gray-500 text-xs text-center">
                  Theme preference is saved automatically
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
