import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useCollection } from '@/hooks/useFirestore';
import { getLangField } from '@/utils/helpers';
import { useLanguage } from '@/hooks/useLanguage';

const Super6Banner = () => {
  const { language } = useLanguage();
  const { data = [], isLoading } = useCollection('super6Banners', { activeOnly: true, orderByField: 'order', orderDirection: 'asc' });
  const banners = useMemo(
    () => data.filter((banner) => banner?.image && banner.isActive !== false),
    [data]
  );
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (current >= banners.length) setCurrent(0);
  }, [banners.length, current]);

  useEffect(() => {
    if (banners.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setCurrent((value) => (value + 1) % banners.length);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [banners.length]);

  if (isLoading && !banners.length) {
    return <div className="h-[200px] w-full animate-pulse bg-gradient-to-r from-tdp-yellow via-[#ffe766] to-tdp-yellow md:h-[320px]" />;
  }

  if (!banners.length) {
    return <div className="h-[200px] w-full bg-gradient-to-br from-tdp-yellow via-[#f5a623] to-[#ffd700] md:h-[320px]" aria-label="Super 6 banner fallback" />;
  }

  return (
    <section className="relative h-[200px] w-full overflow-hidden bg-slate-950 md:h-[320px]" aria-label="Super 6 page banners">
      {banners.map((banner, index) => {
        const title = getLangField(banner, 'title', language);
        return (
          <motion.div
            key={banner.id || banner.image}
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: index === current ? 1 : 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            <img
              src={banner.image}
              alt={title || 'Super 6 Banner'}
              className="h-full w-full object-cover object-center"
              loading={index === 0 ? 'eager' : 'lazy'}
            />
            {title && (
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/58 via-black/10 to-transparent p-5 md:p-8">
                <h2 className="max-w-4xl text-2xl font-black leading-tight text-white drop-shadow md:text-4xl">{title}</h2>
              </div>
            )}
          </motion.div>
        );
      })}

      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {banners.map((banner, index) => (
            <button
              key={banner.id || index}
              type="button"
              onClick={() => setCurrent(index)}
              className={`h-2 rounded-full transition-all ${index === current ? 'w-7 bg-tdp-yellow' : 'w-2 bg-white/70'}`}
              aria-label={`Show Super 6 banner ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default Super6Banner;
