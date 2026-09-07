export const migrationV2 = {
  version: 2,
  name: 'auth_business_and_settings_v2',
  sql: `
    -- 1. Businesses Table
    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      logo TEXT NULL,
      tax_number TEXT NULL,
      phone TEXT NULL,
      email TEXT NULL,
      website TEXT NULL,
      address TEXT NULL,
      city TEXT NULL,
      country TEXT NULL,
      currency TEXT NOT NULL DEFAULT 'FCFA',
      timezone TEXT NOT NULL DEFAULT 'UTC',
      date_format TEXT NOT NULL DEFAULT 'DD-MM-YYYY',
      time_format TEXT NOT NULL DEFAULT '24h',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL
    );

    -- 2. Business Settings Table (Key-Value per Category)
    CREATE TABLE IF NOT EXISTS business_settings (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      category TEXT NOT NULL,
      key TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id),
      UNIQUE(business_id, category, key)
    );

    -- 3. Permissions Table
    CREATE TABLE IF NOT EXISTS permissions (
      id TEXT PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      module TEXT NOT NULL,
      description TEXT NULL
    );

    -- 4. Roles Table (Updating baseline roles)
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT NULL,
      is_system INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL
    );

    -- 5. Role Permissions Junction
    CREATE TABLE IF NOT EXISTS role_permissions (
      role_id TEXT NOT NULL,
      permission_id TEXT NOT NULL,
      PRIMARY KEY (role_id, permission_id),
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    );

    -- 6. Users Table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      pin_code_hash TEXT NULL,
      phone TEXT NULL,
      email TEXT NULL,
      role_id TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      must_change_password INTEGER DEFAULT 0,
      password_last_changed DATETIME DEFAULT CURRENT_TIMESTAMP,
      failed_login_attempts INTEGER DEFAULT 0,
      locked_until DATETIME NULL,
      notes TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME NULL,
      FOREIGN KEY (role_id) REFERENCES roles(id)
    );
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

    -- 7. Security Questions Table
    CREATE TABLE IF NOT EXISTS security_questions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      question TEXT NOT NULL,
      answer_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 8. User Preferences Table
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY,
      theme TEXT DEFAULT 'system',
      language TEXT DEFAULT 'en',
      date_format TEXT DEFAULT 'DD-MM-YYYY',
      time_format TEXT DEFAULT '24h',
      notifications_enabled INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 9. Sessions Table
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      is_active INTEGER DEFAULT 1,
      ip_address TEXT NULL,
      device_info TEXT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

    -- 10. Audit Logs Table
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NULL,
      username TEXT NULL,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      details TEXT NULL,
      ip_address TEXT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);

    -- 11. Login History Table
    CREATE TABLE IF NOT EXISTS login_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NULL,
      username TEXT NOT NULL,
      status TEXT NOT NULL,
      ip_address TEXT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 12. Notification Settings Table
    CREATE TABLE IF NOT EXISTS notification_settings (
      user_id TEXT PRIMARY KEY,
      email_alerts INTEGER DEFAULT 1,
      desktop_alerts INTEGER DEFAULT 1,
      sound_enabled INTEGER DEFAULT 1,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `,
};
