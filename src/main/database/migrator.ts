import Database from 'better-sqlite3';
import { logger } from '../services/logger.service';

export interface Migration {
  id: number;
  name: string;
  sql: string;
}

export class DatabaseMigrator {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public initMigrationTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version INTEGER NOT NULL UNIQUE,
        name TEXT NOT NULL,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  public getAppliedVersions(): number[] {
    this.initMigrationTable();
    const rows = this.db
      .prepare('SELECT version FROM schema_migrations ORDER BY version ASC')
      .all() as Array<{
      version: number;
    }>;
    return rows.map((r) => r.version);
  }

  public runMigrations(migrations: Array<{ version: number; name: string; sql: string }>): void {
    this.initMigrationTable();
    const applied = new Set(this.getAppliedVersions());

    for (const mig of migrations) {
      if (!applied.has(mig.version)) {
        logger.info('DatabaseMigrator', `Applying migration v${mig.version}: ${mig.name}`);
        const executeTransaction = this.db.transaction(() => {
          this.db.exec(mig.sql);
          this.db
            .prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)')
            .run(mig.version, mig.name);
        });

        try {
          executeTransaction();
          logger.info('DatabaseMigrator', `Successfully applied migration v${mig.version}`);
        } catch (err) {
          logger.error('DatabaseMigrator', `Failed applying migration v${mig.version}`, err);
          throw err;
        }
      }
    }
  }
}
