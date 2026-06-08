import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, ExternalLink, Search, X } from 'lucide-react';
import PageHero from './PageHero';
import { useCollection } from '@/hooks/useFirestore';
import { SkeletonGrid } from '@/components/ui/LoadingSpinner';
import { CATEGORIES } from '@/utils/constants';
import { excerpt, getLangField, normalizeSearch, sanitizeHtml } from '@/utils/helpers';
import { formatDate } from '@/utils/dateUtils';
import { useLanguage } from '@/hooks/useLanguage';

const categoryColors = {
  agriculture: 'bg-green-100 text-green-800',
  women: 'bg-pink-100 text-pink-800',
  youth: 'bg-sky-100 text-sky-800',
  health: 'bg-red-100 text-red-800',
  housing: 'bg-indigo-100 text-indigo-800',
  education: 'bg-yellow-100 text-yellow-900'
};

const labelize = (value = '') => value.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const Schemes = () => {
  const { language } = useLanguage();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const { data = [], isLoading, isError, refetch } = useCollection('schemes', {
    activeOnly: true,
    publishedOnly: true,
    orderByField: 'date',
    orderDirection: 'desc'
  });

  const filtered = useMemo(() => data.filter((item) => {
    const okCategory = category === 'all' || item.category === category;
    const haystack = normalizeSearch(`${getLangField(item, 'title', language)} ${getLangField(item, 'description', language)} ${item.category || ''}`);
    return okCategory && (!search || haystack.includes(normalizeSearch(search)));
  }), [category, data, language, search]);

  return (
    <>
      <PageHero page="schemes" title="Government Schemes" subtitle="General welfare schemes, application links, and public information" />
      <section className="container-page py-10 md:py-12">
        <div className="mb-7 rounded-lg border border-yellow-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setCategory('all')} className={`rounded-full px-4 py-2 text-sm font-black ${category === 'all' ? 'bg-tdp-red text-white' : 'bg-slate-100 text-slate-700'}`}>All</button>
              {CATEGORIES.schemes.map((item) => (
                <button key={item} onClick={() => setCategory(item)} className={`rounded-full px-4 py-2 text-sm font-black ${category === item ? 'bg-tdp-red text-white' : 'bg-slate-100 text-slate-700'}`}>
                  {labelize(item)}
                </button>
              ))}
            </div>
            <label className="flex min-h-11 w-full items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 lg:w-80">
              <Search size={17} className="shrink-0 text-slate-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search schemes" className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" />
            </label>
          </div>
        </div>

        {isLoading && <SkeletonGrid />}
        {isError && <div className="rounded-lg bg-red-50 p-6 text-red-700">Unable to load schemes. <button onClick={() => refetch()} className="font-bold underline">Retry</button></div>}
        {!isLoading && !isError && !filtered.length && <div className="rounded-lg bg-white p-10 text-center text-gray-500">No active schemes found.</div>}

        {!isLoading && !isError && !!filtered.length && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((scheme, index) => <SchemeCard key={scheme.id} scheme={scheme} index={index} language={language} />)}
          </div>
        )}
      </section>
    </>
  );
};

