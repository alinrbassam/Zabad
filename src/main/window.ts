import { app, BrowserWindow, shell } from 'electron';
import path from 'path';
import { logger } from './services/logger.service';

import fs from 'fs';

export function createMainWindow(): BrowserWindow {
  const preloadPath = path.join(__dirname, '../preload/index.js');
  logger.info('MainWindow', `Preload path: ${preloadPath}`);
  logger.info('MainWindow', `Preload path exists: ${fs.existsSync(preloadPath)}`);

  const mainWindow = new BrowserWindow({
    title: 'نظام زَبَد - Zabad POS',
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.webContents.openDevTools();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (isDev) {
    mainWindow.loadURL('http://localhost:3000').catch(() => {
      mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  logger.info('MainWindow', 'Created main application window');
  return mainWindow;
}
