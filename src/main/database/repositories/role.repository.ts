import Database from 'better-sqlite3';
import { BaseRepository } from './base.repository';
import { RoleEntity, PermissionEntity } from '@shared/types';

export class RoleRepository extends BaseRepository<RoleEntity> {
  constructor(db: Database.Database) {
    super(db, 'roles');
  }

  public findByName(name: string): RoleEntity | null {
    const stmt = this.db.prepare(
      `SELECT * FROM ${this.tableName} WHERE LOWER(name) = LOWER(?) AND (deleted_at IS NULL OR deleted_at = '')`,
    );
    const row = stmt.get(name);
    return (row as RoleEntity) || null;
  }

  public getRolePermissions(roleId: string): PermissionEntity[] {
    const stmt = this.db.prepare(`
      SELECT p.* FROM permissions p
      JOIN role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `);
    return stmt.all(roleId) as PermissionEntity[];
  }

  public assignPermissionsToRole(roleId: string, permissionIds: string[]): void {
    const deleteStmt = this.db.prepare('DELETE FROM role_permissions WHERE role_id = ?');
    const insertStmt = this.db.prepare(
      'INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)',
    );

    const transaction = this.db.transaction(() => {
      deleteStmt.run(roleId);
      for (const pId of permissionIds) {
        insertStmt.run(roleId, pId);
      }
    });

    transaction();
  }
}
