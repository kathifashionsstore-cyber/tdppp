import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { getLangField } from '@/utils/helpers';
import { useLanguage } from '@/hooks/useLanguage';

const GalleryGrid = ({ items = [], onSelect }) => {
  const { language } = useLanguage();
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <motion.article
          whileHover={{ scale: 1.02 }}
          key={item.id}
          className="group overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-md"
        >
          <button type="button" onClick={() => onSelect?.(item)} className="relative block aspect-[4/3] w-full overflow-hidden bg-gray-200">
            <img src={item.thumbnail || item.images?.[0] || item.url || '/og-image.svg'} alt={getLangField(item, 'title', language)} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
            {item.type === 'video' && <Play className="absolute left-3 top-3 rounded-full bg-white/90 p-1 text-tdp-red" size={28} />}
          </button>
          <div className="p-4">
            <p className="text-xs font-black uppercase text-tdp-red">{item.category || item.type || 'gallery'}</p>
            <h3 className="mt-1 line-clamp-2 text-lg font-black leading-tight text-slate-950">{getLangField(item, 'title', language)}</h3>
            <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{getLangField(item, 'description', language) || getLangField(item, 'content', language)}</p>
            <button type="button" onClick={() => onSelect?.(item)} className="mt-4 font-black text-tdp-red">Read More</button>
          </div>
        </motion.article>
      ))}
    </div>
  );
};

export default GalleryGrid;
