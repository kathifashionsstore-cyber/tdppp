import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Phone } from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { getLangField, stripHtml } from '@/utils/helpers';
import { useLanguage } from '@/hooks/useLanguage';

const defaultAnnouncements = [
  {
    id: 'wayzentech',
    title_en: 'Website made by WayzenTech - Contact: 9398724704',
    title_te: 'Website made by WayzenTech - Contact: 9398724704',
    linkUrl: 'tel:9398724704',
    isActive: true
  },
  {
    id: 'mla',
    title_en: 'Dr. Chadalavada Aravinda Babu - MLA, Narasaraopet, TDP',
    title_te: 'Dr. Chadalavada Aravinda Babu - MLA, Narasaraopet, TDP',
    isActive: true
  },
  {
    id: 'office',
    title_en: 'For constituency services and grievances, contact our office',
    title_te: 'For constituency services and grievances, contact our office',
    isActive: true
  }
];

const AnnouncementBar = () => {
  const { language } = useLanguage();
  const { data = [] } = useCollection('announcements', { activeOnly: true, orderByField: 'order', orderDirection: 'asc' });
  const announcements = useMemo(() => {
    const adminItems = data.filter((item) => getLangField(item, 'title', language) || getLangField(item, 'message', language) || getLangField(item, 'description', language));
    return adminItems.length ? adminItems : defaultAnnouncements;
  }, [data, language]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (announcements.length < 2) return undefined;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % announcements.length), 3000);
    return () => window.clearInterval(timer);
  }, [announcements.length]);

  useEffect(() => {
    setIndex(0);
  }, [announcements.length]);

  const active = announcements[index] || announcements[0];
  const text = stripHtml(getLangField(active, 'title', language) || getLangField(active, 'message', language) || getLangField(active, 'description', language));
  const content = (
    <span className="announcement-slide inline-flex min-w-0 items-center gap-2 text-sm font-black text-slate-950">
      {active?.linkUrl?.startsWith('tel:') && <Phone size={15} />}
      <span className="truncate">{text}</span>
    </span>
  );

  return (
    <div className="fixed inset-x-0 top-0 z-[90] h-9 overflow-hidden bg-gradient-to-r from-tdp-yellow via-[#ffe766] to-tdp-gold text-slate-950 shadow-md">
      <div className="container-page flex h-full items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={active?.id || index}
            initial={{ y: 22, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -22, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="max-w-full"
          >
            {active?.linkUrl ? (
              <a href={active.linkUrl} className="block max-w-full" aria-label={text}>
                {content}
              </a>
            ) : content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AnnouncementBar;
