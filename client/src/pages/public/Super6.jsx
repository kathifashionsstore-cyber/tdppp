import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUp, BookOpen, Film, PlayCircle } from 'lucide-react';
import PageHero from './PageHero';
import { useCollection } from '@/hooks/useFirestore';
import { super6Schemes } from '@/data/super6Data';
import { getLangField, sanitizeHtml } from '@/utils/helpers';
import { useLanguage } from '@/hooks/useLanguage';

const buildFallback = () => super6Schemes.slice(0, 6).map((scheme, index) => ({
  id: scheme.id,
  order: index + 1,
  title_en: scheme.nameEn,
  title_te: scheme.nameTe,
  shortDescription_en: scheme.description,
  shortDescription_te: scheme.description,
  description_en: [scheme.description, scheme.benefits, scheme.eligibility, scheme.steps].flat().filter(Boolean).map((item) => `<p>${item}</p>`).join(''),
  description_te: [scheme.description, scheme.benefits, scheme.eligibility, scheme.steps].flat().filter(Boolean).map((item) => `<p>${item}</p>`).join(''),
  videos: scheme.videoSrc ? [{ title: `${scheme.nameEn} Video`, url: scheme.videoSrc }] : [],
  isPublished: true,
  isActive: true
}));

const Super6 = () => {
  const { language } = useLanguage();
  const { data = [], isLoading } = useCollection('super6Schemes', { publishedOnly: true, activeOnly: true, orderByField: 'order', orderDirection: 'asc' });
  const schemes = useMemo(() => {
    const adminItems = data.length ? data : buildFallback();
    return adminItems.sort((a, b) => (a.order || 99) - (b.order || 99)).slice(0, 6);
  }, [data]);

  return (
    <>
      <PageHero page="super6" title="Super 6 Schemes" subtitle="Flagship welfare schemes of Telugu Desam Party" />
      <section className="bg-white py-12 md:py-16">
        <div className="container-page">
          <div className="mb-7 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-tdp-red">Dedicated Super 6 Page</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950 md:text-4xl">Six schemes, clear details, and inline videos</h2>
            <p className="mt-3 leading-7 text-slate-600">This page is managed from the Super 6 admin panel and remains completely separate from General Schemes.</p>
          </div>
          {isLoading && !data.length && <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm font-bold text-yellow-900">Loading admin Super 6 entries. Showing built-in defaults until Firebase responds.</div>}
          <div className="grid items-start gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {schemes.map((scheme, index) => <Super6Card key={scheme.id || index} scheme={scheme} index={index} language={language} />)}
          </div>
        </div>
      </section>
    </>
  );
};

const Super6Card = ({ scheme, index, language }) => {
  const [expanded, setExpanded] = useState(false);
  const title = getLangField(scheme, 'title', language);
  const fullDescription = getLangField(scheme, 'readMore', language) || getLangField(scheme, 'description', language);
  const videos = normalizeVideos(scheme.videos || scheme.videoUrls);

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.25) }}
      className="group overflow-hidden rounded-lg border border-yellow-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.10)] transition hover:-translate-y-1 hover:border-yellow-300 hover:shadow-[0_18px_42px_rgba(245,166,35,0.22)]"
    >
      <div className="p-4">
        <h3 className="line-clamp-3 text-2xl font-black leading-tight text-tdp-yellow drop-shadow-[0_1px_1px_rgba(15,23,42,0.65)]">{title || `Super 6 Scheme ${index + 1}`}</h3>
        <div className="mt-4">
          <InlineVideoPlaylist videos={videos} cardIndex={index} />
        </div>
        <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-tdp-yellow px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-tdp-navy shadow-[0_8px_22px_rgba(245,166,35,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(245,166,35,0.55)]">
          <BookOpen size={16} /> {expanded ? 'Close' : 'Read More'} {expanded ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
        </button>
      </div>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28 }} className="overflow-hidden border-t border-yellow-200 bg-yellow-50/55">
            <div className="p-5">
              <div className="prose-content rounded-lg border border-yellow-200 bg-white p-4 text-base leading-7 text-slate-700 shadow-sm" dangerouslySetInnerHTML={sanitizeHtml(fullDescription)} />
              <button type="button" onClick={() => setExpanded(false)} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-yellow-300 bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.08em] text-tdp-red shadow-sm">
                Close <ArrowUp size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
};

