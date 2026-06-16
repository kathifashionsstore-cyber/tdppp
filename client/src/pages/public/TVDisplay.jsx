import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock3, ImageOff, Radio, TimerReset } from 'lucide-react';
import AnnouncementBar from '@/components/ui/AnnouncementBar';
import { useCollection } from '@/hooks/useFirestore';
import {
  formatCountdown,
  getEntryTvPhotos,
  getLiveEntries,
  parseTimeToMinutes,
  selectTodaySchedule
} from '@/utils/scheduleUtils';
import { getLangField, stripHtml, toDate } from '@/utils/helpers';

const REFRESH_SECONDS = 600;
const PHOTO_HOLD_MS = 3_000;
const LOOP_HOLD_MS = 10_000;
const CYCLE_MOVE_MS = 1_500;
const FALLBACK_PHOTO = {
  url: '/og-image.png',
  caption: 'TDP Narasaraopet',
  time: ''
};
const DEFAULT_HEADER_TITLE = 'నరసరావుపేట శాసనసభ్యులు డాక్టర్ చదలవాడ అరవింద బాబు';
const DEFAULT_HEADER_SUBTITLE = 'నేటి పర్యటన వివరాలు';
const WORK_IN_PROGRESS_TEXT = 'పని కొనసాగుతోంది...';

