import { create } from 'zustand';
import { LanguageCode, TextDirection } from '@shared/types';
import enTranslations from '../translations/en.json';
import arTranslations from '../translations/ar.json';
import frTranslations from '../translations/fr.json';

type Dictionary = Record<string, string>;

const dictionaries: Record<LanguageCode, Dictionary> = {
  fr: frTranslations,
  en: enTranslations,
  ar: arTranslations,
};

interface LanguageState {
  language: LanguageCode;
  direction: TextDirection;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

const getInitialLanguage = (): LanguageCode => {
  try {
    const saved = localStorage.getItem('zabad_language') as LanguageCode | null;
    if (saved && (saved === 'fr' || saved === 'en' || saved === 'ar')) {
      return saved;
    }
  } catch {
    // fallback
  }
  return 'fr'; // Default to French
};

const initialLang = getInitialLanguage();
const initialDir: TextDirection = initialLang === 'ar' ? 'rtl' : 'ltr';
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('dir', initialDir);
  document.documentElement.setAttribute('lang', initialLang);
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: initialLang,
  direction: initialDir,
  setLanguage: (lang: LanguageCode) => {
    const dir: TextDirection = lang === 'ar' ? 'rtl' : 'ltr';
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', dir);
      document.documentElement.setAttribute('lang', lang);
    }
    try {
      localStorage.setItem('zabad_language', lang);
    } catch {
      // ignore
    }
    set({ language: lang, direction: dir });
  },
  t: (key: string) => {
    const lang = get().language;
    const dict = dictionaries[lang] || dictionaries.fr || dictionaries.en;
    return dict[key] || key;
  },
}));
