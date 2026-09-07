import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';
import { logger } from '../services/logger.service';

export class DatabaseConnection {
  private static instance: DatabaseConnection;
  private db: Database.Database;

  private constructor() {
    const userDataPath = app ? app.getPath('userData') : process.cwd();
    const dbDir = path.join(userDataPath, 'database');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    const dbPath = path.join(dbDir, 'zabad.db');

    logger.info('DatabaseConnection', `Connecting to SQLite database at: ${dbPath}`);
    this.db = new Database(dbPath);
    this.configure();
  }

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public getDatabase(): Database.Database {
    return this.db;
  }

  private configure(): void {
    try {
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('foreign_keys = ON');
      this.db.pragma('synchronous = NORMAL');
    } catch (err) {
      logger.error('DatabaseConnection', 'Failed configuring SQLite pragmas', err);
    }
  }

  public close(): void {
    if (this.db) {
      logger.info('DatabaseConnection', 'Closing database connection');
      this.db.close();
    }
  }
}
