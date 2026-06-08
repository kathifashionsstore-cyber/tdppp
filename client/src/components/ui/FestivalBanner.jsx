import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useFestivalBanner } from '@/hooks/useFestivalBanner';
import { getLangField } from '@/utils/helpers';
import { useLanguage } from '@/hooks/useLanguage';

const FestivalBanner = () => {
  const { showBanner, activeBanner, closeBanner } = useFestivalBanner();
  const { language } = useLanguage();
  const image = activeBanner?.image || activeBanner?.thumbnail || activeBanner?.images?.[0] || '/og-image.svg';
  return (
    <AnimatePresence>
      {showBanner && activeBanner && (
        <motion.div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="relative max-h-[94vh] w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-2xl" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
            <button onClick={closeBanner} className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:scale-110 hover:bg-red-700" aria-label="Close banner">
              <X size={18} />
            </button>
            <img src={image} alt={getLangField(activeBanner, 'title', language)} className="max-h-[78vh] w-full object-contain bg-slate-950" />
            <div className="bg-gradient-to-t from-black to-black/80 p-5 text-white">
              <h2 className="font-telugu text-2xl font-bold">{getLangField(activeBanner, 'title', language)}</h2>
              <p className="mt-2 text-sm text-white/85">{getLangField(activeBanner, 'message', language)}</p>
              <a href="tel:9398724704" className="mt-3 block text-center text-xs font-semibold text-white/70">Website made by WayzenTech 9398724704</a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FestivalBanner;
