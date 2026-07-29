import React from 'react';
import { useSetupWizardStore } from '@stores/useSetupWizardStore';
import { useThemeStore } from '@stores/useThemeStore';
import { useLanguageStore } from '@stores/useLanguageStore';
import { Button } from '@components/ui/Button';

export const Step1Welcome: React.FC = () => {
  const { updateData, nextStep } = useSetupWizardStore();
  const { theme, setTheme } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();

  return (
    <div className="space-y-6 text-center">
      <div className="mx-auto h-16 w-16 bg-sky-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-sky-500/20">
        RMS
      </div>
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
          Welcome to Retail Management System
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Enterprise Desktop Core • v1.0.0 Architecture
        </p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-6 text-left space-y-4">
        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Application Language
          </label>
          <div className="flex space-x-2">
            <Button
              variant={language === 'en' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                setLanguage('en');
                updateData({ language: 'en' });
              }}
              className="flex-1"
            >
              English (LTR)
            </Button>
            <Button
              variant={language === 'ar' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                setLanguage('ar');
                updateData({ language: 'ar' });
              }}
              className="flex-1"
            >
              العربية (RTL)
            </Button>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Display Theme
          </label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={theme === 'light' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                setTheme('light');
                updateData({ theme: 'light' });
              }}
            >
              Light
            </Button>
            <Button
              variant={theme === 'dark' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                setTheme('dark');
                updateData({ theme: 'dark' });
              }}
            >
              Dark
            </Button>
            <Button
              variant={theme === 'system' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => {
                setTheme('system');
                updateData({ theme: 'system' });
              }}
            >
              System
            </Button>
          </div>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button onClick={nextStep} size="lg" className="w-full sm:w-auto">
          Get Started →
        </Button>
      </div>
    </div>
  );
};
