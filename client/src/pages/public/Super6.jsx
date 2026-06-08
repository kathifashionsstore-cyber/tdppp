import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, PlayCircle, X } from 'lucide-react';
import PageHero from './PageHero';
import { useCollection } from '@/hooks/useFirestore';
import { super6Schemes } from '@/data/super6Data';
import { excerpt, getLangField, sanitizeHtml } from '@/utils/helpers';
import { useLanguage } from '@/hooks/useLanguage';

const buildFallback = () => super6Schemes.slice(0, 6).map((scheme, index) => ({
  id: scheme.id,
  order: index + 1,
  title_en: scheme.nameEn,
  title_te: scheme.nameTe,
  description_en: scheme.description,
  description_te: scheme.description,
  readMore_en: [scheme.benefits, scheme.eligibility, scheme.steps].flat().filter(Boolean).map((item) => `<p>${item}</p>`).join(''),
  readMore_te: [scheme.benefits, scheme.eligibility, scheme.steps].flat().filter(Boolean).map((item) => `<p>${item}</p>`).join(''),
  thumbnail: scheme.image,
  image: scheme.image,
  videos: scheme.videoSrc ? [scheme.videoSrc] : [],
  isPublished: true
}));

const Super6 = () => {
  const { language } = useLanguage();
  const [active, setActive] = useState(null);
  const { data = [], isLoading } = useCollection('super6Schemes', { publishedOnly: true, orderByField: 'order', orderDirection: 'asc' });
  const schemes = useMemo(() => {
    const adminItems = data.length ? data : buildFallback();
    return adminItems.slice(0, 6);
  }, [data]);

  return (
    <>
      <PageHero page="super6" title="Super 6 Schemes" subtitle="Flagship welfare schemes of Telugu Desam Party" />
      <section className="bg-white py-12 md:py-16">
        <div className="container-page">
          <div className="mb-7 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-tdp-red">Dedicated Super 6 Page</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950 md:text-4xl">Six schemes, clear details, videos, and updates</h2>
            <p className="mt-3 leading-7 text-slate-600">Each entry is managed from the Super 6 admin panel and remains separate from general government schemes.</p>
          </div>
          {isLoading && !data.length && <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm font-bold text-yellow-900">Loading admin Super 6 entries. Showing built-in defaults until Firebase responds.</div>}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {schemes.map((scheme, index) => (
              <motion.article
                key={scheme.id || index}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.04 }}
                className="group overflow-hidden rounded-lg border border-yellow-200 bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-yellow-50">
                  <img src={scheme.thumbnail || scheme.image || scheme.images?.[0] || '/og-image.svg'} alt={getLangField(scheme, 'title', language)} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <span className="absolute left-3 top-3 rounded-full bg-tdp-yellow px-3 py-1 text-xs font-black text-tdp-red">Super 6.{index + 1}</span>
                </div>
                <div className="p-5">
                  <h3 className="line-clamp-2 text-xl font-black leading-tight text-slate-950">{getLangField(scheme, 'title', language)}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{excerpt(getLangField(scheme, 'shortDescription', language) || getLangField(scheme, 'description', language), 135)}</p>
                  <button type="button" onClick={() => setActive(scheme)} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-tdp-red px-4 py-2 text-sm font-black text-white shadow-red">
                    Read More <ArrowRight size={16} />
                  </button>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
      <Super6Modal item={active} language={language} onClose={() => setActive(null)} />
    </>
  );
};

const Super6Modal = ({ item, language, onClose }) => {
  if (!item) return null;
  const title = getLangField(item, 'title', language);
  const details = getLangField(item, 'readMore', language) || getLangField(item, 'description', language);
  const videos = (item.videos || item.videoUrls || []).filter(Boolean);

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[9998] grid place-items-center bg-slate-950/82 p-3 backdrop-blur-sm md:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
        <motion.article className="relative max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-lg bg-white shadow-2xl" initial={{ y: 26, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 18, opacity: 0, scale: 0.98 }} onClick={(event) => event.stopPropagation()}>
          <button type="button" onClick={onClose} className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white text-slate-950 shadow-lg" aria-label="Close Super 6 details"><X size={19} /></button>
          <div className="grid md:grid-cols-[0.85fr_1.15fr]">
            <div className="bg-slate-950">
              <img src={item.thumbnail || item.image || item.images?.[0] || '/og-image.svg'} alt={title} className="h-full max-h-[42vh] w-full object-cover md:max-h-none" />
            </div>
            <div className="p-5 md:p-8">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-tdp-red">Super 6 Scheme</p>
              <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 md:text-5xl">{title}</h2>
              <div className="prose-content mt-5 rounded-lg bg-yellow-50 p-5 leading-8 text-slate-700" dangerouslySetInnerHTML={sanitizeHtml(details)} />
              <div className="mt-6">
                <div className="mb-3 flex items-center gap-2">
                  <PlayCircle className="text-tdp-red" />
                  <h3 className="text-xl font-black text-slate-950">Videos</h3>
                </div>
                {videos.length ? (
                  <div className="grid gap-4">
                    {videos.map((url, index) => (
                      <video key={`${url}-${index}`} controls preload="metadata" poster={item.thumbnail || item.image || item.images?.[0]} className="aspect-video w-full rounded-lg bg-slate-950 shadow-sm">
                        <source src={url} />
                      </video>
                    ))}
                  </div>
                ) : <div className="rounded-lg border border-dashed border-slate-200 p-5 text-sm font-semibold text-slate-500">No videos added yet.</div>}
              </div>
            </div>
          </div>
        </motion.article>
      </motion.div>
    </AnimatePresence>
  );
};

export default Super6;
