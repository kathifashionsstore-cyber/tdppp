import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Star } from 'lucide-react';

const SuperSixSection = () => (
  <Link
    to="/super6"
    className="fixed bottom-36 right-4 z-[52] inline-flex items-center gap-2 rounded-full bg-tdp-yellow px-4 py-3 font-black text-tdp-navy shadow-[0_10px_30px_rgba(245,166,35,0.45)] ring-4 ring-yellow-300/25 transition hover:-translate-y-1 hover:shadow-[0_14px_36px_rgba(245,166,35,0.65)] md:bottom-24"
    aria-label="Super 6 Schemes"
  >
    <motion.span animate={{ scale: [1, 1.14, 1] }} transition={{ duration: 1.7, repeat: Infinity, repeatDelay: 2.2 }} className="grid h-9 w-9 place-items-center rounded-full bg-tdp-red text-white">
      <Star size={19} fill="currentColor" />
    </motion.span>
    <span className="leading-tight">
      <span className="block text-xs uppercase tracking-[0.12em] text-tdp-red">Super 6</span>
      <span className="hidden text-sm md:block">Schemes</span>
    </span>
    <Sparkles size={15} className="text-tdp-red" />
  </Link>
);

export default SuperSixSection;
