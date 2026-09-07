import Database from 'better-sqlite3';
import { BaseRepository } from './base.repository';
import { UserEntity } from '@shared/types';

export class UserRepository extends BaseRepository<UserEntity> {
  constructor(db: Database.Database) {
    super(db, 'users');
  }

  public findByUsername(username: string): UserEntity | null {
    const stmt = this.db.prepare(
      `SELECT * FROM ${this.tableName} WHERE LOWER(username) = LOWER(?) AND (deleted_at IS NULL OR deleted_at = '')`,
    );
    const row = stmt.get(username);
    return (row as UserEntity) || null;
  }

  public createUser(user: {
    id?: string;
    full_name: string;
    username: string;
    password_hash: string;
    salt: string;
    pin_code_hash?: string;
    phone?: string;
    email?: string;
    role_id: string;
    notes?: string;
  }): UserEntity {
    const now = new Date().toISOString();
    const id = user.id || crypto.randomUUID();

    const stmt = this.db.prepare(`
      INSERT INTO users (id, full_name, username, password_hash, salt, pin_code_hash, phone, email, role_id, is_active, must_change_password, password_last_changed, failed_login_attempts, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, 0, ?, ?, ?)
    `);

    stmt.run(
      id,
      user.full_name,
      user.username,
      user.password_hash,
      user.salt,
      user.pin_code_hash || null,
      user.phone || null,
      user.email || null,
      user.role_id,
      now,
      user.notes || null,
      now,
      now,
    );

    return this.findById(id)!;
  }

  public updateUser(user: Partial<UserEntity> & { id: string }): UserEntity {
    const now = new Date().toISOString();
    const existing = this.findById(user.id);
    if (!existing) throw new Error('User not found');

    const updated: UserEntity = {
      ...existing,
      ...user,
      updated_at: now,
    };

    const stmt = this.db.prepare(`
      UPDATE users SET
        full_name = ?, phone = ?, email = ?, role_id = ?,
        is_active = ?, pin_code_hash = ?, notes = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      updated.full_name,
      updated.phone || null,
      updated.email || null,
      updated.role_id,
      updated.is_active,
      updated.pin_code_hash || null,
      updated.notes || null,
      now,
      updated.id,
    );

    return this.findById(updated.id)!;
  }

  public updateFailedAttempts(userId: string, attempts: number, lockMinutes = 0): void {
    const now = new Date();
    const lockedUntil =
      lockMinutes > 0 ? new Date(now.getTime() + lockMinutes * 60000).toISOString() : null;
    const stmt = this.db.prepare(
      `UPDATE ${this.tableName} SET failed_login_attempts = ?, locked_until = ?, updated_at = ? WHERE id = ?`,
    );
    stmt.run(attempts, lockedUntil, now.toISOString(), userId);
  }

  public updatePassword(userId: string, passwordHash: string, salt: string): void {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(
      `UPDATE ${this.tableName} SET password_hash = ?, salt = ?, password_last_changed = ?, failed_login_attempts = 0, locked_until = NULL, updated_at = ? WHERE id = ?`,
    );
    stmt.run(passwordHash, salt, now, now, userId);
  }

  public countUsers(): number {
    const stmt = this.db.prepare(
      `SELECT COUNT(*) as count FROM ${this.tableName} WHERE (deleted_at IS NULL OR deleted_at = '')`,
    );
    const res = stmt.get() as { count: number };
    return res.count;
  }
}
