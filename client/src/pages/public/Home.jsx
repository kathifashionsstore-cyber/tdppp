import { Link } from 'react-router-dom';
import PageHero from './PageHero';
import WorkCard from '@/components/ui/WorkCard';
import NewsCard from '@/components/ui/NewsCard';
import SchemeGraphDashboard from '@/components/ui/SchemeGraphDashboard';
import LeaderHighlightSection from '@/components/ui/LeaderHighlightSection';
import NarasaraopetLandmarks from '@/components/ui/NarasaraopetLandmarks';
import HomeAboutSection from '@/components/ui/HomeAboutSection';
import VisitorCounter from '@/components/ui/VisitorCounter';
import { useCollection } from '@/hooks/useFirestore';
import { useLanguage } from '@/hooks/useLanguage';
import { SkeletonGrid } from '@/components/ui/LoadingSpinner';
import { HandHeart, MapPin, Phone } from 'lucide-react';

const copy = {
  te: {
    latestNews: 'తాజా వార్తలు',
    featuredWork: 'రోజువారీ పనులు',
    viewAll: 'అన్నీ చూడండి',
    supportTitle: 'ప్రజా సేవకు మీ సహకారం',
    supportBody: 'సంక్షేమం, అభివృద్ధి కార్యక్రమాల కోసం విరాళం ఇవ్వండి లేదా వాలంటీర్ గా చేరండి.',
    supportCta: 'Donate / Volunteer',
    contactTitle: 'సంప్రదించండి',
    contactBody: 'స్థానిక సమస్యలు, కార్యక్రమాలు, ఈవెంట్ల కోసం నియోజకవర్గ కార్యాలయాన్ని సంప్రదించండి.'
  },
  en: {
    latestNews: 'Latest News',
    featuredWork: 'Featured Daily Work',
    viewAll: 'View All',
    supportTitle: 'Support public service',
    supportBody: 'Contribute, volunteer, or connect with the Narasaraopet team for welfare and development activities.',
    supportCta: 'Donate / Volunteer',
    contactTitle: 'Contact',
    contactBody: 'Reach the constituency office for local issues, programs, and event coordination.'
  }
};

const Home = () => {
  const { language } = useLanguage();
  const text = copy[language] || copy.en;
  const work = useCollection('dailyWork', { publishedOnly: true, orderByField: 'createdAt', orderDirection: 'desc', limitCount: 3 });
  const news = useCollection('news', { publishedOnly: true, orderByField: 'publishedAt', orderDirection: 'desc', limitCount: 3 });

  return (
    <>
      <section id="home">
        <PageHero page="home" title="Dr. Chadalavada Aravinda Babu" subtitle="MLA - Narasaraopet, Telugu Desam Party" />
      </section>

      <HomeAboutSection />
      <VisitorCounter />
      <SchemeGraphDashboard />

      <section id="news" className="container-page scroll-mt-24 py-12">
        <SectionHeading title={text.latestNews} to="/news" cta={text.viewAll} />
        <div className="grid gap-5 md:grid-cols-3">
          {(news.data || []).map((item) => <NewsCard key={item.id} item={item} />)}
        </div>
      </section>

      <section id="daily" className="container-page scroll-mt-24 py-12">
        <SectionHeading title={text.featuredWork} to="/daily-work" cta={text.viewAll} />
        {work.isLoading ? <SkeletonGrid count={3} /> : <div className="grid gap-5 md:grid-cols-3">{(work.data || []).map((item) => <WorkCard key={item.id} item={item} />)}</div>}
      </section>

      <section id="leader" className="scroll-mt-24">
        <LeaderHighlightSection language={language} />
      </section>

      <NarasaraopetLandmarks />

      <section className="bg-slate-950 py-12 text-white">
        <div className="container-page grid gap-5 md:grid-cols-2">
          <div id="donate" className="scroll-mt-24 rounded-lg border border-white/10 bg-white/8 p-6 shadow-xl">
            <HandHeart className="text-tdp-yellow" size={30} />
            <h2 className="mt-3 text-2xl font-black">{text.supportTitle}</h2>
            <p className="mt-2 leading-7 text-white/72">{text.supportBody}</p>
            <Link to="/contact" className="mt-5 inline-flex rounded-lg bg-tdp-yellow px-5 py-3 font-black text-tdp-navy">{text.supportCta}</Link>
          </div>
          <div id="contact" className="scroll-mt-24 rounded-lg border border-white/10 bg-white/8 p-6 shadow-xl">
            <Phone className="text-tdp-yellow" size={30} />
            <h2 className="mt-3 text-2xl font-black">{text.contactTitle}</h2>
            <p className="mt-2 leading-7 text-white/72">{text.contactBody}</p>
            <p className="mt-4 flex items-center gap-2 font-black text-tdp-yellow"><Phone size={18} /> 9398724704</p>
            <p className="mt-2 flex items-center gap-2 text-white/72"><MapPin size={18} /> Narasaraopet, Andhra Pradesh</p>
          </div>
        </div>
      </section>
    </>
  );
};

const SectionHeading = ({ title, to, cta }) => (
  <div className="mb-6 flex items-center justify-between gap-4">
    <h2 className="text-2xl font-black text-gray-950">{title}</h2>
    <Link to={to} className="shrink-0 font-bold text-tdp-red">{cta}</Link>
  </div>
);

export default Home;