const TVDisplay = () => {
  const [now, setNow] = useState(() => new Date());
  const [refreshSeconds, setRefreshSeconds] = useState(REFRESH_SECONDS);
  const [slotIndex, setSlotIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [loopHold, setLoopHold] = useState(false);
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

  const broadcast = useMemo(() => buildBroadcastState(schedule, now, fallbackPhotos), [fallbackPhotos, now, schedule]);
  const { timelineEntries, playableSlots } = broadcast;
  const playlistKey = playableSlots.map((slot) => `${slot.key}:${slot.photos.map((photo) => photo.url).join('|')}`).join('::');

  useEffect(() => {
    setSlotIndex(0);
    setPhotoIndex(0);
    setLoopHold(false);
  }, [playlistKey]);

  const activeSlot = playableSlots[slotIndex] || null;
  const displayPhotos = activeSlot?.photos?.length ? activeSlot.photos : fallbackPhotos;
  const activePhotoIndex = displayPhotos.length ? photoIndex % displayPhotos.length : 0;

  useEffect(() => {
    if (!playableSlots.length || loopHold) return undefined;
    const slot = playableSlots[slotIndex];
    if (!slot) return undefined;
    const photos = slot.photos.length ? slot.photos : fallbackPhotos;
    const atLastPhoto = photoIndex >= photos.length - 1;
    const atLastSlot = slotIndex >= playableSlots.length - 1 || slot.kind === 'current';
    const timer = window.setTimeout(() => {
      if (!atLastPhoto) {
        setPhotoIndex((index) => index + 1);
        return;
      }
      if (!atLastSlot) {
        setSlotIndex((index) => Math.min(index + 1, playableSlots.length - 1));
        setPhotoIndex(0);
        return;
      }
      setLoopHold(true);
    }, PHOTO_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [fallbackPhotos, loopHold, photoIndex, playableSlots, slotIndex]);

  useEffect(() => {
    if (!loopHold) return undefined;
    const timer = window.setTimeout(() => {
      setSlotIndex(0);
      setPhotoIndex(0);
      setLoopHold(false);
    }, LOOP_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [loopHold]);

  const playedKeys = useMemo(() => new Set(playableSlots.slice(0, slotIndex).map((slot) => slot.entryKey)), [playableSlots, slotIndex]);
  const activeEntryKey = activeSlot?.entryKey || '';
  const currentEntry = activeSlot?.entry || null;
  const scheduleDate = toDate(schedule?.date) || now;
  const currentTime = now.toLocaleTimeString('en-IN', { hour12: false });
  const headerTitle = getLangField(schedule, 'title', 'te') || DEFAULT_HEADER_TITLE;

  return (
    <main className="h-dvh w-screen overflow-hidden bg-[#050517] text-white">
      <AnnouncementBar fixed={false} tv />

      <header className="grid h-[136px] grid-cols-[120px_minmax(0,1fr)_190px] items-center gap-5 bg-gradient-to-r from-[#ffd700] via-[#f5a623] to-[#ffd700] px-7 text-[#111827] shadow-2xl">
        <div className="grid h-[104px] w-[104px] place-items-center rounded-full bg-white/88 p-2 shadow-[0_0_28px_rgba(255,255,255,0.65)] ring-4 ring-white/45">
          <img src="/logo.webp" alt="TDP Narasaraopet" className="h-[90px] w-auto object-contain" />
        </div>
        <div className="min-w-0 text-center">
          <h1 className="telugu truncate text-[32px] font-black leading-tight">{headerTitle}</h1>
          <p className="telugu mt-1 text-[25px] font-black leading-tight text-[#5a1b00]">{DEFAULT_HEADER_SUBTITLE}</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-[19px] font-black">
            <span className="inline-flex items-center gap-2"><CalendarDays size={21} /> {scheduleDate.toLocaleDateString('te-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
            <span>{scheduleDate.toLocaleDateString('te-IN', { weekday: 'long' })}</span>
            <span className="inline-flex items-center gap-2 rounded-full bg-red-600 px-3 py-1 text-sm uppercase tracking-[0.12em] text-white"><span className="h-2 w-2 animate-pulse rounded-full bg-white" /> Live</span>
          </div>
        </div>
        <div className="justify-self-end rounded-lg bg-black/85 px-4 py-3 font-mono text-[24px] font-black text-tdp-yellow shadow-lg">{currentTime}</div>
      </header>

      <section className="grid h-[calc(100dvh-180px)] min-h-0 grid-cols-[30%_70%] grid-rows-[minmax(0,1fr)] overflow-hidden">
        <aside className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-[#0a0a2e] px-5 py-5 shadow-2xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="telugu text-[25px] font-black text-tdp-yellow">నేటి కార్యక్రమాలు</p>
              <p className="mt-1 text-sm font-bold uppercase tracking-[0.14em] text-white/55">Live Timeline</p>
            </div>
            <Radio className="text-red-400" size={28} />
          </div>

          <TVTimeline
            entries={timelineEntries}
            activeEntryKey={activeEntryKey}
            playedKeys={playedKeys}
            isLoading={schedulesLoading}
          />

          <div className="mt-auto grid gap-2 border-t border-white/10 pt-4 text-sm font-bold text-white/60">
            <span className="inline-flex items-center gap-2"><TimerReset size={16} /> Auto refresh in {formatCountdown(refreshSeconds)}</span>
            <span>Last updated {now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </div>
        </aside>

        <PhotoBroadcastPanel
          activeSlot={activeSlot}
          currentEntry={currentEntry}
          displayPhotos={displayPhotos}
          activePhotoIndex={activePhotoIndex}
          loopHold={loopHold}
        />
      </section>
    </main>
  );
};

const PhotoBroadcastPanel = ({ activeSlot, currentEntry, displayPhotos, activePhotoIndex, loopHold }) => {
  const activePhoto = displayPhotos[activePhotoIndex] || null;
  const description = activeSlot?.isFallback
    ? WORK_IN_PROGRESS_TEXT
    : stripHtml(getLangField(currentEntry, 'activity', 'te') || activePhoto?.caption || 'TDP Narasaraopet');
  const timeRange = currentEntry ? formatEntryRange(currentEntry, activeSlot?.nextEntry) : 'Live display';
  const sourceLabel = activeSlot?.kind === 'current' ? 'NOW' : activeSlot ? 'Work Done Photos' : 'Home Photos';

  return (
    <section className="grid h-full min-h-0 min-w-0 grid-rows-[minmax(0,1fr)_190px] overflow-hidden bg-black">
      <div className="relative min-h-0 overflow-hidden">
        {displayPhotos.map((photo, index) => (
          <img
            key={`${activeSlot?.key || 'fallback'}-${photo.url}-${index}`}
            src={photo.url}
            alt={photo.caption || 'TV display photo'}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[600ms] ${index === activePhotoIndex ? 'opacity-100' : 'opacity-0'}`}
          />
        ))}
        {!displayPhotos.length && (
          <div className="absolute inset-0 grid place-items-center bg-slate-950 text-white/60">
            <ImageOff size={54} />
          </div>
        )}
      </div>

      <footer className="grid h-[190px] grid-cols-[minmax(0,1fr)_220px] gap-6 border-t border-yellow-300/25 bg-[#061329] px-8 py-5">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <p className="font-mono text-[18px] font-black uppercase tracking-[0.12em] text-tdp-yellow">{timeRange}</p>
            <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${activeSlot?.kind === 'current' ? 'animate-pulse bg-red-600 text-white' : 'bg-white/10 text-white/72'}`}>
              {loopHold ? 'Loop restart soon' : sourceLabel}
            </span>
          </div>
          <p key={`${activeSlot?.key || 'fallback'}-${description}`} className="tv-description-reveal telugu mt-4 line-clamp-3 min-h-[92px] text-[25px] font-black leading-[1.45] text-white">
            {description}
          </p>
        </div>
        <div className="flex flex-col items-end justify-end gap-4">
          <img src="/logo.webp" alt="" className="h-14 w-auto rounded-full bg-white object-contain p-1 shadow-yellow" />
          <p className="rounded-full bg-white/12 px-4 py-2 text-sm font-black text-white">Photos {activePhotoIndex + 1} of {Math.max(displayPhotos.length, 1)}</p>
          <div className="flex max-w-[210px] flex-wrap justify-end gap-2">
            {displayPhotos.map((photo, index) => (
              <span key={`${photo.url}-dot-${index}`} className={`h-2.5 rounded-full transition-all ${index === activePhotoIndex ? 'w-9 bg-tdp-yellow' : 'w-2.5 bg-white/45'}`} />
            ))}
          </div>
        </div>
      </footer>
    </section>
  );
};

const TVTimeline = ({ entries, activeEntryKey, playedKeys, isLoading }) => {
  const lineRef = useRef(null);
  const dotRefs = useRef({});
  const [cycleTop, setCycleTop] = useState(18);
  const [moving, setMoving] = useState(false);
  const activeIndex = entries.findIndex((entry) => entry.tvKey === activeEntryKey);
  const showCycle = activeIndex >= 0;

  useEffect(() => {
    const measure = () => {
      const line = lineRef.current;
      const dot = dotRefs.current[activeEntryKey];
      if (!line || !dot) return;
      const lineBox = line.getBoundingClientRect();
      const dotBox = dot.getBoundingClientRect();
      setCycleTop(Math.max(18, dotBox.top - lineBox.top + (dotBox.height / 2)));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [activeEntryKey, entries.length]);

  useEffect(() => {
    if (!showCycle) return undefined;
    setMoving(true);
    const timer = window.setTimeout(() => setMoving(false), CYCLE_MOVE_MS);
    return () => window.clearTimeout(timer);
  }, [activeEntryKey, showCycle]);

  if (isLoading && !entries.length) {
    return <div className="grid flex-1 place-items-center rounded-lg border border-white/10 bg-white/5 text-lg font-black text-white/70">Loading schedule...</div>;
  }

  if (!entries.length) {
    return (
      <div className="grid flex-1 place-items-center rounded-lg border border-dashed border-white/15 bg-white/5 p-6 text-center text-lg font-black text-white/60">
        No schedule published for today.
      </div>
    );
  }

  return (
    <div ref={lineRef} className="relative flex-1 overflow-hidden">
      <div className="absolute bottom-0 left-[24px] top-2 w-1 rounded-full border-l-4 border-dashed border-white/20" />
      <div className="absolute left-[22px] top-2 w-1 rounded-full bg-tdp-yellow transition-[height] duration-[1500ms] ease-in-out" style={{ height: showCycle ? `${cycleTop}px` : 0 }} />
      {showCycle && (
        <div className={`tv-car-marker ${moving ? 'is-moving' : 'is-stopped'}`} style={{ top: `${cycleTop - 18}px` }}>
          {moving && <span className="tv-car-trail" />}
          <AnimatedCarIcon />
        </div>
      )}
      <div className="relative z-10 grid h-full content-start gap-2 overflow-hidden pr-1">
        {entries.map((entry, index) => {
          const state = getTimelineState(entry, activeEntryKey, playedKeys);
          const isActive = state === 'active';
          const isPlayed = state === 'played';
          const isUpcoming = state === 'upcoming';
          return (
            <article key={entry.tvKey} className={`relative ml-12 rounded-lg border p-3 transition ${isActive ? 'scale-[1.01] border-tdp-yellow bg-yellow-400/14 shadow-yellow' : 'border-white/10 bg-white/5'}`}>
              <span ref={(node) => { dotRefs.current[entry.tvKey] = node; }} className={`absolute -left-[45px] top-5 z-10 grid h-8 w-8 place-items-center rounded-full border-4 border-[#0a0a2e] ${isPlayed ? 'bg-green-600 text-white' : isActive ? 'bg-tdp-yellow text-[#0a0a2e]' : 'bg-slate-600 text-white/80'}`}>
                {isPlayed && <CheckCircle2 size={18} />}
                {isActive && <span className="h-3 w-3 rounded-full bg-[#0a0a2e]" />}
                {isUpcoming && <Clock3 size={17} />}
              </span>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={`text-[22px] font-black leading-none ${isPlayed ? 'text-green-300' : isActive ? 'text-tdp-yellow' : 'text-white/58'}`}>{entry.time}</p>
                  <h3 className={`telugu mt-2 line-clamp-2 font-black leading-snug ${isActive ? 'text-[20px] text-white' : 'text-[18px] text-white/68'}`}>
                    {getLangField(entry, 'activity', 'te') || 'Schedule entry'}
                  </h3>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.06em] ${isActive ? 'animate-pulse bg-red-600 text-white' : isPlayed ? 'bg-green-500/15 text-green-200' : 'bg-white/10 text-white/48'}`}>
                  {isActive ? (entry.broadcastStatus === 'in-progress' ? 'Now' : 'On Air') : isPlayed ? 'Played' : 'Upcoming'}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

const AnimatedCarIcon = () => (
  <svg className="h-8 w-12 overflow-visible" viewBox="0 0 96 58" fill="none" aria-hidden="true">
    <path d="M14 39h7l7-14c2-4 6-7 11-7h18c5 0 9 2 12 6l9 15h4c4 0 7 3 7 7v2c0 3-2 5-5 5H12c-3 0-5-2-5-5v-2c0-4 3-7 7-7Z" fill="#FFD700" />
    <path d="M35 24h20c4 0 7 2 9 5l5 8H26l5-9c1-2 2-4 4-4Z" fill="#0A0A2E" opacity=".88" />
    <path d="M40 24v13M60 25v12" stroke="#FFD700" strokeWidth="2" opacity=".72" />
    <path d="M13 45h73" stroke="#F5A623" strokeWidth="3" strokeLinecap="round" />
    <g className="tv-car-wheel" style={{ transformOrigin: '28px 47px' }}>
      <circle cx="28" cy="47" r="9" fill="#0A0A2E" stroke="#FFD700" strokeWidth="3" />
      <path d="M28 38v18M19 47h18M22 41l12 12M34 41 22 53" stroke="#FFD700" strokeWidth="1.2" opacity=".9" />
      <circle cx="28" cy="47" r="2.5" fill="#FFD700" />
    </g>
    <g className="tv-car-wheel" style={{ transformOrigin: '70px 47px' }}>
      <circle cx="70" cy="47" r="9" fill="#0A0A2E" stroke="#FFD700" strokeWidth="3" />
      <path d="M70 38v18M61 47h18M64 41l12 12M76 41 64 53" stroke="#FFD700" strokeWidth="1.2" opacity=".9" />
      <circle cx="70" cy="47" r="2.5" fill="#FFD700" />
    </g>
  </svg>
);

const buildBroadcastState = (schedule, now, fallbackPhotos) => {
  if (!schedule) return { timelineEntries: [], playableSlots: [] };

  const timeBasedEntries = getLiveEntries(schedule, now);
  const hasManualProgress = timeBasedEntries.some((entry) => ['completed', 'in-progress'].includes(normalizeBroadcastStatus(entry.status)));
  const entries = timeBasedEntries
    .map((entry, index, allEntries) => {
      const manualStatus = normalizeBroadcastStatus(entry.status);
      const broadcastStatus = hasManualProgress
        ? (manualStatus || 'upcoming')
        : (manualStatus && manualStatus !== 'upcoming' ? manualStatus : entry.liveStatus);
      const photos = getEntryTvPhotos(entry).sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99));
      return {
        ...entry,
        broadcastStatus,
        tvPhotosNormalized: photos,
        tvKey: entry.id || `${entry.time || index}-${index}`,
        nextEntry: allEntries[index + 1] || null
      };
    })
    .sort((a, b) => compareEntries(a, b));

  const completedSlots = entries
    .filter((entry) => entry.broadcastStatus === 'completed' && entry.tvPhotosNormalized.length)
    .map((entry) => createPlaybackSlot(entry, 'completed', fallbackPhotos));
  const currentEntry = entries.find((entry) => entry.broadcastStatus === 'in-progress') || null;
  const currentSlot = currentEntry ? [createPlaybackSlot(currentEntry, 'current', fallbackPhotos)] : [];
  const playableSlots = [...completedSlots, ...currentSlot];

  return { timelineEntries: entries, playableSlots };
};

const createPlaybackSlot = (entry, kind, fallbackPhotos) => {
  const useFallback = kind === 'current' && !entry.tvPhotosNormalized.length;
  return {
    key: `${entry.tvKey}-${kind}`,
    entryKey: entry.tvKey,
    entry,
    nextEntry: entry.nextEntry,
    kind,
    isFallback: useFallback,
    photos: useFallback ? fallbackPhotos : entry.tvPhotosNormalized
  };
};

const normalizeBroadcastStatus = (status = '') => {
  const value = String(status || '').toLowerCase().trim();
  if (['completed', 'complete', 'done'].includes(value)) return 'completed';
  if (['in-progress', 'inprogress', 'progress', 'current', 'now', 'live'].includes(value)) return 'in-progress';
  if (['upcoming', 'scheduled', 'pending'].includes(value)) return 'upcoming';
  return '';
};

const compareEntries = (left, right) => {
  const leftMinutes = parseTimeToMinutes(left.time);
  const rightMinutes = parseTimeToMinutes(right.time);
  if (leftMinutes != null && rightMinutes != null && leftMinutes !== rightMinutes) return leftMinutes - rightMinutes;
  return (Number(left.order) || 99) - (Number(right.order) || 99);
};

const formatEntryRange = (entry, nextEntry) => {
  const start = entry?.time || '';
  const end = entry?.endTime || nextEntry?.time || '';
  return end && end !== start ? `${start} - ${end}` : start || 'Live display';
};

const getTimelineState = (entry, activeEntryKey, playedKeys) => {
  if (entry.tvKey === activeEntryKey) return 'active';
  if (playedKeys.has(entry.tvKey)) return 'played';
  return 'upcoming';
};

export default TVDisplay;
