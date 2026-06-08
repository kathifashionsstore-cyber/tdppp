import { motion } from 'framer-motion';
import { BookOpen, Landmark, Medal, Vote } from 'lucide-react';
import { useDoc } from '@/hooks/useFirestore';
import { getLangField, sanitizeHtml } from '@/utils/helpers';
import { useLanguage } from '@/hooks/useLanguage';

const fallbackBio = `
  <p>Dr. Chadalavada Aravinda Babu is a medical professional and public representative serving Narasaraopet Assembly Constituency. His work focuses on accessible public services, constituency development, health, education, and welfare delivery.</p>
  <p>He completed MS Orthopaedics from NTR University of Health Sciences in 1992 and brings decades of community service experience into public life.</p>
`;

const HomeAboutSection = () => {
  const { language } = useLanguage();
  const { data } = useDoc('siteConfig', 'about');
  const image = data?.image || data?.photo || '/mla/aravinda-babu.jpg';
  const bio = getLangField(data, 'bio', language) || getLangField(data, 'description', language) || fallbackBio;

  return (
    <section id="about-mla" className="relative overflow-hidden bg-white py-14 md:py-20">
      <div className="container-page">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55 }}
          className="grid gap-8 rounded-2xl border border-yellow-200 bg-gradient-to-br from-white via-yellow-50 to-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.12)] md:grid-cols-[0.82fr_1.18fr] md:p-8"
        >
          <div className="relative">
            <div className="absolute -inset-3 rounded-2xl bg-gradient-to-br from-tdp-yellow to-tdp-red opacity-[0.18] blur-xl" />
            <div className="relative overflow-hidden rounded-xl border border-yellow-300 bg-white p-2 shadow-2xl">
              <img src={image} alt="Dr. Chadalavada Aravinda Babu" className="aspect-[4/5] w-full rounded-lg object-cover object-top" />
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-tdp-red">About Dr. Chadalavada Aravinda Babu</p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 md:text-5xl">Doctor, public representative, and MLA for Narasaraopet</h2>
            <div className="prose-content mt-5 leading-8 text-slate-700" dangerouslySetInnerHTML={sanitizeHtml(bio)} />
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Fact icon={BookOpen} label="Education" value={data?.education || 'MS Orthopaedics, NTR University of Health Sciences, 1992'} />
              <Fact icon={Vote} label="2024 Victory" value={data?.victory || '103,167 votes, 19,705 vote margin'} />
              <Fact icon={Landmark} label="Constituency" value="Narasaraopet Assembly Constituency" />
              <Fact icon={Medal} label="Focus" value="Health, welfare, infrastructure, and citizen services" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const Fact = ({ icon: Icon, label, value }) => (
  <div className="rounded-lg border border-yellow-200 bg-white p-4 shadow-sm">
    <Icon className="text-tdp-red" size={22} />
    <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-slate-400">{label}</p>
    <p className="mt-1 text-sm font-black leading-6 text-slate-950">{value}</p>
  </div>
);

export default HomeAboutSection;
