import { create } from 'zustand';

export const useContentStore = create((set) => ({
  siteConfig: null,
  setSiteConfig: (siteConfig) => set({ siteConfig }),
  heroes: {},
  setHero: (page, hero) => set((state) => ({ heroes: { ...state.heroes, [page]: hero } }))
}));
