const { app, BrowserWindow, tray, Menu, ipcMain, Notification } = require('electron');
const path = require('path');
const fs = require('fs');

// Load .env variables from parent directory if exists
const envPath = path.join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) process.env[key.trim()] = value.trim();
  });
}

let mainWindow;
let mainTray;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    backgroundColor: '#0a0a0f',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    frame: true, // Set to false if implementing custom title bar
    title: 'Kalashi Trading Dashboard',
    show: false
  });

  // Load app
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../build/index.html')}`;
  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open DevTools in development
  if (process.env.ELECTRON_START_URL) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'icon.png');
  if (!fs.existsSync(iconPath)) return;

  mainTray = new tray(iconPath);
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Dashboard', click: () => { if (mainWindow) mainWindow.show(); else createWindow(); } },
    { label: 'Minimize to Tray', click: () => { if (mainWindow) mainWindow.hide(); } },
    { type: 'separator' },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } }
  ]);

  mainTray.setToolTip('Kalashi Trading System');
  mainTray.setContextMenu(contextMenu);

  mainTray.on('double-click', () => {
    if (mainWindow) mainWindow.show();
    else createWindow();
  });
}

// IPC Handlers for Windows Integration
ipcMain.on('set-taskbar-progress', (event, value) => {
  if (mainWindow) mainWindow.setProgressBar(value);
});

ipcMain.on('show-alert', (event, { title, message }) => {
  new Notification({ title, body: message }).show();
});

ipcMain.handle('get-system-metrics', async () => {
  return {
    cpuUsage: Math.random() * 100, // Replace with real metrics if needed
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  };
});

app.on('ready', () => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Keep app running in tray unless explicitly quit
    if (!app.isQuitting) {
      // app.quit(); 
    }
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

