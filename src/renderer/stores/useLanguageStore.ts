import { create } from 'zustand';
import { LanguageCode, TextDirection } from '@shared/types';
import enTranslations from '../translations/en.json';
import arTranslations from '../translations/ar.json';

type Dictionary = Record<string, string>;

const dictionaries: Record<LanguageCode, Dictionary> = {
  en: enTranslations,
  ar: arTranslations,
};

interface LanguageState {
  language: LanguageCode;
  direction: TextDirection;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
}

export const useLanguageStore = create<LanguageState>((set, get) => ({
  language: 'en',
  direction: 'ltr',
  setLanguage: (lang: LanguageCode) => {
    const dir: TextDirection = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
    set({ language: lang, direction: dir });
  },
  t: (key: string) => {
    const lang = get().language;
    const dict = dictionaries[lang] || dictionaries.en;
    return dict[key] || key;
  },
}));