const InlineVideoPlaylist = ({ videos, cardIndex }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [inView, setInView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progressMap, setProgressMap] = useState({});
  const wrapperRef = useRef(null);
  const videoRef = useRef(null);
  const active = videos[activeIndex];

  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: '180px 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setLoading(true);
    return undefined;
  }, [active?.url]);

  const switchVideo = (index) => {
    const current = videoRef.current;
    if (current) {
      if (active?.url) setProgressMap((state) => ({ ...state, [active.url]: current.currentTime || 0 }));
      current.pause();
    }
    setLoading(true);
    setActiveIndex(index);
  };

  const handleLoadedMetadata = () => {
    const current = videoRef.current;
    if (!current || !active?.url) return;
    const saved = progressMap[active.url] || 0;
    if (saved > 0 && Number.isFinite(current.duration) && saved < current.duration) {
      current.currentTime = saved;
    }
    setLoading(false);
  };

  const handleTimeUpdate = () => {
    const current = videoRef.current;
    if (!current || !active?.url) return;
    setProgressMap((state) => ({ ...state, [active.url]: current.currentTime || 0 }));
  };

  const fullscreen = () => {
    const node = wrapperRef.current;
    if (node?.requestFullscreen) node.requestFullscreen();
  };

  if (!videos.length) {
    return (
      <div className="rounded-lg border border-yellow-300 bg-slate-950 p-3 shadow-xl">
        <div className="video-player-wrapper grid place-items-center text-center text-yellow-100">
          <div className="grid gap-2 px-4">
            <Film className="mx-auto text-tdp-yellow" size={34} />
            <p className="text-sm font-black uppercase tracking-[0.12em]">Video will appear here</p>
          </div>
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-300">No videos added yet.</p>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="rounded-lg border border-slate-900 bg-slate-950 p-3 shadow-xl">
      <div className="mb-3 flex items-center justify-between gap-3 text-sm font-black uppercase tracking-[0.12em] text-tdp-yellow">
        <span className="inline-flex items-center gap-2"><PlayCircle size={18} /> Now Playing</span>
        <button type="button" onClick={fullscreen} className="rounded-full border border-yellow-300/40 px-3 py-1 text-[10px] text-yellow-100">Fullscreen</button>
      </div>
      <div className="video-player-wrapper relative">
        {loading && <div className="absolute inset-0 z-10 skeleton bg-slate-900" />}
        {inView && (
          <video
            ref={videoRef}
            key={active.url}
            src={active.url}
            controls
            muted={cardIndex === 0}
            autoPlay={cardIndex === 0}
            preload="metadata"
            playsInline
            onLoadedMetadata={handleLoadedMetadata}
            onCanPlay={() => setLoading(false)}
            onWaiting={() => setLoading(true)}
            onTimeUpdate={handleTimeUpdate}
          />
        )}
      </div>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
        {videos.map((video, index) => (
          <button key={`${video.url}-${index}`} type="button" onClick={() => switchVideo(index)} className={`min-w-[132px] rounded-lg border p-2 text-left transition ${index === activeIndex ? 'border-tdp-yellow bg-tdp-yellow text-slate-950' : 'border-white/15 bg-white/8 text-white hover:bg-white/14'}`}>
            <span className="grid aspect-video place-items-center rounded bg-black/40">
              <PlayCircle size={28} className={index === activeIndex ? 'text-slate-950' : 'text-tdp-yellow'} />
            </span>
            <span className="mt-2 line-clamp-2 block text-xs font-black">{video.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

const normalizeVideos = (videos = []) => videos.filter(Boolean).map((video, index) => {
  if (typeof video === 'string') return { title: `Video ${index + 1}`, url: video };
  return { title: video.title || `Video ${index + 1}`, url: video.url || video.src || '' };
}).filter((video) => video.url);

export default Super6;
