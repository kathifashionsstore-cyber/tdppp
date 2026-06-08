import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Bus, Flame, GraduationCap, HandCoins, Sparkles, Sprout, UsersRound, X } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { useCollection } from '@/hooks/useFirestore';

const schemes = [
  {
    icon: Bus,
    title_te: 'స్త్రీ శక్తి',
    title_en: 'Sthree Shakthi',
    subtitle_te: 'ఉచిత బస్సు ప్రయాణం',
    subtitle_en: 'Free Bus Travel',
    focus_te: 'మహిళలకు ఉచిత ప్రజా రవాణా',
    focus_en: 'Free public transport for women',
    image: '/super-six/stree-shakti.svg'
  },
  {
    icon: HandCoins,
    title_te: 'ఆడబిడ్డ నిధి',
    title_en: 'Aadabidda Nidhi',
    subtitle_te: 'ప్రతి నెల ₹1,500',
    subtitle_en: 'Monthly ₹1,500',
    focus_te: 'మహిళలకు ఆర్థిక భరోసా',
    focus_en: 'Financial aid for women',
    image: '/super-six/aadabidda-nidhi.svg'
  },
  {
    icon: Flame,
    title_te: 'దీపం పథకం',
    title_en: 'Deepam Pathakam',
    subtitle_te: 'ఉచిత గ్యాస్ సిలిండర్లు',
    subtitle_en: 'Free Cooking Gas Cylinders',
    focus_te: 'ఏడాదికి మూడు ఉచిత LPG సిలిండర్లు',
    focus_en: 'Three free LPG cylinders per year',
    image: '/super-six/deepam.svg'
  },
  {
    icon: GraduationCap,
    title_te: 'తల్లికి వందనం',
    title_en: 'Thalliki Vandanam',
    subtitle_te: 'ఏడాదికి ₹15,000',
    subtitle_en: 'Annual ₹15,000',
    focus_te: 'చదువుతున్న పిల్లల తల్లులకు సహాయం',
    focus_en: "Support for school-going children's mothers",
    image: '/super-six/thalliki-vandanam.svg'
  },
  {
    icon: UsersRound,
    title_te: 'యువగళం',
    title_en: 'Yuva Galam',
    subtitle_te: 'నిరుద్యోగ భృతి',
    subtitle_en: 'Unemployment Allowance',
    focus_te: 'నిరుద్యోగ యువతకు నెలకు ₹3,000',
    focus_en: 'Monthly ₹3,000 for unemployed youth',
    image: '/super-six/yuva-galam.svg'
  },
  {
    icon: Sprout,
    title_te: 'అన్నదాత సుఖీభవ',
    title_en: 'Annadata Sukhibhava',
    subtitle_te: 'ఏడాదికి ₹20,000',
    subtitle_en: 'Annual ₹20,000',
    focus_te: 'రైతులకు ఆర్థిక మద్దతు',
    focus_en: 'Financial support for farmers',
    image: '/super-six/annadata.svg'
  }
];

const copy = {
  te: {
    eyebrow: 'ప్రజల సంక్షేమానికి',
    title: 'సూపర్ 6 పథకాలు',
    subtitle: 'మహిళలు, రైతులు, యువత, విద్య మరియు గృహ అవసరాలకు దృష్టి పెట్టిన ప్రధాన సంక్షేమ హామీలు',
    center: 'సూపర్ 6',
    button: 'Super 6 చూడండి'
  },
  en: {
    eyebrow: 'Welfare first',
    title: 'Super 6 Schemes',
    subtitle: 'Flagship welfare promises focused on women, farmers, youth, education, and household needs',
    center: 'Super 6',
    button: 'View Super 6'
  }
};

