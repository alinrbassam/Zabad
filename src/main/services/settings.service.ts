import Database from 'better-sqlite3';
import { SettingsRepository } from '../database/repositories/settings.repository';
import { BusinessRepository } from '../database/repositories/business.repository';
import { AuditRepository } from '../database/repositories/audit.repository';

export class SettingsService {
  private settingsRepo: SettingsRepository;
  private businessRepo: BusinessRepository;
  private auditRepo: AuditRepository;

  constructor(db: Database.Database) {
    this.settingsRepo = new SettingsRepository(db);
    this.businessRepo = new BusinessRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  public getSectionSettings(category: string): Record<string, string> {
    const biz = this.businessRepo.getActiveBusiness();
    if (!biz) return {};

    if (category === 'general' || category === 'business') {
      return {
        name: biz.name,
        type: biz.type,
        logo: biz.logo || '',
        taxNumber: biz.tax_number || '',
        phone: biz.phone || '',
        email: biz.email || '',
        website: biz.website || '',
        address: biz.address || '',
        city: biz.city || '',
        country: biz.country || '',
        currency: biz.currency,
        timezone: biz.timezone,
        dateFormat: biz.date_format,
        timeFormat: biz.time_format,
      };
    }

    return this.settingsRepo.getSettingsByCategory(biz.id, category);
  }

  public updateSectionSettings(
    category: string,
    values: Record<string, string>,
    userId?: string,
  ): Record<string, string> {
    const biz = this.businessRepo.getActiveBusiness();
    if (!biz) throw new Error('No active business found');

    if (category === 'general' || category === 'business') {
      this.businessRepo.updateBusiness({
        ...biz,
        name: values.name || biz.name,
        type: values.type || biz.type,
        logo: values.logo || biz.logo,
        tax_number: values.taxNumber || biz.tax_number,
        phone: values.phone || biz.phone,
        email: values.email || biz.email,
        website: values.website || biz.website,
        address: values.address || biz.address,
        city: values.city || biz.city,
        country: values.country || biz.country,
        currency: values.currency || biz.currency,
        timezone: values.timezone || biz.timezone,
        date_format: values.dateFormat || biz.date_format,
        time_format: values.timeFormat || biz.time_format,
      });
    } else {
      this.settingsRepo.setCategorySettings(biz.id, category, values);
    }

    this.auditRepo.logAction({
      user_id: userId,
      action: 'SETTINGS_UPDATED',
      module: 'Settings',
      details: `Updated ${category} settings section`,
    });

    return this.getSectionSettings(category);
  }
}
