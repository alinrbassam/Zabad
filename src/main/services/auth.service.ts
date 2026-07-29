import Database from 'better-sqlite3';
import { generateSalt, hashPassword, verifyPassword, generateSessionToken } from '../utils/crypto';
import { BusinessRepository } from '../database/repositories/business.repository';
import { UserRepository } from '../database/repositories/user.repository';
import { RoleRepository } from '../database/repositories/role.repository';
import { SessionRepository } from '../database/repositories/session.repository';
import { AuditRepository } from '../database/repositories/audit.repository';
import { SettingsRepository } from '../database/repositories/settings.repository';
import {
  SetupWizardPayloadInput,
  LoginInput,
  PinLoginInput,
  ChangePasswordSchema,
  RecoverPasswordSchema,
} from '../../shared/validation';
import { LoginResult, UserEntity } from '../../shared/types';
import { logger } from './logger.service';

export class AuthService {
  private db: Database.Database;
  private businessRepo: BusinessRepository;
  private userRepo: UserRepository;
  private roleRepo: RoleRepository;
  private sessionRepo: SessionRepository;
  private auditRepo: AuditRepository;
  private settingsRepo: SettingsRepository;

  constructor(db: Database.Database) {
    this.db = db;
    this.businessRepo = new BusinessRepository(db);
    this.userRepo = new UserRepository(db);
    this.roleRepo = new RoleRepository(db);
    this.sessionRepo = new SessionRepository(db);
    this.auditRepo = new AuditRepository(db);
    this.settingsRepo = new SettingsRepository(db);
  }

  public isSetupComplete(): boolean {
    const biz = this.businessRepo.getActiveBusiness();
    return biz !== null;
  }

