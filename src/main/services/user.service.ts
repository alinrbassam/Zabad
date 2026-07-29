import Database from 'better-sqlite3';
import { UserRepository } from '../database/repositories/user.repository';
import { RoleRepository } from '../database/repositories/role.repository';
import { AuditRepository } from '../database/repositories/audit.repository';
import { UserCreateInput, UserUpdateInput } from '@shared/validation';
import { UserEntity, RoleEntity, PermissionEntity } from '@shared/types';
import { generateSalt, hashPassword } from '../utils/crypto';

export class UserService {
  private userRepo: UserRepository;
  private roleRepo: RoleRepository;
  private auditRepo: AuditRepository;
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
    this.userRepo = new UserRepository(db);
    this.roleRepo = new RoleRepository(db);
    this.auditRepo = new AuditRepository(db);
  }

  public listUsers(): (UserEntity & { role_name: string })[] {
    const stmt = this.db.prepare(`
      SELECT u.*, r.name as role_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.deleted_at IS NULL OR u.deleted_at = ''
      ORDER BY u.created_at DESC
    `);
    return stmt.all() as (UserEntity & { role_name: string })[];
  }

  public listRoles(): RoleEntity[] {
    return this.roleRepo.findAll();
  }

  public listPermissions(): PermissionEntity[] {
    const stmt = this.db.prepare('SELECT * FROM permissions');
    return stmt.all() as PermissionEntity[];
  }

  public createUser(input: UserCreateInput, operatorUserId: string): UserEntity {
    const existing = this.userRepo.findByUsername(input.username);
    if (existing) throw new Error('Username is already taken');

    const salt = generateSalt();
    const passwordHash = hashPassword(input.password, salt);
    let pinHash: string | undefined = undefined;

    if (input.pin) {
      pinHash = hashPassword(input.pin, salt);
    }

    const user = this.userRepo.createUser({
      full_name: input.fullName,
      username: input.username,
      password_hash: passwordHash,
      salt,
      pin_code_hash: pinHash,
      phone: input.phone,
      email: input.email,
      role_id: input.roleId,
      notes: input.notes,
    });

    this.auditRepo.logAction({
      user_id: operatorUserId,
      action: 'USER_CREATED',
      module: 'Users',
      details: `Created user account @${user.username}`,
    });

    return user;
  }

  public updateUser(input: UserUpdateInput, operatorUserId: string): UserEntity {
    const existing = this.userRepo.findById(input.id);
    if (!existing) throw new Error('User not found');

    let pinHash = existing.pin_code_hash;
    if (input.pin) {
      pinHash = hashPassword(input.pin, existing.salt);
    }

    const updated = this.userRepo.updateUser({
      id: input.id,
      full_name: input.fullName,
      phone: input.phone,
      email: input.email,
      role_id: input.roleId,
      pin_code_hash: pinHash,
      is_active: input.isActive ? 1 : 0,
      notes: input.notes,
    });

    this.auditRepo.logAction({
      user_id: operatorUserId,
      action: 'USER_UPDATED',
      module: 'Users',
      details: `Updated user account @${updated.username}`,
    });

    return updated;
  }

  public toggleUserStatus(
    targetUserId: string,
    isActive: boolean,
    operatorUserId: string,
  ): UserEntity {
    if (targetUserId === operatorUserId) {
      throw new Error('You cannot deactivate your own active session');
    }

    const updated = this.userRepo.updateUser({
      id: targetUserId,
      is_active: isActive ? 1 : 0,
    });

    this.auditRepo.logAction({
      user_id: operatorUserId,
      action: 'USER_STATUS_TOGGLED',
      module: 'Users',
      details: `${isActive ? 'Activated' : 'Deactivated'} user account @${updated.username}`,
    });

    return updated;
  }

  public resetUserPassword(
    targetUserId: string,
    newPassword: string,
    operatorUserId: string,
  ): void {
    const user = this.userRepo.findById(targetUserId);
    if (!user) throw new Error('User not found');

    const newSalt = generateSalt();
    const newHash = hashPassword(newPassword, newSalt);
    this.userRepo.updatePassword(targetUserId, newHash, newSalt);

    this.auditRepo.logAction({
      user_id: operatorUserId,
      action: 'USER_PASSWORD_RESET',
      module: 'Users',
      details: `Reset password for user account @${user.username}`,
    });
  }
}
