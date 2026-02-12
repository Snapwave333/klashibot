import { useEffect, useCallback } from 'react';
import { useTradingStore } from '../context/TradingContext';
import toast from 'react-hot-toast';

interface KeyboardShortcutsConfig {
  onNavigate?: (viewId: string) => void;
  onCommand?: (cmd: string) => void;
  onToggleSidebar?: () => void;
  onCycleLayout?: () => void;
}

export const useKeyboardShortcuts = (config: KeyboardShortcutsConfig = {}) => {
  const {
    setCurrentView,
    setBotState,
    toggleSidebar,
    sidebarCollapsed,
    setCurrentLayout,
    currentLayout,
  } = useTradingStore();

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  // Layout cycle order
  const layoutOrder = ['default', 'focus', 'split', 'cinema'];

  const cycleLayout = useCallback(() => {
    const currentIndex = layoutOrder.indexOf(currentLayout);
    const nextIndex = (currentIndex + 1) % layoutOrder.length;
    const nextLayout = layoutOrder[nextIndex];
    setCurrentLayout(nextLayout);
    toast.success(`Layout: ${nextLayout}`, { duration: 1500 });
  }, [currentLayout, setCurrentLayout]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;
      const shiftKey = e.shiftKey;

      // Ignore shortcuts when typing in input fields (except Esc)
      const isInputField =
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable);

      if (isInputField && e.key !== 'Escape') return;

      // Global shortcuts (no modifier required)
      if (e.key === 'Escape') {
        // Close any open modals, palettes, etc.
        // This is handled by individual components
        return;
      }

      // Cmd/Ctrl + Key shortcuts
      if (cmdKey && !shiftKey) {
        const shortcuts: Record<string, () => void> = {
          // Navigation shortcuts
          '1': () => {
            e.preventDefault();
            setCurrentView('ai-brain');
            if (config.onNavigate) config.onNavigate('ai-brain');
            toast.success('Neural Core', { duration: 1000, icon: '🧠' });
          },
          '2': () => {
            e.preventDefault();
            setCurrentView('paper-trading');
            if (config.onNavigate) config.onNavigate('paper-trading');
            toast.success('Portfolio View', { duration: 1000, icon: '📊' });
          },
          '3': () => {
            e.preventDefault();
            setCurrentView('risk');
            if (config.onNavigate) config.onNavigate('risk');
            toast.success('Risk Protection', { duration: 1000, icon: '⚠️' });
          },
          '4': () => {
            e.preventDefault();
            setCurrentView('logs');
            if (config.onNavigate) config.onNavigate('logs');
            toast.success('System Logs', { duration: 1000, icon: '📝' });
          },

          // Settings
          ',': () => {
            e.preventDefault();
            setCurrentView('settings');
            if (config.onNavigate) config.onNavigate('settings');
            toast.success('Settings', { duration: 1000, icon: '⚙️' });
          },

          // Bot controls
          p: () => {
            e.preventDefault();
            const newState = 'RUNNING';
            setBotState(newState);
            if (config.onCommand) config.onCommand('PLAY');
            toast.success('Bot Started', { duration: 1500, icon: '▶️' });
          },
          s: () => {
            e.preventDefault();
            const newState = 'STOPPED';
            setBotState(newState);
            if (config.onCommand) config.onCommand('STOP');
            toast.error('Bot Stopped', { duration: 1500, icon: '⏹️' });
          },

          // UI controls
          b: () => {
            e.preventDefault();
            toggleSidebar();
            const willCollapse = !sidebarCollapsed;
            toast.success(willCollapse ? 'Sidebar Collapsed' : 'Sidebar Expanded', {
              duration: 1000,
              icon: willCollapse ? '◀️' : '▶️',
            });
          },

          // Layout
          l: () => {
            e.preventDefault();
            cycleLayout();
          },

          // Refresh data
          r: () => {
            e.preventDefault();
            toast.success('Refreshing data...', { duration: 1500, icon: '🔄' });
            // Trigger data refresh
          },

          // Download/Export
          d: () => {
            e.preventDefault();
            toast.success('Exporting logs...', { duration: 1500, icon: '⬇️' });
            // Trigger log export
          },

          // Help
          '/': () => {
            e.preventDefault();
            toast.success('Keyboard Shortcuts', {
              duration: 3000,
              icon: '⌨️',
            });
            // Could open help modal
          },
        };

        const action = shortcuts[e.key.toLowerCase()];
        if (action) {
          action();
        }
      }

      // Cmd/Ctrl + Shift + Key shortcuts
      if (cmdKey && shiftKey) {
        const shiftShortcuts: Record<string, () => void> = {
          p: () => {
            e.preventDefault();
            const newState = 'PAUSED';
            setBotState(newState);
            if (config.onCommand) config.onCommand('PAUSE');
            toast('Bot Paused', { duration: 1500, icon: '⏸️' });
          },

          // Quick actions
          n: () => {
            e.preventDefault();
            toast.success('New Position', { duration: 1500, icon: '➕' });
            // Open new position dialog
          },

          w: () => {
            e.preventDefault();
            toast.success('Close Position', { duration: 1500, icon: '✖️' });
            // Open close position dialog
          },

          // Focus specific layout
          f: () => {
            e.preventDefault();
            setCurrentLayout('focus');
            toast.success('Focus Layout', { duration: 1000 });
          },

          d: () => {
            e.preventDefault();
            setCurrentLayout('default');
            toast.success('Default Layout', { duration: 1000 });
          },

          c: () => {
            e.preventDefault();
            setCurrentLayout('cinema');
            toast.success('Cinema Layout', { duration: 1000 });
          },
        };

        const action = shiftShortcuts[e.key.toLowerCase()];
        if (action) {
          action();
        }
      }
    },
    [
      isMac,
      setCurrentView,
      setBotState,
      toggleSidebar,
      sidebarCollapsed,
      setCurrentLayout,
      cycleLayout,
      config,
    ]
  );

  useEffect(() => {
    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Return utility functions
  return {
    isMac,
    formatShortcut: (shortcut: string) => {
      return isMac ? shortcut.replace('Ctrl', 'Cmd') : shortcut.replace('Cmd', 'Ctrl');
    },
  };
};

// Keyboard shortcuts reference for display
export const KEYBOARD_SHORTCUTS = {
  navigation: [
    { keys: ['Cmd+1'], description: 'Open Neural Core' },
    { keys: ['Cmd+2'], description: 'Open Portfolio' },

    { keys: ['Cmd+4'], description: 'Open System Logs' },
    { keys: ['Cmd+,'], description: 'Open Settings' },
  ],
  bot: [
    { keys: ['Cmd+P'], description: 'Start Bot' },
    { keys: ['Cmd+Shift+P'], description: 'Pause Bot' },
    { keys: ['Cmd+S'], description: 'Stop Bot' },
  ],
  ui: [
    { keys: ['Cmd+B'], description: 'Toggle Sidebar' },
    { keys: ['Cmd+L'], description: 'Cycle Layout' },
    { keys: ['Cmd+K'], description: 'Open Command Palette' },
    { keys: ['Cmd+/'], description: 'Show Keyboard Shortcuts' },
    { keys: ['Esc'], description: 'Close Modal/Dialog' },
  ],
  actions: [
    { keys: ['Cmd+R'], description: 'Refresh Data' },
    { keys: ['Cmd+D'], description: 'Export Logs' },
    { keys: ['Cmd+Shift+N'], description: 'New Position' },
    { keys: ['Cmd+Shift+W'], description: 'Close Position' },
  ],
  layouts: [
    { keys: ['Cmd+Shift+D'], description: 'Default Layout' },
    { keys: ['Cmd+Shift+F'], description: 'Focus Layout' },
    { keys: ['Cmd+Shift+C'], description: 'Cinema Layout' },
  ],
};
