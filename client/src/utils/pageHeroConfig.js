export const PAGE_HERO_MAX_IMAGES = 5;
export const PAGE_HERO_MAX_SIZE_KB = 300;

export const PAGE_HERO_CONFIGS = [
  {
    pageName: 'home',
    pageLabel: 'Home Page',
    route: '/',
    adminLabel: 'Home Page Banners',
    collectionName: 'heroImages_home',
    storagePath: 'hero/home'
  },
  {
    pageName: 'news',
    pageLabel: 'News Page',
    route: '/news',
    adminLabel: 'News Page Banners',
    collectionName: 'heroImages_news',
    storagePath: 'hero/news'
  },
  {
    pageName: 'gallery',
    pageLabel: 'Gallery Page',
    route: '/gallery',
    adminLabel: 'Gallery Page Banners',
    collectionName: 'heroImages_gallery',
    storagePath: 'hero/gallery'
  },
  {
    pageName: 'dailywork',
    pageLabel: 'Daily Work Page',
    route: '/daily-work',
    adminLabel: 'Daily Work Banners',
    collectionName: 'heroImages_dailywork',
    storagePath: 'hero/dailywork'
  },
  {
    pageName: 'super6',
    pageLabel: 'Super 6 Page',
    route: '/super6',
    adminLabel: 'Super 6 Page Banners',
    collectionName: 'heroImages_super6',
    storagePath: 'hero/super6'
  },
  {
    pageName: 'schemes',
    pageLabel: 'Schemes Page',
    route: '/schemes',
    adminLabel: 'Schemes Page Banners',
    collectionName: 'heroImages_schemes',
    storagePath: 'hero/schemes'
  },
  {
    pageName: 'narasaraopet',
    pageLabel: 'Narasaraopet Page',
    route: '/narasaraopet',
    adminLabel: 'Narasaraopet Banners',
    collectionName: 'heroImages_narasaraopet',
    storagePath: 'hero/narasaraopet'
  },
  {
    pageName: 'contact',
    pageLabel: 'Contact Page',
    route: '/contact',
    adminLabel: 'Contact Page Banners',
    collectionName: 'heroImages_contact',
    storagePath: 'hero/contact'
  }
];

export const normalizePageHeroName = (pageName = '') => String(pageName)
  .trim()
  .toLowerCase()
  .replace(/[-_\s]+/g, '');

export const getPageHeroConfig = (pageName) => {
  const normalized = normalizePageHeroName(pageName);
  return PAGE_HERO_CONFIGS.find((config) => normalizePageHeroName(config.pageName) === normalized) || null;
};
