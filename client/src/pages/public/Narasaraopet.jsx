import { useMemo, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { CalendarDays, ChevronRight, History, Image, Landmark, MapPinned, Navigation, Sparkles, Star, X } from 'lucide-react';
import PageHero from './PageHero';
import StatCounter from '@/components/ui/StatCounter';
import { useCollection } from '@/hooks/useFirestore';
import { getLangField, sanitizeHtml } from '@/utils/helpers';
import { useLanguage } from '@/hooks/useLanguage';
import { SkeletonGrid } from '@/components/ui/LoadingSpinner';

const townTitle = '\u0c28\u0c30\u0c38\u0c30\u0c3e\u0c35\u0c41\u0c2a\u0c47\u0c1f - Narasaraopet';

const fallbackSections = [
  {
    id: 'about-fallback',
    title_en: 'About Narasaraopet',
    description_en: '<p>Narasaraopet is a major civic, education, trade, and public-service center in Palnadu district. The constituency profile, local priorities, attractions, and development updates can be managed from the admin panel.</p>',
    category: 'about',
    order: 1,
    isPublished: true
  },
  {
    id: 'kotappakonda-fallback',
    title_en: 'Kotappakonda - Sri Trikoteswara Swamy Temple',
    description_en: '<p>Kotappakonda is one of the best-known spiritual landmarks near Narasaraopet, known for its three-peaked hill landscape and Sri Trikoteswara Swamy temple. Devotee footfall is especially high during Maha Sivaratri, Mondays, Thursdays, and Poornima.</p>',
    category: 'temple',
    order: 2,
    image: '/og-image.svg',
    mapEmbedUrl: 'https://www.google.com/maps?q=Kotappakonda%20Temple,Andhra%20Pradesh&output=embed',
    linkUrl: 'https://www.google.com/maps?q=Kotappakonda%20Temple,Andhra%20Pradesh',
    isPublished: true
  },
  {
    id: 'town-map',
    title_en: 'Narasaraopet Town Map',
    category: 'map',
    mapEmbedUrl: 'https://www.google.com/maps?q=Narasaraopet,Andhra%20Pradesh&output=embed',
    order: 90,
    isPublished: true
  },
  {
    id: 'temple-map',
    title_en: 'Kotappakonda Map',
    category: 'map',
    mapEmbedUrl: 'https://www.google.com/maps?q=Kotappakonda%20Temple,Andhra%20Pradesh&output=embed',
    order: 91,
    isPublished: true
  },
  {
    id: 'attraction-market',
    title_en: 'Local Civic Centers',
    description_en: '<p>Add local attractions, public places, and constituency development highlights from the admin panel.</p>',
    category: 'attraction',
    order: 20,
    image: '/og-image.svg',
    isPublished: true
  },
  {
    id: 'history-public-service',
    title_en: 'Public Service and Development',
    description_en: '<p>Use historical timeline entries to record milestones, public amenities, and important constituency updates.</p>',
    category: 'history',
    order: 30,
    isPublished: true
  }
];

const defaultStats = [
  { number: '221573', label: 'Voters' },
  { number: '26', label: 'Wards and local areas' },
  { number: '13', label: 'Km to Kotappakonda' },
  { number: '1', label: 'Constituency focus' }
];

const reveal = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0 }
};

const Narasaraopet = () => {
  const { language } = useLanguage();
  const [activeImage, setActiveImage] = useState(null);
  const { data = [], isLoading, error, refetch } = useCollection('narasaraopetSections', { publishedOnly: true, orderByField: 'order', orderDirection: 'asc' });
  const sections = useMemo(() => (data.length ? data : fallbackSections).filter(Boolean), [data]);
  const page = useMemo(() => organizeSections(sections), [sections]);

  if (error) {
    return (
      <section className="container-page py-16 text-center">
        <h1 className="text-2xl font-black text-slate-950">Narasaraopet page could not load</h1>
        <button type="button" onClick={() => refetch?.()} className="mt-5 rounded-lg bg-tdp-red px-5 py-3 font-black text-white">Retry</button>
      </section>
    );
  }

  return (
    <>
      <PageHero page="narasaraopet" title="Narasaraopet Constituency" subtitle="Places, maps, history, and development updates" />

      {isLoading && !data.length ? <section className="container-page py-12"><SkeletonGrid /></section> : (
        <>
          <section className="bg-white py-12 md:py-16">
            <div className="container-page">
              <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.45 }} className="mx-auto max-w-4xl text-center">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-tdp-red">Constituency Profile</p>
                <h1 className="mt-3 text-4xl font-black leading-tight text-slate-950 md:text-6xl">{townTitle}</h1>
                <motion.div initial={{ width: 0 }} whileInView={{ width: '11rem' }} viewport={{ once: true }} transition={{ duration: 0.65, ease: 'easeOut' }} className="mx-auto mt-5 h-1 rounded-full bg-tdp-yellow" />
              </motion.div>
            </div>
          </section>

          <AboutSection item={page.about} language={language} />
          <KotappakondaSection item={page.kotappakonda} language={language} onImage={setActiveImage} />
          <MapSection maps={page.maps} language={language} />
          <AttractionsGrid items={page.attractions} language={language} onImage={setActiveImage} />
          <TimelineSection items={page.timeline} language={language} />
        </>
      )}

      {activeImage && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/84 p-4" onClick={() => setActiveImage(null)}>
          <button type="button" className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white text-slate-950" onClick={() => setActiveImage(null)} aria-label="Close image"><X /></button>
          <img src={activeImage.url} alt={activeImage.title} className="max-h-[86vh] max-w-[94vw] rounded-lg object-contain shadow-2xl" onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </>
  );
};

