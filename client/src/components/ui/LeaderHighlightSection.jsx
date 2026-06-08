import { Link } from 'react-router-dom';
import { BookOpen, GraduationCap, HeartPulse, MapPin, Phone, Vote } from 'lucide-react';

const LeaderHighlightSection = ({ language }) => {
  const isTe = language === 'te';
  const chips = [
    isTe ? 'నరసారావుపేట అభివృద్ధి' : 'Narasaraopet development',
    isTe ? 'విద్యా సంస్థలు' : 'Education institutions',
    isTe ? 'రోడ్లు & మౌలిక సదుపాయాలు' : 'Roads and infrastructure',
    isTe ? 'నీటి పారుదల' : 'Water resources'
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-[#1a237e] via-[#0d1457] to-[#e8821a] py-12 text-white md:py-16">
      <div className="absolute -right-24 top-8 text-[220px] font-black leading-none text-white/5">🚲</div>
      <div className="container-page relative grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
        <div className="order-2 lg:order-1">
          <span className="telugu inline-flex rounded-full bg-tdp-yellow px-4 py-2 text-xs font-black text-[#0d1457]">నరసారావుపేట నియోజకవర్గం నాయకుడు</span>
          <h2 className="telugu mt-5 text-3xl font-black leading-tight md:text-5xl">Dr. చదలవాడ అరవింద బాబు</h2>
          <p className="mt-2 text-lg font-bold italic text-tdp-yellow">Dr. Chadalavada Aravinda Babu</p>
          <div className="mt-4 h-1 w-12 rounded-full bg-tdp-yellow" />
          <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold text-white/90">
            <span className="inline-flex items-center gap-2"><Vote size={18} />{isTe ? 'నరసారావుపేట ఎమ్మెల్యే' : 'Narasaraopet MLA'}</span>
            <span className="inline-flex items-center gap-2"><MapPin size={18} />{isTe ? 'తెలుగు దేశం పార్టీ' : 'Telugu Desam Party'}</span>
            <span className="inline-flex items-center gap-2"><HeartPulse size={18} />{isTe ? 'ప్రజా సేవ' : 'Public service'}</span>
          </div>
          <p className="telugu mt-5 max-w-3xl text-base leading-8 text-white/85">{isTe ? 'నరసారావుపేట ప్రజల నమ్మకపాత్రమైన నాయకుడు. గుంటూరు జిల్లా అభివృద్ధి కోసం అహర్నిశలు కృషి చేస్తున్నారు.' : 'A trusted leader for Narasaraopet, working consistently on development, welfare, education, health, roads, and citizen services.'}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {chips.map((chip) => <span key={chip} className="rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white">{chip}</span>)}
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/contact" className="inline-flex items-center gap-2 rounded-full bg-tdp-red px-5 py-3 text-sm font-black text-white shadow-lg"><Phone size={18} />{isTe ? 'సంప్రదించండి' : 'Contact'}</Link>
            <Link to="/leaders" className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-3 text-sm font-black text-white"><BookOpen size={18} />{isTe ? 'జీవిత చరిత్ర చదవండి' : 'Read Biography'}</Link>
          </div>
        </div>
        <div className="order-1 lg:order-2">
          <div className="relative mx-auto max-w-[360px]">
            <div className="absolute -inset-3 rounded-[2rem] bg-tdp-yellow/25 blur-xl" />
            <div className="relative overflow-hidden rounded-[1.5rem] border-4 border-tdp-yellow bg-slate-950 shadow-2xl">
              <img src="/mla/aravinda-babu.jpg" alt="Dr. Chadalavada Aravinda Babu" className="h-[380px] w-full object-cover object-top md:h-[460px]" loading="lazy" />
              <div className="telugu absolute inset-x-0 bottom-0 bg-[#0d1457]/92 p-3 text-center text-sm font-black">నరసారావుపేట నియోజకవర్గం</div>
              <span className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-tdp-yellow text-[#0d1457]"><GraduationCap size={22} /></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeaderHighlightSection;
