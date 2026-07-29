import React from 'react';
import { useLanguageStore } from '@stores/useLanguageStore';
import { Button } from '@components/ui/Button';

export const LanguageSettings: React.FC = () => {
  const { language, setLanguage } = useLanguageStore();

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
        Language & Internationalization
      </h3>
      <p className="text-xs text-slate-500">
        Instant switching between English (LTR) and Arabic (RTL).
      </p>

      <div className="flex space-x-4 max-w-sm">
        <Button
          variant={language === 'en' ? 'primary' : 'outline'}
          onClick={() => setLanguage('en')}
          className="flex-1"
        >
          English (LTR)
        </Button>
        <Button
          variant={language === 'ar' ? 'primary' : 'outline'}
          onClick={() => setLanguage('ar')}
          className="flex-1"
        >
          العربية (RTL)
        </Button>
      </div>
    </div>
  );
};
