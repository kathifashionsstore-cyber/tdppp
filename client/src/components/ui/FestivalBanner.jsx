import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, X } from 'lucide-react';
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
        <motion.div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/92 p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true">
          <motion.div className="relative flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl" initial={{ scale: 0.86, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.86, opacity: 0 }} transition={{ type: 'spring', stiffness: 280, damping: 28 }}>
            <div className="min-h-0 flex-1 bg-slate-950">
              <img src={image} alt={getLangField(activeBanner, 'title', language)} className="max-h-[68vh] w-full object-contain" />
            </div>
            <div className="bg-gradient-to-b from-slate-950 to-black p-5 text-center text-white md:p-6">
              <h2 className="font-telugu text-2xl font-bold">{getLangField(activeBanner, 'title', language)}</h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-white/85">{getLangField(activeBanner, 'message', language)}</p>
              <a href="tel:9398724704" className="mt-4 block text-sm font-semibold text-white/75">Website made by WayzenTech - 9398724704</a>
              <button type="button" onClick={closeBanner} className="mx-auto mt-5 inline-flex min-h-12 w-full max-w-md items-center justify-center gap-2 rounded-lg bg-tdp-yellow px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-tdp-navy shadow-[0_0_24px_rgba(255,215,0,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_0_34px_rgba(255,215,0,0.65)]">
                <CheckCircle2 size={18} /> Continue to Website <ArrowRight size={18} />
              </button>
              <button type="button" onClick={closeBanner} className="mx-auto mt-3 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold text-white/78 transition hover:text-white">
                <X size={16} /> Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FestivalBanner;
