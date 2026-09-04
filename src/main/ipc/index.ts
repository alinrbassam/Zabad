import { ipcMain, dialog, BrowserWindow } from 'electron';
import { DatabaseConnection } from '../database/connection';
import { ConfigService } from '../services/config.service';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';
import { SettingsService } from '../services/settings.service';
import { AuditRepository } from '../database/repositories/audit.repository';
import { registerInventoryIpcHandlers } from './inventory.ipc';
import { registerPurchasingIpcHandlers } from './purchasing.ipc';
import { registerPOSIpcHandlers } from './pos.ipc';
import { registerReportsIpcHandlers } from './reports.ipc';
import { registerCommercialIpcHandlers } from './commercial.ipc';
import { registerExpenseIpcHandlers } from './expense.ipc';
import { IPC_CHANNELS } from '../../shared/ipc/channels';
import { ApiResponse } from '../../shared/types';
import {
  LoginSchema,
  PinLoginSchema,
  SetupWizardPayloadSchema,
  UserCreateSchema,
  UserUpdateSchema,
  AppConfigInput,
} from '../../shared/validation';
import { logger } from '../services/logger.service';

export function registerIpcHandlers(): void {
  logger.info('IPC', 'Registering Main process IPC channels');

  const db = DatabaseConnection.getInstance().getDatabase();
  const configService = ConfigService.getInstance();
  const authService = new AuthService(db);
  const userService = new UserService(db);
  const settingsService = new SettingsService(db);
  const auditRepo = new AuditRepository(db);

  // Core Config
  ipcMain.handle(IPC_CHANNELS.CONFIG_GET, async () => ({
    success: true,
    data: configService.getConfig(),
  }));

  ipcMain.handle(IPC_CHANNELS.LOG_WRITE, async (_, payload: any) => {
    logger.log(payload.level, payload.module, payload.message, payload.details);
    return { success: true };
  });

  ipcMain.handle('system:select_directory', async (): Promise<ApiResponse<string | null>> => {
    try {
      const focusedWindow = BrowserWindow.getFocusedWindow();
      if (!focusedWindow) {
        return { success: false, error: { code: 'NO_WINDOW', message: 'No focused window found' } };
      }
      const result = await dialog.showOpenDialog(focusedWindow, {
        title: 'Select Backup Directory',
        properties: ['openDirectory', 'createDirectory'],
      });
      if (result.canceled || result.filePaths.length === 0) {
        return { success: true, data: null };
      }
      return { success: true, data: result.filePaths[0] };
    } catch (err) {
      logger.error('IPC', 'Error selecting directory', err);
      return { success: false, error: { code: 'SELECT_DIR_ERROR', message: (err as Error).message } };
    }
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_UPDATE, async (_, newConfig) => {
    try {
      configService.updateConfig(newConfig as AppConfigInput);
      return { success: true, data: configService.getConfig() };
    } catch (err) {
      return { success: false, error: { code: 'CONFIG_ERROR', message: (err as Error).message } };
    }
  });

  // Auth IPC
  ipcMain.handle(IPC_CHANNELS.AUTH_CHECK_SETUP, async (): Promise<ApiResponse<{ isSetupComplete: boolean }>> => {
    return { success: true, data: { isSetupComplete: authService.isSetupComplete() } };
  });

  ipcMain.handle(IPC_CHANNELS.AUTH_COMPLETE_SETUP, async (_, payload: unknown): Promise<ApiResponse> => {
    try {
      const parsed = SetupWizardPayloadSchema.parse(payload);
      const res = authService.completeSetupWizard(parsed);
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: { code: 'SETUP_ERROR', message: (err as Error).message } };
    }
  });

  ipcMain.handle(IPC_CHANNELS.AUTH_LOGIN, async (_, credentials: unknown): Promise<ApiResponse> => {
    try {
      const parsed = LoginSchema.parse(credentials);
      const res = authService.login(parsed);
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: { code: 'AUTH_ERROR', message: (err as Error).message } };
    }
  });

  ipcMain.handle(IPC_CHANNELS.AUTH_LOGIN_PIN, async (_, credentials: unknown): Promise<ApiResponse> => {
    try {
      const parsed = PinLoginSchema.parse(credentials);
      const res = authService.loginWithPin(parsed);
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: { code: 'AUTH_PIN_ERROR', message: (err as Error).message } };
    }
  });

  ipcMain.handle(IPC_CHANNELS.AUTH_LOGOUT, async (_, token: string): Promise<ApiResponse> => {
    try {
      authService.logout(token);
      return { success: true };
    } catch (err) {
      return { success: false, error: { code: 'LOGOUT_ERROR', message: (err as Error).message } };
    }
  });

  ipcMain.handle(IPC_CHANNELS.AUTH_VERIFY_SESSION, async (_, token: string): Promise<ApiResponse> => {
    const session = authService.verifySession(token);
    if (!session) {
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Session expired' } };
    }
    return { success: true, data: session };
  });

  ipcMain.handle(IPC_CHANNELS.AUTH_GET_SECURITY_QUESTION, async (_, username: string): Promise<ApiResponse> => {
    const question = authService.getSecurityQuestion(username);
    if (!question) {
      return { success: false, error: { code: 'NOT_FOUND', message: 'Security question not found' } };
    }
    return { success: true, data: { question } };
  });

  ipcMain.handle(IPC_CHANNELS.AUTH_RECOVER_PASSWORD, async (_, payload: { username: string; securityAnswer: string; newPassword: string }): Promise<ApiResponse> => {
    try {
      authService.recoverPassword(payload.username, payload.securityAnswer, payload.newPassword);
      return { success: true };
    } catch (err) {
      return { success: false, error: { code: 'RECOVERY_ERROR', message: (err as Error).message } };
    }
  });

  // Users IPC
  ipcMain.handle(IPC_CHANNELS.USERS_LIST, async (): Promise<ApiResponse> => {
    return { success: true, data: userService.listUsers() };
  });

  ipcMain.handle(IPC_CHANNELS.USERS_CREATE, async (_, payload: unknown, operatorUserId?: string): Promise<ApiResponse> => {
    try {
      const parsed = UserCreateSchema.parse(payload);
      const res = userService.createUser(parsed, operatorUserId || 'system');
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: { code: 'USER_CREATE_ERROR', message: (err as Error).message } };
    }
  });

  ipcMain.handle(IPC_CHANNELS.USERS_UPDATE, async (_, payload: unknown, operatorUserId?: string): Promise<ApiResponse> => {
    try {
      const parsed = UserUpdateSchema.parse(payload);
      const res = userService.updateUser(parsed, operatorUserId || 'system');
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: { code: 'USER_UPDATE_ERROR', message: (err as Error).message } };
    }
  });

  ipcMain.handle(IPC_CHANNELS.USERS_TOGGLE_STATUS, async (_, payload: { targetUserId: string; isActive: boolean }, operatorUserId: string): Promise<ApiResponse> => {
    try {
      const res = userService.toggleUserStatus(payload.targetUserId, payload.isActive, operatorUserId);
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: { code: 'USER_STATUS_ERROR', message: (err as Error).message } };
    }
  });

  ipcMain.handle(IPC_CHANNELS.USERS_RESET_PASSWORD, async (_, payload: { targetUserId: string; newPassword: string }, operatorUserId: string): Promise<ApiResponse> => {
    try {
      userService.resetUserPassword(payload.targetUserId, payload.newPassword, operatorUserId);
      return { success: true };
    } catch (err) {
      return { success: false, error: { code: 'USER_RESET_ERROR', message: (err as Error).message } };
    }
  });

  ipcMain.handle(IPC_CHANNELS.ROLES_LIST, async (): Promise<ApiResponse> => {
    return { success: true, data: userService.listRoles() };
  });

  ipcMain.handle(IPC_CHANNELS.PERMISSIONS_LIST, async (): Promise<ApiResponse> => {
    return { success: true, data: userService.listPermissions() };
  });

  // Settings IPC
  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET_SECTION, async (_, category: string): Promise<ApiResponse> => {
    return { success: true, data: settingsService.getSectionSettings(category) };
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_UPDATE_SECTION, async (_, category: string, values: Record<string, string>, userId?: string): Promise<ApiResponse> => {
    try {
      const res = settingsService.updateSectionSettings(category, values, userId);
      return { success: true, data: res };
    } catch (err) {
      return { success: false, error: { code: 'SETTINGS_UPDATE_ERROR', message: (err as Error).message } };
    }
  });

  // Audit Logs IPC
  ipcMain.handle(IPC_CHANNELS.AUDIT_LIST, async (_, limit?: number): Promise<ApiResponse> => {
    return { success: true, data: auditRepo.getLogs(limit || 100) };
  });

  // Sub-Handlers Registration
  registerInventoryIpcHandlers(db);
  registerPurchasingIpcHandlers(db);
  registerPOSIpcHandlers(db);
  registerReportsIpcHandlers(db);
  registerCommercialIpcHandlers(db);
  registerExpenseIpcHandlers(db);

  logger.info('IPC', 'All IPC handlers registered successfully');
}
