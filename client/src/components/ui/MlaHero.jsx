import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const fallbackSlides = [
  { id: 'default-mla', image: '/mla/aravinda-babu.jpg', alt_en: 'Dr. Chadalavada Aravinda Babu' },
  { id: 'default-logo', image: '/og-image.svg', alt_en: 'Telugu Desam Party Narasaraopet' }
];

const MlaHero = ({ slides = [] }) => {
  const activeSlides = useMemo(() => {
    const rows = (slides || [])
      .filter((slide) => slide?.image && slide.isActive !== false)
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
    <section className="relative h-[60vh] min-h-[420px] overflow-hidden bg-slate-950 text-white md:h-[70vh] lg:h-[80vh]">
      <div className="absolute inset-0" onTouchStart={(event) => setTouchStart(event.touches[0].clientX)} onTouchEnd={onTouchEnd}>
        {activeSlides.map((slide, slideIndex) => (
          <div key={slide.id || slide.image || slideIndex} className={`absolute inset-0 transition-opacity duration-700 ease-out ${slideIndex === index ? 'opacity-100' : 'opacity-0'}`}>
            <img
              src={slide.image}
              alt={slide.alt_en || slide.label || 'Narasaraopet TDP hero slide'}
              loading={slideIndex === 0 ? 'eager' : 'lazy'}
              className={`h-full w-full object-cover object-top ${slideIndex === index ? 'animate-hero-kenburns' : ''}`}
            />
          </div>
        ))}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-black/88 via-black/32 to-black/15" />

      {activeSlides.length > 1 && (
        <>
          <button type="button" onClick={() => go(-1)} className="absolute left-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-yellow-200/50 bg-black/30 text-tdp-yellow backdrop-blur transition hover:bg-black/50 md:grid" aria-label="Previous hero slide">
            <ChevronLeft size={22} />
          </button>
          <button type="button" onClick={() => go(1)} className="absolute right-4 top-1/2 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-yellow-200/50 bg-black/30 text-tdp-yellow backdrop-blur transition hover:bg-black/50 md:grid" aria-label="Next hero slide">
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <div className="container-page relative flex h-full items-end pb-12 md:pb-16">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-3 rounded-full border border-yellow-200/50 bg-black/35 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-tdp-yellow shadow-yellow backdrop-blur">
            <img src="/logo-tdp.png" alt="Telugu Desam Party logo" className="h-8 w-8 rounded-full bg-white object-contain p-1" />
            Telugu Desam Party
          </div>
          <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">Dr. Chadalavada Aravinda Babu</h1>
          <p className="mt-3 text-xl font-black text-tdp-yellow md:text-3xl">MLA - Narasaraopet | Telugu Desam Party</p>
          <div className="mt-7 flex gap-2">
            {activeSlides.map((slide, dotIndex) => (
              <button key={slide.id || dotIndex} type="button" onClick={() => setIndex(dotIndex)} className={`h-3 rounded-full transition-all ${dotIndex === index ? 'w-9 bg-tdp-yellow' : 'w-3 bg-white/65'}`} aria-label={`Go to hero slide ${dotIndex + 1}`} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MlaHero;
