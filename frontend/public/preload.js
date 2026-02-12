const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  // Environment variables
  env: {
    KALSHI_API_KEY: process.env.KALSHI_API_KEY,
    BASE_URL: process.env.BASE_URL,
    NODE_ENV: process.env.NODE_ENV
  },
  // Platform info
  platform: process.platform,
  // Windows integration features
  setTaskbarProgress: (value) => ipcRenderer.send('set-taskbar-progress', value),
  setTrayTooltip: (text) => ipcRenderer.send('set-tray-tooltip', text),
  showAlert: (title, message) => ipcRenderer.send('show-alert', { title, message }),
  // System metrics (mocked if not available, but real via ipc if implemented)
  getSystemMetrics: () => ipcRenderer.invoke('get-system-metrics')
});
