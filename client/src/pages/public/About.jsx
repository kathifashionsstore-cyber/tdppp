import { motion } from 'framer-motion';
import { Award, GraduationCap, HeartPulse, Vote } from 'lucide-react';
import PageHero from './PageHero';
import Timeline from '@/components/ui/Timeline';

const About = () => (
  <>
    <PageHero page="about" title="Dr. Chadalavada Aravinda Babu" subtitle="MLA - Narasaraopet Constituency, Telugu Desam Party" />
    <section className="container-page grid gap-10 py-14 lg:grid-cols-[420px_1fr]">
      <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="relative">
        <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-tdp-yellow via-white to-tdp-red opacity-70 blur-xl" />
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-3 shadow-2xl">
          <img src="/mla/aravinda-babu.jpg" alt="Dr. Chadalavada Aravinda Babu" className="h-[520px] w-full rounded-[1.5rem] object-cover object-top" />
          <div className="absolute bottom-6 left-6 right-6 rounded-2xl bg-white/90 p-4 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-wide text-tdp-red">Narasaraopet MLA</p>
            <h2 className="text-xl font-black text-slate-950">Dr. Chadalavada Aravinda Babu</h2>
          </div>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid content-center gap-6">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-tdp-red">About MLA Sir</p>
          <h2 className="mt-3 text-4xl font-black leading-tight text-slate-950 md:text-5xl">Doctor, public representative, and development focused leader</h2>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">Dr. Chadalavada Aravinda Babu represents Narasaraopet constituency and works across health, infrastructure, welfare, education, agriculture, and temple development priorities.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[{ icon: GraduationCap, label: 'Education', value: 'M.S. Orthopaedics' }, { icon: Vote, label: '2024 Margin', value: '19,705 votes' }, { icon: Award, label: 'Total Votes', value: '1,03,167' }, { icon: HeartPulse, label: 'Public Service', value: 'Health & Welfare' }].map(({ icon: Icon, label, value }) => <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-lg shadow-slate-900/5"><Icon className="text-tdp-red" /><p className="mt-3 text-xs font-black uppercase tracking-wide text-slate-400">{label}</p><p className="text-lg font-black text-slate-950">{value}</p></div>)}
        </div>
      </motion.div>
    </section>
    <section className="container-page pb-14"><Timeline items={[{ year: '1992', title: 'Medical Education', description: 'Completed M.S. Orthopaedics from NTR University of Health Sciences.' }, { year: '2024', title: 'MLA Victory', description: 'Won Narasaraopet Assembly seat with a 19,705 vote margin.' }]} /></section>
  </>
);

export default About;
