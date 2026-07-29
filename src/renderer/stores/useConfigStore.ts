import { create } from 'zustand';
import { AppConfig } from '@shared/types';

interface ConfigState {
  config: AppConfig | null;
  isLoading: boolean;
  error: string | null;
  loadConfig: () => Promise<void>;
  updateConfig: (partial: Partial<AppConfig>) => Promise<boolean>;
}

export const useConfigStore = create<ConfigState>((set) => ({
  config: null,
  isLoading: false,
  error: null,
  loadConfig: async () => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.getConfig) {
        const res = await window.api.getConfig();
        if (res.success && res.data) {
          set({ config: res.data, isLoading: false });
          return;
        }
      }
      set({ isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
  updateConfig: async (partial: Partial<AppConfig>) => {
    set({ isLoading: true, error: null });
    try {
      if (window.api?.updateConfig) {
        const res = await window.api.updateConfig(partial);
        if (res.success && res.data) {
          set({ config: res.data, isLoading: false });
          return true;
        }
      }
      set({ isLoading: false });
      return false;
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
      return false;
    }
  },
}));
