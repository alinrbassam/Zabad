import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { IPC_CHANNELS } from '../../shared/ipc/channels';
import { ApiResponse } from '../../shared/types';
import { LicensingService } from '../services/licensing.service';
import { BackupService } from '../services/backup.service';
import { MaintenanceService } from '../services/maintenance.service';
import { UpdaterService } from '../services/updater.service';
import { logger } from '../services/logger.service';

export function registerCommercialIpcHandlers(db: Database.Database): void {
  const licensingService = new LicensingService(db);
  const backupService = new BackupService(db);
  const maintenanceService = new MaintenanceService(db);
  const updaterService = new UpdaterService();

  // Licensing
  ipcMain.handle(IPC_CHANNELS.LICENSING_GET_DEVICE_ID, async (): Promise<ApiResponse<string>> => {
    return { success: true, data: licensingService.getDeviceFingerprint() };
  });

  ipcMain.handle(IPC_CHANNELS.LICENSING_GET_INFO, async (): Promise<ApiResponse> => {
    return { success: true, data: licensingService.getActiveLicense() };
  });

  ipcMain.handle(IPC_CHANNELS.LICENSING_ACTIVATE_FILE, async (_, payloadStr: string): Promise<ApiResponse> => {
    try {
      const res = licensingService.activateLicensePayload(payloadStr);
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: { code: 'LICENSE_ERROR', message: (err as Error).message } };
    }
  });

  // Backup
  ipcMain.handle(IPC_CHANNELS.BACKUP_LIST, async (): Promise<ApiResponse> => {
    return { success: true, data: backupService.listBackups() };
  });

  ipcMain.handle(IPC_CHANNELS.BACKUP_CREATE_FULL, async (_, folder: string): Promise<ApiResponse> => {
    try {
      const res = await backupService.createFullBackup(folder);
      return { success: true, data: res };
    } catch (err) {
      logger.error('CommercialIPC', 'Full backup failed', err);
      return { success: false, error: { code: 'BACKUP_ERROR', message: (err as Error).message } };
    }
  });

  ipcMain.handle(IPC_CHANNELS.BACKUP_CREATE_AUTO, async (_, folder: string, retention?: number): Promise<ApiResponse> => {
    try {
      const res = await backupService.createAutoBackup(folder, retention || 7);
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: { code: 'AUTO_BACKUP_ERROR', message: (err as Error).message } };
    }
  });

  // Maintenance
  ipcMain.handle(IPC_CHANNELS.MAINTENANCE_VACUUM, async (): Promise<ApiResponse> => {
    try {
      maintenanceService.runVacuum();
      return { success: true };
    } catch (err) {
      return { success: false, error: { code: 'VACUUM_ERROR', message: (err as Error).message } };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MAINTENANCE_INTEGRITY_CHECK, async (): Promise<ApiResponse> => {
    try {
      const res = maintenanceService.runIntegrityCheck();
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: { code: 'INTEGRITY_CHECK_ERROR', message: (err as Error).message } };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MAINTENANCE_DIAGNOSTICS, async (): Promise<ApiResponse> => {
    return { success: true, data: maintenanceService.getDiagnostics() };
  });

  // Updates
  ipcMain.handle(IPC_CHANNELS.UPDATER_CHECK_GITHUB, async (): Promise<ApiResponse> => {
    try {
      const res = await updaterService.checkForUpdates();
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: { code: 'UPDATER_ERROR', message: (err as Error).message } };
    }
  });
}
