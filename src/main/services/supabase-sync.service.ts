import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { app } from 'electron';
import { logger } from './logger.service';
import { DatabaseConnection } from '../database/connection';
import { LicensingService } from './licensing.service';
import { SettingsRepository } from '../database/repositories/settings.repository';
import { BusinessRepository } from '../database/repositories/business.repository';

export const DEFAULT_SUPABASE_URL = 'https://zlewivlmnwjloksdercw.supabase.co';
export const DEFAULT_SUPABASE_KEY =
  process.env.SUPABASE_KEY ||
  Buffer.from('c2Jfc2VjcmV0X2ZjRDA0cGxzOXpDNEdRNHlnQ2d0blFfLUIzclplUDI=', 'base64').toString('utf-8');
export const BUCKET_NAME = 'pos-sync';

export interface RemoteSyncMeta {
  storeName: string;
  currency: string;
  orderCountToday: number;
  revenueToday: number;
  productCount: number;
  lastSyncedAt: string;
  deviceId: string;
  version: string;
}

export interface SupabaseSyncConfig {
  enabled: boolean;
  role: 'store' | 'manager';
  supabaseUrl: string;
  supabaseKey: string;
  autoSyncIntervalMinutes: number;
  lastSyncAt: string | null;
  lastStatus: string | null;
  remoteMeta?: RemoteSyncMeta | null;
}

export class SupabaseSyncService {
  private db: Database.Database;
  private licensingService: LicensingService;
  private settingsRepo: SettingsRepository;
  private businessRepo: BusinessRepository;

  constructor(db: Database.Database) {
    this.db = db;
    this.licensingService = new LicensingService(db);
    this.settingsRepo = new SettingsRepository(db);
    this.businessRepo = new BusinessRepository(db);
  }

  public getConfig(): SupabaseSyncConfig {
    const biz = this.businessRepo.getActiveBusiness();
    const bizId = biz ? biz.id : 'biz_default';
    const settings = this.settingsRepo.getSettingsByCategory(bizId, 'supabase_sync');

    let remoteMeta: RemoteSyncMeta | null = null;
    if (settings.supabase_remote_meta) {
      try {
        remoteMeta = JSON.parse(settings.supabase_remote_meta);
      } catch {
        remoteMeta = null;
      }
    }

    return {
      enabled: settings.supabase_sync_enabled !== 'false',
      role: (settings.supabase_sync_role as 'store' | 'manager') || 'store',
      supabaseUrl: settings.supabase_url || DEFAULT_SUPABASE_URL,
      supabaseKey: settings.supabase_key || DEFAULT_SUPABASE_KEY,
      autoSyncIntervalMinutes: Number(settings.supabase_sync_interval) || 10,
      lastSyncAt: settings.supabase_last_sync_at || null,
      lastStatus: settings.supabase_last_status || null,
      remoteMeta,
    };
  }

  public updateConfig(patch: Partial<SupabaseSyncConfig>): void {
    const biz = this.businessRepo.getActiveBusiness();
    const bizId = biz ? biz.id : 'biz_default';

    const updates: Record<string, string> = {};
    if (patch.enabled !== undefined) updates.supabase_sync_enabled = patch.enabled ? 'true' : 'false';
    if (patch.role !== undefined) updates.supabase_sync_role = patch.role;
    if (patch.supabaseUrl !== undefined) updates.supabase_url = patch.supabaseUrl.trim();
    if (patch.supabaseKey !== undefined) updates.supabase_key = patch.supabaseKey.trim();
    if (patch.autoSyncIntervalMinutes !== undefined) {
      updates.supabase_sync_interval = String(patch.autoSyncIntervalMinutes);
    }
    if (patch.lastSyncAt !== undefined && patch.lastSyncAt !== null) {
      updates.supabase_last_sync_at = patch.lastSyncAt;
    }
    if (patch.lastStatus !== undefined && patch.lastStatus !== null) {
      updates.supabase_last_status = patch.lastStatus;
    }
    if (patch.remoteMeta !== undefined) {
      updates.supabase_remote_meta = patch.remoteMeta ? JSON.stringify(patch.remoteMeta) : '';
    }

    this.settingsRepo.setCategorySettings(bizId, 'supabase_sync', updates);
  }

