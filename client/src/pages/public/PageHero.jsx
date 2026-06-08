import { Helmet } from 'react-helmet-async';
import { useDoc } from '@/hooks/useFirestore';
import { DEFAULT_HERO_IMAGE } from '@/utils/constants';
import { getLangField } from '@/utils/helpers';
import { useLanguage } from '@/hooks/useLanguage';
import MlaHero from '@/components/ui/MlaHero';

const PageHero = ({ page, title, subtitle }) => {
  const { data: globalHero } = useDoc('heroSections', 'global');
  const { data: pageHero } = useDoc('heroSections', page);
  const { language } = useLanguage();
  const data = globalHero || pageHero;
  const pageTitle = getLangField(data, 'title', language) || title;
  const pageSubtitle = getLangField(data, 'subtitle', language) || subtitle;
  const desc = getLangField(data, 'description', language) || pageSubtitle;
  const slides = (globalHero?.slides?.length ? globalHero.slides : pageHero?.slides) || [];
  const firstImage = slides.find((slide) => slide?.image && slide.isActive !== false)?.image;

  return (
    <>
      <Helmet>
        <title>{pageTitle} | Narasaraopet TDP</title>
        <meta name="description" content={desc} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={desc} />
        <meta property="og:image" content={firstImage || data?.backgroundImage || DEFAULT_HERO_IMAGE || '/og-image.svg'} />
      </Helmet>
      <MlaHero slides={slides} />
    </>
  );
};

export default PageHero;
