import { Helmet } from 'react-helmet-async';
import { useCollection } from '@/hooks/useFirestore';
import { DEFAULT_HERO_IMAGE } from '@/utils/constants';
import MlaHero from '@/components/ui/MlaHero';

const PageHero = ({ page, title, subtitle }) => {
  const { data = [] } = useCollection('heroSections', { activeOnly: true, orderByField: 'order', orderDirection: 'asc' });
  const pageTitle = title;
  const pageSubtitle = subtitle;
  const desc = pageSubtitle;
  const slides = data
    .filter((item) => item?.imageUrl && item.isActive !== false)
    .sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99))
    .slice(0, 5)
    .map((item, index) => ({
      id: item.id,
      image: item.imageUrl,
      imageDesktop: item.imageUrl,
      imageMobile: item.imageUrl,
      imagePath: item.imagePath,
      order: item.order || index + 1,
      isActive: item.isActive !== false,
      alt_en: `Narasaraopet TDP hero banner ${index + 1}`
    }));
  const firstImage = slides[0];

  return (
    <>
      <Helmet>
        <title>{pageTitle} | Narasaraopet TDP</title>
        <meta name="description" content={desc} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={desc} />
        <meta property="og:image" content={firstImage?.image || DEFAULT_HERO_IMAGE || '/og-image.svg'} />
      </Helmet>
      <MlaHero slides={slides} />
    </>
  );
};

export default PageHero;
