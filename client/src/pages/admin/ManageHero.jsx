import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Eye,
  EyeOff,
  Home as HomeIcon,
  ImagePlus,
  Images,
  Landmark,
  Loader2,
  Newspaper,
  Phone,
  Save,
  ScrollText,
  Sparkles,
  Star,
  Trash2,
  UploadCloud,
  XCircle
} from 'lucide-react';
import { deleteObject, getDownloadURL, ref as storageRef, uploadBytesResumable } from 'firebase/storage';
import { useCollection, useCrud } from '@/hooks/useFirestore';
import { storage } from '@/services/firebase';
import { compressImageFile, formatFileSize } from '@/services/imgbbService';
import { confirmToast } from '@/utils/toastUtils.jsx';
import {
  PAGE_HERO_CONFIGS,
  PAGE_HERO_MAX_IMAGES,
  PAGE_HERO_MAX_SIZE_KB
} from '@/utils/pageHeroConfig';

const MAX_UPLOAD_BYTES = PAGE_HERO_MAX_SIZE_KB * 1024;
const MAX_IMAGES_TOAST = 'Maximum 5 images allowed for this page. Delete one to add new';

const PAGE_ICONS = {
  home: HomeIcon,
  news: Newspaper,
  gallery: Images,
  dailywork: ClipboardList,
  super6: Star,
  schemes: ScrollText,
  narasaraopet: Landmark,
  contact: Phone
};

const ManageHero = () => {
  const [selectedPage, setSelectedPage] = useState(null);
  const selectedConfig = PAGE_HERO_CONFIGS.find((config) => config.pageName === selectedPage);

  if (selectedConfig) {
    return <PageHeroManager config={selectedConfig} onBack={() => setSelectedPage(null)} />;
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl bg-gradient-to-r from-slate-950 to-slate-800 p-5 text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-wide text-tdp-yellow">Page Hero Banners Manager</p>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">Separate hero images for every page</h1>
        <p className="mt-1 text-sm text-white/65">Each page has its own Firebase collection and a maximum of 5 images.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {PAGE_HERO_CONFIGS.map((config) => (
          <PageHeroCard key={config.pageName} config={config} onManage={() => setSelectedPage(config.pageName)} />
        ))}
      </section>
    </div>
  );
};

