import Database from 'better-sqlite3';
import { logger } from '../../services/logger.service';

export const migrationV13 = {
  version: 13,
  name: 'sales_order_soft_delete_v13',
  sql: `
    -- Track soft deletion on sales_orders so reset/deleted test sales stay deleted across cloud sync
  `,
};

export function ensureSalesOrderDeleteColumns(db: Database.Database): void {
  try {
    const cols = db.prepare(`PRAGMA table_info(sales_orders)`).all() as Array<{ name: string }>;
    if (cols.length === 0) return;

    const colNames = new Set(cols.map((c) => c.name));

    if (!colNames.has('deleted_at')) {
      db.exec(`ALTER TABLE sales_orders ADD COLUMN deleted_at DATETIME NULL`);
    }
    if (!colNames.has('updated_at')) {
      db.exec(`ALTER TABLE sales_orders ADD COLUMN updated_at DATETIME NULL`);
    }
  } catch (err) {
    logger.error('MigrationV13', 'Failed ensuring sales_orders soft-delete columns', err);
  }
}
