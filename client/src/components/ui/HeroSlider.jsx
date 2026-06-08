import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { DEFAULT_HERO_IMAGE } from '@/utils/constants';
import { getLangField } from '@/utils/helpers';
import { useLanguage } from '@/hooks/useLanguage';
import { super6Schemes } from '@/data/super6Data';
import Super6InfoModal from '@/components/ui/Super6InfoModal';

const buildFallbackSlides = () => super6Schemes.map((scheme) => ({
  id: scheme.id,
  schemeId: scheme.id,
  title_te: scheme.nameTe,
  title_en: scheme.nameEn,
  subtitle_te: scheme.description,
  subtitle_en: scheme.description,
  tag_te: 'సూపర్ 6',
  tag_en: 'Super 6',
  image: scheme.image || DEFAULT_HERO_IMAGE,
  imageMobile: scheme.image || DEFAULT_HERO_IMAGE,
  imageTablet: scheme.image || DEFAULT_HERO_IMAGE,
  imageDesktop: scheme.image || DEFAULT_HERO_IMAGE
}));

const HeroSlider = ({ hero }) => {
  const slides = useMemo(() => {
    const adminSlides = hero?.slides?.length ? hero.slides.slice(0, 6) : [];
    return adminSlides.length
      ? adminSlides.map((slide, index) => ({ ...slide, schemeId: slide.schemeId || super6Schemes[index % super6Schemes.length].id }))
      : buildFallbackSlides();
  }, [hero]);
  const [index, setIndex] = useState(0);
  const [pausedUntil, setPausedUntil] = useState(0);
  const [modalScheme, setModalScheme] = useState(null);
  const touchStart = useRef(null);
  const { language } = useLanguage();

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (Date.now() > pausedUntil) setIndex((value) => (value + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [pausedUntil, slides.length]);

  const slide = slides[index];
  const scheme = super6Schemes.find((item) => item.id === slide.schemeId) || super6Schemes[index % super6Schemes.length];
  const goTo = (nextIndex) => {
    setIndex((nextIndex + slides.length) % slides.length);
    setPausedUntil(Date.now() + 8000);
  };
  const onTouchStart = (event) => {
    touchStart.current = event.touches[0].clientX;
  };
  const onTouchEnd = (event) => {
    if (touchStart.current === null) return;
    const delta = event.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(delta) > 50) goTo(delta < 0 ? index + 1 : index - 1);
    touchStart.current = null;
  };
  const openModal = () => {
    setModalScheme(scheme);
    setPausedUntil(Date.now() + 12000);
  };

  return (
    <>
      <section
        id="home"
        className="hero-slider-height relative w-full cursor-pointer select-none overflow-hidden bg-[#0d1457] text-white"
        aria-label="హీరో స్లైడర్"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div key={`progress-${index}`} className="absolute left-0 top-0 z-20 h-1 bg-gradient-to-r from-tdp-yellow to-orange-500 motion-safe:animate-hero-progress" />
        <button type="button" className="absolute inset-0 z-[1]" aria-label={`${scheme.nameTe} వివరాలు చూడండి`} onClick={openModal} />
        <AnimatePresence mode="wait">
          <motion.picture key={slide.id || index} initial={{ opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.7 }} className="absolute inset-0 block h-full w-full">
            <source media="(max-width: 480px)" srcSet={slide.imageMobile || slide.image || DEFAULT_HERO_IMAGE} />
            <source media="(max-width: 1023px)" srcSet={slide.imageTablet || slide.image || DEFAULT_HERO_IMAGE} />
            <source media="(min-width: 1024px)" srcSet={slide.imageDesktop || slide.image || DEFAULT_HERO_IMAGE} />
            <img src={slide.image || DEFAULT_HERO_IMAGE} alt={getLangField(slide, 'title', language)} className="h-full w-full object-cover object-top" loading={index === 0 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'auto'} />
          </motion.picture>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1457]/95 via-[#0d1457]/32 to-transparent" />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-4 pb-16 sm:p-5 sm:pb-20 md:p-8">
          <div className="mx-auto flex max-w-5xl items-end justify-between gap-4">
            <div className="min-w-0">
              <span className="inline-flex rounded-full bg-gradient-to-r from-tdp-red to-tdp-yellow px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-yellow">{getLangField(slide, 'tag', language) || 'Super 6'}</span>
              <h1 className="telugu mt-3 max-w-3xl text-[24px] font-black leading-tight drop-shadow sm:text-3xl md:text-5xl">{getLangField(slide, 'title', language)}</h1>
              <p className="telugu mt-2 hidden max-w-2xl text-sm font-semibold leading-6 text-white/84 min-[390px]:line-clamp-2 min-[390px]:block md:text-lg">{getLangField(slide, 'subtitle', language)}</p>
            </div>
            <span className="hidden shrink-0 items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-black backdrop-blur sm:inline-flex"><Info size={17} />సమాచారం చూడండి</span>
          </div>
        </div>

        <button className="absolute left-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-white/18 text-white backdrop-blur transition hover:bg-white/30 md:grid" onClick={() => goTo(index - 1)} aria-label="Previous slide"><ChevronLeft /></button>
        <button className="absolute right-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-white/18 text-white backdrop-blur transition hover:bg-white/30 md:grid" onClick={() => goTo(index + 1)} aria-label="Next slide"><ChevronRight /></button>

        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {slides.map((item, slideIndex) => <button key={item.id || slideIndex} onClick={() => goTo(slideIndex)} className={`h-2.5 rounded-full transition-all ${slideIndex === index ? 'w-8 bg-tdp-yellow' : 'w-2.5 bg-white/55'}`} aria-label={`Go to slide ${slideIndex + 1}`} />)}
        </div>
        <div className="absolute right-4 top-4 z-20 rounded-full bg-black/30 px-3 py-1 text-xs font-black text-white/80 backdrop-blur">{index + 1} / {slides.length}</div>
      </section>
      <Super6InfoModal scheme={modalScheme} open={!!modalScheme} onClose={() => setModalScheme(null)} />
    </>
  );
};

export default HeroSlider;
