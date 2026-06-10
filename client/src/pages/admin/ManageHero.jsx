import { useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, ImagePlus, Loader2, Trash2, UploadCloud } from 'lucide-react';
import { deleteObject, ref as storageRef } from 'firebase/storage';
import { useCollection, useCrud } from '@/hooks/useFirestore';
import { storage } from '@/services/firebase';
import { compressImageFile, formatFileSize, uploadCompressedImageToFirebaseStorage } from '@/services/imgbbService';
import { confirmToast, toastError, toastSuccess } from '@/utils/toastUtils.jsx';

const MAX_HERO_IMAGES = 5;

const ManageHero = () => {
  const inputRef = useRef(null);
  const { data = [], isLoading } = useCollection('heroSections', { orderByField: 'order', orderDirection: 'asc' });
  const crud = useCrud('heroSections');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ stage: '', value: 0 });
  const [preview, setPreview] = useState('');

  const images = useMemo(() => data
    .filter((item) => item.imageUrl)
    .sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99))
    .slice(0, MAX_HERO_IMAGES), [data]);
  const isFull = images.length >= MAX_HERO_IMAGES;

  const chooseFile = () => {
    if (isFull) {
      toast.error('Maximum 5 images allowed. Delete one to add a new one');
      return;
    }
    inputRef.current?.click();
  };

  const uploadFile = async (file) => {
    if (!file || busy) return;
    if (isFull) {
      toast.error('Maximum 5 images allowed. Delete one to add a new one');
      return;
    }

    const controller = new AbortController();
    setBusy(true);
    setPreview(URL.createObjectURL(file));
    setProgress({ stage: 'compressing', value: 5 });
    const toastId = toast.loading('Compressing hero image...');

    try {
      const compressed = await compressImageFile(file, {
        maxSizeKB: 300,
        signal: controller.signal,
        onProgress: ({ progress: amount }) => setProgress({ stage: 'compressing', value: Math.round(amount || 10) })
      });
      setProgress({ stage: 'uploading', value: 40 });
      toast.loading('Uploading hero image...', { id: toastId });

      const uploaded = await uploadCompressedImageToFirebaseStorage(compressed.file, {
        folder: 'hero/banners',
        signal: controller.signal,
        onProgress: (amount) => setProgress({ stage: 'uploading', value: 40 + Math.round((amount || 0) * 0.55) })
      });

      await crud.create.mutateAsync({
        imageUrl: uploaded.downloadURL || uploaded.url,
        imagePath: uploaded.path || uploaded.fullPath,
        order: nextOrder(images),
        isActive: true
      });

      setProgress({ stage: 'done', value: 100 });
      toast.success('Hero image uploaded successfully', { id: toastId });
      if (inputRef.current) inputRef.current.value = '';
    } catch (error) {
      toast.error(error.message || 'Hero image upload failed', { id: toastId });
    } finally {
      setBusy(false);
      window.setTimeout(() => {
        setProgress({ stage: '', value: 0 });
        setPreview('');
      }, 1200);
    }
  };

  const toggleActive = async (item) => {
    try {
      await crud.update.mutateAsync({ id: item.id, data: { isActive: !item.isActive } });
      toastSuccess(item.isActive ? 'Hero image disabled' : 'Hero image enabled');
    } catch (error) {
      toastError(error, 'Update failed');
    }
  };

  const updateOrder = async (item, order) => {
    try {
      await crud.update.mutateAsync({ id: item.id, data: { order: Number(order) || item.order || 1 } });
      toastSuccess('Hero image order updated');
    } catch (error) {
      toastError(error, 'Order update failed');
    }
  };

  const remove = async (item) => {
    const confirmed = await confirmToast({
      title: 'Delete hero image?',
      message: 'This removes the image from Firebase Storage and the public slideshow.',
      confirmLabel: 'Delete'
    });
    if (!confirmed) return;
    try {
      if (item.imagePath) await deleteObject(storageRef(storage, item.imagePath)).catch(() => {});
      await crud.remove.mutateAsync(item.id);
      toastSuccess('Image deleted');
    } catch (error) {
      toastError(error, 'Delete failed');
    }
  };

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl bg-gradient-to-r from-slate-950 to-slate-800 p-5 text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-wide text-tdp-yellow">All Pages Hero Images Manager</p>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">Upload up to 5 banner images</h1>
        <p className="mt-1 text-sm text-white/65">These images slide on every page hero section.</p>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">Current Images ({images.length}/{MAX_HERO_IMAGES} uploaded)</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Each upload is compressed to the 300KB target before saving.</p>
          </div>
          <button type="button" onClick={chooseFile} disabled={busy || isFull} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-tdp-yellow px-5 text-base font-black text-tdp-navy shadow-yellow disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 md:w-auto">
            {busy ? <Loader2 className="animate-spin" size={18} /> : <ImagePlus size={18} />}
            Add Image
          </button>
          <input ref={inputRef} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(event) => uploadFile(event.target.files?.[0])} />
        </div>

        <button
          type="button"
          disabled={busy || isFull}
          onClick={chooseFile}
          onDrop={(event) => {
            event.preventDefault();
            uploadFile(event.dataTransfer.files?.[0]);
          }}
          onDragOver={(event) => event.preventDefault()}
          className="mb-5 grid min-h-40 w-full place-items-center rounded-2xl border-2 border-dashed border-yellow-300 bg-yellow-50 p-5 text-center text-sm font-bold text-yellow-900 transition hover:border-tdp-red disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
        >
          <span className="grid gap-2">
            <UploadCloud className="mx-auto" size={30} />
            {isFull ? 'Maximum 5 images allowed' : 'Click or drag one hero banner image'}
            <span className="text-xs text-yellow-800/75">Firebase path: hero/banners/[timestamp].webp</span>
          </span>
        </button>

        {busy && (
          <div className="mb-5 rounded-xl border border-yellow-200 bg-slate-950 p-3 text-yellow-100">
            <div className="h-2 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-tdp-yellow transition-all duration-300" style={{ width: `${progress.value}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm font-black">
              <span>{progress.stage === 'compressing' ? 'Compressing image...' : 'Uploading to Firebase Storage...'}</span>
              <span>{progress.value}%</span>
            </div>
            {preview && <img src={preview} alt="" className="mt-3 aspect-video w-full max-w-sm rounded-lg object-cover ring-1 ring-yellow-300/40" />}
          </div>
        )}

        {isFull && <p className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm font-black text-yellow-900">Maximum 5 images allowed. Delete one to add a new one</p>}

        {isLoading ? (
          <div className="rounded-xl bg-slate-50 p-5 font-bold text-slate-500">Loading hero images...</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {images.map((item, index) => (
              <article key={item.id} className="overflow-hidden rounded-xl border border-yellow-200 bg-white shadow-sm">
                <div className="relative aspect-video bg-slate-100">
                  <img src={item.imageUrl} alt={`Hero banner ${index + 1}`} className="h-full w-full object-cover" loading="lazy" />
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/92 px-2 py-1 text-xs font-black text-green-700"><CheckCircle2 size={13} /> Img {index + 1}</span>
                </div>
                <div className="grid gap-3 p-3">
                  <label className="grid gap-1 text-xs font-black uppercase tracking-wide text-slate-500">
                    Order
                    <input type="number" min="1" max="5" value={item.order || index + 1} onChange={(event) => updateOrder(item, event.target.value)} className="min-h-12 rounded-lg border border-slate-200 px-3 text-base outline-none focus:border-tdp-yellow" />
                  </label>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => toggleActive(item)} className={`min-h-12 flex-1 rounded-lg px-3 text-sm font-black ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </button>
                    <button type="button" onClick={() => remove(item)} className="grid min-h-12 w-12 place-items-center rounded-lg bg-red-50 text-tdp-red" aria-label="Delete image">
                      <Trash2 size={17} />
                    </button>
                  </div>
                  <p className="break-all text-[11px] font-semibold text-slate-400">{item.imagePath || formatFileSize(0)}</p>
                </div>
              </article>
            ))}
            {!images.length && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center font-bold text-slate-500 sm:col-span-2 xl:col-span-5">
                No hero images uploaded yet.
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

const nextOrder = (items) => {
  const used = new Set(items.map((item) => Number(item.order)).filter(Boolean));
  for (let index = 1; index <= MAX_HERO_IMAGES; index += 1) {
    if (!used.has(index)) return index;
  }
  return Math.min(MAX_HERO_IMAGES, items.length + 1);
};

export default ManageHero;
