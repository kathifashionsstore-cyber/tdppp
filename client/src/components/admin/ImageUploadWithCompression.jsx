import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, ImagePlus, Loader2, RefreshCw, Trash2, UploadCloud, X } from 'lucide-react';
import { compressImageFile, formatFileSize, uploadCompressedImage } from '@/services/imgbbService';
import useResolvedImage from '@/hooks/useResolvedImage';

const defaultAccept = 'image/jpeg,image/png,image/webp';

const getUploadStageText = (stage) => {
  if (stage === 'compressing') return 'Compressing image...';
  if (stage === 'uploading') return 'Uploading to server...';
  if (stage === 'done') return 'Upload complete';
  if (stage === 'error') return 'Upload failed';
  return 'Preparing image...';
};

const ImageUploadWithCompression = ({
  label = 'Image Upload',
  value = [],
  onChange,
  onUpload,
  onUploadComplete,
  onUploadStateChange,
  multiple = false,
  aspectRatio = '16/9',
  maxSizeKB = 300,
  accept = defaultAccept,
  storageFolder = 'uploads/images'
}) => {
  const inputRef = useRef(null);
  const previewUrlsRef = useRef([]);
  const activeUploadRef = useRef(null);
  const statusResetTimeoutRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState([]);
  const [uploadError, setUploadError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');
  const urls = Array.isArray(value) ? value : value ? [value] : [];

  useEffect(() => {
    onUploadStateChange?.(busy);
  }, [busy, onUploadStateChange]);

  useEffect(() => () => {
    activeUploadRef.current?.controller?.abort();
    activeUploadRef.current = null;
    clearTimeout(statusResetTimeoutRef.current);
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const setOverallProgress = (stage, progress) => {
    setUploadStage(stage);
    setUploadProgress(Math.min(100, Math.max(0, Math.round(progress))));
  };

  const cancelUpload = () => {
    const activeUpload = activeUploadRef.current;
    if (!activeUpload) return;
    activeUpload.controller.abort();
    toast.dismiss(activeUpload.toastId);
    activeUploadRef.current = null;
    setBusy(false);
    setUploadStage('');
    setUploadProgress(0);
    setUploadError('');
    setItems((state) => state.map((item) => (
      item.status === 'compressing' || item.status === 'uploading'
        ? { ...item, status: 'error', error: 'Canceled', progress: 0 }
        : item
    )));
    if (inputRef.current) inputRef.current.value = '';
  };

  const processFiles = async (files) => {
    const selected = Array.from(files || []);
    if (!selected.length || busy) return;
    clearTimeout(statusResetTimeoutRef.current);
    const controller = new AbortController();
    const operation = { id: `${Date.now()}-${Math.random()}`, controller, toastId: null, hardTimedOut: false };
    activeUploadRef.current = operation;
    const isCurrentOperation = () => activeUploadRef.current?.id === operation.id;
    const hardTimeout = setTimeout(() => {
      operation.hardTimedOut = true;
      controller.abort();
    }, 60_000);

    setBusy(true);
    setUploadError('');
    setOverallProgress('compressing', 5);
    const toastId = toast.loading(`Compressing ${selected.length} image${selected.length > 1 ? 's' : ''}...`);
    operation.toastId = toastId;
    const uploadedUrls = [];
    const processed = [];

    try {
      for (let index = 0; index < selected.length; index += 1) {
        if (controller.signal.aborted) throw new Error('Upload canceled');
        const file = selected[index];
        const rowId = `${file.name}-${file.lastModified}-${index}`;
        if (!file.type.startsWith('image/')) throw new Error(`${file.name} is not a valid image.`);

        setItems((state) => [...state, {
          id: rowId,
          name: file.name,
          status: 'compressing',
          originalSize: file.size,
          compressedSize: 0,
          progress: 10
        }]);

        const compressed = await compressImageFile(file, {
          maxSizeKB,
          signal: controller.signal,
          onProgress: ({ progress }) => {
            if (!isCurrentOperation()) return;
            const overallProgress = 5 + (progress * 0.3);
            setOverallProgress('compressing', overallProgress);
            setItems((state) => state.map((item) => item.id === rowId ? { ...item, progress: overallProgress, status: 'compressing' } : item));
          }
        });
        if (controller.signal.aborted) throw new Error('Upload canceled');
        const previewUrl = URL.createObjectURL(compressed.file);
        previewUrlsRef.current.push(previewUrl);
        setOverallProgress('uploading', 40);

        setItems((state) => state.map((item) => item.id === rowId ? {
          ...item,
          status: 'uploading',
          compressedSize: compressed.compressedSize,
          format: compressed.format,
          warning: compressed.compressionWarning,
          previewUrl,
          progress: 40
        } : item));

        onUpload?.({
          ...compressed,
          compressedFile: compressed.file,
          isLocalPreview: true,
          previewUrl,
          url: previewUrl
        });
        const uploaded = await uploadCompressedImage(compressed.file, {
          folder: storageFolder,
          signal: controller.signal,
          onProgress: (progress) => {
            if (!isCurrentOperation()) return;
            const overallProgress = 40 + (progress * 0.5);
            setOverallProgress('uploading', overallProgress);
            setItems((state) => state.map((item) => item.id === rowId ? { ...item, progress: overallProgress, status: 'uploading' } : item));
          }
        });
        if (controller.signal.aborted) throw new Error('Upload canceled');
        const uploadedUrl = uploaded.url || uploaded.downloadURL || uploaded.displayUrl || '';
        if (!uploadedUrl) throw new Error('Upload finished without an image URL. Please try again.');

        uploadedUrls.push(uploadedUrl);
        processed.push({ ...compressed, ...uploaded, previewUrl, url: uploadedUrl });
        setItems((state) => state.map((item) => item.id === rowId ? {
          ...item,
          status: 'ready',
          url: uploadedUrl,
          path: uploaded.path || uploaded.fullPath || '',
          storageProvider: uploaded.storageProvider,
          progress: 100
        } : item));
      }

      setOverallProgress('done', 100);
      const nextValue = multiple ? [...urls, ...uploadedUrls] : uploadedUrls[0] || '';
      onChange?.(nextValue);
      onUploadComplete?.(multiple ? processed : processed[0]);
      const hasCompressionWarning = processed.some((item) => item.compressionWarning);
      toast.success(
        hasCompressionWarning
          ? `${selected.length} image${selected.length > 1 ? 's' : ''} uploaded with compression warning`
          : `${selected.length} image${selected.length > 1 ? 's' : ''} ready near ${maxSizeKB}KB`,
        { id: toastId }
      );
      if (inputRef.current) inputRef.current.value = '';
    } catch (error) {
      if (!isCurrentOperation()) return;
      const message = operation.hardTimedOut
        ? 'Upload timed out. Please try again with a smaller image.'
        : error.message || 'Image compression/upload failed';
      setUploadError(message);
      setOverallProgress('error', 0);
      toast.error(message, { id: toastId });
      setItems((state) => state.map((item) => item.status === 'compressing' || item.status === 'uploading' ? { ...item, status: 'error', error: message } : item));
    } finally {
      clearTimeout(hardTimeout);
      if (isCurrentOperation()) {
        activeUploadRef.current = null;
        setBusy(false);
        statusResetTimeoutRef.current = setTimeout(() => {
          if (!activeUploadRef.current) {
            setUploadProgress(0);
            setUploadStage('');
          }
        }, 2000);
      }
    }
  };

  const remove = (url) => {
    const next = urls.filter((item) => item !== url);
    onChange?.(multiple ? next : '');
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-xs font-bold text-slate-400">Target {maxSizeKB}KB - WebP</p>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        onDrop={(event) => { event.preventDefault(); processFiles(event.dataTransfer.files); }}
        onDragOver={(event) => event.preventDefault()}
        className="flex min-h-36 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-yellow-300 bg-yellow-50 p-4 text-center text-sm font-semibold text-yellow-900 transition hover:border-tdp-red hover:bg-yellow-100 disabled:pointer-events-none disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-500"
      >
        {busy ? <Loader2 className="mb-2 animate-spin" /> : <ImagePlus className="mb-2" />}
        {busy ? getUploadStageText(uploadStage) : 'Click or drag images to compress and upload'}
        <span className="mt-1 text-xs text-yellow-800/75">Accepted: JPG, PNG, WebP. Aspect hint: {aspectRatio}</span>
      </button>
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} hidden disabled={busy} onChange={(event) => processFiles(event.target.files)} />

      {busy && (
        <div className="mt-3 rounded-xl border border-yellow-300 bg-slate-950 p-3 text-sm text-yellow-100">
          <div className="h-2 overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-tdp-yellow transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="font-black">{getUploadStageText(uploadStage)}</p>
            <button type="button" onClick={cancelUpload} className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-1 text-xs font-black text-white transition hover:border-white/45" aria-label="Cancel upload">
              <X size={13} /> Cancel
            </button>
          </div>
        </div>
      )}

      {uploadError && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
          <span>{uploadError}</span>
          <button type="button" onClick={() => setUploadError('')} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-black text-red-700 transition hover:bg-red-100">
            <X size={13} /> Dismiss
          </button>
        </div>
      )}

      {!!items.length && (
        <div className="mt-3 grid gap-3">
          {items.slice(-6).map((item) => (
            <div key={item.id} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 text-sm md:grid-cols-[96px_1fr_auto] md:items-center">
              <div className="aspect-video overflow-hidden rounded-lg bg-slate-100">
                {item.previewUrl ? <img src={item.previewUrl} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-slate-400"><UploadCloud size={22} /></div>}
              </div>
              <div className="min-w-0">
                <p className="truncate font-black text-slate-800">{item.name}</p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-slate-500">
                  <span>Original: {formatFileSize(item.originalSize)}</span>
                  {!!item.compressedSize && <span>Compressed: {formatFileSize(item.compressedSize)}</span>}
                  {!!item.format && <span>Format: {item.format}</span>}
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full ${item.status === 'error' ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${item.progress || 0}%` }} />
                </div>
                <p className={`mt-1 inline-flex items-center gap-1 text-xs font-black ${item.status === 'ready' ? 'text-green-700' : item.status === 'error' ? 'text-red-700' : 'text-yellow-800'}`}>
                  {item.status === 'ready' ? <CheckCircle2 size={13} /> : item.status === 'error' ? <X size={13} /> : <RefreshCw size={13} className="animate-spin" />}
                  {item.status === 'ready' ? `Image ready - ${formatFileSize(item.compressedSize)}` : item.status === 'error' ? item.error || 'Error' : getUploadStageText(item.status)}
                </p>
                {item.warning && <p className="mt-1 text-xs font-bold text-yellow-700">{item.warning}</p>}
              </div>
              {item.status === 'ready' && <CheckCircle2 className="text-green-600" />}
            </div>
          ))}
        </div>
      )}

      {!!urls.length && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {urls.map((url) => (
            <UploadedImagePreview key={url} url={url} busy={busy} onRemove={() => remove(url)} />
          ))}
        </div>
      )}
    </div>
  );
};

const UploadedImagePreview = ({ url, busy, onRemove }) => {
  const { src, isResolving } = useResolvedImage(url);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div className="relative">
      <div className="grid h-24 w-full place-items-center overflow-hidden rounded-lg bg-slate-100 text-slate-400">
        {src && !failed ? (
          <img src={src} className="h-full w-full object-cover" alt="" onError={() => setFailed(true)} />
        ) : (
          <div className="grid gap-1 text-center text-xs font-bold">
            {isResolving ? <RefreshCw size={18} className="mx-auto animate-spin" /> : <ImagePlus size={20} className="mx-auto" />}
            <span>{isResolving ? 'Loading' : 'No preview'}</span>
          </div>
        )}
      </div>
      <span className="absolute left-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-green-600 text-white"><CheckCircle2 size={14} /></span>
      <button type="button" disabled={busy} onClick={onRemove} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-red-600 text-white disabled:opacity-50" aria-label="Remove image"><Trash2 size={14} /></button>
    </div>
  );
};

export default ImageUploadWithCompression;
