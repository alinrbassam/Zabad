import Database from 'better-sqlite3';
import { UnitEntity } from '@shared/types';

export class UnitRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
    this.initDefaultUnits();
  }

  private initDefaultUnits(): void {
    const defaults = [
      {
        code: 'pcs',
        name_en: 'Piece',
        name_ar: ' قطعة',
        symbol: 'pcs',
        cat: 'Count',
        dec: 0,
        prec: 0,
      },
      {
        code: 'kg',
        name_en: 'Kilogram',
        name_ar: 'كيلوجرام',
        symbol: 'kg',
        cat: 'Weight',
        dec: 1,
        prec: 3,
      },
      { code: 'g', name_en: 'Gram', name_ar: 'جرام', symbol: 'g', cat: 'Weight', dec: 1, prec: 2 },
      { code: 'l', name_en: 'Liter', name_ar: 'لتر', symbol: 'L', cat: 'Volume', dec: 1, prec: 3 },
      {
        code: 'ml',
        name_en: 'Milliliter',
        name_ar: 'مليلتر',
        symbol: 'ml',
        cat: 'Volume',
        dec: 0,
        prec: 0,
      },
      { code: 'm', name_en: 'Meter', name_ar: 'متر', symbol: 'm', cat: 'Length', dec: 1, prec: 2 },
      {
        code: 'box',
        name_en: 'Box',
        name_ar: 'صندوق',
        symbol: 'box',
        cat: 'Packaging',
        dec: 0,
        prec: 0,
      },
      {
        code: 'carton',
        name_en: 'Carton',
        name_ar: 'كرتونة',
        symbol: 'ctn',
        cat: 'Packaging',
        dec: 0,
        prec: 0,
      },
      {
        code: 'pack',
        name_en: 'Pack',
        name_ar: 'عبوة',
        symbol: 'pk',
        cat: 'Packaging',
        dec: 0,
        prec: 0,
      },
    ];

    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO units (id, code, name_en, name_ar, symbol, unit_category, allow_decimals, decimal_precision, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    for (const u of defaults) {
      stmt.run(crypto.randomUUID(), u.code, u.name_en, u.name_ar, u.symbol, u.cat, u.dec, u.prec);
    }
  }

  public findAll(): UnitEntity[] {
    const stmt = this.db.prepare('SELECT * FROM units WHERE is_active = 1 ORDER BY name_en ASC');
    return stmt.all() as UnitEntity[];
  }

  public findById(id: string): UnitEntity | null {
    const stmt = this.db.prepare('SELECT * FROM units WHERE id = ?');
    const row = stmt.get(id);
    return (row as UnitEntity) || null;
  }

  public createUnit(unit: Partial<UnitEntity>): UnitEntity {
    const id = unit.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO units (id, code, name_en, name_ar, symbol, unit_category, allow_decimals, decimal_precision, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      unit.code,
      unit.name_en,
      unit.name_ar,
      unit.symbol,
      unit.unit_category || 'Count',
      unit.allow_decimals ? 1 : 0,
      unit.decimal_precision || 0,
      unit.is_active ? 1 : 0,
      now,
      now,
    );

    return this.findById(id)!;
  }
}
