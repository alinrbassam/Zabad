import React from 'react';
import { Card } from '../ui/Card';

export const SettingsLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">System Settings</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Manage system configuration, business details, tax rates, and offline preferences.
        </p>
      </div>
      <Card>{children}</Card>
    </div>
  );
};
