import { useEffect, useMemo, useState } from 'react';
import { getLangField, stripHtml } from '@/utils/helpers';
import { useLanguage } from '@/hooks/useLanguage';

const defaultAnnouncements = [
  {
    id: 'wayzentech',
    title_en: 'Website made by WayzenTech - 9398724704',
    title_te: 'Website made by WayzenTech - 9398724704',
    linkUrl: 'tel:9398724704',
    isActive: true
  },
  {
    id: 'mla',
    title_en: 'Dr. Chadalavada Aravinda Babu - MLA, Narasaraopet TDP',
    title_te: 'Dr. Chadalavada Aravinda Babu - MLA, Narasaraopet TDP',
    isActive: true
  },
  {
    id: 'office',
    title_en: 'For services contact our office',
    title_te: 'For services contact our office',
    isActive: true
  }
];

const AnnouncementBar = ({ fixed = true, tv = false }) => {
  const { language } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const announcements = useMemo(() => defaultAnnouncements
    .map((item) => ({
      ...item,
      text: stripHtml(getLangField(item, 'title', language))
    }))
    .map((item) => ({ ...item, linkUrl: item.linkUrl || item.url || '' })), [language]);

  useEffect(() => {
    if (!tv || announcements.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % announcements.length);
    }, 4_000);
    return () => window.clearInterval(timer);
  }, [announcements.length, tv]);

  const mobileCallLink = announcements.find((item) => item.linkUrl?.startsWith('tel:'))?.linkUrl || 'tel:9398724704';
  const marqueeItems = [...announcements, ...announcements];
  const activeAnnouncement = announcements[activeIndex % Math.max(announcements.length, 1)] || announcements[0];

  if (tv) {
    return (
      <div className={`announcement-bar tv-announcement-bar ${fixed ? 'fixed inset-x-0 top-0 z-[90]' : 'relative z-20'} h-11 w-full overflow-hidden text-[#1a1a1a] shadow-md`}>
        <div key={activeAnnouncement?.id || activeAnnouncement?.text || activeIndex} className="tv-announcement-content">
          <span className="tv-announcement-line" />
          <span aria-hidden="true" className="tv-announcement-star">✦</span>
          <span className="tv-announcement-text">{activeAnnouncement?.text}</span>
          <span className="tv-announcement-line" />
        </div>
      </div>
    );
  }

  return (
    <div className={`announcement-bar ${fixed ? 'fixed inset-x-0 top-0 z-[90]' : 'relative z-20'} ${tv ? 'h-11' : 'h-8 md:h-9'} w-full overflow-hidden whitespace-nowrap text-[#1a1a1a] shadow-md`}>
      {!tv && <a href={mobileCallLink} className="absolute inset-0 z-20 md:hidden" aria-label="Call WayzenTech" />}
      <div className="relative z-0 flex h-full w-full items-center overflow-hidden">
        <div className={`announcement-track font-black ${tv ? 'text-base md:text-lg' : 'text-[12px] md:text-sm'}`}>
          {marqueeItems.map((item, index) => (
            <span key={`${item.id || item.text}-${index}`} className="inline-flex items-center gap-4 px-2">
              {item.linkUrl ? (
                <a href={item.linkUrl} className="hidden underline-offset-2 hover:underline md:inline" aria-label={item.text}>{item.text}</a>
              ) : (
                <span>{item.text}</span>
              )}
              {item.linkUrl && <span className="md:hidden">{item.text}</span>}
              <span aria-hidden="true" className="text-base leading-none">✦</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBar;
