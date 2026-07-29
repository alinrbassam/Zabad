import { create } from 'zustand';
import { ThemeMode } from '@shared/types';

interface ThemeState {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'system',
  setTheme: (mode: ThemeMode) => {
    const root = document.documentElement;
    if (
      mode === 'dark' ||
      (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    set({ theme: mode });
  },
}));
