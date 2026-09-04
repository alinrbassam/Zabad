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

      <div className="grid grid-cols-3 gap-3 max-w-lg">
        <Button
          variant={language === 'fr' ? 'primary' : 'outline'}
          onClick={() => setLanguage('fr')}
          className="w-full"
        >
          Français (LTR)
        </Button>
        <Button
          variant={language === 'en' ? 'primary' : 'outline'}
          onClick={() => setLanguage('en')}
          className="w-full"
        >
          English (LTR)
        </Button>
        <Button
          variant={language === 'ar' ? 'primary' : 'outline'}
          onClick={() => setLanguage('ar')}
          className="w-full"
        >
          العربية (RTL)
        </Button>
      </div>
    </div>
  );
};