const SuperSixSection = () => {
  const { language } = useLanguage();
  const { data: adminSchemes = [] } = useCollection('super6Schemes', { publishedOnly: true, orderByField: 'order', orderDirection: 'asc' });
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [pulseCount, setPulseCount] = useState(0);
  const text = copy[language] || copy.en;
  const ordered = useMemo(() => {
    const published = adminSchemes
      .map((item, index) => ({
        ...schemes[index % schemes.length],
        ...item,
        title_en: item.title_en || item.name_en || schemes[index % schemes.length].title_en,
        title_te: item.title_te || item.name_te || item.title_en || schemes[index % schemes.length].title_te,
        subtitle_en: item.subtitle_en || item.category || schemes[index % schemes.length].subtitle_en,
        subtitle_te: item.subtitle_te || item.subtitle_en || item.category || schemes[index % schemes.length].subtitle_te,
        focus_en: item.description_en || item.content_en || schemes[index % schemes.length].focus_en,
        focus_te: item.description_te || item.content_te || item.description_en || schemes[index % schemes.length].focus_te,
        image: item.image || item.thumbnail || item.images?.[0] || schemes[index % schemes.length].image
      }))
      .slice(0, 6);
    return published.length >= 6 ? published : schemes;
  }, [adminSchemes]);

  useEffect(() => {
    if (open || pulseCount >= 5) return undefined;
    const timer = window.setTimeout(() => setPulseCount((count) => count + 1), 2000);
    return () => window.clearTimeout(timer);
  }, [open, pulseCount]);

  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % ordered.length), 3200);
    return () => window.clearInterval(timer);
  }, [open, ordered.length]);

  const active = ordered[activeIndex] || ordered[0];

  return (
    <div className="fixed bottom-36 right-4 z-[52] md:bottom-24">
      {open && (
        <motion.section
          initial={{ opacity: 0, y: 18, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.96 }}
          className="fixed inset-x-3 bottom-28 max-h-[76vh] overflow-hidden rounded-lg border border-yellow-200 bg-[#101827] text-white shadow-2xl md:absolute md:inset-auto md:bottom-20 md:right-0 md:w-[760px]"
        >
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(90deg,rgba(255,255,255,.12)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:54px_54px]" />
          <div className="relative flex items-start justify-between gap-4 border-b border-white/10 p-4 md:p-5">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-tdp-yellow">{text.eyebrow}</p>
              <h2 className="mt-1 text-2xl font-black leading-tight md:text-4xl">{text.title}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">{text.subtitle}</p>
            </div>
            <button onClick={() => setOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20" aria-label="Close Super 6">
              <X size={18} />
            </button>
          </div>
          <div className="relative max-h-[58vh] overflow-y-auto p-4 md:p-5">
            <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
              <motion.div key={activeIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="overflow-hidden rounded-lg border border-white/10 bg-white/8 shadow-2xl">
                <div className="relative aspect-[16/10] bg-slate-900">
                  <img src={active.image} alt="" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <span className="rounded-full bg-tdp-yellow px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-tdp-red">Step {activeIndex + 1} of 6</span>
                    <h3 className="mt-3 text-3xl font-black leading-tight">{language === 'te' ? active.title_te : active.title_en}</h3>
                    <p className="mt-2 text-base font-bold text-tdp-yellow">{language === 'te' ? active.subtitle_te : active.subtitle_en}</p>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/82">{language === 'te' ? active.focus_te : active.focus_en}</p>
                  </div>
                </div>
              </motion.div>
              <div className="grid gap-2">
                {ordered.map((scheme, index) => <SchemeTile key={`${scheme.title_en}-${index}`} scheme={scheme} index={index} language={language} active={index === activeIndex} onClick={() => setActiveIndex(index)} />)}
              </div>
            </div>
          </div>
        </motion.section>
      )}
      <motion.button
        onClick={() => setOpen((value) => !value)}
        animate={pulseCount < 5 && !open ? { scale: [1, 1.08, 1], y: [0, -5, 0] } : { scale: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-tdp-red via-red-700 to-tdp-yellow text-white shadow-2xl ring-4 ring-red-600/20 transition hover:-translate-y-1"
        aria-label={text.button}
      >
        <span className="absolute -inset-1 rounded-full border border-yellow-200/80 opacity-80" />
        <BookOpen size={26} />
        <Sparkles className="absolute -right-1 -top-1 h-5 w-5 rounded-full bg-white p-0.5 text-tdp-red" />
      </motion.button>
      {!open && pulseCount < 5 && (
        <motion.div
          key={pulseCount}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }}
          className="absolute bottom-3 right-20 hidden w-44 rounded-lg border border-yellow-200 bg-white p-3 text-sm font-black leading-5 text-slate-950 shadow-xl md:block"
        >
          {text.button}
        </motion.div>
      )}
    </div>
  );
};

const SchemeTile = ({ scheme, index, language, active, onClick }) => {
  const Icon = scheme.icon;
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`group relative overflow-hidden rounded-lg border p-2 text-left shadow-xl transition ${active ? 'border-tdp-yellow bg-tdp-yellow text-slate-950' : 'border-white/10 bg-white/8 text-white hover:bg-white/14'}`}
    >
      <div className="grid grid-cols-[74px_1fr_auto] items-center gap-3">
        <img src={scheme.image} alt="" className="h-20 w-full rounded-md object-cover" loading="lazy" />
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${active ? 'bg-tdp-red text-white' : 'bg-tdp-yellow text-tdp-red'}`}>
              <Icon size={20} />
            </span>
            <span className={`text-xs font-black uppercase tracking-[0.16em] ${active ? 'text-slate-600' : 'text-white/50'}`}>Step {index + 1}</span>
          </div>
          <h3 className="mt-1 truncate text-sm font-black leading-tight">{language === 'te' ? scheme.title_te : scheme.title_en}</h3>
          <p className={`truncate text-xs font-bold ${active ? 'text-tdp-red' : 'text-tdp-yellow'}`}>{language === 'te' ? scheme.subtitle_te : scheme.subtitle_en}</p>
        </div>
        <ArrowRight size={18} className={active ? 'text-tdp-red' : 'text-white/45'} />
      </div>
    </motion.button>
  );
};

export default SuperSixSection;
