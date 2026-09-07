import Database from 'better-sqlite3';
import { AuditLogEntity } from '@shared/types';
import { logger } from '../../services/logger.service';

export class AuditRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public logAction(log: {
    user_id?: string;
    username?: string;
    action: string;
    module: string;
    details?: string;
    ip_address?: string;
  }): AuditLogEntity {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO audit_logs (id, user_id, username, action, module, details, ip_address, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      log.user_id || null,
      log.username || null,
      log.action,
      log.module,
      log.details || null,
      log.ip_address || '127.0.0.1',
      timestamp,
    );

    logger.info('AuditRepository', `[AUDIT] [${log.module}] ${log.action}: ${log.details || ''}`);

    return {
      id,
      user_id: log.user_id,
      username: log.username,
      action: log.action,
      module: log.module,
      details: log.details,
      ip_address: log.ip_address,
      timestamp,
    };
  }

  public getLogs(limit = 100): AuditLogEntity[] {
    const stmt = this.db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?');
    return stmt.all(limit) as AuditLogEntity[];
  }
}
