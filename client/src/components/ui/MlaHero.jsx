import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DEFAULT_HERO_IMAGE } from '@/utils/constants';
import { getLangField } from '@/utils/helpers';
import { useLanguage } from '@/hooks/useLanguage';

const fallbackSlides = [
  { id: 'default-mla', image: '/mla/aravinda-babu.jpg', alt_en: 'Dr. Chadalavada Aravinda Babu' }
];

const MlaHero = ({ slides = [] }) => {
  const { language } = useLanguage();
  const activeSlides = useMemo(() => {
    const rows = (slides || [])
      .filter((slide) => (slide?.image || slide?.imageMobile) && slide.isActive !== false)
      .sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99));
    return rows.length ? rows : fallbackSlides;
  }, [slides]);
  const [index, setIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);

  useEffect(() => {
    if (index >= activeSlides.length) setIndex(0);
  }, [activeSlides.length, index]);

  useEffect(() => {
    if (activeSlides.length <= 1) return undefined;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % activeSlides.length), 2000);
    return () => window.clearInterval(timer);
  }, [activeSlides.length]);

  const go = (direction) => {
    setIndex((value) => (value + direction + activeSlides.length) % activeSlides.length);
  };

  const onTouchEnd = (event) => {
    if (touchStart == null) return;
    const delta = event.changedTouches[0].clientX - touchStart;
    if (Math.abs(delta) > 42) go(delta > 0 ? -1 : 1);
    setTouchStart(null);
  };

  return (
    <section className="relative h-[45vh] min-h-[260px] overflow-hidden bg-slate-950 md:h-[55vh] lg:h-[70vh]">
      <div className="absolute inset-0" onTouchStart={(event) => setTouchStart(event.touches[0].clientX)} onTouchEnd={onTouchEnd}>
        {activeSlides.map((slide, slideIndex) => (
          <div key={slide.id || slide.image || slideIndex} className={`absolute inset-0 transition-opacity duration-700 ease-out ${slideIndex === index ? 'opacity-100' : 'opacity-0'}`}>
            <picture>
              <source media="(max-width: 640px)" srcSet={slide.imageMobile || slide.image || DEFAULT_HERO_IMAGE} />
              <source media="(min-width: 641px)" srcSet={slide.imageDesktop || slide.image || slide.imageMobile || DEFAULT_HERO_IMAGE} />
              <img
                src={slide.image || slide.imageMobile || DEFAULT_HERO_IMAGE}
                alt={getLangField(slide, 'alt', language) || getLangField(slide, 'title', language) || slide.label || 'Narasaraopet TDP hero slide'}
                loading={slideIndex === 0 ? 'eager' : 'lazy'}
                className={`h-full w-full object-cover object-center ${slideIndex === index ? 'animate-hero-kenburns' : ''}`}
              />
            </picture>
          </div>
        ))}
      </div>

      {activeSlides.length > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} className="absolute left-4 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-black/15 text-white/80 backdrop-blur-sm transition hover:bg-black/30 hover:text-tdp-yellow md:grid" aria-label="Previous hero slide">
            <ChevronLeft size={22} />
          </button>
          <button type="button" onClick={() => go(1)} className="absolute right-4 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-black/15 text-white/80 backdrop-blur-sm transition hover:bg-black/30 hover:text-tdp-yellow md:grid" aria-label="Next hero slide">
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
        {activeSlides.map((slide, dotIndex) => (
          <button key={slide.id || dotIndex} type="button" onClick={() => setIndex(dotIndex)} className={`h-2 rounded-full transition-all ${dotIndex === index ? 'w-6 bg-tdp-yellow' : 'w-2 bg-white/70'}`} aria-label={`Go to hero slide ${dotIndex + 1}`} />
        ))}
      </div>
    </section>
  );
};

export default MlaHero;
