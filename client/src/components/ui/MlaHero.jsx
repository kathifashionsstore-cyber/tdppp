import { motion } from 'framer-motion';
import { Award, MapPin, Phone, ShieldCheck } from 'lucide-react';

const MlaHero = () => (
  <section className="relative overflow-hidden bg-[#0f172a] text-white">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,215,0,0.22),transparent_30%),linear-gradient(135deg,#101827_0%,#8b0000_54%,#f5a623_100%)]" />
    <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.12)_1px,transparent_1px)] [background-size:52px_52px]" />
    <div className="container-page relative grid min-h-[430px] gap-8 py-10 md:min-h-[520px] md:grid-cols-[1.05fr_.95fr] md:items-end md:py-12">
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="pb-2 md:pb-10">
        <div className="inline-flex items-center gap-3 rounded-full border border-yellow-200/50 bg-black/20 px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-tdp-yellow shadow-yellow backdrop-blur">
          <img src="/logo-tdp.png" alt="Telugu Desam Party logo" className="h-8 w-8 rounded-full bg-white object-contain p-1" />
          Telugu Desam Party
        </div>
        <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight tracking-normal md:text-6xl">
          Dr. Chadalavada Aravinda Babu
        </h1>
        <p className="mt-3 text-xl font-black text-tdp-yellow md:text-3xl">MLA - Narasaraopet</p>
        <p className="mt-4 max-w-2xl text-base font-semibold leading-8 text-white/78 md:text-lg">
          Public service, welfare access, and constituency development for Narasaraopet Assembly Constituency, Andhra Pradesh.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-2 text-sm font-bold backdrop-blur"><MapPin size={17} /> Narasaraopet Constituency</span>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-2 text-sm font-bold backdrop-blur"><Award size={17} /> Telugu Desam Party</span>
          <a href="tel:9398724704" className="inline-flex items-center gap-2 rounded-full bg-tdp-yellow px-4 py-2 text-sm font-black text-slate-950 shadow-yellow"><Phone size={17} /> 9398724704</a>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 26 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55 }} className="relative mx-auto w-full max-w-[440px] md:mx-0 md:justify-self-end">
        <div className="absolute -inset-4 rounded-[28px] border border-yellow-200/30" />
        <div className="relative overflow-hidden rounded-[22px] border border-yellow-200/50 bg-white/10 p-3 shadow-2xl backdrop-blur">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[16px] bg-white">
            <img src="/mla/aravinda-babu.jpg" alt="Dr. Chadalavada Aravinda Babu" className="h-full w-full object-cover object-top" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/82 to-transparent p-4">
              <span className="inline-flex items-center gap-2 rounded-full bg-tdp-yellow px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-tdp-red"><ShieldCheck size={14} /> MLA</span>
              <p className="mt-2 text-lg font-black">Narasaraopet Assembly Constituency</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

export default MlaHero;