  public completeSetupWizard(payload: SetupWizardPayloadInput): LoginResult {
    if (this.isSetupComplete()) {
      throw new Error('System setup has already been completed.');
    }

    logger.info('AuthService', 'Executing initial business setup wizard transaction');

    let result: LoginResult | null = null;

    const transaction = this.db.transaction(() => {
      // 1. Create Business
      const business = this.businessRepo.createBusiness({
        name: payload.businessName,
        type: payload.businessType,
        logo: payload.logo,
        phone: payload.phone,
        email: payload.email,
        website: payload.website,
        address: payload.address,
        city: payload.city,
        country: payload.country,
        tax_number: payload.taxNumber,
        currency: payload.currency,
        timezone: payload.timezone,
        date_format: payload.dateFormat,
        time_format: payload.timeFormat,
      });

      // 2. Create System Roles
      const ownerRoleStmt = this.db.prepare(
        'INSERT INTO roles (id, name, description, is_system) VALUES (?, ?, ?, 1)',
      );
      const cashierRoleStmt = this.db.prepare(
        'INSERT INTO roles (id, name, description, is_system) VALUES (?, ?, ?, 1)',
      );

      const ownerRoleId = crypto.randomUUID();
      const cashierRoleId = crypto.randomUUID();

      ownerRoleStmt.run(ownerRoleId, 'Owner', 'Full system access and store ownership');
      cashierRoleStmt.run(cashierRoleId, 'Cashier', 'POS checkout and sales processing access');

      // 3. Create Permissions & Assign to Owner
      const permissionsList = [
        {
          id: crypto.randomUUID(),
          key: 'system.all',
          name: 'Full Control',
          module: 'System',
          description: 'All permissions',
        },
        {
          id: crypto.randomUUID(),
          key: 'pos.checkout',
          name: 'POS Checkout',
          module: 'POS',
          description: 'Checkout sales',
        },
        {
          id: crypto.randomUUID(),
          key: 'inventory.manage',
          name: 'Manage Inventory',
          module: 'Inventory',
          description: 'Inventory',
        },
        {
          id: crypto.randomUUID(),
          key: 'users.manage',
          name: 'Manage Users',
          module: 'Users',
          description: 'Users',
        },
        {
          id: crypto.randomUUID(),
          key: 'reports.view',
          name: 'View Reports',
          module: 'Reports',
          description: 'Reports',
        },
      ];

      const permStmt = this.db.prepare(
        'INSERT INTO permissions (id, key, name, module, description) VALUES (?, ?, ?, ?, ?)',
      );
      for (const p of permissionsList) {
        permStmt.run(p.id, p.key, p.name, p.module, p.description);
      }

      this.roleRepo.assignPermissionsToRole(
        ownerRoleId,
        permissionsList.map((p) => p.id),
      );
      this.roleRepo.assignPermissionsToRole(
        cashierRoleId,
        permissionsList.filter((p) => p.key === 'pos.checkout').map((p) => p.id),
      );

      // 4. Create Owner Account
      const salt = generateSalt();
      const passwordHash = hashPassword(payload.ownerPassword, salt);

      const ownerUser = this.userRepo.createUser({
        full_name: payload.ownerName,
        username: payload.ownerUsername,
        password_hash: passwordHash,
        salt,
        phone: payload.phone,
        email: payload.email,
        role_id: ownerRoleId,
      });

      // 5. Store Security Question
      const sqSalt = generateSalt();
      const sqAnswerHash = hashPassword(payload.securityAnswer.toLowerCase().trim(), sqSalt);
      const sqStmt = this.db.prepare(
        'INSERT INTO security_questions (id, user_id, question, answer_hash, salt) VALUES (?, ?, ?, ?, ?)',
      );
      sqStmt.run(crypto.randomUUID(), ownerUser.id, payload.securityQuestion, sqAnswerHash, sqSalt);

      // 6. Save Default Settings Sections
      this.settingsRepo.setCategorySettings(business.id, 'tax', {
        enabled: String(payload.taxEnabled),
        rate: String(payload.taxRate),
        pricesIncludeTax: String(payload.pricesIncludeTax),
      });

      this.settingsRepo.setCategorySettings(business.id, 'receipt', {
        width: payload.receiptWidth,
        language: payload.receiptLanguage,
        showLogo: String(payload.showReceiptLogo),
        showAddress: String(payload.showReceiptAddress),
        showPhone: String(payload.showReceiptPhone),
        showTaxNumber: String(payload.showReceiptTaxNumber),
        showCashierName: String(payload.showCashierName),
        footerMessage: payload.receiptFooterMessage || '',
        returnPolicy: payload.returnPolicy || '',
        autoPrint: String(payload.autoPrintReceipt),
        savePdf: String(payload.saveReceiptAsPdf),
      });

      this.settingsRepo.setCategorySettings(business.id, 'backup', {
        autoEnabled: String(payload.autoBackupEnabled),
        backupFolder: payload.backupFolder || '',
        frequency: payload.backupFrequency,
        cloudFolder: payload.cloudSyncFolder || '',
        retentionCount: String(payload.backupRetentionCount),
        compression: String(payload.backupCompressionEnabled),
        encryption: String(payload.backupEncryptionEnabled),
      });

      // 7. Create Session
      const token = generateSessionToken();
      const session = this.sessionRepo.createSession(ownerUser.id, token, 30);

      this.auditRepo.logAction({
        user_id: ownerUser.id,
        username: ownerUser.username,
        action: 'SETUP_COMPLETED',
        module: 'SetupWizard',
        details: `Initial business ${business.name} setup completed successfully.`,
      });

      result = {
        token: session.token,
        user: ownerUser,
        role: { id: ownerRoleId, name: 'Owner', is_system: 1, created_at: '', updated_at: '' },
        permissions: permissionsList.map((p) => p.key),
        expiresAt: session.expires_at,
      };
    });

    transaction();
    return result!;
  }

  public login(input: LoginInput): LoginResult {
    const user = this.userRepo.findByUsername(input.username);

    if (!user || user.is_active === 0) {
      this.auditRepo.logAction({
        username: input.username,
        action: 'FAILED_LOGIN',
        module: 'Auth',
        details: 'Invalid username or inactive account',
      });
      throw new Error('Invalid credentials or inactive account');
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new Error('Account is temporarily locked due to multiple failed attempts');
    }

    const isValid = verifyPassword(input.password, user.salt, user.password_hash);
    if (!isValid) {
      const attempts = user.failed_login_attempts + 1;
      const lockMinutes = attempts >= 5 ? 15 : 0;
      this.userRepo.updateFailedAttempts(user.id, attempts, lockMinutes);

      this.auditRepo.logAction({
        user_id: user.id,
        username: user.username,
        action: 'FAILED_LOGIN',
        module: 'Auth',
        details: `Incorrect password attempt #${attempts}`,
      });

      throw new Error('Invalid credentials');
    }

    // Reset failed login counter
    this.userRepo.updateFailedAttempts(user.id, 0);

    const token = generateSessionToken();
    const session = this.sessionRepo.createSession(user.id, token, 30);
    const role = this.roleRepo.findById(user.role_id);
    const perms = this.roleRepo.getRolePermissions(user.role_id).map((p) => p.key);

    this.auditRepo.logAction({
      user_id: user.id,
      username: user.username,
      action: 'LOGIN',
      module: 'Auth',
      details: 'User logged in successfully',
    });

    return {
      token: session.token,
      user,
      role: role!,
      permissions: perms,
      expiresAt: session.expires_at,
    };
  }

