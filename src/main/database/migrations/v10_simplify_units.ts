import Database from 'better-sqlite3';
import { logger } from '../../services/logger.service';

export const migrationV10 = {
  version: 10,
  name: 'simplify_units_v10',
  sql: `
    -- 1. Ensure 'carton' exists before remapping any products from 'box' or 'pack' (prevents FK errors on pre-seeded DBs)
    INSERT OR IGNORE INTO units (id, code, name_en, name_ar, symbol, unit_category, allow_decimals, decimal_precision, is_active)
    VALUES ('3d632883-8a79-4c4a-acd8-c3b3751f030b', 'carton', 'Carton', 'كرتونة', 'ctn', 'Packaging', 0, 0, 1);

    -- 2. Migrate any existing products pointing to 'box' or 'pack' to 'carton' safely
    UPDATE products
    SET base_unit_id = (SELECT id FROM units WHERE LOWER(code) = 'carton' LIMIT 1)
    WHERE base_unit_id IN (
      SELECT id FROM units WHERE LOWER(code) IN ('box', 'pack')
      UNION
      SELECT 'a624a0e8-3b09-49c9-a6ba-669337912adf'
      UNION
      SELECT '79a4a165-841c-4652-b2f3-e5cb41694880'
    )
      AND EXISTS (SELECT 1 FROM units WHERE LOWER(code) = 'carton');

    -- 3. Deactivate redundant units: Gram, Milliliter, Liter, Box, Pack
    UPDATE units SET is_active = 0 WHERE code IN ('g', 'ml', 'l', 'box', 'pack');

    -- 4. Ensure essential retail units are active: Piece, Carton, Kilogram, Meter
    UPDATE units SET is_active = 1 WHERE code IN ('pcs', 'carton', 'kg', 'm');

    -- 5. Clean up arabic label for Piece and Kilogram
    UPDATE units SET name_ar = 'قطعة' WHERE code = 'pcs';
    UPDATE units SET name_ar = 'كيلوغرام' WHERE code = 'kg';
  `,
};

export function ensureCleanUnits(db: Database.Database): void {
  try {
    const unitCols = db.prepare(`PRAGMA table_info(units)`).all() as Array<{ name: string }>;
    if (unitCols.length === 0) return;

    // 1. Ensure 'carton' exists so FK update never fails if UnitRepository has not run yet
    db.prepare(`
      INSERT OR IGNORE INTO units (id, code, name_en, name_ar, symbol, unit_category, allow_decimals, decimal_precision, is_active)
      VALUES ('3d632883-8a79-4c4a-acd8-c3b3751f030b', 'carton', 'Carton', 'كرتونة', 'ctn', 'Packaging', 0, 0, 1)
    `).run();

    // 2. Update any products referencing box or pack to carton (only when carton unit exists)
    const prodCols = db.prepare(`PRAGMA table_info(products)`).all() as Array<{ name: string }>;
    if (prodCols.length > 0) {
      db.prepare(`
        UPDATE products
        SET base_unit_id = (SELECT id FROM units WHERE LOWER(code) = 'carton' LIMIT 1)
        WHERE base_unit_id IN (
          SELECT id FROM units WHERE LOWER(code) IN ('box', 'pack')
          UNION
          SELECT 'a624a0e8-3b09-49c9-a6ba-669337912adf'
          UNION
          SELECT '79a4a165-841c-4652-b2f3-e5cb41694880'
        )
          AND EXISTS (SELECT 1 FROM units WHERE LOWER(code) = 'carton')
      `).run();
    }

    // 3. Deactivate redundant units
    db.prepare(`
      UPDATE units SET is_active = 0 WHERE code IN ('g', 'ml', 'l', 'box', 'pack')
    `).run();

    // 4. Ensure essential units are active
    db.prepare(`
      UPDATE units SET is_active = 1 WHERE code IN ('pcs', 'carton', 'kg', 'm')
    `).run();

    // 5. Clean up labels
    db.prepare(`
      UPDATE units SET name_ar = 'قطعة' WHERE code = 'pcs'
    `).run();
    db.prepare(`
      UPDATE units SET name_ar = 'كيلوغرام' WHERE code = 'kg'
    `).run();
  } catch (err) {
    logger.warn('MigrationV10', 'Failed ensuring clean units schema state', err);
  }
}
