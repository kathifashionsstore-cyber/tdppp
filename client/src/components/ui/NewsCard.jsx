import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Flame, PlayCircle, Tag } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';
import { excerpt, getLangField, getYouTubeThumbnailUrl } from '@/utils/helpers';
import { useLanguage } from '@/hooks/useLanguage';
import ContentDetailModal from './ContentDetailModal';

const NewsCard = ({ item }) => {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const youtubeThumb = item.youtubeThumbnail || getYouTubeThumbnailUrl(item.videoUrl || item.url);
  const isVideo = Boolean(youtubeThumb);
  const image = youtubeThumb || item.thumbnail || item.image || item.images?.[0] || '/og-image.svg';
  const title = getLangField(item, 'title', language);
  const summary = getLangField(item, 'excerpt', language) || excerpt(getLangField(item, 'content', language) || getLangField(item, 'description', language));
  const badge = item.tag || item.category || 'local';
  return (
    <>
    <motion.article whileHover={{ y: -4 }} className="group overflow-hidden rounded-lg border border-yellow-300/70 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.10)] ring-1 ring-slate-100">
      <button type="button" onClick={() => setOpen(true)} className="relative block aspect-video w-full overflow-hidden bg-slate-950">
        <img src={image} alt={title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
        <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-tdp-red via-tdp-yellow to-tdp-red" />
        {isVideo && <span className="absolute inset-0 grid place-items-center bg-black/25"><PlayCircle className="rounded-full bg-white/95 p-2 text-tdp-red shadow-xl" size={58} /></span>}
        {isVideo && <span className="absolute bottom-3 left-3 rounded-full bg-tdp-red px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white shadow">Video</span>}
      </button>
      <div className="p-4">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold uppercase text-tdp-red">
          {item.isBreaking && <Flame size={14} />}
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-1 text-tdp-red"><Tag size={13} />{badge}</span>
        </div>
        <h3 className="line-clamp-2 text-lg font-black leading-snug text-gray-950">{title}</h3>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">{summary}</p>
        <div className="mt-4 flex flex-col gap-3 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-1 font-semibold"><Calendar size={14} />{formatDate(item.publishedAt || item.date || item.createdAt)}</span>
          <button type="button" onClick={() => setOpen(true)} className="inline-flex w-full justify-center rounded-lg bg-tdp-navy px-3 py-2 font-black text-white shadow-sm transition hover:bg-slate-950 sm:w-auto">{isVideo ? 'Watch Now' : 'Read More'}</button>
        </div>
      </div>
    </motion.article>
    <ContentDetailModal item={item} open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default NewsCard;
