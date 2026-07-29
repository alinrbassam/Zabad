import React from 'react';
import { useThemeStore } from '@stores/useThemeStore';
import { Button } from '@components/ui/Button';

export const AppearanceSettings: React.FC = () => {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
        Appearance Settings
      </h3>
      <p className="text-xs text-slate-500">
        Customize the visual theme, mode, and interface styling.
      </p>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
          Theme Mode
        </label>
        <div className="grid grid-cols-3 gap-3 max-w-md">
          <Button
            variant={theme === 'light' ? 'primary' : 'outline'}
            onClick={() => setTheme('light')}
          >
            Light Mode
          </Button>
          <Button
            variant={theme === 'dark' ? 'primary' : 'outline'}
            onClick={() => setTheme('dark')}
          >
            Dark Mode
          </Button>
          <Button
            variant={theme === 'system' ? 'primary' : 'outline'}
            onClick={() => setTheme('system')}
          >
            System Default
          </Button>
        </div>
      </div>
    </div>
  );
};
