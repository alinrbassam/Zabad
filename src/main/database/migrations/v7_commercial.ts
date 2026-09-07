export const migrationV7 = {
  version: 7,
  name: 'commercial_features_v7',
  sql: `
    -- License Information
    CREATE TABLE IF NOT EXISTS license_info (
      id TEXT PRIMARY KEY,
      license_key TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      business_name TEXT NOT NULL,
      device_id TEXT NOT NULL,
      issue_date DATETIME NOT NULL,
      expiration_date DATETIME NULL,
      license_type TEXT NOT NULL DEFAULT 'Lifetime',
      enabled_modules_json TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'Active',
      activated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_license_status ON license_info(status);

    -- Backup Records Log
    CREATE TABLE IF NOT EXISTS backup_records (
      id TEXT PRIMARY KEY,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL DEFAULT 0,
      backup_type TEXT NOT NULL DEFAULT 'Full',
      is_automatic INTEGER NOT NULL DEFAULT 0,
      is_encrypted INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_backups_created ON backup_records(created_at);
  `,
};
