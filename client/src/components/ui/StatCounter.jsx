import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';

const StatCounter = ({ number, label }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const numeric = Number(String(number).replace(/[^0-9]/g, '')) || 0;
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    const formatted = Math.round(latest).toLocaleString('en-IN');
    return String(number).includes('+') ? `${formatted}+` : formatted;
  });

  useEffect(() => {
    if (inView) {
      const controls = animate(count, numeric, { duration: 1.8, ease: 'easeOut' });
      return controls.stop;
    }
  }, [count, inView, numeric]);

  return (
    <div ref={ref} className="text-center">
      <motion.div className="text-3xl font-black text-tdp-yellow md:text-5xl">{rounded}</motion.div>
      <div className="mt-2 text-sm font-semibold text-white/90 md:text-base">{label}</div>
    </div>
  );
};

export default StatCounter;
