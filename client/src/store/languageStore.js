import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const normalizeLanguage = (language) => (language === 'te' || language === 'en' ? language : 'en');

export const useLanguageStore = create(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => set({ language: normalizeLanguage(language) }),
      toggleLanguage: () => set((state) => ({ language: normalizeLanguage(state.language) === 'te' ? 'en' : 'te' }))
    }),
    {
      name: 'tdp-language',
      migrate: (persistedState) => ({
        ...persistedState,
        language: normalizeLanguage(persistedState?.language)
      })
    }
  )
);
