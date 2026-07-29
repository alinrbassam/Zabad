import { create } from 'zustand';
import { UserEntity, RoleEntity } from '@shared/types';
import { UserCreateInput, UserUpdateInput } from '@shared/validation';

interface UserState {
  users: (UserEntity & { role_name: string })[];
  roles: RoleEntity[];
  isLoading: boolean;
  error: string | null;

  loadUsers: () => Promise<void>;
  loadRoles: () => Promise<void>;
  createUser: (user: UserCreateInput, operatorUserId: string) => Promise<boolean>;
  updateUser: (user: UserUpdateInput, operatorUserId: string) => Promise<boolean>;
  toggleUserStatus: (
    targetUserId: string,
    isActive: boolean,
    operatorUserId: string,
  ) => Promise<boolean>;
  resetUserPassword: (
    targetUserId: string,
    newPassword: string,
    operatorUserId: string,
  ) => Promise<boolean>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  roles: [],
  isLoading: false,
  error: null,

  loadUsers: async () => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.getUsers) {
        const res = await window.api.getUsers();
        if (res.success && res.data) {
          set({ users: res.data });
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadRoles: async () => {
    try {
      if (window.api?.getRoles) {
        const res = await window.api.getRoles();
        if (res.success && res.data) {
          set({ roles: res.data });
        }
      }
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  createUser: async (user: UserCreateInput, operatorUserId: string) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.createUser) {
        const res = await window.api.createUser(user, operatorUserId);
        if (res.success) {
          await get().loadUsers();
          return true;
        } else {
          set({ error: res.error?.message || 'Failed creating user' });
          return false;
        }
      }
      return false;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  updateUser: async (user: UserUpdateInput, operatorUserId: string) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.updateUser) {
        const res = await window.api.updateUser(user, operatorUserId);
        if (res.success) {
          await get().loadUsers();
          return true;
        } else {
          set({ error: res.error?.message || 'Failed updating user' });
          return false;
        }
      }
      return false;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  toggleUserStatus: async (targetUserId: string, isActive: boolean, operatorUserId: string) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.toggleUserStatus) {
        const res = await window.api.toggleUserStatus(targetUserId, isActive, operatorUserId);
        if (res.success) {
          await get().loadUsers();
          return true;
        } else {
          set({ error: res.error?.message || 'Failed toggling user status' });
          return false;
        }
      }
      return false;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  resetUserPassword: async (targetUserId: string, newPassword: string, operatorUserId: string) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.resetUserPassword) {
        const res = await window.api.resetUserPassword(targetUserId, newPassword, operatorUserId);
        if (res.success) {
          return true;
        } else {
          set({ error: res.error?.message || 'Failed resetting password' });
          return false;
        }
      }
      return false;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },
}));
