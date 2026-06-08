import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '@/store/languageStore';

export const useLanguage = () => {
  const { language, setLanguage, toggleLanguage } = useLanguageStore();
  const { i18n } = useTranslation();
  useEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.lang = language;
  }, [language, i18n]);
  return { language, setLanguage, toggleLanguage };
};
