import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Flame, PlayCircle } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';
import { excerpt, getLangField, getYouTubeThumbnailUrl } from '@/utils/helpers';
import { useLanguage } from '@/hooks/useLanguage';
import ContentDetailModal from './ContentDetailModal';

const NewsCard = ({ item }) => {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const youtubeThumb = getYouTubeThumbnailUrl(item.videoUrl || item.url);
  const isVideo = Boolean(youtubeThumb);
  const image = youtubeThumb || item.thumbnail || item.image || item.images?.[0] || '/og-image.svg';
  return (
    <>
    <motion.article whileHover={{ y: -4, scale: 1.01 }} className="overflow-hidden rounded-lg border border-yellow-100 bg-white shadow-md">
      <button type="button" onClick={() => setOpen(true)} className="relative block aspect-video w-full overflow-hidden bg-slate-950">
        <img src={image} alt={getLangField(item, 'title', language)} className="h-full w-full object-cover" loading="lazy" />
        {isVideo && <span className="absolute inset-0 grid place-items-center bg-black/20"><PlayCircle className="rounded-full bg-white/95 p-2 text-tdp-red shadow-xl" size={54} /></span>}
      </button>
      <div className="p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-tdp-red">
          {item.isBreaking && <Flame size={14} />}
          {isVideo ? 'video' : item.category || 'local'}
        </div>
        <h3 className="line-clamp-2 text-lg font-bold text-gray-950">{getLangField(item, 'title', language)}</h3>
        <p className="mt-2 line-clamp-3 text-sm text-gray-600">{getLangField(item, 'excerpt', language) || excerpt(getLangField(item, 'content', language))}</p>
        <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
          <span className="inline-flex items-center gap-1"><Calendar size={14} />{formatDate(item.publishedAt || item.createdAt)}</span>
          <button type="button" onClick={() => setOpen(true)} className="font-bold text-tdp-red">{isVideo ? 'Watch Now' : 'Read More'}</button>
        </div>
      </div>
    </motion.article>
    <ContentDetailModal item={item} open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default NewsCard;