  public loginWithPin(input: PinLoginInput): LoginResult {
    const user = this.userRepo.findByUsername(input.username);
    if (!user || !user.pin_code_hash) {
      throw new Error('PIN login not enabled for this user');
    }

    const isValid = verifyPassword(input.pin, user.salt, user.pin_code_hash);
    if (!isValid) {
      throw new Error('Invalid PIN code');
    }

    const token = generateSessionToken();
    const session = this.sessionRepo.createSession(user.id, token, 30);
    const role = this.roleRepo.findById(user.role_id);
    const perms = this.roleRepo.getRolePermissions(user.role_id).map((p) => p.key);

    return {
      token: session.token,
      user,
      role: role!,
      permissions: perms,
      expiresAt: session.expires_at,
    };
  }

  public logout(token: string): void {
    const session = this.sessionRepo.findActiveSession(token);
    if (session) {
      this.sessionRepo.invalidateSession(token);
      this.auditRepo.logAction({
        user_id: session.user_id,
        action: 'LOGOUT',
        module: 'Auth',
        details: 'User logged out',
      });
    }
  }

  public verifySession(
    token: string,
  ): { user: UserEntity; role: string; permissions: string[] } | null {
    const session = this.sessionRepo.findActiveSession(token);
    if (!session) return null;

    const user = this.userRepo.findById(session.user_id);
    if (!user || user.is_active === 0) return null;

    const role = this.roleRepo.findById(user.role_id);
    const perms = this.roleRepo.getRolePermissions(user.role_id).map((p) => p.key);

    return {
      user,
      role: role ? role.name : 'Unknown',
      permissions: perms,
    };
  }

  public changePassword(userId: string, currentPassword: string, newPassword: string): void {
    const user = this.userRepo.findById(userId);
    if (!user) throw new Error('User not found');

    const fullUser = this.userRepo.findByUsername(user.username);
    if (!fullUser || !verifyPassword(currentPassword, fullUser.salt, fullUser.password_hash)) {
      throw new Error('Current password is incorrect');
    }

    ChangePasswordSchema.shape.newPassword.parse(newPassword);

    const newSalt = generateSalt();
    const newHash = hashPassword(newPassword, newSalt);
    this.userRepo.updatePassword(userId, newHash, newSalt);

    this.auditRepo.logAction({
      user_id: userId,
      username: user.username,
      action: 'PASSWORD_CHANGE',
      module: 'Auth',
      details: 'User changed password successfully',
    });
  }

  public getSecurityQuestion(username: string): string | null {
    const user = this.userRepo.findByUsername(username);
    if (!user) return null;

    const stmt = this.db.prepare('SELECT question FROM security_questions WHERE user_id = ?');
    const row = stmt.get(user.id) as { question: string } | undefined;
    return row ? row.question : null;
  }

  public recoverPassword(username: string, answer: string, newPassword: string): void {
    const user = this.userRepo.findByUsername(username);
    if (!user) throw new Error('User not found');

    const stmt = this.db.prepare(
      'SELECT answer_hash, salt FROM security_questions WHERE user_id = ?',
    );
    const sq = stmt.get(user.id) as { answer_hash: string; salt: string } | undefined;

    if (!sq || !verifyPassword(answer.toLowerCase().trim(), sq.salt, sq.answer_hash)) {
      throw new Error('Security question answer is incorrect');
    }

    RecoverPasswordSchema.shape.newPassword.parse(newPassword);

    const newSalt = generateSalt();
    const newHash = hashPassword(newPassword, newSalt);
    this.userRepo.updatePassword(user.id, newHash, newSalt);

    this.auditRepo.logAction({
      user_id: user.id,
      username: user.username,
      action: 'PASSWORD_RECOVER',
      module: 'Auth',
      details: 'Password reset via security question',
    });
  }
}
