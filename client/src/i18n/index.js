import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import te from './te.json';
import en from './en.json';

i18n.use(initReactI18next).init({
  resources: { te: { translation: te }, en: { translation: en } },
  lng: JSON.parse(localStorage.getItem('tdp-language') || '{}')?.state?.language || 'te',
  fallbackLng: 'te',
  interpolation: { escapeValue: false }
});

export default i18n;
