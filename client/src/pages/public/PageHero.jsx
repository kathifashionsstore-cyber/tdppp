import { Helmet } from 'react-helmet-async';
import { useDoc } from '@/hooks/useFirestore';
import { DEFAULT_HERO_IMAGE } from '@/utils/constants';
import { getLangField } from '@/utils/helpers';
import { useLanguage } from '@/hooks/useLanguage';
import MlaHero from '@/components/ui/MlaHero';

const PageHero = ({ page, title, subtitle }) => {
  const { data } = useDoc('heroSections', page);
  const { language } = useLanguage();
  const pageTitle = getLangField(data, 'title', language) || title;
  const pageSubtitle = getLangField(data, 'subtitle', language) || subtitle;
  const desc = getLangField(data, 'description', language) || pageSubtitle;

  return (
    <>
      <Helmet>
        <title>{pageTitle} | Narasaraopet TDP</title>
        <meta name="description" content={desc} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={desc} />
        <meta property="og:image" content={data?.backgroundImage || DEFAULT_HERO_IMAGE || '/og-image.svg'} />
      </Helmet>
      <MlaHero />
    </>
  );
};

export default PageHero;
