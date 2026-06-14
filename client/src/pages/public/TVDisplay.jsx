import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Car, CheckCircle2, Clock3, ImageOff, Radio, TimerReset } from 'lucide-react';
import { useCollection } from '@/hooks/useFirestore';
import { formatCountdown, getCurrentEntryIndex, getLiveEntries, selectTodaySchedule, selectTvPhotoSet } from '@/utils/scheduleUtils';
import { getLangField, toDate } from '@/utils/helpers';

const REFRESH_SECONDS = 600;
const FALLBACK_PHOTO = {
  url: '/og-image.png',
  caption: 'TDP Narasaraopet',
  time: ''
};

const TVDisplay = () => {
  const [now, setNow] = useState(() => new Date());
  const [refreshSeconds, setRefreshSeconds] = useState(REFRESH_SECONDS);
  const [slideIndex, setSlideIndex] = useState(0);
  const { data: schedules = [], isLoading: schedulesLoading } = useCollection('dailySchedules', { publishedOnly: true, orderByField: 'date', orderDirection: 'desc' });
  const { data: heroImages = [] } = useCollection('heroImages_home', { activeOnly: true, orderByField: 'order', orderDirection: 'asc', limitCount: 10 });

  useEffect(() => {
    const clockTimer = window.setInterval(() => setNow(new Date()), 1_000);
    const reloadTimer = window.setInterval(() => window.location.reload(), REFRESH_SECONDS * 1_000);
    const countdownTimer = window.setInterval(() => {
      setRefreshSeconds((seconds) => (seconds <= 1 ? REFRESH_SECONDS : seconds - 1));
    }, 1_000);
    return () => {
      window.clearInterval(clockTimer);
      window.clearInterval(reloadTimer);
      window.clearInterval(countdownTimer);
    };
  }, []);

  const schedule = useMemo(() => selectTodaySchedule(schedules, now) || schedules[0] || null, [now, schedules]);
  const entries = useMemo(() => (schedule ? getLiveEntries(schedule, now) : []), [now, schedule]);
  const fallbackPhotos = useMemo(() => {
    const photos = heroImages
      .filter((item) => item?.imageUrl && item.isActive !== false)
      .sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99))
      .map((item, index) => ({
        url: item.imageUrl,
        caption: item.title_te || item.title_en || `Home hero image ${index + 1}`,
        time: ''
      }));
    return photos.length ? photos : [FALLBACK_PHOTO];
  }, [heroImages]);
  const selectedPhotos = useMemo(() => selectTvPhotoSet(entries, fallbackPhotos), [entries, fallbackPhotos]);
  const photos = selectedPhotos.photos.length ? selectedPhotos.photos : [FALLBACK_PHOTO];
  const activePhotoIndex = photos.length ? slideIndex % photos.length : 0;
  const currentEntry = selectedPhotos.sourceEntry || entries[getCurrentEntryIndex(entries)] || null;
  const scheduleDate = toDate(schedule?.date) || now;
  const currentTime = now.toLocaleTimeString('en-IN', { hour12: false });

  useEffect(() => {
    setSlideIndex(0);
  }, [photos.length, selectedPhotos.source]);

  useEffect(() => {
    if (photos.length <= 1) return undefined;
    const slideTimer = window.setInterval(() => {
      setSlideIndex((index) => (index + 1) % photos.length);
    }, 5_000);
    return () => window.clearInterval(slideTimer);
  }, [photos.length]);

  return (
    <main className="h-dvh w-screen overflow-hidden bg-[#050517] text-white">
      <header className="grid h-[116px] grid-cols-[86px_1fr_170px] items-center gap-4 bg-gradient-to-r from-[#ffd700] via-[#f5a623] to-[#ffd700] px-6 text-[#111827] shadow-2xl">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-white/70 p-2 shadow-lg">
          <img src="/logo-tdp.png" alt="TDP" className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0 text-center">
          <h1 className="telugu truncate text-[30px] font-black leading-tight">నరసరావుపేట శాసనసభ్యులు డాక్టర్ చదలవాడ అరవింద బాబు నేటి పర్యటన వివరాలు</h1>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-[19px] font-black">
            <span className="inline-flex items-center gap-2"><CalendarDays size={21} /> {scheduleDate.toLocaleDateString('te-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            <span>{scheduleDate.toLocaleDateString('te-IN', { weekday: 'long' })}</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-sm uppercase tracking-[0.12em] text-white"><span className="h-2 w-2 animate-pulse rounded-full bg-white" /> Live</span>
          </div>
        </div>
        <div className="justify-self-end rounded-lg bg-black/85 px-4 py-3 font-mono text-[24px] font-black text-tdp-yellow shadow-lg">{currentTime}</div>
      </header>

      <section className="grid h-[calc(100dvh-116px)] grid-cols-[30%_70%]">
        <aside className="flex min-w-0 flex-col bg-[#0a0a2e] px-5 py-5 shadow-2xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="telugu text-[25px] font-black text-tdp-yellow">నేటి కార్యక్రమాలు</p>
              <p className="mt-1 text-sm font-bold uppercase tracking-[0.14em] text-white/55">Live Timeline</p>
            </div>
            <Radio className="text-red-400" size={28} />
          </div>

          {schedulesLoading && !entries.length ? (
            <div className="grid flex-1 place-items-center rounded-lg border border-white/10 bg-white/5 text-lg font-black text-white/70">Loading schedule...</div>
          ) : (
            <TVTimeline entries={entries} />
          )}

          <div className="mt-auto grid gap-2 border-t border-white/10 pt-4 text-sm font-bold text-white/60">
            <span className="inline-flex items-center gap-2"><TimerReset size={16} /> Auto refresh in {formatCountdown(refreshSeconds)}</span>
            <span>Last updated {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </aside>

        <section className="relative overflow-hidden bg-black">
          {photos.map((photo, index) => (
            <img
              key={`${photo.url}-${index}`}
              src={photo.url}
              alt={photo.caption || 'TV display photo'}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${index === activePhotoIndex ? 'opacity-100' : 'opacity-0'}`}
            />
          ))}
          {!photos.length && (
            <div className="absolute inset-0 grid place-items-center bg-slate-950 text-white/60">
              <ImageOff size={54} />
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/82 to-transparent px-7 pb-6 pt-24">
            <div className="flex items-end justify-between gap-6">
              <div className="min-w-0">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-tdp-yellow">{selectedPhotos.source === 'fallback' ? 'Home Photos' : 'Work Done Photos'}</p>
                <h2 className="telugu mt-2 line-clamp-2 text-[28px] font-black leading-tight text-white">
                  {currentEntry ? getLangField(currentEntry, 'activity', 'te') : photos[activePhotoIndex]?.caption || 'TDP Narasaraopet'}
                </h2>
                <p className="mt-2 text-[17px] font-black text-white/78">{currentEntry?.time || photos[activePhotoIndex]?.time || 'Live display'}</p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <img src="/logo-tdp.png" alt="" className="h-11 w-11 object-contain" />
                <p className="rounded-full bg-white/12 px-4 py-2 text-sm font-black text-white">Photos {activePhotoIndex + 1} of {photos.length}</p>
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              {photos.map((photo, index) => (
                <span key={`${photo.url}-dot-${index}`} className={`h-2.5 rounded-full transition-all ${index === activePhotoIndex ? 'w-9 bg-tdp-yellow' : 'w-2.5 bg-white/45'}`} />
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
};

const TVTimeline = ({ entries }) => {
  const currentIndex = getCurrentEntryIndex(entries);

  if (!entries.length) {
    return (
      <div className="grid flex-1 place-items-center rounded-lg border border-dashed border-white/15 bg-white/5 p-6 text-center text-lg font-black text-white/60">
        No schedule published for today.
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <div className="absolute bottom-0 left-[24px] top-2 w-1 rounded-full bg-white/18" />
      <div className="grid h-full content-start gap-3 overflow-hidden pr-1">
        {entries.slice(0, 8).map((entry, index) => {
          const isCurrent = index === currentIndex && entry.liveStatus !== 'upcoming';
          return (
            <article key={`${entry.time}-${index}`} className={`relative ml-12 rounded-lg border p-3 transition ${isCurrent ? 'border-tdp-yellow bg-yellow-400/12 shadow-yellow' : 'border-white/10 bg-white/5'}`}>
              <span className={`absolute -left-[46px] top-5 z-10 grid h-8 w-8 place-items-center rounded-full border-4 border-[#0a0a2e] ${entry.liveStatus === 'completed' ? 'bg-green-600 text-white' : isCurrent ? 'bg-tdp-yellow text-[#0a0a2e]' : 'bg-slate-600 text-white/80'}`}>
                {entry.liveStatus === 'completed' && <CheckCircle2 size={18} />}
                {isCurrent && <Car className="tv-car-bounce" size={19} />}
                {entry.liveStatus === 'upcoming' && <Clock3 size={17} />}
              </span>
              <span className={`absolute -left-[31px] top-0 h-full w-1 rounded-full ${entry.liveStatus === 'completed' || isCurrent ? 'bg-tdp-yellow' : 'bg-white/18'}`} />
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={`text-[22px] font-black leading-none ${entry.liveStatus === 'completed' ? 'text-green-300' : 'text-tdp-yellow'}`}>{entry.time}</p>
                  <h3 className={`telugu mt-2 line-clamp-2 font-black leading-snug ${isCurrent ? 'text-[20px] text-white' : entry.liveStatus === 'upcoming' ? 'text-[18px] text-white/62' : 'text-[18px] text-white/78'}`}>
                    {getLangField(entry, 'activity', 'te') || 'Schedule entry'}
                  </h3>
                </div>
                {isCurrent && <span className="animate-pulse rounded-full bg-red-600 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-white">Now</span>}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default TVDisplay;
