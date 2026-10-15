import Database from 'better-sqlite3';

export const migrationV9 = {
  version: 9,
  name: 'weight_and_packaging_v9',
  sql: `
    -- Schema update for weight and packaging units
  `,
};

export function ensureWeightColumns(db: Database.Database): void {
  try {
    // 1. Products table
    const prodCols = db.prepare(`PRAGMA table_info(products)`).all() as Array<{ name: string }>;
    const prodColNames = new Set(prodCols.map((c) => c.name));

    if (!prodColNames.has('piece_weight')) {
      db.exec(`ALTER TABLE products ADD COLUMN piece_weight REAL DEFAULT 0`);
    }
    if (!prodColNames.has('pieces_per_pack')) {
      db.exec(`ALTER TABLE products ADD COLUMN pieces_per_pack INTEGER DEFAULT 1`);
    }

    // 2. Sales order items table
    const soiCols = db.prepare(`PRAGMA table_info(sales_order_items)`).all() as Array<{ name: string }>;
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
  } catch (err) {
    // If tables don't exist yet, migration will create or skip safely
  }
}
