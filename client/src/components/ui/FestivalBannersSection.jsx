import { useEffect, useState } from 'react';
import { Download, Globe2, Phone } from 'lucide-react';
import { BANNER_STORAGE_KEY, festivalDefaults } from '@/utils/schemeData';

const loadBanners = () => {
  try {
    return JSON.parse(localStorage.getItem(BANNER_STORAGE_KEY)) || festivalDefaults;
  } catch {
    return festivalDefaults;
  }
};

const FestivalBannersSection = () => {
  const [banners, setBanners] = useState(loadBanners);

  useEffect(() => {
    const onStorage = (event) => {
      if (!event.key || event.key === BANNER_STORAGE_KEY) setBanners(loadBanners());
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('tdp-banners-updated', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('tdp-banners-updated', onStorage);
    };
  }, []);

  return (
    <section id="festival-banners" className="bg-gradient-to-r from-[#0d1457] via-[#1a237e] to-[#0d1457] py-14 text-white">
      <div className="container-page">
        <div className="text-center">
          <div className="mx-auto flex w-max items-center gap-3 rounded-full border border-yellow-300/30 bg-white/10 px-4 py-2">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-tdp-yellow text-xl font-black text-[#0d1457]">W</span>
            <span className="text-xl font-black text-tdp-yellow">WayzenTech</span>
          </div>
          <h2 className="telugu mt-5 text-3xl font-black">పండుగ బ్యానర్స్</h2>
          <p className="mt-1 text-sm font-bold text-tdp-yellow">Festival Banners Manager</p>
          <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm font-bold text-tdp-yellow">
            <a href="tel:9398724704" className="inline-flex items-center gap-2"><Phone size={16} />9398724704</a>
            <a href="https://wayzentech.in" className="inline-flex items-center gap-2"><Globe2 size={16} />wayzentech.in</a>
          </div>
          <div className="mx-auto mt-5 h-px w-40 bg-tdp-yellow" />
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {banners.filter((banner) => banner.active !== false).sort((a, b) => (a.order || 0) - (b.order || 0)).map((banner) => (
            <article key={banner.id} className="group overflow-hidden rounded-lg bg-white text-slate-950 shadow-xl">
              <div className={`relative aspect-video bg-gradient-to-br ${banner.gradient || 'from-tdp-navy to-tdp-yellow'}`}>
                {banner.image ? <img src={banner.image} alt={banner.nameEn} className="h-full w-full object-cover" /> : (
                  <div className="flex h-full flex-col items-center justify-center p-6 text-center text-white">
                    <p className="text-5xl">✦</p>
                    <p className="telugu mt-3 text-2xl font-black drop-shadow">{banner.nameTe}</p>
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-white/80">{banner.nameEn}</p>
                  </div>
                )}
                <div className="absolute inset-0 grid place-items-center bg-black/0 opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100">
                  <button className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-tdp-navy"><Download size={16} />డౌన్లోడ్</button>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 p-4">
                <div>
                  <h3 className="telugu font-black text-slate-950">{banner.nameTe}</h3>
                  <p className="text-sm font-semibold text-slate-500">{banner.nameEn}</p>
                </div>
                <span className="rounded-full bg-tdp-red px-3 py-1 text-xs font-black text-white">{banner.date}</span>
              </div>
              <p className="px-4 pb-4 text-right text-xs font-bold text-slate-400">WayzenTech</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FestivalBannersSection;
