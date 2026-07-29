import { create } from 'zustand';
import { UserEntity, RoleEntity } from '@shared/types';

interface AuthState {
  token: string | null;
  user: UserEntity | null;
  role: RoleEntity | null;
  permissions: string[];
  isAuthenticated: boolean;
  isScreenLocked: boolean;
  rememberedUsername: string;
  inactivityTimeoutMinutes: number;
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
  token: localStorage.getItem('rms_auth_token') || null,
  user: null,
  role: null,
  permissions: [],
  isAuthenticated: false,
  isScreenLocked: false,
  rememberedUsername: localStorage.getItem('rms_remembered_username') || '',
  inactivityTimeoutMinutes: 30,

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
    const token = get().token;
    if (token && window.api?.logout) {
      await window.api.logout(token);
    }
    localStorage.removeItem('rms_auth_token');
    set({
      token: null,
      user: null,
      role: null,
      permissions: [],
      isAuthenticated: false,
      isScreenLocked: false,
    });
  },

  checkSession: async () => {
    const token = get().token;
    if (!token || !window.api?.verifySession) {
      set({ isAuthenticated: false });
      return false;
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
      // Ignore errors
    }

    localStorage.removeItem('rms_auth_token');
    set({ token: null, user: null, isAuthenticated: false });
    return false;
  },
}));
