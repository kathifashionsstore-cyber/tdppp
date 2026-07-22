import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Clock3, FileText, ImageOff, Maximize2, Minimize2, Pause, Play, RefreshCw, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { useRealtimeCollection, useRealtimeDoc } from '@/hooks/useFirestore';
import {
  getEntryTvPhotos,
  getLiveEntries,
  parseTimeToMinutes,
  selectTodaySchedule
} from '@/utils/scheduleUtils';
import { getLangField, stripHtml, toDate } from '@/utils/helpers';

const PHOTO_HOLD_MS = 3_000;
const LOOP_HOLD_MS = 10_000;
const CYCLE_MOVE_MS = 2_000;
const FALLBACK_PHOTO = {
  url: '/og-image.png',
  caption: 'తెలుగుదేశం నరసరావుపేట',
  time: ''
};
const WORK_IN_PROGRESS_TEXT = 'పని జరుగుతోంది';
const DONE_TEXT = 'ఈ రోజు కార్యక్రమాలు విజయవంతంగా పూర్తయ్యాయి';
const DEFAULT_ATTENDANCE = {
  count: 0,
  target: 0,
  label: 'ఇప్పటివరకు హాజరైన వ్యక్తులు',
  show: true,
  showWidget: true,
  mlaName: 'డాక్టర్ చదలవాడ అరవింద బాబు',
  constituencyName: 'నరసరావుపేట నియోజకవర్గం',
  profileName: 'డాక్టర్ చదలవాడ అరవింద బాబు',
  mlaPhotoUrl: '/logo.webp',
  photoUrl: '/logo.webp',
  tickerMessages: [
    'ప్రజల కోసం... అభివృద్ధి కోసం... తెలుగుదేశం కోసం...',
    'వెబ్‌సైట్ తయారు చేసింది వేజెన్‌టెక్ — 9398724704',
    'డాక్టర్ చదలవాడ అరవింద బాబు — శాసనసభ్యులు, నరసరావుపేట, తెలుగుదేశం పార్టీ'
  ]
};

