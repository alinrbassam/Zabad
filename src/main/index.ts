import { app, BrowserWindow } from 'electron';
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
import { logger } from './services/logger.service';

app.whenReady().then(() => {
  logger.info('App', 'Starting RMS Enterprise Desktop Application');

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
    ]);
    logger.info('App', 'Database migrations v2, v3, v4, v5, v6 & v7 executed successfully');
  } catch (err) {
    logger.error('App', 'Failed initializing database migrations', err);
  }

  registerIpcHandlers();
  createMainWindow();

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
