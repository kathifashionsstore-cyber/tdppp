import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Star } from 'lucide-react';
import { super6Schemes } from '@/data/super6Data';
import Super6InfoModal from '@/components/ui/Super6InfoModal';

const Super6VideoSection = () => {
  const [modalScheme, setModalScheme] = useState(null);

  return (
    <>
      <section id="super6-videos" className="overflow-hidden bg-gradient-to-b from-[#0d1457] via-[#1a237e] to-[#0d1457] py-14 text-white">
        <div className="container-page">
          <div className="mx-auto max-w-3xl text-center">
            <span className="telugu inline-flex items-center gap-2 rounded-full border border-yellow-300/35 bg-yellow-300/10 px-4 py-2 text-sm font-black text-tdp-yellow"><Star size={16} />బాబు సూపర్ 6</span>
            <h2 className="telugu mt-4 text-3xl font-black md:text-5xl">సూపర్ 6 వీడియోలు</h2>
            <p className="telugu mt-2 text-sm font-semibold text-white/70 md:text-base">ప్రతి పథకానికి స్థానిక వీడియో ఫైల్ సిద్ధంగా ఉంది. మీ అసలు MP4 ఫైళ్లను public/videos లో అదే పేర్లతో మార్చండి.</p>
          </div>

          <div className="mt-10 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:overflow-visible">
            <div className="flex w-max gap-4 md:grid md:w-auto md:grid-cols-3 md:gap-5">
              {super6Schemes.map((scheme, index) => <VideoCard key={scheme.id} scheme={scheme} index={index} onDetails={() => setModalScheme(scheme)} />)}
            </div>
          </div>
          <p className="telugu mt-2 text-center text-xs font-bold text-white/45 md:hidden">← స్వైప్ చేయండి →</p>
        </div>
      </section>
      <Super6InfoModal scheme={modalScheme} open={!!modalScheme} onClose={() => setModalScheme(null)} />
    </>
  );
};

const VideoCard = ({ scheme, index, onDetails }) => {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.querySelectorAll('source').forEach((source) => source.removeAttribute('src'));
    video.removeAttribute('src');
    video.load();
  }, []);

  const playInline = (event) => {
    event.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.play().then(() => setPlaying(true)).catch(onDetails);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay: index * 0.06 }}
      onClick={onDetails}
      className="group relative h-[310px] w-[220px] shrink-0 cursor-pointer overflow-hidden rounded-2xl bg-slate-950 shadow-2xl md:h-[330px] md:w-auto"
    >
      <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline preload="none" poster={scheme.poster} controls={playing}>
        <source src={scheme.videoSrc} type="video/mp4" />
      </video>
      {!playing && <img src={scheme.poster} alt="" className="absolute inset-0 h-full w-full bg-white/5 object-contain p-8" loading="lazy" />}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d1457] via-[#0d1457]/42 to-black/10" />
      <span className="absolute right-4 top-4 text-5xl font-black text-white/12">{scheme.number}</span>
      <button onClick={playInline} className="absolute left-4 top-4 z-10 inline-flex items-center gap-2 rounded-full bg-white/18 px-3 py-2 text-xs font-black text-white backdrop-blur transition hover:bg-white/28" aria-label={`${scheme.nameTe} video play`}>
        <Play size={15} fill="currentColor" />Play
      </button>
      <div className="absolute inset-x-0 bottom-0 p-5 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-tdp-red to-tdp-yellow text-3xl shadow-yellow">{scheme.icon}</div>
        <h3 className="telugu text-lg font-black leading-tight">{scheme.nameTe}</h3>
        <p className="text-xs font-bold text-white/60">{scheme.nameEn}</p>
        <p className="telugu mx-auto mt-3 w-max rounded-full bg-tdp-yellow px-3 py-1 text-xs font-black text-tdp-navy">{scheme.amount}</p>
        <p className="telugu mt-2 text-xs font-semibold text-white/70">{scheme.beneficiaries}</p>
      </div>
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent transition group-hover:border-tdp-yellow/70" />
    </motion.article>
  );
};

export default Super6VideoSection;
