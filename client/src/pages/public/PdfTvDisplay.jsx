import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, FileText, Loader2, Maximize2, Minimize2, Pause, Play, RotateCcw, SlidersHorizontal, Tv, X } from 'lucide-react';
import { fetchCurrentPdf, getPdfFileUrl } from '@/services/pdfApi';
import { loadPdfDocument, renderPdfPageToCanvas } from '@/utils/pdfRenderer';

const POLL_MS = 5_000;

const PdfTvDisplay = () => {
  const canvasRef = useRef(null);
  const stageRef = useRef(null);
  const pdfDocRef = useRef(null);
  const [current, setCurrent] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(() => !!document.fullscreenElement);
  const [showControls, setShowControls] = useState(false);
  const [error, setError] = useState('');
  const [pollTick, setPollTick] = useState(0);
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const controlsContainerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  const settings = {
    autoChangeSeconds: Math.max(1, Number(current?.autoChangeSeconds) || 8),
    loop: current?.loop !== false,
    showPageNumber: current?.showPageNumber !== false
  };

  // Screen Wake Lock API for 24/7 PDF TV Displays
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

  // Fullscreen listener
  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  const triggerControls = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = window.setTimeout(() => setShowControls(false), 3500);
  };

  const loadCurrent = useCallback(async () => {
    try {
      const response = await fetchCurrentPdf();
      setError('');
      setCurrent((existing) => {
        const next = response.current || null;
        const oldKey = `${existing?.pdf?.id || ''}:${existing?.updatedAt || ''}`;
        const nextKey = `${next?.pdf?.id || ''}:${next?.updatedAt || ''}`;
        if (oldKey !== nextKey) {
          setPageNumber(1);
          setIsSwitching(true);
        }
        return next;
      });
    } catch {
      setError('సాంకేతిక అనుసంధానం కోల్పోయింది. తిరిగి ప్రయత్నిస్తోంది...');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCurrent();
    const timer = window.setInterval(() => setPollTick((value) => value + 1), POLL_MS);
    return () => window.clearInterval(timer);
  }, [loadCurrent]);

  useEffect(() => {
    if (pollTick) loadCurrent();
  }, [loadCurrent, pollTick]);

  useEffect(() => {
    let cancelled = false;
    const loadPdf = async () => {
      if (!current?.pdf) {
        setPageCount(0);
        pdfDocRef.current?.destroy?.();
        pdfDocRef.current = null;
        return;
      }
      setIsLoading(true);
      try {
        const pdf = await loadPdfDocument({ url: getPdfFileUrl(current.pdf) });
        if (cancelled) {
          await pdf.destroy();
          return;
        }
        await pdfDocRef.current?.destroy?.();
        pdfDocRef.current = pdf;
        setPageCount(pdf.numPages);
        setPageNumber(1);
      } catch {
        if (!cancelled) setError('ఎంచుకున్న PDF ఫైల్ ప్రదర్శించుటలో సమస్య.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    loadPdf();
    return () => {
      cancelled = true;
    };
  }, [current?.pdf?.id]);

  const renderPage = useCallback(async () => {
    const pdf = pdfDocRef.current;
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!pdf || !canvas || !stage || !pageNumber) return;
    setIsSwitching(true);
    try {
      await renderPdfPageToCanvas({ pdf, pageNumber, canvas, container: stage });
    } catch {
      setError('పత్రం పేజీ లోడ్ కాలేదు.');
    } finally {
      window.setTimeout(() => setIsSwitching(false), 160);
    }
  }, [pageNumber]);

  useEffect(() => {
    renderPage();
    window.addEventListener('resize', renderPage);
    return () => window.removeEventListener('resize', renderPage);
  }, [renderPage]);

  useEffect(() => {
    if (isPaused || !pageCount || !settings.autoChangeSeconds) return undefined;
    const timer = window.setInterval(() => {
      setPageNumber((value) => {
        if (value < pageCount) return value + 1;
        return settings.loop ? 1 : value;
      });
    }, settings.autoChangeSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [isPaused, pageCount, settings.autoChangeSeconds, settings.loop]);

  const goPrevious = useCallback(() => {
    setPageNumber((value) => (value <= 1 ? (settings.loop ? pageCount || 1 : 1) : value - 1));
  }, [pageCount, settings.loop]);

  const goNext = useCallback(() => {
    setPageNumber((value) => (value >= pageCount ? (settings.loop ? 1 : value) : value + 1));
  }, [pageCount, settings.loop]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleKey = (event) => {
      triggerControls();
      if (event.key === 'ArrowLeft') goPrevious();
      if (event.key === 'ArrowRight') goNext();
      if (event.key.toLowerCase() === 'f') toggleFullscreen();
      if (event.key === ' ') {
        event.preventDefault();
        setIsPaused((value) => !value);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goNext, goPrevious, toggleFullscreen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (controlsContainerRef.current && !controlsContainerRef.current.contains(event.target)) {
        setIsControlsOpen(false);
      }
    };
    if (isControlsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isControlsOpen]);

  return (
    <main
      onMouseMove={triggerControls}
      onTouchStart={triggerControls}
      className="group relative grid h-dvh w-screen overflow-hidden bg-[#05050a] text-white select-none"
    >
      {/* Dynamic PDF Broadcast Header */}
      <header className="absolute top-0 inset-x-0 z-30 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="h-10 w-10 rounded-full border border-yellow-500/40 bg-white/90 p-1 shadow-[0_0_15px_rgba(255,215,0,0.4)] flex-shrink-0">
            <img src="/logo.webp" alt="TDP Logo" className="h-full w-full object-contain" />
          </div>
          <div className="flex-shrink">
            <h1 className="telugu text-base font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] leading-tight">
              {current?.pdf?.title || 'తెలుగుదేశం పత్ర ప్రసారం'}
            </h1>
            <p className="telugu text-xs font-bold text-tdp-yellow/90 leading-tight">
              నరసరావుపేట డిజిటల్ టీవీ ప్రదర్శన
            </p>
          </div>

          {/* Controls Button embedded in header after logo & title */}
          <div ref={controlsContainerRef} className="relative z-50 ml-2 flex-shrink-0">
            {!isControlsOpen ? (
              <button
                type="button"
                onClick={() => setIsControlsOpen(true)}
                className="flex items-center gap-2 rounded-xl border-2 border-yellow-400/80 bg-[#0a0005]/95 px-3 py-1.5 shadow-lg backdrop-blur-md transition hover:bg-yellow-400/20 hover:scale-105 active:scale-95"
                title="పత్ర నియంత్రణలు"
              >
                <SlidersHorizontal size={14} className="text-tdp-yellow" />
                <span className="telugu text-xs font-black text-white">నియంత్రణలు</span>
              </button>
            ) : (
              <div className="absolute top-full left-0 mt-2 z-50 flex flex-col gap-2 rounded-2xl border-2 border-yellow-400/90 bg-[#0c0006]/98 p-3.5 shadow-[0_15px_45px_rgba(0,0,0,0.95)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200 min-w-[270px]">
                <div className="flex items-center justify-between border-b border-white/20 pb-2 px-1">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={15} className="text-tdp-yellow" />
                    <span className="telugu text-xs font-black text-tdp-yellow">పత్ర నియంత్రణలు (PDF Controls)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsControlsOpen(false)}
                    className="grid h-6 w-6 place-items-center rounded-lg bg-white/10 text-white/80 hover:bg-red-600 hover:text-white transition"
                    aria-label="మూసివేయి"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex items-center justify-between gap-2 rounded-xl bg-white/10 px-3 py-1.5">
                    <button
                      type="button"
                      onClick={goPrevious}
                      className="flex items-center gap-1 text-xs font-black text-white hover:text-tdp-yellow transition"
                      title="Left Arrow Key"
                    >
                      <ChevronLeft size={16} />
                      <span className="telugu">మునుపటి</span>
                    </button>
                    <span className="text-xs font-mono font-black text-tdp-yellow">{pageNumber} / {pageCount}</span>
                    <button
                      type="button"
                      onClick={goNext}
                      className="flex items-center gap-1 text-xs font-black text-white hover:text-tdp-yellow transition"
                      title="Right Arrow Key"
                    >
                      <span className="telugu">తరువాతి</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPaused((v) => !v);
                      setIsControlsOpen(false);
                    }}
                    className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-black text-white transition hover:bg-yellow-400/30 hover:text-tdp-yellow active:scale-95 text-left"
                  >
                    {isPaused ? <Play size={15} className="text-tdp-yellow fill-tdp-yellow" /> : <Pause size={15} className="fill-white" />}
                    <span className="telugu">{isPaused ? 'ప్లే (Play Document)' : 'పాజ్ (Pause Document)'}</span>
                  </button>

                  <a
                    href="/tv"
                    onClick={() => setIsControlsOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl bg-red-600/90 border border-yellow-400/70 px-3.5 py-2 text-xs font-black text-white transition hover:bg-red-600 hover:text-tdp-yellow active:scale-95 shadow-md"
                  >
                    <Tv size={15} className="text-tdp-yellow" />
                    <span className="telugu">షెడ్యూల్ ప్రసారం (Live TV)</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      toggleFullscreen();
                      setIsControlsOpen(false);
                    }}
                    className="flex items-center gap-2.5 rounded-xl bg-white/10 px-3.5 py-2 text-xs font-black text-white transition hover:bg-white/20 hover:text-tdp-yellow active:scale-95 text-left"
                  >
                    {isFullscreen ? <Minimize2 size={15} className="text-tdp-yellow" /> : <Maximize2 size={15} className="text-tdp-yellow" />}
                    <span className="telugu">{isFullscreen ? 'చిన్నది (Exit Fullscreen)' : 'ఫుల్ స్క్రీన్ (Full Screen)'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {current?.pdf && settings.showPageNumber && (
          <div className="flex items-center gap-3 rounded-2xl border border-white/15 bg-black/60 px-4 py-2 text-sm font-black text-white/90 backdrop-blur-md pointer-events-auto">
            <FileText size={15} className="text-tdp-yellow" />
            <span>పేజీ {pageNumber} / {pageCount || current.pdf.pages || 1}</span>
          </div>
        )}
      </header>

      {/* Main Canvas Presentation Stage */}
      <section ref={stageRef} className="relative grid h-full w-full place-items-center overflow-hidden bg-[#05050a]">
        {!current?.pdf && !isLoading && (
          <div className="grid place-items-center gap-3 text-center text-white/60">
            <RotateCcw size={40} className="animate-spin text-tdp-yellow" style={{ animationDuration: '8s' }} />
            <p className="telugu text-xl font-black">టీవీ పత్ర ఎంపిక కోసం వేచి చూస్తోంది...</p>
            <p className="telugu text-xs font-semibold text-white/40">అడ్మిన్ ప్యానెల్ లో PDF డిస్ప్లే ఎంచుకోండి</p>
          </div>
        )}

        <canvas
          ref={canvasRef}
          className={`block max-h-full max-w-full bg-white shadow-[0_0_80px_rgba(255,215,0,.15)] transition-opacity duration-300 ${isSwitching ? 'opacity-0' : 'opacity-100'}`}
        />

        {(isLoading || isSwitching) && (
          <div className="absolute inset-0 grid place-items-center bg-black/65 backdrop-blur-sm z-20">
            <div className="grid justify-items-center gap-3 rounded-2xl border border-yellow-500/30 bg-[#080812]/90 px-8 py-6 shadow-2xl">
              <Loader2 size={38} className="animate-spin text-tdp-yellow" />
              <p className="telugu text-sm font-black uppercase tracking-wider text-white/85">పత్రం లోడ్ అవుతోంది...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute left-6 bottom-6 z-30 rounded-2xl border border-red-500/40 bg-red-950/90 px-5 py-3 text-sm font-black text-white shadow-xl backdrop-blur-md">
            {error}
          </div>
        )}
      </section>
    </main>
  );
};

export default PdfTvDisplay;
