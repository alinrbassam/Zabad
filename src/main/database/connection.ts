import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { logger } from '../services/logger.service';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private rawDb: Database.Database;
  private proxyDb: Database.Database;
  private dbPath: string;

  private constructor() {
    const userDataPath = app ? app.getPath('userData') : process.cwd();
    const dbDir = path.join(userDataPath, 'database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    this.dbPath = path.join(dbDir, 'zabad.db');

    logger.info('DatabaseConnection', `Connecting to SQLite database at: ${this.dbPath}`);
    this.rawDb = new Database(this.dbPath);
    this.configure(this.rawDb);

    this.proxyDb = new Proxy({} as Database.Database, {
      get: (_target, prop) => {
        const val = (this.rawDb as any)[prop];
        if (typeof val === 'function') {
          return val.bind(this.rawDb);
        }
        return val;
      },
    });
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public getDatabase(): Database.Database {
    return this.proxyDb;
  }

  public getRawDatabase(): Database.Database {
    return this.rawDb;
  }

  public getDbPath(): string {
    return this.dbPath;
  }

  public reloadDatabase(newDbPath?: string): void {
    logger.info('DatabaseConnection', 'Reloading database connection...');
    try {
      if (this.rawDb) {
        try {
          this.rawDb.pragma('wal_checkpoint(TRUNCATE)');
        } catch {
          // ignore
        }
        this.rawDb.close();
      }

      if (newDbPath && fs.existsSync(newDbPath) && newDbPath !== this.dbPath) {
        const backupPath = `${this.dbPath}.bak`;
        try {
          if (fs.existsSync(this.dbPath)) {
            fs.copyFileSync(this.dbPath, backupPath);
          }
        } catch (e) {
          logger.warn('DatabaseConnection', 'Could not create .bak backup before swap', e);
        }
        fs.copyFileSync(newDbPath, this.dbPath);
      }

      this.rawDb = new Database(this.dbPath);
      this.configure(this.rawDb);
      logger.info('DatabaseConnection', 'Database reloaded successfully.');
    } catch (err) {
      logger.error('DatabaseConnection', 'Failed to reload database', err);
      throw err;
    }
  }

  private configure(db: Database.Database): void {
    try {
      db.pragma('journal_mode = WAL');
      db.pragma('foreign_keys = ON');
      db.pragma('synchronous = NORMAL');
    } catch (err) {
      logger.error('DatabaseConnection', 'Failed configuring SQLite pragmas', err);
    }
  }

  public close(): void {
    if (this.rawDb) {
      logger.info('DatabaseConnection', 'Closing database connection');
      this.rawDb.close();
    }
  }
}
