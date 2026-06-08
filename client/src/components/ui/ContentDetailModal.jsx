import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, MapPin, Tag, X } from 'lucide-react';
import { formatDate } from '@/utils/dateUtils';
import { getLangField, getYouTubeEmbedUrl, sanitizeHtml } from '@/utils/helpers';
import { useLanguage } from '@/hooks/useLanguage';

const ContentDetailModal = ({ item, open, onClose }) => {
  const { language } = useLanguage();
  if (!item) return null;
  const title = getLangField(item, 'title', language) || getLangField(item, 'name', language);
  const html = getLangField(item, 'description', language) || getLangField(item, 'content', language) || getLangField(item, 'message', language);
  const image = item.image || item.thumbnail || item.images?.[0] || '/og-image.svg';
  const videoEmbed = item.videoEmbedUrl || getYouTubeEmbedUrl(item.videoUrl || item.url);
  const videoSrc = videoEmbed ? `${videoEmbed}${videoEmbed.includes('?') ? '&' : '?'}rel=0&modestbranding=1` : '';
  const date = item.date || item.publishedAt || item.createdAt;
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[9998] grid place-items-center bg-slate-950/78 p-3 backdrop-blur-sm md:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.article className={`relative max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-lg border border-yellow-300 bg-white shadow-2xl ${videoEmbed ? '' : 'grid md:grid-cols-[0.9fr_1.1fr]'}`} initial={{ y: 28, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 18, opacity: 0, scale: 0.97 }} transition={{ duration: 0.22 }} onClick={(event) => event.stopPropagation()}>
            <span className="absolute inset-x-0 top-0 z-10 h-1 bg-gradient-to-r from-tdp-red via-tdp-yellow to-tdp-red" />
            <button type="button" onClick={onClose} className="absolute right-3 top-3 z-20 grid h-10 w-10 place-items-center rounded-full bg-white text-slate-950 shadow-lg" aria-label="Close details">
              <X size={19} />
            </button>
            <div className={`${videoEmbed ? 'bg-slate-950' : 'min-h-72 bg-slate-950 md:min-h-[620px]'}`}>
              {videoEmbed ? (
                <div className="p-2 pt-3 md:p-4 md:pt-5">
                  <div className="overflow-hidden rounded-lg border border-yellow-300/60 bg-black shadow-2xl">
                    <iframe title={title} src={videoSrc} className="aspect-video w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
                  </div>
                </div>
              ) : (
                <img src={image} alt={title} className="h-full max-h-[36vh] w-full object-cover md:max-h-none" />
              )}
            </div>
            <div className={`overflow-y-auto p-5 md:p-8 ${videoEmbed ? 'bg-gradient-to-b from-white to-yellow-50/55' : ''}`}>
              <div className="flex flex-wrap items-center gap-2">
                <p className="rounded-full bg-tdp-red px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-white">{item.category || 'update'}</p>
                {item.tag && <p className="inline-flex items-center gap-1 rounded-full border border-yellow-300 bg-yellow-50 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-tdp-red"><Tag size={13} />{item.tag}</p>}
              </div>
              <h2 className="mt-3 text-2xl font-black leading-tight text-slate-950 md:text-4xl">{title}</h2>
              <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold text-slate-500">
                {date && <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm"><Calendar size={16} />{formatDate(date)}</span>}
                {getLangField(item, 'location', language) && <span className="inline-flex items-center gap-1.5"><MapPin size={16} />{getLangField(item, 'location', language)}</span>}
              </div>
              <div className="prose-content mt-6 rounded-lg border border-yellow-200 bg-white p-5 leading-7 text-slate-700 shadow-sm" dangerouslySetInnerHTML={sanitizeHtml(html)} />
            </div>
          </motion.article>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ContentDetailModal;
