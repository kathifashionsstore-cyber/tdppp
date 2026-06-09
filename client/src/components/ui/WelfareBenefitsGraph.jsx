import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import BicycleIcon from '@/components/ui/BicycleIcon';

const benefits = [
  {
    id: 'ntr-pension',
    nameTe: 'ఎన్టీఆర్ భరోసా పింఛన్',
    nameEn: 'NTR Bharosa Pension',
    benefit: '₹4,000 per month',
    amount: 4000,
    suffix: ' per month',
    width: 96,
    color: '#FFD700'
  },
  {
    id: 'free-bus',
    nameTe: 'స్త్రీ శక్తి ఉచిత బస్సు ప్రయాణం',
    nameEn: 'Free Bus Travel (Stree Shakti)',
    benefit: 'Free travel for women',
    width: 88,
    color: '#38BDF8'
  },
  {
    id: 'thalliki',
    nameTe: 'తల్లికి వందనం',
    nameEn: 'Thalliki Vandanam',
    benefit: '₹15,000 per year per child',
    amount: 15000,
    suffix: ' per year per child',
    width: 92,
    color: '#22C55E'
  },
  {
    id: 'annadata',
    nameTe: 'అన్నదాత సుఖీభవ',
    nameEn: 'Annadata Sukhibhava',
    benefit: 'Farmer financial assistance',
    width: 84,
    color: '#F97316'
  },
  {
    id: 'deepam',
    nameTe: 'దీపం పథకం',
    nameEn: 'Deepam Scheme',
    benefit: 'Free LPG cylinders',
    width: 78,
    color: '#F43F5E'
  },
  {
    id: 'yuva',
    nameTe: 'యువ ఉపాధి మద్దతు',
    nameEn: 'Yuva Employment Support',
    benefit: '₹3,000 monthly allowance',
    amount: 3000,
    suffix: ' monthly allowance',
    width: 86,
    color: '#A78BFA'
  }
];

const WelfareBenefitsGraph = () => {
  const sectionRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [counts, setCounts] = useState(() => benefits.map(() => 0));

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setPrefersReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.24 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return undefined;
    if (prefersReducedMotion) {
      setCounts(benefits.map((item) => item.amount || 0));
      return undefined;
    }
    let frame = 0;
    const duration = 900;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - ((1 - progress) ** 3);
      setCounts(benefits.map((item) => Math.round((item.amount || 0) * eased)));
      if (progress < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [visible, prefersReducedMotion]);

  return (
    <section ref={sectionRef} className="scroll-mt-24 bg-[#10162f] py-12 text-white md:py-16">
      <div className="container-page">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-yellow-300/35 bg-yellow-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-tdp-yellow">
              <BicycleIcon size={26} color="#FFD700" opacity={1} />
              Super 6 Benefits
            </div>
            <h2 className="telugu text-3xl font-black leading-tight md:text-4xl">TDP సూపర్ 6 — ప్రజలకు ప్రయోజనాలు</h2>
            <p className="mt-2 text-sm font-bold text-white/68 md:text-base">Super 6 Benefits for the People</p>
          </div>
          <Link to="/super6" className="inline-flex w-max items-center gap-2 rounded-lg bg-tdp-yellow px-4 py-3 text-sm font-black text-tdp-navy shadow-yellow">
            View Details <ArrowRight size={17} />
          </Link>
        </div>

        <div className="grid gap-4">
          {benefits.map((item, index) => (
            <Link key={item.id} to="/super6" className="group grid gap-3 rounded-lg border border-white/10 bg-white/[0.06] p-4 transition hover:border-yellow-300/55 hover:bg-white/[0.09] md:grid-cols-[260px_1fr_230px] md:items-center">
              <div className="min-w-0">
                <h3 className="telugu text-[15px] font-black leading-6 text-white md:text-lg">{item.nameTe}</h3>
                <p className="text-sm font-bold text-white/62">{item.nameEn}</p>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-white/12">
                <span
                  className={`benefit-bar-fill block h-full rounded-full ${visible ? 'is-visible' : ''}`}
                  style={{ width: `${item.width}%`, background: item.color, animationDelay: `${index * 90}ms` }}
                />
              </div>
              <div className="flex items-center justify-between gap-3 md:justify-end">
                <span className="text-sm font-black text-tdp-yellow md:text-base">{formatBenefit(item, counts[index])}</span>
                <ArrowRight size={17} className="shrink-0 text-white/40 transition group-hover:translate-x-1 group-hover:text-tdp-yellow" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

const formatBenefit = (item, count) => {
  if (!item.amount) return item.benefit;
  return `₹${count.toLocaleString('en-IN')}${item.suffix}`;
};

export default WelfareBenefitsGraph;
