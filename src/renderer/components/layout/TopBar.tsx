import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '../../stores/useThemeStore';
import { useLanguageStore } from '../../stores/useLanguageStore';
import { useAuthStore } from '../../stores/useAuthStore';
import { SearchBox } from '../ui/SearchBox';
import { Notifications } from './Notifications';
import { UserProfile } from './UserProfile';
import { Sun, Moon, Monitor, Globe, Shield, ShoppingCart, ChevronDown, Check } from 'lucide-react';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useThemeStore();
  const { language, setLanguage, t } = useLanguageStore();
  const { activeRoleMode, setRoleMode, setManagerUnlockModalOpen } = useAuthStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLangOpen, setIsLangOpen] = React.useState(false);
  const langRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleToggle = () => {
    if (activeRoleMode === 'cashier') {
      setManagerUnlockModalOpen(true);
    } else {
      setRoleMode('cashier');
      navigate('/pos');
    }
  };

  return (
    <header className="h-14 bg-white/95 dark:bg-[#0B1120]/90 dark:backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-6 flex items-center justify-between select-none sticky top-0 z-30">
      <div className="w-72">
        <SearchBox
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={language === 'ar' ? 'بحث سريع...' : t('search_placeholder')}
        />
      </div>

      <div className="flex items-center space-x-3 rtl:space-x-reverse">
        {/* Role Mode Quick Toggle Pill */}
        <button
          onClick={handleRoleToggle}
          className={`flex items-center space-x-1.5 rtl:space-x-reverse px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs ${
            activeRoleMode === 'cashier'
              ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-800'
              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
          }`}
          title={
            activeRoleMode === 'cashier'
              ? language === 'fr'
                ? 'Cliquer pour déverrouiller le Mode Gérant'
                : 'Click to switch to Manager Mode'
              : language === 'fr'
              ? 'Cliquer pour passer en Mode Caisse'
              : 'Click to switch to Cashier Mode'
          }
        >
          {activeRoleMode === 'cashier' ? (
            <>
              <ShoppingCart className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
              <span>
                {language === 'ar'
                  ? 'وضع الكاشير (بيع فقط)'
                  : language === 'fr'
                  ? 'Caisse (Vente Seule)'
                  : 'Cashier (Sell Only)'}
              </span>
            </>
          ) : (
            <>
              <Shield className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>
                {language === 'ar'
                  ? 'وضع المدير (إدارة وشراء)'
                  : language === 'fr'
                  ? 'Gérant (Accès Complet)'
                  : 'Manager (Full Access)'}
              </span>
            </>
          )}
        </button>

        {/* Theme Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 space-x-0.5 rtl:space-x-reverse">
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

        {/* Language Dropdown Menu */}
        <div className="relative" ref={langRef}>
          <button
            type="button"
            onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center space-x-1.5 rtl:space-x-reverse px-2.5 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 transition-colors"
            title="Changer de langue / Select Language"
          >
            <Globe className="h-3.5 w-3.5 text-sky-600" />
            <span>{language === 'fr' ? 'Français' : language === 'en' ? 'English' : 'العربية'}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {isLangOpen && (
            <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-1.5 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 py-1 overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setLanguage('fr');
                  setIsLangOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors ${
                  language === 'fr'
                    ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>Français</span>
                {language === 'fr' && <Check className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setLanguage('en');
                  setIsLangOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors ${
                  language === 'en'
                    ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>English</span>
                {language === 'en' && <Check className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setLanguage('ar');
                  setIsLangOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors font-sans ${
                  language === 'ar'
                    ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <span>العربية</span>
                {language === 'ar' && <Check className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />}
              </button>
            </div>
          )}
        </div>

        <Notifications />
        <UserProfile />
      </div>
    </header>
  );
};