const AboutSection = ({ item, language }) => (
  <section className="bg-slate-950 py-12 text-white md:py-16">
    <div className="container-page grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.45 }}>
        <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-tdp-yellow"><Landmark size={16} /> About Narasaraopet</p>
        <h2 className="mt-3 text-3xl font-black leading-tight md:text-5xl">{getLangField(item, 'title', language) || 'About Narasaraopet'}</h2>
        <div className="prose-content mt-5 max-w-3xl leading-8 text-white/76" dangerouslySetInnerHTML={sanitizeHtml(getLangField(item, 'description', language) || getLangField(item, 'content', language))} />
      </motion.div>
      <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.45, delay: 0.1 }} className="grid grid-cols-2 gap-4 rounded-lg border border-white/10 bg-white/8 p-5 shadow-2xl">
        {defaultStats.map((stat) => <StatCounter key={stat.label} number={stat.number} label={stat.label} />)}
      </motion.div>
    </div>
  </section>
);

const KotappakondaSection = ({ item, language, onImage }) => {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [-40, 40]);
  const images = getImages(item);
  const heroImage = images[0] || '/og-image.svg';
  const directionsUrl = item.linkUrl || item.mapUrl || 'https://www.google.com/maps?q=Kotappakonda%20Temple,Andhra%20Pradesh';

  return (
    <section id="kotappakonda" ref={ref} className="relative overflow-hidden bg-white py-12 md:py-16">
      <motion.div style={{ y }} className="absolute inset-x-0 top-0 h-[58%] bg-slate-950">
        <img src={heroImage} alt="" className="h-full w-full object-cover opacity-30" />
      </motion.div>
      <div className="container-page relative">
        <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.45 }} className="grid overflow-hidden rounded-lg border border-yellow-200 bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
          <button type="button" onClick={() => onImage({ url: heroImage, title: getLangField(item, 'title', language) })} className="min-h-[320px] bg-slate-100 lg:min-h-[520px]">
            <img src={heroImage} alt={getLangField(item, 'title', language)} className="h-full w-full object-cover" />
          </button>
          <div className="p-6 md:p-8">
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-tdp-red"><Star size={16} /> Featured</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 md:text-5xl">{getLangField(item, 'title', language) || 'Kotappakonda'}</h2>
            <div className="prose-content mt-5 leading-8 text-slate-600" dangerouslySetInnerHTML={sanitizeHtml(getLangField(item, 'description', language) || getLangField(item, 'content', language))} />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {['Maha Sivaratri', 'Mondays', 'Thursdays', 'Poornima'].map((label) => (
                <div key={label} className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-3 font-black text-slate-900">
                  <CalendarDays size={18} className="text-tdp-red" /> {label}
                </div>
              ))}
            </div>
            <a href={directionsUrl} target="_blank" rel="noreferrer" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-lg bg-tdp-yellow px-5 py-3 font-black text-tdp-navy shadow-[0_10px_26px_rgba(245,166,35,0.35)]">
              <Navigation size={18} /> Get Directions
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const MapSection = ({ maps, language }) => (
  <section className="bg-slate-950 py-12 text-white md:py-16">
    <div className="container-page">
      <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.45 }} className="mb-7">
        <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-tdp-yellow"><MapPinned size={16} /> Google Maps</p>
        <h2 className="mt-2 text-3xl font-black md:text-4xl">Narasaraopet and Kotappakonda</h2>
      </motion.div>
      <div className="grid gap-5 md:grid-cols-2">
        {maps.slice(0, 2).map((item, index) => (
          <motion.article key={item.id || index} variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.45, delay: index * 0.08 }} className="overflow-hidden rounded-lg border border-white/10 bg-white/8 p-3 shadow-2xl">
            <h3 className="mb-3 flex items-center gap-2 px-1 font-black text-tdp-yellow"><MapPinned size={18} />{getLangField(item, 'title', language) || 'Map'}</h3>
            <iframe title={getLangField(item, 'title', language) || 'Map'} className="h-80 w-full rounded-md border border-yellow-300/40 bg-white md:h-96" loading="lazy" src={item.mapEmbedUrl || 'https://www.google.com/maps?q=Narasaraopet,Andhra%20Pradesh&output=embed'} />
          </motion.article>
        ))}
      </div>
    </div>
  </section>
);

