import { useMemo, useState } from 'react';
import PageHero from './PageHero';
import { Image, MapPinned, PlayCircle, Star, X } from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { getLangField, sanitizeHtml } from '@/utils/helpers';
import { useLanguage } from '@/hooks/useLanguage';
import { SkeletonGrid } from '@/components/ui/LoadingSpinner';

const fallbackSections = [
  {
    id: 'about-fallback',
    title_en: 'About Narasaraopet Constituency',
    description_en: '<p>Add constituency history, public facilities, local centers, and development priorities from the admin panel.</p>',
    category: 'about',
    order: 1,
    isPublished: true
  },
  {
    id: 'kotappakonda-fallback',
    title_en: 'Kotappakonda Temple',
    description_en: '<p>Add Kotappakonda Temple images, description, and optional video from the admin panel. This temple section is featured first when published.</p>',
    category: 'temple',
    order: 2,
    image: '/og-image.svg',
    isPublished: true
  },
  {
    id: 'map-narasaraopet',
    title_en: 'Narasaraopet Town Map',
    category: 'map',
    mapEmbedUrl: 'https://www.google.com/maps?q=Narasaraopet,Andhra%20Pradesh&output=embed',
    order: 98,
    isPublished: true
  },
  {
    id: 'map-kotappakonda',
    title_en: 'Kotappakonda Location Map',
    category: 'map',
    mapEmbedUrl: 'https://www.google.com/maps?q=Kotappakonda%20Temple,Andhra%20Pradesh&output=embed',
    order: 99,
    isPublished: true
  }
];

