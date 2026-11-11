import Database from 'better-sqlite3';
import { logger } from '../../services/logger.service';

export const migrationV9 = {
  version: 9,
  name: 'weight_and_packaging_v9',
  sql: `
    -- Schema update for weight and packaging units (columns ensured idempotently via ensureWeightColumns)
  `,
};

export function isMissingWeightColumnError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes('no column named piece_weight') ||
    msg.includes('no column named pieces_per_pack') ||
    msg.includes('no such column: piece_weight') ||
    msg.includes('no such column: pieces_per_pack') ||
    msg.includes('no such column: p.piece_weight') ||
    msg.includes('no such column: p.pieces_per_pack') ||
    msg.includes('no column named selling_mode') ||
    msg.includes('no column named unit_weight') ||
    msg.includes('no column named total_weight') ||
    msg.includes('no such column: selling_mode') ||
    msg.includes('no such column: unit_weight') ||
    msg.includes('no such column: total_weight')
  );
}

export function ensureWeightColumns(db: Database.Database): void {
  // 1. Products table
  try {
    const prodCols = db.prepare(`PRAGMA table_info(products)`).all() as Array<{ name: string }>;
    if (prodCols.length > 0) {
      const prodColNames = new Set(prodCols.map((c) => c.name));

      if (!prodColNames.has('piece_weight')) {
        db.exec(`ALTER TABLE products ADD COLUMN piece_weight REAL DEFAULT 0`);
      }
      if (!prodColNames.has('pieces_per_pack')) {
        db.exec(`ALTER TABLE products ADD COLUMN pieces_per_pack INTEGER DEFAULT 1`);
      }
    }
  } catch (err) {
    logger.error('MigrationV9', 'Failed ensuring weight columns on products table', err);
  }

  // 2. Sales order items table
  try {
    const soiCols = db
      .prepare(`PRAGMA table_info(sales_order_items)`)
      .all() as Array<{ name: string }>;
    if (soiCols.length > 0) {
      const soiColNames = new Set(soiCols.map((c) => c.name));

      if (!soiColNames.has('selling_mode')) {
        db.exec(`ALTER TABLE sales_order_items ADD COLUMN selling_mode TEXT DEFAULT 'pack'`);
      }
      if (!soiColNames.has('piece_weight')) {
        db.exec(`ALTER TABLE sales_order_items ADD COLUMN piece_weight REAL DEFAULT 0`);
      }
      if (!soiColNames.has('pieces_per_pack')) {
        db.exec(`ALTER TABLE sales_order_items ADD COLUMN pieces_per_pack INTEGER DEFAULT 1`);
      }
      if (!soiColNames.has('unit_weight')) {
        db.exec(`ALTER TABLE sales_order_items ADD COLUMN unit_weight REAL DEFAULT 0`);
      }
      if (!soiColNames.has('total_weight')) {
        db.exec(`ALTER TABLE sales_order_items ADD COLUMN total_weight REAL DEFAULT 0`);
      }
    }
  } catch (err) {
    logger.error('MigrationV9', 'Failed ensuring weight columns on sales_order_items table', err);
  }
}