const AttractionsGrid = ({ items, language, onImage }) => (
  <section className="bg-white py-12 md:py-16">
    <div className="container-page">
      <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.45 }} className="mb-7 max-w-3xl">
        <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-tdp-red"><Sparkles size={16} /> Local Attractions</p>
        <h2 className="mt-2 text-3xl font-black text-slate-950 md:text-4xl">Places, culture, and development highlights</h2>
      </motion.div>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => {
          const image = getImages(item)[0] || '/og-image.svg';
          return (
            <motion.article key={item.id || index} variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.18 }} transition={{ duration: 0.42, delay: Math.min(index * 0.06, 0.24) }} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md">
              <button type="button" onClick={() => onImage({ url: image, title: getLangField(item, 'title', language) })} className="block aspect-video w-full bg-slate-100">
                <img src={image} alt={getLangField(item, 'title', language)} className="h-full w-full object-cover" loading="lazy" />
              </button>
              <div className="p-5">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-tdp-red"><Image size={15} />{item.category || 'attraction'}</p>
                <h3 className="mt-2 text-xl font-black text-slate-950">{getLangField(item, 'title', language)}</h3>
                <div className="prose-content mt-3 line-clamp-5 text-slate-600" dangerouslySetInnerHTML={sanitizeHtml(getLangField(item, 'description', language) || getLangField(item, 'content', language))} />
                <span className="mt-4 inline-flex items-center gap-1 font-black text-tdp-red">Read More <ChevronRight size={16} /></span>
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  </section>
);

const TimelineSection = ({ items, language }) => (
  <section className="bg-yellow-50 py-12 md:py-16">
    <div className="container-page">
      <motion.div variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.45 }} className="mb-8 max-w-3xl">
        <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-tdp-red"><History size={16} /> Historical Timeline</p>
        <h2 className="mt-2 text-3xl font-black text-slate-950 md:text-4xl">Milestones and constituency updates</h2>
      </motion.div>
      <div className="relative grid gap-5 md:pl-8">
        <div className="absolute bottom-0 left-3 top-0 hidden w-px bg-yellow-300 md:block" />
        {items.map((item, index) => (
          <motion.article key={item.id || index} variants={reveal} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.22 }} transition={{ duration: 0.42, delay: Math.min(index * 0.06, 0.24) }} className="relative rounded-lg border border-yellow-200 bg-white p-5 shadow-sm">
            <span className="absolute -left-[2.2rem] top-6 hidden h-4 w-4 rounded-full border-4 border-white bg-tdp-red shadow md:block" />
            <p className="text-xs font-black uppercase tracking-[0.18em] text-tdp-red">{item.tag || item.category || 'history'}</p>
            <h3 className="mt-2 text-xl font-black text-slate-950">{getLangField(item, 'title', language)}</h3>
            <div className="prose-content mt-3 text-slate-600" dangerouslySetInnerHTML={sanitizeHtml(getLangField(item, 'description', language) || getLangField(item, 'content', language))} />
          </motion.article>
        ))}
      </div>
    </div>
  </section>
);

const organizeSections = (sections) => {
  const sorted = [...sections].sort((a, b) => (a.order || 99) - (b.order || 99));
  const about = sorted.find((item) => item.category === 'about') || fallbackSections[0];
  const kotappakonda = sorted.find((item) => item.category === 'temple' || /kotappakonda|trikoteswara/i.test(`${item.title_en || ''} ${item.title_te || ''}`)) || fallbackSections[1];
  const maps = sorted.filter((item) => item.category === 'map' || item.mapEmbedUrl);
  const timeline = sorted.filter((item) => item.category === 'history' || item.category === 'timeline');
  const attractions = sorted.filter((item) => (
    item.id !== about.id
    && item.id !== kotappakonda.id
    && !maps.some((map) => map.id === item.id)
    && !timeline.some((entry) => entry.id === item.id)
    && ['attraction', 'tourism', 'development'].includes(item.category)
  ));

  return {
    about,
    kotappakonda,
    maps: maps.length ? maps : fallbackSections.filter((item) => item.category === 'map'),
    attractions: attractions.length ? attractions : fallbackSections.filter((item) => item.category === 'attraction'),
    timeline: timeline.length ? timeline : fallbackSections.filter((item) => item.category === 'history')
  };
};

const getImages = (item = {}) => (item.images?.length ? item.images : [item.image || item.thumbnail]).filter(Boolean);

export default Narasaraopet;
