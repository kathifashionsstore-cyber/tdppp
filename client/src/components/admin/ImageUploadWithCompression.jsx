import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, ImagePlus, Loader2, RefreshCw, Trash2, UploadCloud, X } from 'lucide-react';
import { compressImageFile, formatFileSize, uploadCompressedImageToImgBB } from '@/services/imgbbService';

const defaultAccept = 'image/jpeg,image/png,image/webp';

const ImageUploadWithCompression = ({
  label = 'Image Upload',
  value = [],
  onChange,
  onUpload,
  onUploadStateChange,
  multiple = false,
  aspectRatio = '16/9',
  maxSizeKB = 300,
  accept = defaultAccept
}) => {
  const inputRef = useRef(null);
  const previewUrlsRef = useRef([]);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState([]);
  const urls = Array.isArray(value) ? value : value ? [value] : [];

  useEffect(() => {
    onUploadStateChange?.(busy);
  }, [busy, onUploadStateChange]);

  useEffect(() => () => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const processFiles = async (files) => {
    const selected = Array.from(files || []);
    if (!selected.length || busy) return;
    setBusy(true);
    const toastId = toast.loading(`Compressing ${selected.length} image${selected.length > 1 ? 's' : ''}...`);
    const uploadedUrls = [];
    const processed = [];

    try {
      for (let index = 0; index < selected.length; index += 1) {
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
          onProgress: ({ progress }) => {
            setItems((state) => state.map((item) => item.id === rowId ? { ...item, progress, status: 'compressing' } : item));
          }
        });
        const previewUrl = URL.createObjectURL(compressed.file);
        previewUrlsRef.current.push(previewUrl);

        setItems((state) => state.map((item) => item.id === rowId ? {
          ...item,
          status: 'uploading',
          compressedSize: compressed.compressedSize,
          format: compressed.format,
          previewUrl,
          progress: 96
        } : item));

        onUpload?.({ ...compressed, previewUrl });
        const uploaded = await uploadCompressedImageToImgBB(compressed.file, (progress) => {
          setItems((state) => state.map((item) => item.id === rowId ? { ...item, progress, status: 'uploading' } : item));
        });

        uploadedUrls.push(uploaded.url);
        processed.push({ ...compressed, previewUrl, url: uploaded.url });
        setItems((state) => state.map((item) => item.id === rowId ? {
          ...item,
          status: 'ready',
          url: uploaded.url,
          progress: 100
        } : item));
      }

      const nextValue = multiple ? [...urls, ...uploadedUrls] : uploadedUrls[0] || '';
      onChange?.(nextValue);
      toast.success(`${selected.length} image${selected.length > 1 ? 's' : ''} ready under ${maxSizeKB}KB`, { id: toastId });
      if (inputRef.current) inputRef.current.value = '';
    } catch (error) {
      toast.error(error.message || 'Image compression/upload failed', { id: toastId });
      setItems((state) => state.map((item) => item.status === 'compressing' || item.status === 'uploading' ? { ...item, status: 'error', error: error.message } : item));
    } finally {
      setBusy(false);
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
        <p className="text-xs font-bold text-slate-400">Max {maxSizeKB}KB - WebP</p>
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
        {busy ? 'Compressing image before upload...' : 'Click or drag images to compress and upload'}
        <span className="mt-1 text-xs text-yellow-800/75">Accepted: JPG, PNG, WebP. Aspect hint: {aspectRatio}</span>
      </button>
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} hidden disabled={busy} onChange={(event) => processFiles(event.target.files)} />

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
                  {item.status === 'ready' ? `Image ready - ${formatFileSize(item.compressedSize)}` : item.status === 'error' ? item.error || 'Error' : 'Compressing/uploading...'}
                </p>
              </div>
              {item.status === 'ready' && <CheckCircle2 className="text-green-600" />}
            </div>
          ))}
        </div>
      )}

      {!!urls.length && (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {urls.map((url) => (
            <div key={url} className="relative">
              <img src={url} className="h-24 w-full rounded-lg object-cover" alt="" />
              <span className="absolute left-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-green-600 text-white"><CheckCircle2 size={14} /></span>
              <button type="button" disabled={busy} onClick={() => remove(url)} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-red-600 text-white disabled:opacity-50" aria-label="Remove image"><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploadWithCompression;
