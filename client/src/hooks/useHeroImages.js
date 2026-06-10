import { useMemo } from 'react';
import { useCollection } from '@/hooks/useFirestore';
import { getPageHeroConfig, PAGE_HERO_MAX_IMAGES } from '@/utils/pageHeroConfig';

export const useHeroImages = (pageName) => {
  const config = useMemo(() => getPageHeroConfig(pageName), [pageName]);
  const {
    data = [],
    isLoading,
    isError,
    error
  } = useCollection(config?.collectionName || 'heroImages_disabled', {
    activeOnly: true,
    enabled: Boolean(config),
    limitCount: PAGE_HERO_MAX_IMAGES,
    orderByField: 'order',
    orderDirection: 'asc'
  });

  const images = useMemo(() => {
    if (!config) return [];

    return data
      .filter((item) => item?.imageUrl && item.isActive !== false)
      .sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99))
      .slice(0, PAGE_HERO_MAX_IMAGES)
      .map((item, index) => ({
        id: item.id,
        image: item.imageUrl,
        imageDesktop: item.imageUrl,
        imageMobile: item.imageUrl,
        deleteUrl: item.deleteUrl,
        thumbUrl: item.thumbUrl,
        order: Number(item.order) || index + 1,
        isActive: item.isActive !== false,
        alt_en: `${config.pageLabel} hero banner ${index + 1}`
      }));
  }, [config, data]);

  return {
    config,
    images,
    isLoading: Boolean(config) && isLoading,
    isError,
    error
  };
};
