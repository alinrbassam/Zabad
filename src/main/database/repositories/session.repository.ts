import Database from 'better-sqlite3';
import { SessionEntity } from '@shared/types';

export class SessionRepository {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  public createSession(userId: string, token: string, durationMinutes = 30): SessionEntity {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationMinutes * 60000).toISOString();
    const session: SessionEntity = {
      id: crypto.randomUUID(),
      user_id: userId,
      token,
      login_time: now.toISOString(),
      expires_at: expiresAt,
      is_active: 1,
    };

    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, user_id, token, login_time, expires_at, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `);
    stmt.run(session.id, session.user_id, session.token, session.login_time, session.expires_at);

    return session;
  }

  public findActiveSession(token: string): SessionEntity | null {
    const stmt = this.db.prepare(
      `SELECT * FROM sessions WHERE token = ? AND is_active = 1 AND expires_at > CURRENT_TIMESTAMP`,
    );
    const row = stmt.get(token);
    return (row as SessionEntity) || null;
  }

  public invalidateSession(token: string): void {
    const stmt = this.db.prepare(`UPDATE sessions SET is_active = 0 WHERE token = ?`);
    stmt.run(token);
  }

  public invalidateUserSessions(userId: string): void {
    const stmt = this.db.prepare(`UPDATE sessions SET is_active = 0 WHERE user_id = ?`);
    stmt.run(userId);
  }
}
