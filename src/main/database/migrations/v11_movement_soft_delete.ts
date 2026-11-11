import Database from 'better-sqlite3';
import { logger } from '../../services/logger.service';

export const migrationV11 = {
  version: 11,
  name: 'inventory_movement_soft_delete_v11',
  sql: `
    -- Track soft deletion on inventory_movements so deletions stay deleted across cloud sync
  `,
};

export function ensureMovementDeleteColumns(db: Database.Database): void {
  try {
    const cols = db.prepare(`PRAGMA table_info(inventory_movements)`).all() as Array<{ name: string }>;
    if (cols.length === 0) return;

    const colNames = new Set(cols.map((c) => c.name));

    if (!colNames.has('deleted_at')) {
      db.exec(`ALTER TABLE inventory_movements ADD COLUMN deleted_at DATETIME NULL`);
    }
    if (!colNames.has('updated_at')) {
      db.exec(`ALTER TABLE inventory_movements ADD COLUMN updated_at DATETIME NULL`);
    }
  } catch (err) {
    logger.error('MigrationV11', 'Failed ensuring movement soft-delete columns', err);
  }
}
