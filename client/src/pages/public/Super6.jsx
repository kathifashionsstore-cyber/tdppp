import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUp, BookOpen, Film, ImagePlus, PlayCircle } from 'lucide-react';
import PageHero from './PageHero';
import { useCollection } from '@/hooks/useFirestore';
import { super6Schemes } from '@/data/super6Data';
import { getLangField, sanitizeHtml } from '@/utils/helpers';
import { useLanguage } from '@/hooks/useLanguage';
import useResolvedImage from '@/hooks/useResolvedImage';
import SchemeGraphDashboard from '@/components/ui/SchemeGraphDashboard';

const buildFallback = () => super6Schemes.slice(0, 6).map((scheme, index) => ({
  id: scheme.id,
  schemeId: scheme.id,
  order: index + 1,
  title_en: scheme.nameEn,
  title_te: scheme.nameTe,
  shortDescription_en: scheme.description,
  shortDescription_te: scheme.description,
  description_en: [scheme.description, scheme.benefits, scheme.eligibility, scheme.steps].flat().filter(Boolean).map((item) => `<p>${item}</p>`).join(''),
  description_te: [scheme.description, scheme.benefits, scheme.eligibility, scheme.steps].flat().filter(Boolean).map((item) => `<p>${item}</p>`).join(''),
  videos: scheme.videoSrc ? [{ title: `${scheme.nameEn} Video`, url: scheme.videoSrc }] : [],
  playlistThumbnail: scheme.poster || scheme.image,
  thumbnailUrl: scheme.poster || scheme.image,
  thumbnailPath: '',
  thumbnailLabel_en: `${scheme.nameEn} Video`,
  thumbnailLabel_te: `${scheme.nameTe} Video`,
  progressPercent: 70 + (index * 4),
  isPublished: true,
  isActive: true
}));

const findAdminScheme = (items, fallback, index) => items.find((item) => (
  item.schemeId === fallback.schemeId
  || item.sourceId === fallback.schemeId
  || item.id === fallback.schemeId
  || item.title_en === fallback.title_en
  || Number(item.order) === index + 1
));

