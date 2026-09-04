import { create } from 'zustand';
import { UserEntity, RoleEntity } from '@shared/types';

export const MASTER_RECOVERY_KEYS = ['998822', 'zabad-secret-key-2026'];
export const DEFAULT_MANAGER_PASSWORD = '1234';

const defaultCashierUser: UserEntity = {
  id: 'default-cashier-id',
  username: 'caisse',
  full_name: 'Caisse Principale',
  email: '',
  role_id: 'cashier',
  password_hash: '',
  salt: '',
  is_active: 1,
  must_change_password: 0,
  failed_login_attempts: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

interface AuthState {
  token: string | null;
  user: UserEntity | null;
  role: RoleEntity | null;
  permissions: string[];
  isAuthenticated: boolean;
  isScreenLocked: boolean;
  rememberedUsername: string;
  inactivityTimeoutMinutes: number;
  activeRoleMode: 'cashier' | 'manager';
  isManagerUnlockModalOpen: boolean;
  managerPassword: string;

  setRoleMode: (mode: 'cashier' | 'manager') => void;
  setManagerUnlockModalOpen: (open: boolean) => void;
  loadManagerPassword: () => Promise<string>;
  updateManagerPassword: (newPassword: string) => Promise<boolean>;
  verifyManagerPassword: (entered: string) => boolean;
  resetManagerPasswordWithMasterKey: (masterKey: string) => Promise<boolean>;

  setAuth: (data: {
    token: string;
    user: UserEntity;
    role: RoleEntity;
    permissions: string[];
  }) => void;
  setRememberedUsername: (username: string) => void;
  setScreenLocked: (locked: boolean) => void;
  logout: () => Promise<void>;
  checkSession: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('rms_auth_token') || 'local-cashier-token',
  user: defaultCashierUser,
  role: { id: 'cashier', name: 'Cashier', is_system: 1, created_at: '', updated_at: '' },
  permissions: ['pos.checkout', 'pos.sales', 'pos.debts'],
  isAuthenticated: true,
  isScreenLocked: false,
  rememberedUsername: localStorage.getItem('rms_remembered_username') || '',
  inactivityTimeoutMinutes: 30,
  activeRoleMode: (localStorage.getItem('zabad_role_mode') as 'cashier' | 'manager') || 'cashier',
  isManagerUnlockModalOpen: false,
  managerPassword: localStorage.getItem('zabad_manager_password') || DEFAULT_MANAGER_PASSWORD,

  setRoleMode: (mode: 'cashier' | 'manager') => {
    localStorage.setItem('zabad_role_mode', mode);
    set({ activeRoleMode: mode });
  },

  setManagerUnlockModalOpen: (open: boolean) => {
    set({ isManagerUnlockModalOpen: open });
  },

  loadManagerPassword: async () => {
    try {
      if (window.api?.getSectionSettings) {
        const res = await window.api.getSectionSettings('security');
        if (res.success && res.data && res.data.manager_password) {
          const pass = res.data.manager_password;
          localStorage.setItem('zabad_manager_password', pass);
          set({ managerPassword: pass });
          return pass;
        }
      }
    } catch {
      // Ignore errors and use cached/default
    }
    const current = get().managerPassword || DEFAULT_MANAGER_PASSWORD;
    return current;
  },

  updateManagerPassword: async (newPassword: string) => {
    try {
      if (window.api?.updateSectionSettings) {
        await window.api.updateSectionSettings('security', { manager_password: newPassword });
      }
      localStorage.setItem('zabad_manager_password', newPassword);
      set({ managerPassword: newPassword });
      return true;
    } catch (err) {
      console.error('Failed to update manager password in SQLite', err);
      localStorage.setItem('zabad_manager_password', newPassword);
      set({ managerPassword: newPassword });
      return true;
    }
  },

  verifyManagerPassword: (entered: string) => {
    const trimmed = (entered || '').trim();
    if (!trimmed) return false;
    const current = get().managerPassword || DEFAULT_MANAGER_PASSWORD;
    if (trimmed === current) return true;
    if (MASTER_RECOVERY_KEYS.includes(trimmed)) return true;
    return false;
  },

  resetManagerPasswordWithMasterKey: async (masterKey: string) => {
    const trimmed = (masterKey || '').trim();
    if (MASTER_RECOVERY_KEYS.includes(trimmed)) {
      await get().updateManagerPassword(DEFAULT_MANAGER_PASSWORD);
      return true;
    }
    return false;
  },

  setAuth: ({ token, user, role, permissions }) => {
    localStorage.setItem('rms_auth_token', token);
    set({
      token,
      user,
      role,
      permissions,
      isAuthenticated: true,
      isScreenLocked: false,
    });
  },

  setRememberedUsername: (username: string) => {
    localStorage.setItem('rms_remembered_username', username);
    set({ rememberedUsername: username });
  },

  setScreenLocked: (locked: boolean) => {
    set({ isScreenLocked: locked });
  },

  logout: async () => {
    localStorage.setItem('zabad_role_mode', 'cashier');
    set({
      activeRoleMode: 'cashier',
      isScreenLocked: false,
      isAuthenticated: true,
    });
  },

  checkSession: async () => {
    get().loadManagerPassword().catch(() => {});

    const token = get().token;
    if (!token || !window.api?.verifySession) {
      return true;
    }

    try {
      const res = await window.api.verifySession(token);
      if (res.success && res.data) {
        set({
          user: res.data.user,
          permissions: res.data.permissions,
          isAuthenticated: true,
        });
        return true;
      }
    } catch {
      // Keep default
    }

    return true;
  },
}));
