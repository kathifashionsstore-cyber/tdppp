import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, ImagePlus, Loader2, X } from 'lucide-react';
import { useImgBB } from '@/hooks/useImgBB';

const ImageUploader = ({ value = [], onChange, onUploadStateChange, multiple = false }) => {
  const inputRef = useRef(null);
  const { uploadMany, uploadOne, uploading, progress } = useImgBB();
  const urls = Array.isArray(value) ? value : value ? [value] : [];

  useEffect(() => {
    onUploadStateChange?.(uploading);
  }, [onUploadStateChange, uploading]);

  const handleFiles = async (files) => {
    const fileList = Array.from(files || []);
    if (!fileList.length || uploading) return;
    const toastId = toast.loading(`Uploading ${fileList.length} image${fileList.length > 1 ? 's' : ''}...`);
    try {
      const uploaded = multiple ? await uploadMany(fileList) : [await uploadOne(fileList[0])];
      const next = multiple ? [...urls, ...uploaded.map((item) => item.url)] : uploaded[0].url;
      onChange?.(next);
      toast.success('Image uploaded successfully', { id: toastId });
      if (inputRef.current) inputRef.current.value = '';
    } catch (error) {
      toast.error(error.message || 'Image upload failed', { id: toastId });
    }
  };
  const remove = (url) => {
    const next = urls.filter((item) => item !== url);
    onChange?.(multiple ? next : '');
  };
  return (
    <div className={uploading ? 'cursor-wait' : ''}>
      <button type="button" disabled={uploading} onClick={() => inputRef.current?.click()} onDrop={(event) => { event.preventDefault(); handleFiles(event.dataTransfer.files); }} onDragOver={(event) => event.preventDefault()} className="flex min-h-32 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-yellow-300 bg-yellow-50 p-4 text-center text-sm font-semibold text-yellow-800 transition hover:border-tdp-red hover:bg-yellow-100 disabled:pointer-events-none disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-500">
        {uploading ? <Loader2 className="mb-2 animate-spin" /> : <ImagePlus className="mb-2" />}
        {uploading ? 'Please wait, image is uploading' : 'Click or drag images to upload'}
        {uploading && <span className="mt-2 text-xs">Processing {Object.values(progress).at(-1) || 0}% - saving is disabled</span>}
      </button>
      <input ref={inputRef} type="file" accept="image/*" multiple={multiple} hidden disabled={uploading} onChange={(event) => handleFiles(event.target.files)} />
      {!!urls.length && <div className="mt-3 grid grid-cols-3 gap-3">{urls.map((url) => <div key={url} className="relative"><img src={url} className="h-24 w-full rounded object-cover" alt="" /><span className="absolute left-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-green-600 text-white"><CheckCircle2 size={14} /></span><button type="button" disabled={uploading} onClick={() => remove(url)} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-red-600 text-white disabled:opacity-50"><X size={14} /></button></div>)}</div>}
    </div>
  );
};

export default ImageUploader;