const Super6 = () => {
  const { language } = useLanguage();
  const { data = [], isLoading } = useCollection('super6Schemes', { orderByField: 'order', orderDirection: 'asc' });
  const schemes = useMemo(() => {
    const fallbackItems = buildFallback();
    return fallbackItems.map((fallback, index) => {
      const adminItem = findAdminScheme(data, fallback, index);
      return adminItem ? { ...fallback, ...adminItem, videos: normalizeVideos(adminItem.videos || adminItem.videoUrls).length ? adminItem.videos || adminItem.videoUrls : fallback.videos, order: index + 1 } : fallback;
    });
  }, [data]);

  return (
    <>
      <PageHero page="super6" title="Super 6 Schemes" subtitle="Flagship welfare schemes of Telugu Desam Party" />
      <Super6ProgressBars schemes={schemes} language={language} />
      <SchemeGraphDashboard />
      <section className="bg-white py-12 md:py-16">
        <div className="mx-auto w-full max-w-[1560px] px-4 sm:px-6 lg:px-8">
          <div className="mb-7 max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-tdp-red">Dedicated Super 6 Page</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950 md:text-4xl">Six schemes, clear details, and inline videos</h2>
            <p className="mt-3 leading-7 text-slate-600">This page is managed from the Super 6 admin panel and remains completely separate from General Schemes.</p>
          </div>
          {isLoading && !data.length && <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm font-bold text-yellow-900">Loading admin Super 6 entries. Showing built-in defaults until Firebase responds.</div>}
          <div className="grid items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
            {schemes.map((scheme, index) => <Super6Card key={scheme.id || index} scheme={scheme} index={index} language={language} />)}
          </div>
        </div>
      </section>
    </>
  );
};

const Super6ProgressBars = ({ schemes, language }) => (
  <section className="bg-[#10162f] py-10 text-white">
    <div className="container-page">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-tdp-yellow">Admin Controlled Progress</p>
        <h2 className="telugu mt-2 text-3xl font-black">సూపర్ 6 పురోగతి</h2>
        <p className="mt-1 text-sm font-semibold text-white/62">Progress percentages are managed from the Super 6 admin panel.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {schemes.slice(0, 6).map((scheme, index) => {
          const title = getLangField(scheme, 'title', language) || `Super 6 Scheme ${index + 1}`;
          const progress = Math.max(0, Math.min(100, Number(scheme.progressPercent ?? scheme.progress ?? 75)));
          return (
            <article key={scheme.id || index} className="rounded-lg border border-white/10 bg-white/[0.07] p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="telugu line-clamp-2 text-lg font-black text-white">{title}</h3>
                <span className="rounded-full bg-tdp-yellow px-3 py-1 text-xs font-black text-tdp-navy">{progress}%</span>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/12">
                <div className="h-full origin-left rounded-full bg-gradient-to-r from-tdp-yellow to-orange-400 transition-transform duration-700" style={{ transform: `scaleX(${progress / 100})` }} />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  </section>
);

const Super6Card = ({ scheme, index, language }) => {
  const [expanded, setExpanded] = useState(false);
  const title = getLangField(scheme, 'title', language);
  const fullDescription = getLangField(scheme, 'readMore', language) || getLangField(scheme, 'description', language);
  const videos = normalizeVideos(scheme.videos || scheme.videoUrls);
  const playlistThumbnail = scheme.thumbnailUrl || scheme.playlistThumbnail || scheme.thumbnailImage || scheme.videoThumbnail || scheme.thumbnail || scheme.image || scheme.images?.[0] || '/og-image.svg';
  const thumbnailLabel = getLangField(scheme, 'thumbnailLabel', language) || `${title || `Super 6 Scheme ${index + 1}`} Video`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.25) }}
      className="group mx-auto flex w-full max-w-[500px] flex-col gap-3 overflow-hidden rounded-2xl border-2 border-tdp-yellow bg-[#1a1a1a] p-4 shadow-[0_14px_36px_rgba(15,23,42,0.22)] transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(245,166,35,0.22)]"
    >
      <div>
        <h3 className="line-clamp-3 text-2xl font-black leading-tight text-tdp-yellow">{title || `Super 6 Scheme ${index + 1}`}</h3>
        <div className="mt-4">
          <InlineVideoPlaylist videos={videos} cardIndex={index} thumbnail={playlistThumbnail} thumbnailPath={scheme.thumbnailPath} thumbnailLabel={thumbnailLabel} />
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

const InlineVideoPlaylist = ({ videos, cardIndex, thumbnail, thumbnailPath, thumbnailLabel }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [inView, setInView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [progressMap, setProgressMap] = useState({});
  const { src: thumbnailSrc, isResolving: thumbnailResolving } = useResolvedImage(thumbnailFailed && thumbnailPath ? thumbnailPath : thumbnail, thumbnailPath);
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
    return () => {
      const current = videoRef.current;
      if (!current) return;
      current.pause();
      current.removeAttribute('src');
      current.load();
    };
  }, [active?.url]);

  useEffect(() => {
    setThumbnailFailed(false);
  }, [thumbnailSrc]);

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

  const playFromThumbnail = () => {
    const current = videoRef.current;
    if (current) current.play().catch(() => {});
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
    <div ref={wrapperRef} className="w-full rounded-lg border border-slate-900 bg-slate-950 p-3 shadow-xl">
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
            preload="none"
            playsInline
            onLoadedMetadata={handleLoadedMetadata}
            onCanPlay={() => setLoading(false)}
            onWaiting={() => setLoading(true)}
            onTimeUpdate={handleTimeUpdate}
          />
        )}
      </div>
      <button type="button" onClick={playFromThumbnail} className="group/thumbnail mt-3 block w-full text-left">
        <span className="relative block aspect-video w-full overflow-hidden rounded-lg border-2 border-tdp-yellow bg-black">
          {thumbnailSrc && !thumbnailFailed ? (
            <img src={thumbnailSrc} alt={thumbnailLabel} className="h-full w-full object-cover transition duration-300 group-hover/thumbnail:scale-105" loading="lazy" onError={() => setThumbnailFailed(true)} />
          ) : (
            <span className="grid h-full w-full place-items-center px-4 text-center text-sm font-black text-tdp-yellow">
              {thumbnailResolving ? 'Loading thumbnail...' : <><ImagePlus className="mb-2" size={28} /> No thumbnail uploaded</>}
            </span>
          )}
          <span className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition duration-300 group-hover/thumbnail:bg-black/22 group-hover/thumbnail:opacity-100">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-black/55 text-white"><PlayCircle size={24} /></span>
          </span>
        </span>
        <span className="mt-2 block rounded-lg bg-white/8 px-3 py-2 text-sm font-black text-yellow-100">{thumbnailLabel}</span>
      </button>
    </div>
  );
};

const normalizeVideos = (videos = []) => videos.filter(Boolean).map((video, index) => {
  if (typeof video === 'string') return { title: `Video ${index + 1}`, url: video };
  return { title: video.title || `Video ${index + 1}`, url: video.url || video.src || '' };
}).filter((video) => video.url);

export default Super6;
