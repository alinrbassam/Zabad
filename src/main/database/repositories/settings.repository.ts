import Database from 'better-sqlite3';

export interface SettingItem {
  id: string;
  business_id: string;
  category: string;
  key: string;
  value: string;
}

export class SettingsRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public getSettingsByCategory(businessId: string, category: string): Record<string, string> {
    const stmt = this.db.prepare(
      `SELECT key, value FROM business_settings WHERE business_id = ? AND category = ?`,
    );
    const rows = stmt.all(businessId, category) as Array<{ key: string; value: string }>;
    const result: Record<string, string> = {};
    for (const r of rows) {
      result[r.key] = r.value;
    }
    return result;
  }

  public setCategorySettings(
    businessId: string,
    category: string,
    settings: Record<string, string>,
  ): void {
    const stmt = this.db.prepare(`
      INSERT INTO business_settings (id, business_id, category, key, value, updated_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(business_id, category, key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `);

    const transaction = this.db.transaction(() => {
      for (const [key, value] of Object.entries(settings)) {
        stmt.run(crypto.randomUUID(), businessId, category, key, String(value));
      }
    });

    transaction();
  }
}