const TVDisplay = () => {
  const [now, setNow] = useState(() => new Date());
  const [slotIndex, setSlotIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [loopHold, setLoopHold] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(() => !!document.fullscreenElement);
  const [showControls, setShowControls] = useState(false);
  const [panelFlash, setPanelFlash] = useState(false);
  const photoIntervalRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const { data: schedules = [], isLoading: schedulesLoading } = useRealtimeCollection('dailySchedules', { publishedOnly: true, orderByField: 'date', orderDirection: 'desc' });
  const { data: heroImages = [] } = useRealtimeCollection('heroImages_home', { activeOnly: true, orderByField: 'order', orderDirection: 'asc', limitCount: 10 });
  const { data: attendanceDoc } = useRealtimeDoc('tvAttendance', 'today');

  // Clock timer
  useEffect(() => {
    const clockTimer = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(clockTimer);
  }, []);

  // Screen Wake Lock API for 24/7 TV Displays
  useEffect(() => {
    let wakeLock = null;
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch {
        // ignore fallback
      }
    };
    requestWakeLock();
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      wakeLock?.release?.();
    };
  }, []);

  // Fullscreen state listener
  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  // Auto-hiding control bar trigger
  const triggerControls = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = window.setTimeout(() => setShowControls(false), 3500);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  const attendance = useMemo(() => normalizeAttendance(attendanceDoc), [attendanceDoc]);
  const tickerMessages = attendance.tickerMessages;
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
  const activeSlotKey = activeSlot?.key || 'fallback-home';
  const currentPhotoCount = displayPhotos.length || 0;
  const playableSlotCount = playableSlots.length;
  const isFallbackPlaylist = !activeSlot;
  const isLastPlaybackSlot = !activeSlot || slotIndex >= playableSlotCount - 1;

  useEffect(() => {
    setPhotoIndex(0);
  }, [activeSlotKey]);

  useEffect(() => {
    if (!activeSlotKey) return undefined;
    setPanelFlash(true);
    const timer = window.setTimeout(() => setPanelFlash(false), 300);
    return () => window.clearTimeout(timer);
  }, [activeSlotKey]);

  // Slideshow interval
  useEffect(() => {
    if (photoIntervalRef.current) {
      window.clearInterval(photoIntervalRef.current);
      photoIntervalRef.current = null;
    }

    if (!activeSlotKey || loopHold || isPaused || !currentPhotoCount) return undefined;

    photoIntervalRef.current = window.setInterval(() => {
      setPhotoIndex((prevIndex) => {
        const totalPhotos = Math.max(currentPhotoCount, 1);
        const nextIndex = (prevIndex + 1) % totalPhotos;
        const slotFinished = totalPhotos <= 1 || nextIndex === 0;

        if (slotFinished) {
          if (isFallbackPlaylist) {
            return nextIndex;
          }
          if (isLastPlaybackSlot) {
            setLoopHold(true);
          } else {
            setSlotIndex((index) => Math.min(index + 1, playableSlotCount - 1));
          }
        }

        return nextIndex;
      });
    }, PHOTO_HOLD_MS);

    return () => {
      if (photoIntervalRef.current) {
        window.clearInterval(photoIntervalRef.current);
        photoIntervalRef.current = null;
      }
    };
  }, [activeSlotKey, currentPhotoCount, isFallbackPlaylist, isLastPlaybackSlot, isPaused, loopHold, playableSlotCount]);

  useEffect(() => {
    if (!loopHold) return undefined;
    const timer = window.setTimeout(() => {
      setSlotIndex(0);
      setPhotoIndex(0);
      setLoopHold(false);
    }, LOOP_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [loopHold]);

  // Keyboard shortcuts (F, Space, Arrows, R)
  useEffect(() => {
    const handleKey = (event) => {
      triggerControls();
      if (event.key.toLowerCase() === 'f') toggleFullscreen();
      if (event.key === ' ' || event.key.toLowerCase() === 'p') {
        event.preventDefault();
        setIsPaused((v) => !v);
      }
      if (event.key === 'ArrowRight') {
        setPhotoIndex((i) => (i + 1) % Math.max(displayPhotos.length, 1));
      }
      if (event.key === 'ArrowLeft') {
        setPhotoIndex((i) => (i - 1 + displayPhotos.length) % Math.max(displayPhotos.length, 1));
      }
      if (event.key.toLowerCase() === 'r') {
        window.location.reload();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [displayPhotos.length]);

  const playedKeys = useMemo(() => new Set(playableSlots.slice(0, slotIndex).map((slot) => slot.entryKey)), [playableSlots, slotIndex]);
  const activeEntryKey = activeSlot?.entryKey || '';
  const currentEntry = activeSlot?.entry || null;
  const scheduleDate = toDate(schedule?.date) || now;
  const clock = useMemo(() => formatClock(now), [now]);

  return (
    <main
      onMouseMove={triggerControls}
      onTouchStart={triggerControls}
      className="tv-broadcast-screen relative h-dvh w-screen overflow-hidden bg-[#08080f] text-white select-none"
    >
      <TopTicker messages={tickerMessages} />

      <BroadcastHeader
        clock={clock}
        date={scheduleDate}
        isPaused={isPaused}
        onTogglePause={() => setIsPaused((v) => !v)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onRefresh={() => window.location.reload()}
      />

      <section className="tv-broadcast-body grid min-h-0 grid-cols-[32%_68%] overflow-hidden">
        <aside className={`tv-left-panel tv-news-left-panel relative flex min-h-0 min-w-0 flex-col overflow-hidden px-5 py-4 ${panelFlash ? 'is-flashing' : ''}`}>
          <div className="tv-left-panel-watermark" aria-hidden="true" />
          <div className="relative z-10 mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="tv-panel-title telugu text-[22px] font-black">నేటి కార్యక్రమాలు</p>
              <p className="tv-live-subtitle telugu mt-1 text-[11px] font-black tracking-[0.2em]">జీవ వేళాపట్టిక</p>
            </div>
            <span className="tv-live-pill">
              <span />
              ప్రత్యక్షం
            </span>
          </div>

          <TVTimeline
            entries={timelineEntries}
            activeEntryKey={activeEntryKey}
            playedKeys={playedKeys}
            isLoading={schedulesLoading}
          />

          <AttendanceWidget attendance={attendance} />
        </aside>

        <PhotoBroadcastPanel
          activeSlot={activeSlot}
          currentEntry={currentEntry}
          displayPhotos={displayPhotos}
          activePhotoIndex={activePhotoIndex}
          setPhotoIndex={setPhotoIndex}
          loopHold={loopHold}
          isPaused={isPaused}
        />
      </section>

      <BottomTicker messages={tickerMessages} />
    </main>
  );
};

const TVControlsToolbar = ({ isPaused, onTogglePause, isFullscreen, onToggleFullscreen, onRefresh }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative z-50 ml-1 flex-shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-xl border-2 border-yellow-400/80 bg-[#0a0005]/95 px-3 py-1.5 shadow-lg backdrop-blur-md transition hover:bg-yellow-400/20 hover:scale-105 active:scale-95"
        title="టీవీ నియంత్రణలు (TV Controls)"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600" />
        </span>
        <SlidersHorizontal size={14} className="text-tdp-yellow" />
        <span className="telugu text-xs font-black text-white">నియంత్రణలు</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 flex flex-col gap-2 rounded-2xl border-2 border-yellow-400/90 bg-[#0c0006]/98 p-3.5 shadow-[0_15px_45px_rgba(0,0,0,0.95)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 min-w-[260px]">
          <div className="flex items-center justify-between border-b border-white/20 pb-2 px-1">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={15} className="text-tdp-yellow" />
              <span className="telugu text-xs font-black text-tdp-yellow">టీవీ నియంత్రణలు (TV Controls)</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="grid h-6 w-6 place-items-center rounded-lg bg-white/10 text-white/80 hover:bg-red-600 hover:text-white transition"
              aria-label="మూసివేయి"
            >
              <X size={14} />
            </button>
          </div>

          <div className="flex flex-col gap-2 mt-1">
            <button
              type="button"
              onClick={() => {
                onToggleFullscreen();
                setIsOpen(false);
              }}
              className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-black text-white transition hover:bg-yellow-400/30 hover:text-tdp-yellow text-left active:scale-95"
            >
              {isFullscreen ? <Minimize2 size={15} className="text-tdp-yellow" /> : <Maximize2 size={15} className="text-tdp-yellow" />}
              <span className="telugu">{isFullscreen ? 'చిన్నది (Exit Fullscreen)' : 'ఫుల్ స్క్రీన్ (Full Screen)'}</span>
            </button>

            <a
              href="/tv/pdf"
              target="_blank"
              rel="noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 rounded-xl bg-red-600/90 border border-yellow-400/70 px-3.5 py-2 text-xs font-black text-white transition hover:bg-red-600 hover:text-tdp-yellow shadow-md active:scale-95"
            >
              <FileText size={15} className="text-tdp-yellow" />
              <span className="telugu">PDF ప్రసారం (PDF Display)</span>
            </a>

            <button
              type="button"
              onClick={() => {
                onTogglePause();
                setIsOpen(false);
              }}
              className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-black text-white transition hover:bg-yellow-400/30 hover:text-tdp-yellow text-left active:scale-95"
            >
              {isPaused ? <Play size={15} className="text-tdp-yellow fill-tdp-yellow" /> : <Pause size={15} className="fill-white" />}
              <span className="telugu">{isPaused ? 'ప్లే (Play Slideshow)' : 'పాజ్ (Pause Slideshow)'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onRefresh();
                setIsOpen(false);
              }}
              className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-black text-white transition hover:bg-white/20 hover:text-tdp-yellow text-left active:scale-95"
            >
              <RefreshCw size={15} className="text-white/90" />
              <span className="telugu">రిఫ్రెష్ (Refresh Screen)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const TopTicker = ({ messages }) => (
  <div className="tv-top-ticker">
    <div className="tv-top-ticker-track">
      {[...messages, ...messages].map((message, index) => (
        <span key={`${message}-${index}`}>
          {message}
          <b>✦</b>
        </span>
      ))}
    </div>
  </div>
);

const BottomTicker = ({ messages }) => (
  <div className="tv-bottom-ticker">
    <div className="tv-bottom-star" aria-hidden="true">★</div>
    <div className="tv-bottom-divider" aria-hidden="true" />
    <div className="tv-bottom-ticker-window">
      <div className="tv-bottom-ticker-track">
        {[...messages, ...messages].map((message, index) => (
          <span key={`${message}-${index}`} className={/[\u0C00-\u0C7F]/.test(message) ? 'telugu' : ''}>
            {message}
            <b>✦</b>
          </span>
        ))}
      </div>
    </div>
    <div className="tv-bottom-chevrons" aria-hidden="true">
      <span>&gt;</span><span>&gt;</span><span>&gt;</span>
    </div>
  </div>
);

const BroadcastHeader = ({ clock, date, isPaused, onTogglePause, isFullscreen, onToggleFullscreen, onRefresh }) => (
  <header className="tv-broadcast-header relative grid min-h-0 grid-cols-[360px_minmax(0,1fr)_250px] items-center gap-4 overflow-hidden px-4">
    <HeaderParticles />
    <div className="relative z-10 flex items-center gap-3">
      <div className="tv-logo-frame flex-shrink-0">
        <span className="tv-logo-ring tv-logo-ring-outer" />
        <span className="tv-logo-ring tv-logo-ring-inner" />
        <img src="/logo.webp" alt="Telugu Desam Party" />
      </div>
      <div className="min-w-0 flex-shrink">
        <p className="telugu text-[16px] font-black text-tdp-yellow drop-shadow-[0_0_10px_rgba(255,215,0,.75)] leading-tight">తెలుగుదేశం పార్టీ</p>
        <p className="telugu text-[13px] font-black text-white/70 leading-tight mt-0.5">నరసరావుపేట</p>
      </div>
      <TVControlsToolbar
        isPaused={isPaused}
        onTogglePause={onTogglePause}
        isFullscreen={isFullscreen}
        onToggleFullscreen={onToggleFullscreen}
        onRefresh={onRefresh}
      />
    </div>

    <div className="relative z-10 min-w-0 text-center">
      <p className="tv-header-kicker telugu">
        డాక్టర్ చదలవాడ అరవింద బాబు — శాసనసభ్యులు, నరసరావుపేట తెలుగుదేశం
      </p>
      <h1 className="tv-header-title telugu">
        <span>గౌరవ నరసరావుపేట శాసనసభ్యులు</span>
        <strong>డాక్టర్ చదలవాడ అరవింద బాబు</strong>
      </h1>
      <p className="telugu mt-1 text-[18px] font-black text-tdp-yellow">నేటి పర్యటన వివరాలు</p>
    </div>

    <div className="relative z-10">
      <ClockBadge clock={clock} date={date} />
    </div>
  </header>
);

const HeaderParticles = () => (
  <div className="tv-header-particles" aria-hidden="true">
    {Array.from({ length: 20 }).map((_, index) => (
      <span
        key={index}
        style={{
          '--x': `${(index * 17) % 100}%`,
          '--delay': `${(index % 7) * -1.1}s`,
          '--size': `${2 + (index % 4)}px`
        }}
      />
    ))}
  </div>
);

const ClockBadge = ({ clock, date }) => {
  const minuteKey = `${clock.hours}:${clock.minutes}`;
  const dateText = date.toLocaleDateString('te-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  const hourAngle = ((clock.hours % 12) + (clock.minutes / 60)) * 30;
  const minuteAngle = clock.minutes * 6;
  const secondAngle = clock.seconds * 6;

  return (
    <section key={minuteKey} className="tv-clock-badge">
      <div className="tv-analog-clock" aria-hidden="true">
        <span className="clock-hand hour" style={{ transform: `rotate(${hourAngle}deg)` }} />
        <span className="clock-hand minute" style={{ transform: `rotate(${minuteAngle}deg)` }} />
        <span className="clock-hand second" style={{ transform: `rotate(${secondAngle}deg)` }} />
      </div>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <p className="font-mono text-[28px] font-black leading-none text-tdp-yellow">
            {clock.hh}:{clock.mm}:<span className="text-[23px]">{clock.ss}</span>
          </p>
          <span className={`tv-ampm ${clock.meridiem.toLowerCase()}`}>{clock.meridiem}</span>
        </div>
        <p className="mt-2 text-[13px] font-black uppercase tracking-[0.12em] text-white">{dateText}</p>
      </div>
    </section>
  );
};

const PhotoBroadcastPanel = ({ activeSlot, currentEntry, displayPhotos, activePhotoIndex, setPhotoIndex, loopHold }) => {
  const [photoOrientations, setPhotoOrientations] = useState({});
  const activePhoto = displayPhotos[activePhotoIndex] || null;
  const description = activeSlot?.isFallback
    ? WORK_IN_PROGRESS_TEXT
    : stripHtml(getLangField(currentEntry, 'activity', 'te') || activePhoto?.caption || 'తెలుగుదేశం నరసరావుపేట');
  const timeRange = currentEntry ? formatEntryRange(currentEntry, activeSlot?.nextEntry) : 'ప్రత్యక్ష ప్రసారం';
  const revealDuration = `${Math.max(0.9, description.length / 40).toFixed(2)}s`;
  const thumbPhotos = displayPhotos.slice(0, 4);
  const extraCount = Math.max(0, displayPhotos.length - 4);

  const handleImageLoad = (event, url) => {
    const { naturalHeight, naturalWidth } = event.currentTarget;
    if (!naturalHeight || !naturalWidth) return;
    const orientation = naturalHeight > naturalWidth ? 'portrait' : 'landscape';
    setPhotoOrientations((state) => (state[url] === orientation ? state : { ...state, [url]: orientation }));
  };

  return (
    <section className="tv-right-panel grid min-h-0 min-w-0 grid-rows-[80%_20%] overflow-hidden bg-[#05050a] p-0">
      <div className="tv-photo-stage relative min-h-0 overflow-hidden">
        {displayPhotos.map((photo, index) => {
          const isActive = index === activePhotoIndex;
          const isPortrait = photoOrientations[photo.url] === 'portrait';
          return (
            <div
              key={`${activeSlot?.key || 'fallback'}-${photo.url}-${index}`}
              className={`tv-photo-frame ${isActive ? 'is-active' : ''} ${isPortrait ? 'is-portrait' : 'is-landscape'}`}
            >
              {isPortrait && <img src={photo.url} alt="" className="tv-photo-backdrop" aria-hidden="true" />}
              <img
                src={photo.url}
                alt={photo.caption || 'టీవీ ప్రదర్శన ఫోటో'}
                onLoad={(event) => handleImageLoad(event, photo.url)}
                className={`tv-photo-image ${isPortrait ? 'object-contain' : 'object-cover'}`}
              />
            </div>
          );
        })}
        {!displayPhotos.length && (
          <div className="absolute inset-0 grid place-items-center bg-slate-950 text-white/60">
            <ImageOff size={54} />
          </div>
        )}
      </div>

      <footer className="tv-info-bar grid min-h-0 grid-cols-[55%_45%] gap-4 overflow-hidden px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="tv-live-dot" />
            <span className="tv-live-now-text telugu">ప్రత్యక్షం</span>
          </div>
          <p className="mt-2 text-[20px] font-black text-tdp-yellow drop-shadow-[0_0_10px_rgba(255,215,0,.85)]">{timeRange}</p>
          <p
            key={`${activeSlot?.key || 'fallback'}-${description}`}
            className="tv-description-reveal telugu mt-3 line-clamp-4 text-[17px] font-black leading-[1.55] text-white"
            style={{ '--typewriter-duration': revealDuration, '--typewriter-chars': Math.max(description.length, 1) }}
          >
            {loopHold ? DONE_TEXT : description}
          </p>
        </div>

        <div className="min-w-0">
          <div className="tv-thumbs-heading">
            <span />
            <p className="telugu">పని పూర్తి ఫోటోలు</p>
          </div>
          <div className="mt-4 flex items-center justify-end gap-3">
            {thumbPhotos.map((photo, index) => (
              <button
                key={`${photo.url}-thumb-${index}`}
                type="button"
                onClick={() => setPhotoIndex(index)}
                className={`tv-thumb ${index === activePhotoIndex ? 'is-active' : ''}`}
                aria-label={`ఫోటో ${index + 1}`}
              >
                <img src={photo.url} alt="" />
              </button>
            ))}
            {extraCount > 0 && <span className="tv-extra-count">+{extraCount}</span>}
          </div>
          <p className="telugu mt-3 text-right text-[15px] font-black text-white">ఫోటో {activePhotoIndex + 1} / {Math.max(displayPhotos.length, 1)}</p>
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
  const [arriving, setArriving] = useState(false);
  const activeIndex = entries.findIndex((entry) => entry.tvKey === activeEntryKey);
  const showCycle = activeIndex >= 0;

  useEffect(() => {
    const measure = () => {
      const line = lineRef.current;
      const dot = dotRefs.current[activeEntryKey];
      if (!line || !dot) return;
      const lineBox = line.getBoundingClientRect();
      const dotBox = dot.getBoundingClientRect();
      const measuredTop = dotBox.top - lineBox.top + (dotBox.height / 2);
      const maxVisibleTop = Math.max(18, lineBox.height - 38);
      setCycleTop(Math.min(maxVisibleTop, Math.max(18, measuredTop)));
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [activeEntryKey, entries.length]);

  useEffect(() => {
    if (!showCycle) return undefined;
    setMoving(true);
    setArriving(false);
    const movementTimer = window.setTimeout(() => {
      setMoving(false);
      setArriving(true);
    }, CYCLE_MOVE_MS);
    const settleTimer = window.setTimeout(() => setArriving(false), CYCLE_MOVE_MS + 700);
    return () => {
      window.clearTimeout(movementTimer);
      window.clearTimeout(settleTimer);
    };
  }, [activeEntryKey, showCycle]);

  if (isLoading && !entries.length) {
    return <div className="telugu grid flex-1 place-items-center rounded-lg border border-white/10 bg-white/5 text-lg font-black text-white/70">వేళాపట్టిక లోడ్ అవుతోంది...</div>;
  }

  if (!entries.length) {
    return (
      <div className="telugu relative z-10 grid flex-1 place-items-center rounded-lg border border-dashed border-white/15 bg-white/5 p-6 text-center text-lg font-black text-white/60">
        ఈ రోజు ప్రచురించిన వేళాపట్టిక లేదు.
      </div>
    );
  }

  return (
    <div ref={lineRef} className={`tv-timeline-shell relative z-10 flex-1 overflow-hidden ${moving ? 'is-moving' : ''} ${arriving ? 'is-arriving' : ''}`}>
      <div className="tv-timeline-road absolute bottom-0 left-[24px] top-2 w-1 rounded-full" />
      <div className="tv-timeline-completed-line absolute left-[22px] top-2 w-1 rounded-full transition-[height] duration-[2000ms]" style={{ height: showCycle ? `${cycleTop}px` : 0 }} />
      {showCycle && (
        <div className={`tv-car-marker ${moving ? 'is-moving' : 'is-stopped'} ${arriving ? 'has-arrived' : ''}`} style={{ top: `${cycleTop - 18}px` }}>
          <span className="tv-car-halo" />
          <span className="tv-headlight" />
          <span className="tv-car-beam" />
          {moving && (
            <>
              <span className="tv-speed-line line-1" />
              <span className="tv-speed-line line-2" />
              <span className="tv-speed-line line-3" />
              <span className="tv-smoke-puff puff-1" />
              <span className="tv-smoke-puff puff-2" />
            </>
          )}
          <span className="tv-car-shell">
            <AnimatedCarIcon />
          </span>
        </div>
      )}
      <div className="relative z-10 grid h-full content-start gap-2 overflow-hidden pr-1">
        {entries.map((entry, index) => {
          const state = getTimelineState(entry, activeEntryKey, playedKeys);
          const isActive = state === 'active';
          const isPlayed = state === 'played';
          const isUpcoming = state === 'upcoming';
          return (
            <article
              key={entry.tvKey}
              className={`tv-timeline-row ${state} ${isActive && arriving ? 'is-activated' : ''} relative ml-12 rounded-lg border p-3 transition`}
              style={{ '--row-index': index }}
            >
              <span ref={(node) => { dotRefs.current[entry.tvKey] = node; }} className={`tv-timeline-dot ${state} absolute -left-[45px] top-5 z-10 grid h-8 w-8 place-items-center rounded-full border-4`}>
                {isPlayed && <CheckCircle2 size={18} />}
                {isActive && (
                  <>
                    <span className="tv-dot-ring ring-1" />
                    <span className="tv-dot-ring ring-2" />
                    <span className="tv-dot-ring ring-3" />
                    <span className="h-3 w-3 rounded-full bg-[#0a0a2e]" />
                  </>
                )}
                {isUpcoming && <Clock3 size={17} />}
              </span>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={`tv-time-text ${state} flex items-center gap-1 font-black leading-none`}>
                    {isActive && <Play size={13} fill="currentColor" />}
                    {renderTimelineTime(entry.time, isActive)}
                  </p>
                  <h3 className={`tv-activity-text ${state} telugu mt-2 leading-snug ${isActive ? '' : 'line-clamp-2'}`}>
                    {getLangField(entry, 'activity', 'te') || 'Schedule entry'}
                  </h3>
                </div>
                <span className={`tv-status-badge ${state} telugu shrink-0 rounded-full px-2 py-1 text-[11px] font-black`}>
                  {isActive ? 'ప్రత్యక్షం' : isPlayed ? 'పూర్తయింది' : 'రాబోతోంది'}
                </span>
              </div>
              {isActive && (
                <span className="tv-row-particles" aria-hidden="true">
                  {Array.from({ length: 8 }).map((_, particleIndex) => (
                    <span key={particleIndex} style={{ '--particle-index': particleIndex }} />
                  ))}
                </span>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
};

const renderTimelineTime = (time, isActive) => {
  if (!isActive) return time;
  return String(time || '').split('').map((char, index) => (
    <span key={`${char}-${index}`} style={{ '--char-index': index }}>
      {char === ' ' ? '\u00a0' : char}
    </span>
  ));
};

const AttendanceWidget = ({ attendance }) => {
  const { displayCount, percentage } = useAnimatedAttendance(attendance);

  if (attendance.showWidget === false) return null;

  const photoUrl = attendance.mlaPhotoUrl || DEFAULT_ATTENDANCE.mlaPhotoUrl;
  const target = Math.max(Number(attendance.target) || 0, 0);

  return (
    <section className="tv-attendance-widget relative z-10 mt-3">
      <div className="tv-attendance-profile">
        <div className="tv-attendance-person">
          <div className="tv-mla-photo-ring">
            <img className="tv-mla-photo" src={photoUrl} alt={attendance.mlaName || DEFAULT_ATTENDANCE.mlaName} />
          </div>
          <div className="tv-attendance-copy min-w-0">
          <p className="tv-attendance-eyebrow telugu">శాసనసభ్యులు వివరాలు</p>
          <h3 className="tv-attendance-name telugu">{attendance.mlaName || DEFAULT_ATTENDANCE.mlaName}</h3>
          <p className="tv-attendance-constituency telugu">{attendance.constituencyName || DEFAULT_ATTENDANCE.constituencyName}</p>
          </div>
        </div>
        <div className="tv-attendance-stats">
          <div className="tv-attendance-count-row">
            <span className="telugu">{attendance.label || DEFAULT_ATTENDANCE.label}</span>
            <strong>{displayCount} / {target}</strong>
          </div>
          <div className="tv-attendance-progress">
            <div className="tv-attendance-fill h-full rounded-full" style={{ width: `${percentage}%` }} />
          </div>
          <div className="tv-attendance-stars" aria-hidden="true">
            {Array.from({ length: 5 }).map((_, index) => <span key={index}>★</span>)}
          </div>
        </div>
      </div>
    </section>
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

const useAnimatedAttendance = (attendance) => {
  const [displayCount, setDisplayCount] = useState(attendance.count);
  const previousCountRef = useRef(attendance.count);
  const target = Math.max(Number(attendance.target) || 0, 0);
  const percentage = target > 0 ? Math.min(100, Math.max(0, (attendance.count / target) * 100)) : 0;

  useEffect(() => {
    const from = previousCountRef.current;
    const to = attendance.count;
    previousCountRef.current = to;
    if (from === to) {
      setDisplayCount(to);
      return undefined;
    }

    const start = performance.now();
    let frame = 0;
    const animate = (time) => {
      const progress = Math.min(1, (time - start) / 1_000);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayCount(Math.round(from + (to - from) * eased));
      if (progress < 1) frame = window.requestAnimationFrame(animate);
    };
    frame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frame);
  }, [attendance.count]);

  return { displayCount, percentage };
};

const buildBroadcastState = (schedule, now, fallbackPhotos) => {
  if (!schedule) return { timelineEntries: [], playableSlots: [], hasCurrentSlot: false };

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

  return { timelineEntries: entries, playableSlots, hasCurrentSlot: Boolean(currentEntry) };
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
  if (['completed', 'complete', 'done', 'played'].includes(value)) return 'completed';
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
  return end && end !== start ? `${start} - ${end}` : start || 'ప్రత్యక్ష ప్రసారం';
};

const formatClock = (date) => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const meridiem = hours < 12 ? 'AM' : 'PM';
  hours = hours % 12 || 12;
  return {
    hours,
    minutes,
    seconds,
    hh: String(hours).padStart(2, '0'),
    mm: String(minutes).padStart(2, '0'),
    ss: String(seconds).padStart(2, '0'),
    meridiem
  };
};

const normalizeAttendance = (doc = {}) => {
  const count = Number(doc?.currentCount ?? doc?.count ?? DEFAULT_ATTENDANCE.count);
  const target = Number(doc?.totalTarget ?? doc?.target ?? DEFAULT_ATTENDANCE.target);
  const tickerMessages = normalizeTickerMessages(doc?.tickerMessages || doc?.tickers || doc?.messages);
  const showWidget = doc?.showWidget ?? doc?.show ?? doc?.isVisible ?? DEFAULT_ATTENDANCE.showWidget;
  const mlaName = doc?.mlaName || doc?.profileName || DEFAULT_ATTENDANCE.mlaName;
  const constituencyName = doc?.constituencyName || DEFAULT_ATTENDANCE.constituencyName;
  const mlaPhotoUrl = doc?.mlaPhotoUrl || doc?.photoUrl || DEFAULT_ATTENDANCE.mlaPhotoUrl;
  return {
    ...DEFAULT_ATTENDANCE,
    ...doc,
    count: Number.isFinite(count) ? Math.max(0, Math.round(count)) : DEFAULT_ATTENDANCE.count,
    target: Number.isFinite(target) ? Math.max(0, Math.round(target)) : DEFAULT_ATTENDANCE.target,
    label: doc?.label || doc?.label_te || DEFAULT_ATTENDANCE.label,
    show: showWidget,
    showWidget,
    mlaName,
    constituencyName,
    profileName: mlaName,
    mlaPhotoUrl,
    photoUrl: mlaPhotoUrl,
    tickerMessages
  };
};

const normalizeTickerMessages = (messages) => {
  const normalized = Array.isArray(messages)
    ? messages.map((message) => translateKnownTicker(String(message || '').trim())).filter(Boolean).slice(0, 3)
    : [];
  return normalized.length ? normalized : DEFAULT_ATTENDANCE.tickerMessages;
};

const translateKnownTicker = (message) => {
  const lower = message.toLowerCase();
  if (lower.includes('website made by wayzentech')) return 'వెబ్‌సైట్ తయారు చేసింది వేజెన్‌టెక్ — 9398724704';
  if (lower.includes('chadalavada aravinda babu')) return 'డాక్టర్ చదలవాడ అరవింద బాబు — శాసనసభ్యులు, నరసరావుపేట, తెలుగుదేశం పార్టీ';
  if (lower.includes('for the people') || lower.includes('telugu desam')) return 'ప్రజల కోసం... అభివృద్ధి కోసం... తెలుగుదేశం కోసం...';
  return message;
};

const getTimelineState = (entry, activeEntryKey, playedKeys) => {
  if (entry.tvKey === activeEntryKey) return 'active';
  if (playedKeys.has(entry.tvKey) || entry.broadcastStatus === 'completed') return 'played';
  return 'upcoming';
};

export default TVDisplay;
