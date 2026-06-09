import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { X, CheckCircle2, Share2 } from 'lucide-react';

const Super6InfoModal = ({ scheme, open, onClose }) => {
  const videoRef = useRef(null);

  const cleanupVideo = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.removeAttribute('src');
    video.querySelectorAll('source').forEach((source) => source.removeAttribute('src'));
    video.load();
  };

  useEffect(() => {
    if (!open) cleanupVideo();
    return cleanupVideo;
  }, [open]);

  if (!scheme) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[120]" role="dialog" aria-modal="true" aria-labelledby="super6-modal-title">
          <motion.button
            type="button"
            aria-label="Close modal backdrop"
            className="absolute inset-0 bg-slate-950/72 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.article
            initial={{ opacity: 0, y: 80, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 80, scale: 0.98 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="absolute inset-x-0 bottom-0 max-h-[92svh] overflow-hidden rounded-t-3xl bg-white shadow-2xl md:inset-8 md:mx-auto md:max-w-5xl md:rounded-2xl"
          >
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-full bg-slate-300 md:hidden" />
            <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/95 p-4 backdrop-blur md:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-tdp-red to-tdp-yellow text-3xl shadow-yellow">{scheme.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-tdp-red">Babu Super 6</p>
                    <h2 id="super6-modal-title" className="telugu truncate text-2xl font-black text-slate-950 md:text-4xl">{scheme.nameTe}</h2>
                    <p className="font-bold text-slate-500">{scheme.nameEn}</p>
                  </div>
                </div>
                <button onClick={onClose} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200" aria-label="Close"><X /></button>
              </div>
              <div className="mt-4 grid gap-3 rounded-2xl bg-gradient-to-r from-[#0d1457] to-[#1a237e] p-4 text-white md:grid-cols-[auto_1fr] md:items-center">
                <span className="inline-flex w-max items-center gap-2 rounded-full bg-green-400/16 px-3 py-1 text-sm font-black text-green-200"><CheckCircle2 size={16} />అమలులో ఉంది</span>
                <div>
                  <div className="mb-1 flex justify-between text-xs font-bold text-white/70"><span>Implementation progress</span><span>85%</span></div>
                  <div className="h-2 rounded-full bg-white/15"><div className="h-full w-[85%] rounded-full bg-tdp-yellow" /></div>
                </div>
              </div>
            </header>

            <div className="max-h-[calc(92svh-190px)] overflow-y-auto p-4 md:p-6">
              <div className="grid gap-4 md:grid-cols-3">
                {scheme.stats.map((stat) => <div key={stat} className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center text-lg font-black text-tdp-navy">{stat}</div>)}
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
                <div className="space-y-5">
                  <Section title="పథకం గురించి">
                    <p className="telugu text-base leading-8 text-slate-700">{scheme.description}</p>
                  </Section>
                  <Section title="ముఖ్య ప్రయోజనాలు">
                    <BulletList items={scheme.benefits} />
                  </Section>
                  <Section title="అర్హత నిబంధనలు">
                    <BulletList items={scheme.eligibility} />
                  </Section>
                  <Section title="దరఖాస్తు ఎలా చేయాలి">
                    <ol className="space-y-2">
                      {scheme.steps.map((step, index) => (
                        <li key={step} className="telugu flex gap-3 rounded-xl bg-yellow-50 p-3 text-sm font-semibold leading-6 text-slate-700">
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-tdp-yellow text-xs font-black text-tdp-navy">{index + 1}</span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </Section>
                </div>

                <aside className="space-y-4">
                  <div className="overflow-hidden rounded-2xl bg-slate-950 shadow-xl">
                    <div className="aspect-video bg-slate-900">
                      <video ref={videoRef} className="h-full w-full object-cover" controls playsInline preload="none" poster={scheme.poster}>
                        <source src={scheme.videoSrc} type="video/mp4" />
                      </video>
                    </div>
                    <div className="p-4">
                      <p className="telugu font-black text-white">{scheme.nameTe} వీడియో</p>
                      <p className="text-sm text-white/60">Replace {scheme.videoSrc} with your local MP4 file.</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <h3 className="telugu font-black text-slate-950">జిల్లాల వారీ అమలు</h3>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-bold text-slate-600">
                      {['గుంటూరు', 'కృష్ణా', 'విశాఖ', 'కర్నూలు', 'నెల్లూరు', 'కడప'].map((district) => <span key={district} className="rounded-full bg-slate-100 px-3 py-2 text-center">{district}</span>)}
                    </div>
                  </div>
                  <button className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-tdp-red px-4 py-3 text-sm font-black text-white"><Share2 size={18} />పంచుకోండి</button>
                </aside>
              </div>
            </div>
          </motion.article>
        </div>
      )}
    </AnimatePresence>
  );
};

const Section = ({ title, children }) => (
  <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
    <h3 className="telugu mb-3 text-lg font-black text-slate-950">{title}</h3>
    {children}
  </section>
);

const BulletList = ({ items }) => (
  <ul className="space-y-2">
    {items.map((item) => <li key={item} className="telugu flex gap-2 text-sm font-semibold leading-6 text-slate-700"><CheckCircle2 className="mt-0.5 shrink-0 text-green-600" size={18} />{item}</li>)}
  </ul>
);

export default Super6InfoModal;