const PageHeroCard = ({ config, onManage }) => {
  const Icon = PAGE_ICONS[config.pageName] || Sparkles;
  const { data = [], isLoading } = useCollection(config.collectionName, {
    orderByField: 'order',
    orderDirection: 'asc'
  });
  const images = useMemo(() => sortHeroImages(data), [data]);
  const activeCount = images.filter((item) => item.isActive !== false).length;
  const isFull = images.length >= PAGE_HERO_MAX_IMAGES;
  const statusText = isFull ? 'Maximum reached' : activeCount ? 'Active images' : 'No images uploaded';
  const statusClass = isFull
    ? 'bg-red-50 text-red-700'
    : activeCount
      ? 'bg-green-50 text-green-700'
      : 'bg-amber-50 text-amber-700';
  const StatusIcon = isFull || !activeCount ? CircleAlert : CheckCircle2;

  return (
    <article className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-yellow-50 text-yellow-700">
          <Icon size={22} />
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${statusClass}`}>
          <StatusIcon size={13} />
          {isLoading ? 'Loading' : `${images.length} / ${PAGE_HERO_MAX_IMAGES}`}
        </span>
      </div>
      <div>
        <h2 className="text-lg font-black text-slate-950">{config.adminLabel}</h2>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
          These images show only on the {config.pageLabel}.
        </p>
      </div>
      <div className="rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-600">
        <p>{statusText}</p>
        <p className={isFull ? 'mt-1 text-red-700' : 'mt-1 text-slate-500'}>{remainingSlotsLabel(images.length)}</p>
      </div>
      <button
        type="button"
        onClick={onManage}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-tdp-yellow px-4 text-sm font-black text-tdp-navy shadow-yellow"
      >
        <ImagePlus size={17} />
        Manage Banners
      </button>
    </article>
  );
};

const PageHeroManager = ({ config, onBack }) => {
  const inputRef = useRef(null);
  const { data = [], isLoading } = useCollection(config.collectionName, {
    orderByField: 'order',
    orderDirection: 'asc'
  });
  const crud = useCrud(config.collectionName);
  const [selectedImage, setSelectedImage] = useState(null);
  const [compressing, setCompressing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [actionId, setActionId] = useState('');
  const [progress, setProgress] = useState({ stage: '', value: 0 });

  const images = useMemo(() => sortHeroImages(data), [data]);
  const isFull = images.length >= PAGE_HERO_MAX_IMAGES;
  const busy = compressing || uploading || Boolean(actionId);
  const Icon = PAGE_ICONS[config.pageName] || Sparkles;

  useEffect(() => {
    return () => {
      if (selectedImage?.previewUrl) URL.revokeObjectURL(selectedImage.previewUrl);
    };
  }, [selectedImage?.previewUrl]);

  const clearSelectedImage = () => setSelectedImage(null);

  const chooseFile = () => {
    if (isFull) {
      toast.error(MAX_IMAGES_TOAST);
      return;
    }
    inputRef.current?.click();
  };

  const prepareFile = async (file) => {
    if (!file || compressing) return;
    if (isFull) {
      toast.error(MAX_IMAGES_TOAST);
      return;
    }
    if (!file.type?.startsWith('image/')) {
      toast.error('Please select a valid image file.');
      return;
    }

    setCompressing(true);
    clearSelectedImage();
    setProgress({ stage: 'compressing', value: 5 });
    const toastId = toast.loading(`Compressing image for ${config.pageLabel}...`);

    try {
      const compressed = await compressImageFile(file, {
        maxSizeKB: PAGE_HERO_MAX_SIZE_KB,
        onProgress: ({ progress: amount }) => setProgress({
          stage: 'compressing',
          value: Math.min(95, Math.max(5, Math.round(amount || 5)))
        })
      });

      if (compressed.file.size > MAX_UPLOAD_BYTES || !compressed.file.type.includes('webp')) {
        toast.error('Image too large. Try a different image', { id: toastId });
        return;
      }

      setSelectedImage({
        ...compressed,
        previewUrl: URL.createObjectURL(compressed.file)
      });
      setProgress({ stage: 'ready', value: 100 });
      toast.success(
        `Compressed: ${formatFileSize(compressed.originalSize)} -> ${formatFileSize(compressed.compressedSize)}`,
        { id: toastId }
      );
    } catch (error) {
      toast.error(error?.message || 'Image too large. Try a different image', { id: toastId });
    } finally {
      setCompressing(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const uploadSelectedImage = async () => {
    if (isFull) {
      toast.error(MAX_IMAGES_TOAST);
      return;
    }
    if (!selectedImage?.file || uploading) {
      toast.error('Select and compress an image first');
      return;
    }

    setUploading(true);
    setProgress({ stage: 'uploading', value: 0 });
    const toastId = toast.loading(`Uploading to ${config.pageLabel}...`);

    try {
      const imagePath = `${config.storagePath}/${Date.now()}.webp`;
      const uploaded = await uploadHeroImageFile(selectedImage.file, imagePath, (amount) => {
        setProgress({ stage: 'uploading', value: Math.round(amount || 0) });
      });

      if (!uploaded.downloadURL?.startsWith('https://firebasestorage.googleapis.com')) {
        throw new Error('Could not get image URL. Try uploading again');
      }

      try {
        await crud.create.mutateAsync({
          imageUrl: uploaded.downloadURL,
          imagePath: uploaded.imagePath,
          order: nextOrder(images),
          isActive: true,
          pageName: config.pageName,
          createdAt: new Date().toISOString(),
          sizeKB: Math.max(1, Math.round(selectedImage.file.size / 1024)),
          format: 'webp'
        });
      } catch (error) {
        const databaseError = new Error('Saved to storage but database save failed. Try again');
        databaseError.cause = error;
        throw databaseError;
      }

      setProgress({ stage: 'done', value: 100 });
      toast.success(`Image uploaded to ${config.pageLabel} successfully`, { id: toastId });
      clearSelectedImage();
    } catch (error) {
      const message = error?.message?.startsWith('Could not get image URL')
        || error?.message?.startsWith('Saved to storage')
        ? error.message
        : 'Upload failed. Check internet and try again';
      toast.error(message, { id: toastId });
    } finally {
      setUploading(false);
      window.setTimeout(() => setProgress({ stage: '', value: 0 }), 900);
    }
  };

  const remove = async (item) => {
    const confirmed = await confirmToast({
      title: `Delete this image from ${config.pageLabel}?`,
      message: 'This removes the file from Firebase Storage and deletes its database record.',
      confirmLabel: 'Confirm Delete'
    });
    if (!confirmed) return;

    setActionId(`delete-${item.id}`);
    try {
      if (item.imagePath) {
        await deleteObject(storageRef(storage, item.imagePath));
      }
      await crud.remove.mutateAsync(item.id);
      await normalizeOrderFields(images.filter((image) => image.id !== item.id), crud);
      toast.success(`Image deleted from ${config.pageLabel}`);
    } catch (error) {
      toast.error('Delete failed. Try again');
    } finally {
      setActionId('');
    }
  };

  const move = async (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= images.length) return;

    const current = images[index];
    const target = images[nextIndex];
    setActionId(`move-${current.id}`);
    try {
      await Promise.all([
        crud.update.mutateAsync({ id: current.id, data: { order: Number(target.order) || nextIndex + 1 } }),
        crud.update.mutateAsync({ id: target.id, data: { order: Number(current.order) || index + 1 } })
      ]);
      toast.success('Image order updated');
    } catch (error) {
      toast.error('Order update failed. Try again');
    } finally {
      setActionId('');
    }
  };

  const toggleActive = async (item) => {
    setActionId(`toggle-${item.id}`);
    try {
      await crud.update.mutateAsync({ id: item.id, data: { isActive: item.isActive === false } });
      toast.success(item.isActive === false ? 'Image enabled' : 'Image hidden from slideshow');
    } catch (error) {
      toast.error('Update failed. Try again');
    } finally {
      setActionId('');
    }
  };

  return (
    <div className="grid gap-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm"
      >
        <ArrowLeft size={17} />
        Back to All Pages
      </button>

      <div className="rounded-2xl bg-gradient-to-r from-slate-950 to-slate-800 p-5 text-white shadow-xl">
        <div className="flex flex-wrap items-start gap-4">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/10 text-tdp-yellow">
            <Icon size={24} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-tdp-yellow">{config.adminLabel}</p>
            <h1 className="mt-1 text-2xl font-black md:text-3xl">{config.pageLabel} Hero Banner Images</h1>
            <p className="mt-1 text-sm text-white/65">Images below appear only on {config.route}. Slides run every 2 seconds with zoom animation.</p>
          </div>
        </div>
        <div className="mt-4 inline-flex rounded-xl bg-white/10 px-3 py-2 text-sm font-black">
          {images.length} of {PAGE_HERO_MAX_IMAGES} images uploaded
        </div>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">Uploaded Images</h2>
            <p className="mt-1 text-sm font-bold text-slate-500">{remainingSlotsLabel(images.length)}</p>
          </div>
          <button
            type="button"
            onClick={chooseFile}
            disabled={busy || isFull}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-tdp-yellow px-5 text-base font-black text-tdp-navy shadow-yellow disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 md:w-auto"
          >
            {compressing ? <Loader2 className="animate-spin" size={18} /> : <ImagePlus size={18} />}
            Select Image
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-xl bg-slate-50 p-5 font-bold text-slate-500">Loading images...</div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {images.map((item, index) => (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-3">
                  <span className="text-sm font-black text-slate-950">Order: {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => toggleActive(item)}
                    disabled={busy}
                    className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-black disabled:opacity-50 ${item.isActive === false ? 'bg-slate-100 text-slate-500' : 'bg-green-50 text-green-700'}`}
                  >
                    {item.isActive === false ? <EyeOff size={15} /> : <Eye size={15} />}
                    Active: {item.isActive === false ? 'Off' : 'On'}
                  </button>
                </div>
                <div className="grid gap-3 p-3 sm:grid-cols-[180px_1fr]">
                  <img src={item.imageUrl} alt={`${config.pageLabel} banner ${index + 1}`} className="aspect-video w-full rounded-xl bg-slate-100 object-cover ring-1 ring-slate-200" loading="lazy" />
                  <div className="grid content-between gap-3">
                    <div className="grid gap-1 text-sm font-semibold text-slate-500">
                      <p>Size: {item.sizeKB ? `${item.sizeKB} KB` : 'Unknown'}</p>
                      <p>Format: {(item.format || 'webp').toUpperCase()}</p>
                      <p className="break-all text-xs text-slate-400">{item.imagePath}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => move(index, -1)}
                        disabled={busy || index === 0}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowUp size={16} />
                        Move Up
                      </button>
                      <button
                        type="button"
                        onClick={() => move(index, 1)}
                        disabled={busy || index === images.length - 1}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-black text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowDown size={16} />
                        Move Down
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(item)}
                        disabled={busy}
                        className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-red-50 px-3 text-sm font-black text-tdp-red disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
            {!images.length && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center font-bold text-slate-500 lg:col-span-2">
                No hero images uploaded yet. The public page will show the TDP gold gradient fallback.
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-950">Add New Image</h2>
            <p className={`mt-1 text-sm font-bold ${isFull ? 'text-red-700' : 'text-slate-500'}`}>{remainingSlotsLabel(images.length)}</p>
          </div>
          {selectedImage && (
            <button
              type="button"
              onClick={clearSelectedImage}
              disabled={uploading}
              className="inline-flex min-h-10 w-fit items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-black text-slate-700 disabled:opacity-50"
            >
              <XCircle size={16} />
              Clear Selection
            </button>
          )}
        </div>

        <button
          type="button"
          disabled={busy || isFull}
          onClick={chooseFile}
          onDrop={(event) => {
            event.preventDefault();
            prepareFile(event.dataTransfer.files?.[0]);
          }}
          onDragOver={(event) => event.preventDefault()}
          className="grid min-h-44 w-full place-items-center rounded-2xl border-2 border-dashed border-yellow-300 bg-yellow-50 p-5 text-center text-sm font-bold text-yellow-900 transition hover:border-tdp-red disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
        >
          <span className="grid gap-2">
            <UploadCloud className="mx-auto" size={30} />
            {isFull ? 'Maximum reached' : 'Click or drag to upload'}
            <span className="text-xs text-yellow-800/75">Auto-compressed to 300KB WebP. Recommended: 16:9 landscape.</span>
            <span className="text-xs text-yellow-800/75">Storage path: {config.storagePath}/[timestamp].webp</span>
          </span>
        </button>
        <input ref={inputRef} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(event) => prepareFile(event.target.files?.[0])} />

        {(compressing || uploading) && (
          <div className="mt-4 rounded-xl border border-yellow-200 bg-slate-950 p-3 text-yellow-100">
            <div className="h-2 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-tdp-yellow transition-all duration-300" style={{ width: `${progress.value}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-sm font-black">
              <span>{progress.stage === 'uploading' ? 'Uploading to Firebase Storage...' : 'Compressing image...'}</span>
              <span>{progress.value}%</span>
            </div>
          </div>
        )}

        {selectedImage && (
          <div className="mt-4 grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[minmax(220px,360px)_1fr]">
            <img src={selectedImage.previewUrl} alt="Compressed preview" className="aspect-video w-full rounded-xl object-cover ring-1 ring-slate-200" />
            <div className="grid content-between gap-4">
              <div>
                <p className="text-sm font-black text-slate-950">Compressed preview is ready</p>
                <p className="mt-1 text-sm font-bold text-slate-600">
                  Original: {formatFileSize(selectedImage.originalSize)} - Compressed: {formatFileSize(selectedImage.compressedSize)} - WebP
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-500">This image will appear only on {config.pageLabel}.</p>
              </div>
              <button
                type="button"
                onClick={uploadSelectedImage}
                disabled={uploading || isFull}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-tdp-red px-5 text-base font-black text-white shadow-red disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {uploading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Upload to {config.pageLabel}
              </button>
            </div>
          </div>
        )}

        {isFull && (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-black text-red-700">
            Maximum reached. Delete one image to add a new image.
          </p>
        )}
      </section>
    </div>
  );
};

const uploadHeroImageFile = (file, imagePath, onProgress) => new Promise((resolve, reject) => {
  const targetRef = storageRef(storage, imagePath);
  const uploadTask = uploadBytesResumable(targetRef, file, {
    contentType: 'image/webp',
    customMetadata: {
      originalName: file.name
    }
  });

  uploadTask.on(
    'state_changed',
    (snapshot) => {
      if (snapshot.totalBytes) {
        onProgress?.((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      }
    },
    reject,
    async () => {
      try {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve({
          downloadURL,
          imagePath: uploadTask.snapshot.ref.fullPath
        });
      } catch (error) {
        reject(error);
      }
    }
  );
});

const sortHeroImages = (items = []) => items
  .filter((item) => item?.imageUrl)
  .sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99));

const nextOrder = (items) => {
  const used = new Set(items.map((item) => Number(item.order)).filter(Boolean));
  for (let order = 1; order <= PAGE_HERO_MAX_IMAGES; order += 1) {
    if (!used.has(order)) return order;
  }
  return PAGE_HERO_MAX_IMAGES;
};

const normalizeOrderFields = async (items, crud) => {
  const ordered = sortHeroImages(items);
  await Promise.all(ordered.map((item, index) => (
    Number(item.order) === index + 1
      ? Promise.resolve()
      : crud.update.mutateAsync({ id: item.id, data: { order: index + 1 } })
  )));
};

const remainingSlotsLabel = (count) => {
  const remaining = Math.max(0, PAGE_HERO_MAX_IMAGES - count);
  if (!remaining) return 'Maximum reached';
  return `${remaining} more image${remaining === 1 ? '' : 's'} can be added`;
};

export default ManageHero;
