import { app, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import { createMainWindow } from './window';
import { registerIpcHandlers } from './ipc';
import { DatabaseConnection } from './database/connection';
import { DatabaseMigrator } from './database/migrator';
import { migrationV2 } from './database/migrations/v2_auth_and_settings';
import { migrationV3 } from './database/migrations/v3_inventory';
import { migrationV4 } from './database/migrations/v4_purchasing';
import { migrationV5 } from './database/migrations/v5_pos';
import { migrationV6 } from './database/migrations/v6_reports';
import { migrationV7 } from './database/migrations/v7_commercial';
import { migrationV8, ensureBorrowColumns } from './database/migrations/v8_expenses_and_borrow';
import path from 'path';
import { logger } from './services/logger.service';
import { DemoDataService } from './services/demo-data.service';

app.setName('Zabad POS');
try {
  app.commandLine.appendSwitch('lang', 'en-GB');
  const appData = app.getPath('appData');
  app.setPath('userData', path.join(appData, 'Zabad POS'));
} catch {
  // non-electron or test runner fallback
}

app.whenReady().then(() => {
  logger.info('App', 'Starting Zabad POS Seafood Desktop Application');

  try {
    const db = DatabaseConnection.getInstance().getDatabase();
    const migrator = new DatabaseMigrator(db);
    migrator.initMigrationTable();
    migrator.runMigrations([
      migrationV2,
      migrationV3,
      migrationV4,
      migrationV5,
      migrationV6,
      migrationV7,
      migrationV8,
    ]);
    ensureBorrowColumns(db);
    logger.info('App', 'Database migrations v2 through v8 executed successfully');

    const demoService = new DemoDataService(db);
    demoService.ensureZabadCatalog();
  } catch (err) {
    logger.error('App', 'Failed initializing database migrations or catalog', err);
  }

  registerIpcHandlers();
  createMainWindow();

  // Check for auto-updates when running packaged app
  if (app.isPackaged) {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      logger.warn('AutoUpdater', 'Check for updates failed', err);
    });
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  logger.info('App', 'All windows closed, quitting application');
  DatabaseConnection.getInstance().close();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

process.on('uncaughtException', (error) => {
  logger.error('App', 'Uncaught Exception detected', error);
});

process.on('unhandledRejection', (reason) => {
  logger.error('App', 'Unhandled Promise Rejection detected', reason);
});