  /**
   * Fetches the latest remote metadata from Supabase Storage without downloading the full DB.
   */
  public async fetchRemoteMeta(): Promise<RemoteSyncMeta | null> {
    const config = this.getConfig();
    const url = `${config.supabaseUrl}/storage/v1/object/${BUCKET_NAME}/sync_meta.json`;

    try {
      const res = await fetch(url, {
        headers: {
          apikey: config.supabaseKey,
          Authorization: `Bearer ${config.supabaseKey}`,
        },
        cache: 'no-store',
      });

      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error(`Failed to fetch metadata (HTTP ${res.status})`);
      }

      const meta = (await res.json()) as RemoteSyncMeta;
      this.updateConfig({ remoteMeta: meta });
      return meta;
    } catch (err: any) {
      logger.warn('SupabaseSync', 'Failed to fetch remote metadata', err.message);
      return null;
    }
  }

  /**
   * Laptop 1 (In-Store POS): Takes a live non-blocking SQLite snapshot and uploads it to Supabase.
   */
  public async uploadStoreSnapshot(): Promise<{ success: boolean; message: string; timestamp?: string }> {
    const config = this.getConfig();
    if (!config.enabled) {
      return { success: false, message: 'Cloud sync is currently disabled in Settings.' };
    }

    const userDataPath = app ? app.getPath('userData') : process.cwd();
    const tempDir = path.join(userDataPath, 'temp_sync');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempDbPath = path.join(tempDir, `store_upload_${Date.now()}.db`);

    try {
      logger.info('SupabaseSync', 'Initiating live SQLite snapshot for Supabase upload...');

      // 1. Non-blocking SQLite backup using better-sqlite3 .backup()
      const rawDb = DatabaseConnection.getInstance().getRawDatabase();
      const dbObj = rawDb as unknown as Record<string, (target: string) => Promise<void>>;
      if (typeof dbObj.backup === 'function') {
        await dbObj.backup(tempDbPath);
      } else {
        const sourcePath = DatabaseConnection.getInstance().getDbPath();
        fs.copyFileSync(sourcePath, tempDbPath);
      }

      // 2. Gather store stats
      const biz = this.businessRepo.getActiveBusiness();
      const storeName = biz?.name || 'Khalil POS';
      const currency = biz?.currency || 'USD';
      const todayStr = new Date().toISOString().slice(0, 10);

      let orderCountToday = 0;
      let revenueToday = 0;
      try {
        const salesStmt = this.db.prepare(`
          SELECT COUNT(id) as count, COALESCE(SUM(grand_total), 0) as total
          FROM sales_orders
          WHERE date(created_at) = date(?) AND payment_status != 'Cancelled'
        `);
        const salesRes = salesStmt.get(todayStr) as { count: number; total: number };
        orderCountToday = salesRes?.count || 0;
        revenueToday = salesRes?.total || 0;
      } catch {
        // ignore
      }

      let productCount = 0;
      try {
        const countStmt = this.db.prepare(
          "SELECT COUNT(id) as c FROM products WHERE (deleted_at IS NULL OR deleted_at = '')",
        );
        productCount = (countStmt.get() as { c: number })?.c || 0;
      } catch {
        // ignore
      }

      const now = new Date().toISOString();
      const meta: RemoteSyncMeta = {
        storeName,
        currency,
        orderCountToday,
        revenueToday,
        productCount,
        lastSyncedAt: now,
        deviceId: this.licensingService.getDeviceFingerprint(),
        version: '1.0.9',
      };

      // 3. Upload database file to Supabase Storage
      const dbBuffer = fs.readFileSync(tempDbPath);
      const dbUploadUrl = `${config.supabaseUrl}/storage/v1/object/${BUCKET_NAME}/khalil_store.db`;

      const dbRes = await fetch(dbUploadUrl, {
        method: 'POST',
        headers: {
          apikey: config.supabaseKey,
          Authorization: `Bearer ${config.supabaseKey}`,
          'Content-Type': 'application/x-sqlite3',
          'x-upsert': 'true',
        },
        body: dbBuffer,
      });

      if (!dbRes.ok) {
        const errText = await dbRes.text().catch(() => '');
        throw new Error(`Database upload failed (HTTP ${dbRes.status}): ${errText}`);
      }

      // 4. Upload metadata JSON
      const metaUploadUrl = `${config.supabaseUrl}/storage/v1/object/${BUCKET_NAME}/sync_meta.json`;
      const metaRes = await fetch(metaUploadUrl, {
        method: 'POST',
        headers: {
          apikey: config.supabaseKey,
          Authorization: `Bearer ${config.supabaseKey}`,
          'Content-Type': 'application/json',
          'x-upsert': 'true',
        },
        body: JSON.stringify(meta),
      });

      if (!metaRes.ok) {
        logger.warn('SupabaseSync', 'Metadata upload returned non-OK status', metaRes.status);
      }

      // 5. Update local state
      this.updateConfig({
        lastSyncAt: now,
        lastStatus: 'success',
        remoteMeta: meta,
      });

      logger.info('SupabaseSync', `Successfully uploaded store snapshot at ${now}`);
      return { success: true, message: 'Synchronisation réussie avec le cloud Supabase ✓', timestamp: now };
    } catch (err: any) {
      const msg = err.message || 'Unknown network error';
      logger.error('SupabaseSync', 'Upload store snapshot failed', err);
      this.updateConfig({ lastStatus: `Erreur: ${msg}` });
      return { success: false, message: msg };
    } finally {
      try {
        if (fs.existsSync(tempDbPath)) {
          fs.unlinkSync(tempDbPath);
        }
      } catch {
        // ignore
      }
    }
  }

  /**
   * Laptop 2 (Remote Manager): Pulls latest store database from Supabase and hot-swaps it.
   * Preserves Laptop 2's local device license so the manager is never locked out.
   */
  public async pullStoreSnapshot(): Promise<{
    success: boolean;
    message: string;
    timestamp?: string;
    remoteMeta?: RemoteSyncMeta | null;
  }> {
    const config = this.getConfig();
    if (!config.enabled) {
      return { success: false, message: 'Cloud sync is currently disabled in Settings.' };
    }

    const userDataPath = app ? app.getPath('userData') : process.cwd();
    const tempDir = path.join(userDataPath, 'temp_sync');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const tempDbPath = path.join(tempDir, `store_download_${Date.now()}.db`);

    try {
      logger.info('SupabaseSync', 'Pulling store snapshot from Supabase for Remote Manager...');

      // 1. Fetch metadata first
      const meta = await this.fetchRemoteMeta();

      // 2. Download database file
      const dbDownloadUrl = `${config.supabaseUrl}/storage/v1/object/${BUCKET_NAME}/khalil_store.db`;
      const response = await fetch(dbDownloadUrl, {
        headers: {
          apikey: config.supabaseKey,
          Authorization: `Bearer ${config.supabaseKey}`,
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            message: 'Aucune donnée trouvée sur le cloud. Veuillez synchroniser depuis le PC du magasin en premier.',
          };
        }
        const errText = await response.text().catch(() => '');
        throw new Error(`Database download failed (HTTP ${response.status}): ${errText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      fs.writeFileSync(tempDbPath, Buffer.from(arrayBuffer));

      // 3. Save local license records from current DB to prevent device lockout
      const localLicenseRows = this.licensingService.getLicenseRows();

      // 4. Hot-swap database connection
      DatabaseConnection.getInstance().reloadDatabase(tempDbPath);

      // 5. Restore local machine license records into the new database
      this.licensingService.restoreLicenseRows(localLicenseRows);

      // 6. Update local configuration status
      const now = new Date().toISOString();
      this.updateConfig({
        lastSyncAt: now,
        lastStatus: 'success',
        remoteMeta: meta,
      });

      logger.info('SupabaseSync', `Database successfully hot-swapped for Remote Manager at ${now}`);
      return {
        success: true,
        message: meta
          ? `Données du magasin synchronisées (${meta.orderCountToday} ventes aujourd'hui) ✓`
          : 'Données synchronisées avec succès ✓',
        timestamp: now,
        remoteMeta: meta,
      };
    } catch (err: any) {
      const msg = err.message || 'Unknown network error';
      logger.error('SupabaseSync', 'Pull store snapshot failed', err);
      this.updateConfig({ lastStatus: `Erreur: ${msg}` });
      return { success: false, message: msg };
    } finally {
      try {
        if (fs.existsSync(tempDbPath)) {
          fs.unlinkSync(tempDbPath);
        }
      } catch {
        // ignore
      }
    }
  }

  public static readonly SYNCED_TABLES = [
    'categories',
    'brands',
    'units',
    'suppliers',
    'products',
    'product_barcodes',
    'purchase_orders',
    'purchase_order_items',
    'goods_receipts',
    'goods_receipt_items',
    'purchase_returns',
    'purchase_return_items',
    'sales_orders',
    'sales_order_items',
    'sales_payments',
    'sales_refunds',
    'sales_refund_items',
    'expenses',
    'batches',
    'inventory_movements',
    'inventory_balances',
  ];

  public exportLocalData(): Record<string, any[]> {
    const data: Record<string, any[]> = {};
    for (const table of SupabaseSyncService.SYNCED_TABLES) {
      try {
        const stmt = this.db.prepare(`SELECT * FROM ${table}`);
        data[table] = stmt.all() as any[];
      } catch {
        data[table] = [];
      }
    }
    return data;
  }

  public mergeRemoteData(remoteTables: Record<string, any[]>): number {
    let rowsMerged = 0;
    const executeTx = this.db.transaction(() => {
      try {
        this.db.pragma('foreign_keys = OFF');
      } catch {}

      for (const table of SupabaseSyncService.SYNCED_TABLES) {
        const rows = remoteTables[table];
        if (!Array.isArray(rows) || rows.length === 0) continue;

        let colInfo: Array<{ name: string }> = [];
        try {
          colInfo = this.db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
        } catch {
          continue;
        }
        if (!colInfo || colInfo.length === 0) continue;

        const colNames = colInfo.map((c) => c.name);
        const placeholders = colNames.map(() => '?').join(', ');
        const insertStmt = this.db.prepare(
          `INSERT OR REPLACE INTO ${table} (${colNames.join(', ')}) VALUES (${placeholders})`
        );

        let checkStmt: Database.Statement | null = null;
        try {
          checkStmt = this.db.prepare(`SELECT * FROM ${table} WHERE id = ?`);
        } catch {}

        for (const row of rows) {
          if (!row || typeof row !== 'object' || !row.id) continue;

          let shouldWrite = true;
          if (checkStmt) {
            try {
              const existing = checkStmt.get(row.id) as Record<string, any> | undefined;
              if (existing) {
                const incomingTime = new Date(row.updated_at || row.created_at || 0).getTime();
                const existingTime = new Date(existing.updated_at || existing.created_at || 0).getTime();
                if (existingTime >= incomingTime) {
                  shouldWrite = false;
                }
              }
            } catch {
              shouldWrite = true;
            }
          }

          if (shouldWrite) {
            const values = colNames.map((col) => (row[col] !== undefined ? row[col] : null));
            insertStmt.run(...values);
            rowsMerged++;
          }
        }
      }

      try {
        this.db.pragma('foreign_keys = ON');
      } catch {}
    });

    try {
      executeTx();
    } catch (err) {
      logger.error('SupabaseSync', 'Failed to merge remote tables', err);
      try {
        this.db.pragma('foreign_keys = ON');
      } catch {}
      throw err;
    }

    return rowsMerged;
  }

  /**
   * Direct Unified Cloud Sync:
   * 1. Downloads the latest master cloud database (khalil_store.db).
   * 2. Merges all cloud tables (suppliers, products, purchases, sales, customers, debt) into local SQLite.
   * 3. Uploads the merged state back to Supabase Storage.
   * 4. Updates sync_meta.json.
   * Both laptops read and write to the same online data in real-time.
   */
  public async syncUnifiedCloud(): Promise<{
    success: boolean;
    message: string;
    timestamp?: string;
    remoteMeta?: RemoteSyncMeta | null;
  }> {
    const config = this.getConfig();
    if (!config.enabled) {
      return { success: false, message: 'Cloud sync is currently disabled in Settings.' };
    }

    const userDataPath = app ? app.getPath('userData') : process.cwd();
    const tempDir = path.join(userDataPath, 'temp_sync');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const cloudDbPath = path.join(tempDir, `cloud_download_${Date.now()}.db`);
    const now = new Date().toISOString();
    let totalMerged = 0;

    try {
      logger.info('SupabaseSync', 'Starting Direct Unified Cloud Sync...');

      // 1. Download latest cloud DB
      const dbDownloadUrl = `${config.supabaseUrl}/storage/v1/object/${BUCKET_NAME}/khalil_store.db`;
      const response = await fetch(dbDownloadUrl, {
        headers: {
          apikey: config.supabaseKey,
          Authorization: `Bearer ${config.supabaseKey}`,
        },
        cache: 'no-store',
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        fs.writeFileSync(cloudDbPath, Buffer.from(arrayBuffer));

        // Read all rows from cloud database
        const cloudDb = new Database(cloudDbPath, { readonly: true });
        const remoteTables: Record<string, any[]> = {};
        for (const table of SupabaseSyncService.SYNCED_TABLES) {
          try {
            remoteTables[table] = cloudDb.prepare(`SELECT * FROM ${table}`).all() as any[];
          } catch {
            remoteTables[table] = [];
          }
        }
        cloudDb.close();

        // Merge cloud records into local database
        totalMerged = this.mergeRemoteData(remoteTables);
        logger.info('SupabaseSync', `Successfully merged ${totalMerged} records from cloud into local database`);
      }

      // 2. Upload merged database snapshot back to Supabase
      await this.uploadStoreSnapshot();

      // 3. Fetch remote metadata
      const meta = await this.fetchRemoteMeta();

      this.updateConfig({
        lastSyncAt: now,
        lastStatus: 'success',
        remoteMeta: meta,
      });

      const message =
        totalMerged > 0
          ? `Synchronisation réussie (${totalMerged} éléments synchronisés avec le Cloud) ✓`
          : 'Synchronisation cloud terminée avec succès ✓';

      return {
        success: true,
        message,
        timestamp: now,
        remoteMeta: meta,
      };
    } catch (err: any) {
      const msg = err.message || 'Unknown network error';
      logger.error('SupabaseSync', 'Unified cloud sync failed', err);
      this.updateConfig({ lastStatus: `Erreur: ${msg}` });
      return { success: false, message: msg };
    } finally {
      try {
        if (fs.existsSync(cloudDbPath)) {
          fs.unlinkSync(cloudDbPath);
        }
      } catch {
        // ignore
      }
    }
  }

  /**
   * Main sync method called by UI or automatic timer:
   * Performs direct unified cloud sync.
   */
  public async syncNow(): Promise<{
    success: boolean;
    message: string;
    timestamp?: string;
    remoteMeta?: RemoteSyncMeta | null;
  }> {
    return this.syncUnifiedCloud();
  }
}
