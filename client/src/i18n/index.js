import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import te from './te.json';
import en from './en.json';

const getSavedLanguage = () => {
  try {
    return JSON.parse(localStorage.getItem('tdp-language') || '{}')?.state?.language;
  } catch {
    return null;
  }
};

const savedLanguage = getSavedLanguage();
const initialLanguage = savedLanguage === 'te' || savedLanguage === 'en' ? savedLanguage : 'en';

i18n.use(initReactI18next).init({
  resources: { te: { translation: te }, en: { translation: en } },
  lng: initialLanguage,
  fallbackLng: 'en',
  interpolation: { escapeValue: false }
});

export default i18n;
