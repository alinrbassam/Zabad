import Database from 'better-sqlite3';
import { BaseRepository } from './base.repository';
import { BrandEntity } from '@shared/types';

export class BrandRepository extends BaseRepository<BrandEntity> {
  constructor(db: Database.Database) {
    super(db, 'brands');
  }

  public createBrand(brand: Partial<BrandEntity>): BrandEntity {
    const id = brand.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO brands (id, name_en, name_ar, description, logo, country_of_origin, is_active, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      brand.name_en,
      brand.name_ar,
      brand.description || null,
      brand.logo || null,
      brand.country_of_origin || null,
      brand.is_active ? 1 : 0,
      brand.notes || null,
      now,
      now,
    );

    return this.findById(id)!;
  }

  public updateBrand(brand: Partial<BrandEntity> & { id: string }): BrandEntity {
    const now = new Date().toISOString();
    const existing = this.findById(brand.id);
    if (!existing) throw new Error('Brand not found');

    const stmt = this.db.prepare(`
      UPDATE brands SET
        name_en = ?, name_ar = ?, description = ?, logo = ?,
        country_of_origin = ?, is_active = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      brand.name_en || existing.name_en,
      brand.name_ar || existing.name_ar,
      brand.description || existing.description || null,
      brand.logo || existing.logo || null,
      brand.country_of_origin || existing.country_of_origin || null,
      brand.is_active !== undefined ? (brand.is_active ? 1 : 0) : existing.is_active,
      brand.notes || existing.notes || null,
      now,
      brand.id,
    );

    return this.findById(brand.id)!;
  }
}
