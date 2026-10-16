import Database from 'better-sqlite3';

export const migrationV10 = {
  version: 10,
  name: 'simplify_units_v10',
  sql: `
    -- 1. Migrate any existing products pointing to 'box' or 'pack' to 'carton'
    UPDATE products 
    SET base_unit_id = '3d632883-8a79-4c4a-acd8-c3b3751f030b' 
    WHERE base_unit_id IN ('a624a0e8-3b09-49c9-a6ba-669337912adf', '79a4a165-841c-4652-b2f3-e5cb41694880');

    -- 2. Deactivate redundant units: Gram, Milliliter, Liter, Box, Pack
    UPDATE units SET is_active = 0 WHERE code IN ('g', 'ml', 'l', 'box', 'pack');

    -- 3. Ensure essential retail units are active: Piece, Carton, Kilogram, Meter
    UPDATE units SET is_active = 1 WHERE code IN ('pcs', 'carton', 'kg', 'm');

    -- 4. Clean up arabic label for Piece and Kilogram
    UPDATE units SET name_ar = 'قطعة' WHERE code = 'pcs';
    UPDATE units SET name_ar = 'كيلوغرام' WHERE code = 'kg';
  `,
};

export function ensureCleanUnits(db: Database.Database): void {
  try {
    // 1. Update any products referencing box or pack to carton
    db.prepare(`
      UPDATE products 
      SET base_unit_id = '3d632883-8a79-4c4a-acd8-c3b3751f030b' 
      WHERE base_unit_id IN ('a624a0e8-3b09-49c9-a6ba-669337912adf', '79a4a165-841c-4652-b2f3-e5cb41694880')
    `).run();

    // 2. Deactivate redundant units
    db.prepare(`
      UPDATE units SET is_active = 0 WHERE code IN ('g', 'ml', 'l', 'box', 'pack')
    `).run();

    // 3. Ensure essential units are active
    db.prepare(`
      UPDATE units SET is_active = 1 WHERE code IN ('pcs', 'carton', 'kg', 'm')
    `).run();

    // 4. Clean up labels
    db.prepare(`
      UPDATE units SET name_ar = 'قطعة' WHERE code = 'pcs'
    `).run();
    db.prepare(`
      UPDATE units SET name_ar = 'كيلوغرام' WHERE code = 'kg'
    `).run();
  } catch (err) {
    // ignore if tables not ready yet
  }
}
