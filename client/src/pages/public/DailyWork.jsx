import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, CalendarDays, Car, CheckCircle2, ChevronDown, ChevronUp, Clock3, Copy, MapPin, MessageCircle } from 'lucide-react';
import PageHero from './PageHero';
import { useCollection } from '@/hooks/useFirestore';
import { formatDate } from '@/utils/dateUtils';
import { excerpt, getLangField, sanitizeHtml, stripHtml, toDate } from '@/utils/helpers';
import { useLanguage } from '@/hooks/useLanguage';

const DailyWork = () => {
  const { language } = useLanguage();
  const [now, setNow] = useState(() => new Date());
  const { data: schedules = [], isLoading: scheduleLoading } = useCollection('dailySchedules', { publishedOnly: true, orderByField: 'date', orderDirection: 'desc' });
  const { data: workItems = [], isLoading: workLoading } = useCollection('dailyWork', { publishedOnly: true, orderByField: 'date', orderDirection: 'desc' });

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const todaySchedule = useMemo(() => schedules
    .map((item) => ({ ...item, date: toDate(item.date) || new Date() }))
    .find((item) => isSameDay(item.date, now)), [now, schedules]);
  const liveEntries = useMemo(() => todaySchedule ? getLiveEntries(todaySchedule, now) : [], [now, todaySchedule]);
  const shareText = useMemo(() => todaySchedule ? buildWhatsAppText(todaySchedule, liveEntries) : '', [liveEntries, todaySchedule]);

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success('Schedule copied to clipboard');
    } catch {
      toast.error('Copy failed. Please try again.');
    }
  };

  return (
    <>
      <PageHero page="dailywork" title="Daily Work" subtitle="Development, welfare, meetings, visits, and constituency updates" />

      <section className="bg-white py-8 md:py-12">
        <div className="container-page">
          {todaySchedule ? (
            <motion.article initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="overflow-hidden rounded-xl border border-yellow-200 bg-white shadow-xl">
              {!!(todaySchedule.topImage || todaySchedule.topImageUrl) && (
                <img src={todaySchedule.topImage || todaySchedule.topImageUrl} alt="" className="aspect-video w-full object-cover" loading="lazy" />
              )}
              <ScheduleHeader schedule={todaySchedule} language={language} now={now} />
              <ScheduleTimeline entries={liveEntries} language={language} />
              <div className="grid gap-4 border-t border-yellow-100 bg-yellow-50 p-4 md:p-6">
                <div className="rounded-lg border border-yellow-200 bg-white p-4 shadow-sm">
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-tdp-red">Closing Note</p>
                  <p className="telugu whitespace-pre-line leading-8 text-slate-700">{stripHtml(getLangField(todaySchedule, 'closingNote', language) || todaySchedule.closingNote_te || todaySchedule.closingNote_en)}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-3 font-black text-white shadow-md">
                    <MessageCircle size={18} /> Share on WhatsApp
                  </a>
                  <button type="button" onClick={copyShare} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-3 font-black text-slate-800">
                    <Copy size={18} /> Copy Text
                  </button>
                </div>
              </div>
            </motion.article>
          ) : (
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-yellow-200 bg-yellow-50 p-8 text-center shadow-sm">
              <Clock3 className="mx-auto text-tdp-red" size={34} />
              <h1 className="mt-3 text-2xl font-black text-slate-950">Today&apos;s schedule has not been published yet.</h1>
              <p className="mt-2 font-semibold text-slate-600">{scheduleLoading ? 'Checking for the latest schedule...' : 'Check back soon.'}</p>
            </motion.div>
          )}
        </div>
      </section>

      <WorkGallery items={workItems} isLoading={workLoading} language={language} />
    </>
  );
};

const ScheduleHeader = ({ schedule, language, now }) => {
  const date = toDate(schedule.date) || now;
  return (
    <header className="bg-slate-950 p-5 text-white md:p-7">
      <p className="telugu text-2xl font-black leading-relaxed text-tdp-yellow md:text-3xl">{getLangField(schedule, 'greeting', language) || schedule.greeting_te || schedule.greeting_en}</p>
      <div className="mt-2 flex flex-wrap gap-3 text-sm font-bold text-white/72">
        <span className="inline-flex items-center gap-2"><CalendarDays size={16} /> {formatDate(date, 'dd/MM/yyyy')}</span>
        <span>{date.toLocaleDateString(language === 'te' ? 'te-IN' : 'en-IN', { weekday: 'long' })}</span>
      </div>
      <h1 className="telugu mt-5 max-w-4xl text-xl font-black leading-9 md:text-3xl md:leading-[1.35]">{getLangField(schedule, 'title', language) || schedule.title_te || schedule.title_en}</h1>
      <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-tdp-yellow">Live Timeline</p>
    </header>
  );
};

