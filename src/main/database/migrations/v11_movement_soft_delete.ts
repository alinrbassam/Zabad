import Database from 'better-sqlite3';

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
    const colNames = new Set(cols.map((c) => c.name));

    if (!colNames.has('deleted_at')) {
      db.exec(`ALTER TABLE inventory_movements ADD COLUMN deleted_at DATETIME NULL`);
    }
    if (!colNames.has('updated_at')) {
      db.exec(`ALTER TABLE inventory_movements ADD COLUMN updated_at DATETIME NULL`);
    }
  } catch {
    // Ignore if table doesn't exist yet
  }
}
