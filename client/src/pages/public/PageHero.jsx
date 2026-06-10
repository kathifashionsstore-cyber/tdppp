import { Helmet } from 'react-helmet-async';
import { DEFAULT_HERO_IMAGE } from '@/utils/constants';
import HeroSlideshow from '@/components/ui/HeroSlideshow';

const PageHero = ({ page, title, subtitle }) => {
  const pageTitle = title;
  const pageSubtitle = subtitle;
  const desc = pageSubtitle;

  return (
    <>
      <Helmet>
        <title>{pageTitle} | Narasaraopet TDP</title>
        <meta name="description" content={desc} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={desc} />
        <meta property="og:image" content={DEFAULT_HERO_IMAGE || '/og-image.svg'} />
      </Helmet>
      <HeroSlideshow pageName={page} />
    </>
  );
};

export default PageHero;