const ScheduleTimeline = ({ entries, language }) => {
  const lineRef = useRef(null);
  const dotRefs = useRef([]);
  const [carTop, setCarTop] = useState(18);
  const completedCount = entries.filter((entry) => entry.liveStatus === 'completed').length;
  const activeIndex = entries.findIndex((entry) => entry.liveStatus === 'in-progress');
  const currentIndex = activeIndex >= 0 ? activeIndex : completedCount >= entries.length ? entries.length - 1 : Math.max(0, completedCount - 1);
  const showCar = activeIndex >= 0 || completedCount >= entries.length;

  useEffect(() => {
    const measure = () => {
      const line = lineRef.current;
      const dot = dotRefs.current[currentIndex] || dotRefs.current[entries.length - 1];
      if (!line || !dot) return;
      const lineBox = line.getBoundingClientRect();
      const dotBox = dot.getBoundingClientRect();
      setCarTop(Math.max(18, dotBox.top - lineBox.top + (dotBox.height / 2)));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [currentIndex, entries.length]);

  if (!entries.length) {
    return <div className="p-6 text-center font-bold text-slate-500">No schedule entries have been added yet.</div>;
  }

  const fillHeight = completedCount >= entries.length ? '100%' : showCar ? `${Math.max(0, carTop)}px` : '0px';

  return (
    <div className="relative p-4 md:p-7">
      <div ref={lineRef} className="relative ml-2 grid gap-5 border-l-4 border-slate-200 pl-8 md:ml-5 md:pl-10">
        <motion.div className="absolute -left-1 top-0 w-1 rounded-full bg-tdp-yellow" animate={{ height: fillHeight }} transition={{ duration: 1, ease: 'easeInOut' }} />
        {showCar && (
          <motion.div className="absolute -left-[18px] z-20 grid h-8 w-8 place-items-center rounded-full border-2 border-white bg-slate-950 text-tdp-yellow shadow-lg md:-left-[20px]" animate={{ top: carTop - 16 }} transition={{ duration: 1, ease: 'easeInOut' }} aria-hidden="true">
            <Car size={22} />
          </motion.div>
        )}
        {entries.map((entry, index) => (
          <motion.article key={`${entry.time}-${index}`} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: 0.32, delay: Math.min(index * 0.06, 0.24) }} className="relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <span ref={(node) => { dotRefs.current[index] = node; }} className={`absolute -left-[3.05rem] top-5 z-10 grid h-7 w-7 place-items-center rounded-full border-4 border-white shadow-sm ${statusDotClass(entry.liveStatus)}`}>
              {entry.liveStatus === 'completed' && <CheckCircle2 size={15} />}
              {entry.liveStatus === 'in-progress' && <span className="h-3 w-3 animate-pulse rounded-full bg-tdp-red" />}
              {entry.liveStatus === 'upcoming' && <Clock3 size={14} />}
            </span>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className={`text-lg font-black ${entry.liveStatus === 'completed' ? 'text-green-700 line-through decoration-2' : entry.liveStatus === 'in-progress' ? 'text-tdp-red' : 'text-slate-950'}`}>{entry.time}</p>
                <h3 className={`telugu mt-1 text-xl font-black leading-8 ${entry.liveStatus === 'completed' ? 'text-slate-500 line-through decoration-2' : 'text-slate-950'}`}>{getLangField(entry, 'activity', language) || entry.activity_te || entry.activity_en}</h3>
                {(getLangField(entry, 'location', language) || entry.location_te || entry.location_en) && <p className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-slate-500"><MapPin size={15} /> {getLangField(entry, 'location', language) || entry.location_te || entry.location_en}</p>}
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.08em] ${statusBadgeClass(entry.liveStatus)}`}>{entry.liveStatus === 'in-progress' ? 'Now' : entry.liveStatus}</span>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
};

const WorkGallery = ({ items, isLoading, language }) => (
  <section className="bg-slate-100 py-10 md:py-14">
    <div className="container-page">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-tdp-red">Daily Work Photo Gallery</p>
        <h2 className="mt-2 text-3xl font-black text-slate-950">Latest Work Updates</h2>
      </div>
      {isLoading ? (
        <div className="rounded-xl bg-white p-6 font-bold text-slate-500">Loading work updates...</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => <WorkPhotoCard key={item.id || index} item={item} index={index} language={language} />)}
          {!items.length && <div className="rounded-xl bg-white p-8 text-center font-bold text-slate-500 md:col-span-2 xl:col-span-3">No daily work photos published yet.</div>}
        </div>
      )}
    </div>
  </section>
);

const WorkPhotoCard = ({ item, index, language }) => {
  const [expanded, setExpanded] = useState(false);
  const image = item.image || item.images?.[0] || '/og-image.svg';
  const title = getLangField(item, 'title', language) || 'Daily Work Update';
  const description = getLangField(item, 'description', language) || item.description_en || '';
  return (
    <motion.article initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.32, delay: Math.min(index * 0.05, 0.25) }} className="overflow-hidden rounded-xl border border-yellow-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.08)]">
      <img src={image} alt={title} className="aspect-video w-full object-cover" loading="lazy" />
      <div className="p-5">
        <p className="inline-flex items-center gap-2 text-sm font-bold text-slate-500"><CalendarDays size={15} /> {formatDate(item.date || item.createdAt, 'dd MMMM yyyy')}</p>
        <h3 className="mt-3 text-xl font-black leading-7 text-slate-950">{title}</h3>
        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-600">{excerpt(description, 140)}</p>
        <button type="button" onClick={() => setExpanded((value) => !value)} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-tdp-yellow px-4 text-sm font-black uppercase tracking-[0.08em] text-tdp-navy shadow-yellow">
          <BookOpen size={16} /> Read More {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
              <div className="prose-content mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm leading-7 text-slate-700" dangerouslySetInnerHTML={sanitizeHtml(description)} />
              <button type="button" onClick={() => setExpanded(false)} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 font-black text-slate-700">
                Close <ChevronUp size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
};

const getLiveEntries = (schedule, now) => {
  const entries = [...(schedule.entries || [])].sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99));
  const scheduleDate = toDate(schedule.date) || now;
  const isToday = isSameDay(scheduleDate, now);
  const isPast = startOfDay(scheduleDate) < startOfDay(now);
  const isFuture = startOfDay(scheduleDate) > startOfDay(now);
  const nowMinutes = (now.getHours() * 60) + now.getMinutes();
  const entryMinutes = inferEntryMinutes(entries);
  const currentIndex = entryMinutes.reduce((active, minutes, index) => {
    return minutes != null && minutes <= nowMinutes ? index : active;
  }, -1);

  return entries.map((entry, index) => {
    let liveStatus = 'upcoming';
    if (isPast || (isToday && index < currentIndex)) liveStatus = 'completed';
    else if (!isFuture && isToday && index === currentIndex) liveStatus = 'in-progress';
    return { ...entry, liveStatus };
  });
};

const inferEntryMinutes = (entries) => {
  let lastMinutes = -1;
  return entries.map((entry) => {
    const raw = parseTimeToMinutes(entry.time);
    if (raw == null) return null;
    let minutes = raw;
    if (!/am|pm/i.test(entry.time || '')) {
      while (minutes <= lastMinutes && minutes + 720 < 1440) minutes += 720;
    }
    lastMinutes = Math.max(lastMinutes, minutes);
    return minutes;
  });
};

const parseTimeToMinutes = (value = '') => {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return null;
  const match = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridian = match[3];
  if (meridian === 'pm' && hours < 12) hours += 12;
  if (meridian === 'am' && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return null;
  return (hours * 60) + minutes;
};

const buildWhatsAppText = (schedule, entries) => {
  const date = toDate(schedule.date) || new Date();
  const lines = [
    schedule.greeting_te || schedule.greeting_en || '',
    `Date ${formatDate(date, 'dd/MM/yyyy')}`,
    date.toLocaleDateString('te-IN', { weekday: 'long' }),
    schedule.title_te || schedule.title_en || '',
    ...entries.map((entry) => `* ${entry.time} - ${entry.activity_te || entry.activity_en || ''} *`),
    stripHtml(schedule.closingNote_te || schedule.closingNote_en || ''),
    schedule.signature_te || 'Itlu\nMLA Office'
  ];
  return lines.filter(Boolean).join('\n');
};

const statusDotClass = (status) => {
  if (status === 'completed') return 'bg-green-600 text-white';
  if (status === 'in-progress') return 'bg-red-50 text-tdp-red ring-4 ring-red-100';
  return 'bg-slate-100 text-slate-500';
};

const statusBadgeClass = (status) => {
  if (status === 'completed') return 'bg-green-100 text-green-700';
  if (status === 'in-progress') return 'bg-red-100 text-tdp-red';
  return 'bg-slate-100 text-slate-500';
};

const isSameDay = (left, right) => startOfDay(left).getTime() === startOfDay(right).getTime();

const startOfDay = (value) => {
  const date = toDate(value) || new Date();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export default DailyWork;
