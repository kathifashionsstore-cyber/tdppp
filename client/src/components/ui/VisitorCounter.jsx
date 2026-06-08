import { useEffect, useState } from 'react';
import { Eye } from 'lucide-react';
import { getAnalyticsDay } from '@/services/analyticsService';

const VisitorCounter = () => {
  const [visits, setVisits] = useState(null);

  useEffect(() => {
    getAnalyticsDay().then((data) => setVisits(data?.totalVisits || 0)).catch(() => setVisits(0));
  }, []);

  return (
    <section className="bg-slate-950 py-4 text-white">
      <div className="container-page flex flex-wrap items-center justify-center gap-3 text-center text-sm font-bold md:justify-between">
        <span className="inline-flex items-center gap-2 text-tdp-yellow"><Eye size={18} /> Visitor Counter</span>
        <span>{visits === null ? 'Counting visits...' : `${Number(visits).toLocaleString('en-IN')} visits today`}</span>
      </div>
    </section>
  );
};

export default VisitorCounter;
