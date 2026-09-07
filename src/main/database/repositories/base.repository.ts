import Database from 'better-sqlite3';
import { BaseEntity } from '@shared/types';
import { logger } from '../../services/logger.service';

export abstract class BaseRepository<T extends BaseEntity> {
  protected db: Database.Database;
  protected tableName: string;

  constructor(db: Database.Database, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  public findById(id: string): T | null {
    try {
      const stmt = this.db.prepare(
        `SELECT * FROM ${this.tableName} WHERE id = ? AND (deleted_at IS NULL OR deleted_at = '')`,
      );
      const result = stmt.get(id);
      return (result as T) || null;
    } catch (err) {
      logger.error('BaseRepository', `Error finding entity in ${this.tableName} by id ${id}`, err);
      throw err;
    }
  }

  public findAll(): T[] {
    try {
      const stmt = this.db.prepare(
        `SELECT * FROM ${this.tableName} WHERE (deleted_at IS NULL OR deleted_at = '') ORDER BY created_at DESC`,
      );
      return stmt.all() as T[];
    } catch (err) {
      logger.error('BaseRepository', `Error finding all entities in ${this.tableName}`, err);
      throw err;
    }
  }

  public softDelete(id: string): boolean {
    try {
      const now = new Date().toISOString();
      const stmt = this.db.prepare(
        `UPDATE ${this.tableName} SET deleted_at = ?, updated_at = ? WHERE id = ?`,
      );
      const result = stmt.run(now, now, id);
      return result.changes > 0;
    } catch (err) {
      logger.error(
        'BaseRepository',
        `Error soft deleting entity in ${this.tableName} with id ${id}`,
        err,
      );
      throw err;
    }
  }

  public hardDelete(id: string): boolean {
    try {
      const stmt = this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`);
      const result = stmt.run(id);
      return result.changes > 0;
    } catch (err) {
      logger.error(
        'BaseRepository',
        `Error hard deleting entity in ${this.tableName} with id ${id}`,
        err,
      );
      throw err;
    }
  }
}
