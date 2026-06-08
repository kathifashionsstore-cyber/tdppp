import { ArrowUp } from 'lucide-react';
import { useEffect, useState } from 'react';

const BackToTop = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  if (!visible) return null;
  return (
    <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-40 right-4 z-40 hidden h-11 w-11 items-center justify-center rounded-full bg-tdp-navy text-white shadow-lg md:flex" aria-label="Back to top">
      <ArrowUp size={20} />
    </button>
  );
};

export default BackToTop;
