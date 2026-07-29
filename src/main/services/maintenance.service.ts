import os from 'node:os';
import Database from 'better-sqlite3';
import { logger } from './logger.service';

export interface DiagnosticsMetrics {
  appVersion: string;
  electronVersion: string;
  nodeVersion: string;
  sqliteVersion: string;
  osPlatform: string;
  osRelease: string;
  totalMemoryMB: number;
  freeMemoryMB: number;
  productCount: number;
  salesCount: number;
  purchaseCount: number;
  lastBackupDate?: string | null;
}

export class MaintenanceService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public runVacuum(): boolean {
    logger.info('MaintenanceService', 'Executing VACUUM on SQLite database');
    this.db.exec('VACUUM');
    return true;
  }

  public runIntegrityCheck(): { status: string; result: string } {
    logger.info('MaintenanceService', 'Running PRAGMA integrity_check');
    const res = this.db.prepare('PRAGMA integrity_check').get() as { integrity_check: string };
    return {
      status: res.integrity_check === 'ok' ? 'Success' : 'Warning',
      result: res.integrity_check,
    };
  }

  public getDiagnostics(): DiagnosticsMetrics {
    const productRes = this.db
      .prepare('SELECT COUNT(*) as cnt FROM products WHERE deleted_at IS NULL')
      .get() as { cnt: number };
    const salesRes = this.db.prepare('SELECT COUNT(*) as cnt FROM sales_orders').get() as {
      cnt: number;
    };
    const purchaseRes = this.db.prepare('SELECT COUNT(*) as cnt FROM purchase_orders').get() as {
      cnt: number;
    };
    const lastBackup = this.db
      .prepare('SELECT created_at FROM backup_records ORDER BY created_at DESC LIMIT 1')
      .get() as { created_at: string } | undefined;
    const sqliteVer = this.db.prepare('SELECT sqlite_version() as ver').get() as { ver: string };

    return {
      appVersion: '1.0.0',
      electronVersion: process.versions.electron || 'N/A',
      nodeVersion: process.versions.node || 'N/A',
      sqliteVersion: sqliteVer.ver,
      osPlatform: os.platform(),
      osRelease: os.release(),
      totalMemoryMB: Math.round(os.totalmem() / 1024 / 1024),
      freeMemoryMB: Math.round(os.freemem() / 1024 / 1024),
      productCount: productRes.cnt || 0,
      salesCount: salesRes.cnt || 0,
      purchaseCount: purchaseRes.cnt || 0,
      lastBackupDate: lastBackup?.created_at || null,
    };
  }
}
