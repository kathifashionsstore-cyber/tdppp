import { useMemo } from 'react';
import { Phone } from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { getLangField, stripHtml } from '@/utils/helpers';
import { useLanguage } from '@/hooks/useLanguage';
import BicycleIcon from '@/components/ui/BicycleIcon';

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
    const adminItems = data
      .map((item) => ({
        ...item,
        text: stripHtml(getLangField(item, 'title', language) || getLangField(item, 'message', language) || getLangField(item, 'description', language))
      }))
      .filter((item) => item.text);
    const source = adminItems.length ? adminItems : defaultAnnouncements.map((item) => ({
      ...item,
      text: stripHtml(getLangField(item, 'title', language))
    }));
    return source.map((item) => ({ ...item, linkUrl: item.linkUrl || item.url || '' }));
  }, [data, language]);
  const mobileCallLink = announcements.find((item) => item.linkUrl?.startsWith('tel:'))?.linkUrl || 'tel:9398724704';
  const marqueeItems = [...announcements, ...announcements];

  return (
    <div className="announcement-bar fixed inset-x-0 top-0 z-[90] h-8 overflow-hidden text-[#1a1a1a] shadow-md md:h-10">
      <a href={mobileCallLink} className="absolute inset-0 z-20 md:hidden" aria-label="Call WayzenTech" />
      <div className="pointer-events-none absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/42 p-1">
        <BicycleIcon size={24} color="#1a1a1a" opacity={1} className="announcement-icon-rotate" />
      </div>
      <div className="pointer-events-none absolute right-2 top-1/2 z-10 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-white/45 text-[#1a1a1a] md:h-7 md:w-7">
        <Phone size={15} className="announcement-phone-pulse" />
      </div>
      <div className="relative z-0 flex h-full items-center overflow-hidden px-11">
        <div className="announcement-track text-[12px] font-black md:text-sm">
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
