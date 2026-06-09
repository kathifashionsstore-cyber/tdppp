import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [ready, setReady] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const sectionRef = useRef(null);
  const touchStart = useRef(null);
  const touchCurrent = useRef(null);

  useEffect(() => {
    if (index >= activeSlides.length) setIndex(0);
  }, [activeSlides.length, index]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return undefined;
    const node = sectionRef.current;
    if (!node) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const offset = Math.max(-12, Math.min(18, rect.top * -0.04));
      node.style.setProperty('--hero-parallax-y', `${offset}px`);
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    if (activeSlides.length <= 1) return undefined;
    const timer = window.setTimeout(() => setIndex((value) => (value + 1) % activeSlides.length), 2000);
    return () => window.clearTimeout(timer);
  }, [activeSlides.length, index]);

  const goTo = (nextIndex) => {
    setIndex((nextIndex + activeSlides.length) % activeSlides.length);
  };

  const go = (direction) => goTo(index + direction);

  const onTouchStart = (event) => {
    touchStart.current = event.touches[0].clientX;
    touchCurrent.current = touchStart.current;
  };

  const onTouchMove = (event) => {
    touchCurrent.current = event.touches[0].clientX;
  };

  const onTouchEnd = (event) => {
    if (touchStart.current == null) return;
    const delta = (touchCurrent.current ?? event.changedTouches[0].clientX) - touchStart.current;
    if (Math.abs(delta) > 42) go(delta > 0 ? -1 : 1);
    touchStart.current = null;
    touchCurrent.current = null;
  };

  return (
    <section ref={sectionRef} className="relative h-[45vh] overflow-hidden bg-slate-950 md:h-[55vh] lg:h-[70vh]" style={{ touchAction: 'pan-y' }}>
      <div className="absolute inset-0" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onTouchCancel={onTouchEnd}>
        {activeSlides.map((slide, slideIndex) => (
          <div key={slide.id || slide.image || slideIndex} className={`hero-slide-frame absolute inset-0 ${ready && slideIndex === index ? 'is-active' : ''}`} aria-hidden={slideIndex !== index}>
            <picture className="block h-full w-full">
              <source media="(max-width: 640px)" srcSet={slide.imageMobile || slide.image || DEFAULT_HERO_IMAGE} />
              <source media="(min-width: 641px)" srcSet={slide.imageDesktop || slide.image || slide.imageMobile || DEFAULT_HERO_IMAGE} />
              <img
                src={slide.image || slide.imageMobile || DEFAULT_HERO_IMAGE}
                alt={getLangField(slide, 'alt', language) || getLangField(slide, 'title', language) || slide.label || 'Narasaraopet TDP hero slide'}
                loading={slideIndex === 0 ? 'eager' : 'lazy'}
                fetchPriority={slideIndex === 0 ? 'high' : 'auto'}
                decoding="async"
                width="1600"
                height="900"
                sizes="100vw"
                className="hero-slide-image"
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
          <button key={slide.id || dotIndex} type="button" onClick={() => goTo(dotIndex)} className={`hero-dot ${dotIndex === index ? 'is-active' : ''}`} aria-label={`Go to hero slide ${dotIndex + 1}`} />
        ))}
      </div>
    </section>
  );
};

export default MlaHero;
