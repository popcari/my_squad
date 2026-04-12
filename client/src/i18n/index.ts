import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import vi from './locales/vi.json';

const LANG_KEY = 'app_language';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    vi: { translation: vi },
  },
  lng: (typeof window !== 'undefined' && localStorage.getItem(LANG_KEY)) || 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export const changeLanguage = (lng: string) => {
  i18n.changeLanguage(lng);
  if (typeof window !== 'undefined') {
    localStorage.setItem(LANG_KEY, lng);
  }
};

export default i18n;
