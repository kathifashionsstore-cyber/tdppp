import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, MapPin } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { excerpt, getLangField } from '@/utils/helpers';
import { formatDate } from '@/utils/dateUtils';
import ContentDetailModal from './ContentDetailModal';

const WorkCard = ({ item }) => {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const image = item.images?.[0] || item.image || '/og-image.svg';
  return (
    <>
    <motion.article whileHover={{ y: -4, scale: 1.01 }} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md">
      <button type="button" onClick={() => setOpen(true)} className="block aspect-[4/3] w-full overflow-hidden bg-slate-100"><img src={image} alt={getLangField(item, 'title', language)} className="h-full w-full object-cover" loading="lazy" /></button>
      <div className="p-4">
        <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase text-yellow-800">{item.category || 'development'}</span>
        <h3 className="mt-3 line-clamp-2 text-lg font-bold text-gray-950">{getLangField(item, 'title', language)}</h3>
        <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1"><MapPin size={14} />{getLangField(item, 'location', language)}</span>
          <span className="inline-flex items-center gap-1"><Calendar size={14} />{formatDate(item.date || item.createdAt)}</span>
        </div>
        <p className="mt-3 line-clamp-3 text-sm text-gray-600">{excerpt(getLangField(item, 'description', language))}</p>
        <button type="button" onClick={() => setOpen(true)} className="mt-4 inline-flex font-bold text-tdp-red">Read Full</button>
      </div>
    </motion.article>
    <ContentDetailModal item={item} open={open} onClose={() => setOpen(false)} />
    </>
  );
};

export default WorkCard;