const Narasaraopet = () => {
  const { language } = useLanguage();
  const [activeImage, setActiveImage] = useState(null);
  const { data = [], isLoading } = useCollection('narasaraopetSections', { publishedOnly: true, orderByField: 'order', orderDirection: 'asc' });
  const sections = data.length ? data : fallbackSections;

  const { featuredTemple, mapSections, contentSections, imageFrames } = useMemo(() => {
    const temple = sections.find((item) => item.category === 'temple' || /kotappakonda/i.test(`${item.title_en || ''} ${item.title_te || ''}`));
    const maps = sections.filter((item) => item.category === 'map' || item.mapEmbedUrl);
    const content = sections.filter((item) => item.id !== temple?.id && !maps.some((map) => map.id === item.id));
    const frames = sections.flatMap((item) => (item.images?.length ? item.images : [item.image || item.thumbnail]).filter(Boolean).map((url) => ({ url, item })));
    return { featuredTemple: temple, mapSections: maps, contentSections: content, imageFrames: frames };
  }, [sections]);

  return (
    <>
      <PageHero page="narasaraopet" title="Narasaraopet Constituency" subtitle="Admin-controlled constituency profile, places, maps, and history" />

      {isLoading ? <section className="container-page py-12"><SkeletonGrid /></section> : (
        <>
          {featuredTemple && <FeaturedSection item={featuredTemple} language={language} onImage={setActiveImage} />}

          <section className="bg-white py-12 md:py-16">
            <div className="container-page">
              <div className="mb-7 max-w-3xl">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-tdp-red">Admin Managed</p>
                <h2 className="mt-2 text-3xl font-black text-slate-950 md:text-4xl">Constituency Sections</h2>
                <p className="mt-3 leading-7 text-slate-600">About, attractions, history, tourism, and development sections appear here in admin-defined order.</p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {contentSections.map((item) => <SectionCard key={item.id} item={item} language={language} onImage={setActiveImage} />)}
              </div>
            </div>
          </section>

          {!!imageFrames.length && (
            <section className="bg-yellow-50 py-12 md:py-16">
              <div className="container-page">
                <div className="mb-7 max-w-3xl">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-tdp-red">Photo Frames</p>
                  <h2 className="mt-2 text-3xl font-black text-slate-950">Narasaraopet in pictures</h2>
                </div>
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {imageFrames.map(({ url, item }, index) => (
                    <button key={`${url}-${index}`} type="button" onClick={() => setActiveImage({ url, title: getLangField(item, 'title', language) || 'Narasaraopet' })} className="group overflow-hidden rounded-lg border border-yellow-200 bg-white p-2 text-left shadow-md">
                      <span className="block aspect-[4/5] overflow-hidden rounded-md bg-slate-100">
                        <img src={url} alt={getLangField(item, 'title', language) || 'Narasaraopet'} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
                      </span>
                      <span className="block p-3 text-sm font-black leading-tight text-slate-950">{getLangField(item, 'title', language)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          )}

          <section className="bg-slate-950 py-12 text-white md:py-16">
            <div className="container-page">
              <div className="mb-7">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-tdp-yellow">Maps</p>
                <h2 className="mt-2 text-3xl font-black">Narasaraopet & Kotappakonda Locations</h2>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {mapSections.map((item) => (
                  <article key={item.id} className="overflow-hidden rounded-lg border border-white/10 bg-white/8 p-3 shadow-2xl">
                    <h3 className="mb-3 flex items-center gap-2 px-1 font-black text-tdp-yellow"><MapPinned size={18} />{getLangField(item, 'title', language) || 'Map'}</h3>
                    <iframe title={getLangField(item, 'title', language) || 'Map'} className="h-80 w-full rounded-md bg-white" loading="lazy" src={item.mapEmbedUrl || 'https://www.google.com/maps?q=Narasaraopet,Andhra%20Pradesh&output=embed'} />
                  </article>
                ))}
              </div>
            </div>
          </section>
        </>
      )}

      {activeImage && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/82 p-4" onClick={() => setActiveImage(null)}>
          <button className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white text-slate-950" onClick={() => setActiveImage(null)} aria-label="Close image"><X /></button>
          <img src={activeImage.url} alt={activeImage.title} className="max-h-[86vh] max-w-[94vw] rounded-lg object-contain shadow-2xl" onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </>
  );
};

const FeaturedSection = ({ item, language, onImage }) => {
  const images = (item.images?.length ? item.images : [item.image || item.thumbnail]).filter(Boolean);
  return (
    <section className="bg-slate-950 py-12 text-white md:py-16">
      <div className="container-page grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-tdp-yellow"><Star size={16} />Featured First</p>
          <h2 className="mt-3 text-3xl font-black leading-tight md:text-5xl">{getLangField(item, 'title', language)}</h2>
          <div className="prose-content mt-5 leading-8 text-white/76" dangerouslySetInnerHTML={sanitizeHtml(getLangField(item, 'description', language) || getLangField(item, 'content', language))} />
          {item.videoUrl && <a href={item.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-lg bg-tdp-yellow px-4 py-2 font-black text-slate-950"><PlayCircle size={18} /> Watch Video</a>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {(images.length ? images : ['/og-image.svg']).slice(0, 4).map((url, index) => (
            <button key={url} type="button" onClick={() => onImage({ url, title: getLangField(item, 'title', language) })} className={index === 0 ? 'sm:col-span-2' : ''}>
              <img src={url} alt={getLangField(item, 'title', language)} className="aspect-video w-full rounded-lg object-cover shadow-xl" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

const SectionCard = ({ item, language, onImage }) => {
  const image = item.images?.[0] || item.image || item.thumbnail;
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      {image && (
        <button type="button" onClick={() => onImage({ url: image, title: getLangField(item, 'title', language) })} className="mb-4 block aspect-video w-full overflow-hidden rounded-md bg-slate-100">
          <img src={image} alt={getLangField(item, 'title', language)} className="h-full w-full object-cover" />
        </button>
      )}
      <p className="flex items-center gap-2 text-xs font-black uppercase text-tdp-red"><Image size={15} />{item.category || 'section'}</p>
      <h3 className="mt-2 text-xl font-black text-slate-950">{getLangField(item, 'title', language)}</h3>
      <div className="prose-content mt-3 text-slate-600" dangerouslySetInnerHTML={sanitizeHtml(getLangField(item, 'description', language) || getLangField(item, 'content', language))} />
    </article>
  );
};

export default Narasaraopet;