const SchemeCard = ({ scheme, index, language }) => {
  const [open, setOpen] = useState(false);
  const title = getLangField(scheme, 'title', language) || getLangField(scheme, 'name', language);
  const description = getLangField(scheme, 'description', language) || getLangField(scheme, 'content', language);
  const image = scheme.image || scheme.thumbnail || scheme.images?.[0] || '/og-image.svg';
  const applyLink = scheme.applyLink || scheme.linkUrl;
  const date = scheme.date || scheme.publishedAt || scheme.updatedAt || scheme.createdAt;

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.24) }}
        className="group flex overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_10px_26px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:border-yellow-300 hover:shadow-[0_18px_40px_rgba(245,166,35,0.20)]"
      >
        <div className="flex min-w-0 flex-1 flex-col">
          <button type="button" onClick={() => setOpen(true)} className="relative block aspect-[16/10] w-full overflow-hidden bg-slate-100">
            <img src={image} alt={title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
            <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-black shadow ${categoryColors[scheme.category] || 'bg-yellow-100 text-yellow-900'}`}>
              {labelize(scheme.category || 'scheme')}
            </span>
          </button>
          <div className="flex flex-1 flex-col p-4">
            <h2 className="line-clamp-2 text-xl font-black leading-snug text-slate-950">{title}</h2>
            <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{excerpt(description, 170)}</p>
            <button type="button" onClick={() => setOpen(true)} className="mt-3 w-max text-sm font-black text-tdp-red">Read More</button>
            <div className="mt-auto pt-5">
              {date && <p className="mb-3 inline-flex items-center gap-1.5 text-xs font-bold text-slate-500"><Calendar size={14} /> Date: {formatDate(date)}</p>}
              {applyLink && (
                <a href={applyLink} target="_blank" rel="noreferrer" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-tdp-yellow px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-tdp-navy shadow-[0_8px_22px_rgba(245,166,35,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(245,166,35,0.55)]">
                  <ExternalLink size={17} /> Apply Now
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.article>
      <SchemeModal scheme={scheme} open={open} onClose={() => setOpen(false)} language={language} />
    </>
  );
};

const SchemeModal = ({ scheme, open, onClose, language }) => {
  const title = getLangField(scheme, 'title', language) || getLangField(scheme, 'name', language);
  const description = getLangField(scheme, 'description', language) || getLangField(scheme, 'content', language);
  const image = scheme.image || scheme.thumbnail || scheme.images?.[0] || '/og-image.svg';
  const applyLink = scheme.applyLink || scheme.linkUrl;
  const date = scheme.date || scheme.publishedAt || scheme.updatedAt || scheme.createdAt;

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[9998] grid place-items-center bg-slate-950/78 p-3 backdrop-blur-sm md:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.article className="relative max-h-[92vh] w-full max-w-4xl overflow-hidden rounded-lg border border-yellow-300 bg-white shadow-2xl" initial={{ y: 24, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 16, opacity: 0, scale: 0.97 }} onClick={(event) => event.stopPropagation()}>
            <span className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-tdp-red via-tdp-yellow to-tdp-red" />
            <button type="button" onClick={onClose} className="absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-white text-slate-950 shadow-lg" aria-label="Close scheme details">
              <X size={19} />
            </button>
            <div className="max-h-[92vh] overflow-y-auto">
              <div className="relative aspect-[16/7] min-h-56 bg-slate-100">
                <img src={image} alt={title} className="h-full w-full object-cover" />
                <span className={`absolute bottom-4 left-4 rounded-full px-3 py-1 text-xs font-black shadow ${categoryColors[scheme.category] || 'bg-yellow-100 text-yellow-900'}`}>
                  {labelize(scheme.category || 'scheme')}
                </span>
              </div>
              <div className="p-5 md:p-7">
                <h2 className="text-2xl font-black leading-tight text-slate-950 md:text-4xl">{title}</h2>
                {date && <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-3 py-1.5 text-sm font-bold text-slate-600"><Calendar size={16} />{formatDate(date)}</p>}
                <div className="prose-content mt-6 rounded-lg border border-yellow-200 bg-white p-5 leading-7 text-slate-700 shadow-sm" dangerouslySetInnerHTML={sanitizeHtml(description)} />
                {applyLink && (
                  <a href={applyLink} target="_blank" rel="noreferrer" className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-lg bg-tdp-yellow px-5 py-4 text-base font-black uppercase tracking-[0.08em] text-tdp-navy shadow-[0_10px_28px_rgba(245,166,35,0.40)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(245,166,35,0.60)] md:w-auto">
                    <ExternalLink size={19} /> Apply Now
                  </a>
                )}
              </div>
            </div>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Schemes;
