import Database from 'better-sqlite3';
import { BaseRepository } from './base.repository';
import { SupplierEntity } from '@shared/types';

export class SupplierRepository extends BaseRepository<SupplierEntity> {
  constructor(db: Database.Database) {
    super(db, 'suppliers');
  }

  public createSupplier(sup: Partial<SupplierEntity>): SupplierEntity {
    const id = sup.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO suppliers (
        id, code, name, contact_person, phone, secondary_phone, email, address,
        city, country, tax_number, website, notes, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      sup.code,
      sup.name,
      sup.contact_person || null,
      sup.phone || null,
      sup.secondary_phone || null,
      sup.email || null,
      sup.address || null,
      sup.city || null,
      sup.country || null,
      sup.tax_number || null,
      sup.website || null,
      sup.notes || null,
      sup.is_active ? 1 : 0,
      now,
      now,
    );

    return this.findById(id)!;
  }

  public updateSupplier(sup: Partial<SupplierEntity> & { id: string }): SupplierEntity {
    const now = new Date().toISOString();
    const existing = this.findById(sup.id);
    if (!existing) throw new Error('Supplier not found');

    const stmt = this.db.prepare(`
      UPDATE suppliers SET
        code = ?, name = ?, contact_person = ?, phone = ?, secondary_phone = ?,
        email = ?, address = ?, city = ?, country = ?, tax_number = ?,
        website = ?, notes = ?, is_active = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      sup.code || existing.code,
      sup.name || existing.name,
      sup.contact_person || existing.contact_person || null,
      sup.phone || existing.phone || null,
      sup.secondary_phone || existing.secondary_phone || null,
      sup.email || existing.email || null,
      sup.address || existing.address || null,
      sup.city || existing.city || null,
      sup.country || existing.country || null,
      sup.tax_number || existing.tax_number || null,
      sup.website || existing.website || null,
      sup.notes || existing.notes || null,
      sup.is_active !== undefined ? (sup.is_active ? 1 : 0) : existing.is_active,
      now,
      sup.id,
    );

    return this.findById(sup.id)!;
  }
}
