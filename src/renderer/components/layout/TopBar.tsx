import React from 'react';
import { useThemeStore } from '../../stores/useThemeStore';
import { useLanguageStore } from '../../stores/useLanguageStore';
import { SearchBox } from '../ui/SearchBox';
import { Notifications } from './Notifications';
import { UserProfile } from './UserProfile';
import { Sun, Moon, Monitor, Globe } from 'lucide-react';

export const TopBar: React.FC = () => {
  const { theme, setTheme } = useThemeStore();
  const { language, setLanguage, t } = useLanguageStore();
  const [searchQuery, setSearchQuery] = React.useState('');

  return (
    <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between select-none">
      <div className="w-72">
        <SearchBox
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('search_placeholder')}
        />
      </div>

      <div className="flex items-center space-x-3">
        {/* Theme Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setTheme('light')}
            className={`p-1 rounded-md transition-colors ${
              theme === 'light'
                ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-xs'
                : 'text-slate-500'
            }`}
            title={t('light')}
          >
            <Sun className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`p-1 rounded-md transition-colors ${
              theme === 'dark'
                ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-xs'
                : 'text-slate-500'
            }`}
            title={t('dark')}
          >
            <Moon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`p-1 rounded-md transition-colors ${
              theme === 'system'
                ? 'bg-white dark:bg-slate-700 text-sky-600 shadow-xs'
                : 'text-slate-500'
            }`}
            title={t('system')}
          >
            <Monitor className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Language Switcher */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"
        >
          <Globe className="h-3.5 w-3.5 text-sky-600" />
          <span>{language === 'en' ? 'العربية' : 'English'}</span>
        </button>

        <Notifications />
        <UserProfile />
      </div>
    </header>
  );
};
