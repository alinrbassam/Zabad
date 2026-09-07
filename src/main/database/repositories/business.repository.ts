import Database from 'better-sqlite3';
import { BaseRepository } from './base.repository';
import { BusinessEntity } from '@shared/types';
import { logger } from '../../services/logger.service';

export class BusinessRepository extends BaseRepository<BusinessEntity> {
  constructor(db: Database.Database) {
    super(db, 'businesses');
  }

  public getActiveBusiness(): BusinessEntity | null {
    try {
      const stmt = this.db.prepare(
        `SELECT * FROM ${this.tableName} WHERE (deleted_at IS NULL OR deleted_at = '') LIMIT 1`,
      );
      const row = stmt.get();
      return (row as BusinessEntity) || null;
    } catch (err) {
      logger.error('BusinessRepository', 'Error fetching active business', err);
      return null;
    }
  }

  public createBusiness(business: Partial<BusinessEntity>): BusinessEntity {
    const now = new Date().toISOString();
    const entity: BusinessEntity = {
      id: business.id || crypto.randomUUID(),
      name: business.name || 'My Enterprise Store',
      type: business.type || 'General Retail',
      logo: business.logo || '',
      tax_number: business.tax_number || '',
      phone: business.phone || '',
      email: business.email || '',
      website: business.website || '',
      address: business.address || '',
      city: business.city || '',
      country: business.country || '',
      currency: business.currency || 'USD',
      timezone: business.timezone || 'UTC',
      date_format: business.date_format || 'YYYY-MM-DD',
      time_format: business.time_format || '24h',
      created_at: now,
      updated_at: now,
    };

    const stmt = this.db.prepare(`
      INSERT INTO businesses (id, name, type, logo, tax_number, phone, email, website, address, city, country, currency, timezone, date_format, time_format, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      entity.id,
      entity.name,
      entity.type,
      entity.logo,
      entity.tax_number,
      entity.phone,
      entity.email,
      entity.website,
      entity.address,
      entity.city,
      entity.country,
      entity.currency,
      entity.timezone,
      entity.date_format,
      entity.time_format,
      entity.created_at,
      entity.updated_at,
    );

    return entity;
  }

  public updateBusiness(business: BusinessEntity): BusinessEntity {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE businesses SET
        name = ?, type = ?, logo = ?, tax_number = ?, phone = ?, email = ?,
        website = ?, address = ?, city = ?, country = ?, currency = ?,
        timezone = ?, date_format = ?, time_format = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      business.name,
      business.type,
      business.logo || '',
      business.tax_number || '',
      business.phone || '',
      business.email || '',
      business.website || '',
      business.address || '',
      business.city || '',
      business.country || '',
      business.currency,
      business.timezone,
      business.date_format,
      business.time_format,
      now,
      business.id,
    );

    return this.findById(business.id)!;
  }
}
