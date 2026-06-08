import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Award, ChevronDown, ChevronUp, ExternalLink, Star } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { useLanguageStore } from '@/store/languageStore';
import { LEADERS_DATA } from '@/data/leadersData';

const useLeadersData = () => {
  const [leaders, setLeaders] = useState(LEADERS_DATA);
  useEffect(() => {
    getDoc(doc(db, 'siteConfig', 'leaders'))
      .then((snap) => setLeaders(snap.exists() && snap.data().list?.length ? snap.data().list : LEADERS_DATA))
      .catch(() => setLeaders(LEADERS_DATA));
  }, []);
  return leaders;
};

const LeaderCard = ({ leader, index }) => {
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { language } = useLanguageStore();
  const name = language === 'te' ? leader.name_te : leader.name_en;
  const designation = language === 'te' ? leader.designation_te : leader.designation_en;
  const role = language === 'te' ? leader.role_te : leader.role_en;
  const tagline = language === 'te' ? leader.tagline_te : leader.tagline_en;
  const vision = language === 'te' ? leader.vision_te : leader.vision_en;
  const achievements = language === 'te' ? leader.achievements_te : leader.achievements_en;
  const badgeText = language === 'te' ? leader.badge_te : leader.badge_en;

  return (
    <motion.article initial={{ opacity: 0, y: 35 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.55, delay: index * 0.12 }} className="group overflow-hidden rounded-2xl border border-white/70 bg-white shadow-xl shadow-slate-900/8 transition duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className="relative h-36 px-5 pb-4" style={{ background: leader.cardGradient }}>
        <span className="absolute left-5 top-4 rounded-full px-3 py-1 text-xs font-black text-white shadow" style={{ background: leader.badgeColor }}>{badgeText}</span>
        <p className="absolute bottom-4 left-5 right-5 line-clamp-2 text-xs font-semibold text-white/85">{tagline}</p>
      </div>
      <div className="relative px-5 pb-5">
        <div className="absolute -top-14 left-5 h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow-xl">
          {!imgError ? <img src={leader.photo} alt={leader.photoAlt} onError={() => setImgError(true)} className="h-full w-full object-cover object-top" loading="lazy" /> : <div className="grid h-full w-full place-items-center text-2xl font-black text-white" style={{ background: leader.cardGradient }}>{name?.charAt(0)}</div>}
        </div>
        <div className="min-h-28 pt-5 pl-28">
          <h3 className="text-base font-black leading-tight text-slate-950">{name}</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">{role}</p>
        </div>
        <p className="border-t border-slate-100 pt-3 text-xs font-bold leading-snug" style={{ color: leader.badgeColor }}>{designation}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(leader.stats || []).map((stat) => <div key={`${leader.id}-${stat.value}`} className="rounded-xl border border-slate-100 bg-slate-50 p-2 text-center"><div className="text-sm font-black" style={{ color: leader.badgeColor }}>{stat.value}</div><div className="mt-0.5 text-[10px] leading-tight text-slate-500">{language === 'te' ? stat.label_te : stat.label_en}</div></div>)}
        </div>
        <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-slate-600">{vision}</p>
        <button onClick={() => setExpanded(!expanded)} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-black transition" style={{ background: expanded ? leader.badgeColor : '#FFF9E6', color: expanded ? '#fff' : leader.badgeColor }}>
          {expanded ? (language === 'te' ? 'తక్కువ చూపించు' : 'Show Less') : (language === 'te' ? 'విజయాలు చూడండి' : 'View Achievements')}
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        <AnimatePresence>
          {expanded && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"><div className="mt-3 space-y-2"><p className="flex items-center gap-2 text-xs font-black text-slate-700"><Award size={14} style={{ color: leader.badgeColor }} />{language === 'te' ? 'ముఖ్య విజయాలు' : 'Key Achievements'}</p>{(achievements || []).map((item) => <p key={item} className="border-l-2 pl-2 text-[11px] leading-snug text-slate-600" style={{ borderColor: leader.badgeColor }}>{item}</p>)}</div></motion.div>}
        </AnimatePresence>
        <a href={leader.profileUrl} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-400 transition hover:text-slate-700"><ExternalLink size={12} />{language === 'te' ? 'అధికారిక వెబ్‌సైట్' : 'Official Website'}</a>
      </div>
    </motion.article>
  );
};

const LeadersVisionSection = () => {
  const leaders = useLeadersData();
  const { language } = useLanguageStore();
  return (
    <section id="leaders" className="relative overflow-hidden bg-[linear-gradient(180deg,#FAFAF7_0%,#FFF9E6_45%,#FAFAF7_100%)] py-16">
      <div className="container-page relative">
        <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mb-10 text-center">
          <span className="text-xs font-black uppercase tracking-[0.25em] text-tdp-red">{language === 'te' ? 'ఆంధ్రప్రదేశ్ ప్రభుత్వం' : 'Government of Andhra Pradesh'}</span>
          <h2 className="mt-3 text-3xl font-black text-slate-950 md:text-4xl">{language === 'te' ? 'మన నాయకత్వం - మన దార్శనికులు' : 'Our Leadership - Our Visionaries'}</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-500">{language === 'te' ? 'నరసారావుపేట అభివృద్ధికి మార్గదర్శకమైన రాష్ట్ర నాయకత్వం.' : 'State leadership guiding the development vision for Narasaraopet constituency.'}</p>
          <div className="mt-4 flex justify-center gap-1"><span className="h-1 w-16 rounded bg-tdp-yellow" /><span className="h-1 w-6 rounded bg-tdp-red" /><span className="h-1 w-3 rounded bg-tdp-yellow" /></div>
        </motion.div>
        <div className="grid gap-6 md:grid-cols-3">{leaders.map((leader, index) => <LeaderCard key={leader.id} leader={leader} index={index} />)}</div>
        <div className="mt-10 text-center"><span className="inline-flex items-center gap-2 rounded-full border border-yellow-300 bg-yellow-50 px-5 py-2.5 text-xs font-black text-yellow-800"><Star size={14} fill="#FFD700" />{language === 'te' ? 'నరసారావుపేట అభివృద్ధికి ఈ నాయకుల విజన్ మార్గదర్శకం' : 'Their vision guides Narasaraopet development'}<Star size={14} fill="#FFD700" /></span></div>
      </div>
    </section>
  );
};

export default LeadersVisionSection;
