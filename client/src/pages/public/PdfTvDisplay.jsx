import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Maximize2, Pause, Play, RotateCcw } from 'lucide-react';
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
  const [error, setError] = useState('');
  const [pollTick, setPollTick] = useState(0);

  const settings = {
    autoChangeSeconds: Math.max(1, Number(current?.autoChangeSeconds) || 8),
    loop: current?.loop !== false,
    showPageNumber: current?.showPageNumber !== false
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
      setError('Connection lost. Reconnecting...');
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
        if (!cancelled) setError('Unable to load selected PDF.');
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
      setError('Unable to render PDF page.');
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

  const enterFullscreen = useCallback(() => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
  }, []);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'ArrowLeft') goPrevious();
      if (event.key === 'ArrowRight') goNext();
      if (event.key.toLowerCase() === 'f') enterFullscreen();
      if (event.key === ' ') {
        event.preventDefault();
        setIsPaused((value) => !value);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [enterFullscreen, goNext, goPrevious]);

  return (
    <main className="group grid h-dvh w-screen overflow-hidden bg-black text-white">
      <section ref={stageRef} className="relative grid h-full w-full place-items-center overflow-hidden bg-black">
        {!current?.pdf && !isLoading && (
          <div className="grid place-items-center gap-3 text-center text-white/58">
            <RotateCcw size={34} />
            <p className="text-lg font-black">Waiting for PDF selection</p>
          </div>
        )}

        <canvas ref={canvasRef} className={`block max-h-full max-w-full bg-white shadow-[0_0_60px_rgba(255,255,255,.08)] transition-opacity duration-300 ${isSwitching ? 'opacity-0' : 'opacity-100'}`} />

        {(isLoading || isSwitching) && (
          <div className="absolute inset-0 grid place-items-center bg-black/58">
            <div className="grid justify-items-center gap-3 rounded-2xl bg-black/70 px-6 py-5">
              <Loader2 size={34} className="animate-spin text-tdp-yellow" />
              <p className="text-sm font-black uppercase tracking-[0.18em] text-white/70">Loading PDF</p>
            </div>
          </div>
        )}

        {error && <div className="absolute left-4 top-4 rounded-full bg-red-600/90 px-4 py-2 text-sm font-black">{error}</div>}

        {current?.pdf && settings.showPageNumber && (
          <div className="absolute right-5 top-5 rounded-full bg-black/70 px-4 py-2 font-mono text-sm font-black text-white/85">
            {pageNumber} / {pageCount || current.pdf.pages || 1}
          </div>
        )}

        {current?.pdf && (
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-2xl bg-black/55 p-2 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
            <button type="button" onClick={goPrevious} className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20" aria-label="Previous page"><ChevronLeft size={22} /></button>
            <button type="button" onClick={() => setIsPaused((value) => !value)} className="grid h-11 w-11 place-items-center rounded-xl bg-tdp-yellow text-black" aria-label={isPaused ? 'Resume' : 'Pause'}>{isPaused ? <Play size={20} /> : <Pause size={20} />}</button>
            <button type="button" onClick={goNext} className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20" aria-label="Next page"><ChevronRight size={22} /></button>
            <button type="button" onClick={enterFullscreen} className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 text-white hover:bg-white/20" aria-label="Fullscreen"><Maximize2 size={20} /></button>
          </div>
        )}
      </section>
    </main>
  );
};

export default PdfTvDisplay;
