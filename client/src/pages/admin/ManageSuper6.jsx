import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Eye, ImagePlus, Plus, Save, Trash2, XCircle } from 'lucide-react';
import ContentTable from '@/components/admin/ContentTable';
import ImageUploader from '@/components/admin/ImageUploader';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { useCollection, useCrud } from '@/hooks/useFirestore';
import { super6Schemes } from '@/data/super6Data';
import { translatePayloadFields } from '@/services/translationService';
import useResolvedImage from '@/hooks/useResolvedImage';

const SAVE_TIMEOUT_MS = 60_000;

const withSaveTimeout = (promise, message) => {
  let timeoutId = null;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), SAVE_TIMEOUT_MS);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
};

const emptyForm = () => ({
  title_en: '',
  title_te: '',
  shortDescription_en: '',
  shortDescription_te: '',
  description_en: '',
  description_te: '',
  readMore_en: '',
  readMore_te: '',
  thumbnail: '',
  image: '',
  images: [],
  videos: [],
  order: 1,
  isPublished: true,
  isActive: true
});

const findSchemeDoc = (items, scheme, index) => items.find((item) => (
  item.schemeId === scheme.id
  || item.sourceId === scheme.id
  || item.id === scheme.id
  || item.title_en === scheme.nameEn
  || Number(item.order) === index + 1
));

const defaultSchemePayload = (scheme, index) => ({
  schemeId: scheme.id,
  title_en: scheme.nameEn,
  title_te: scheme.nameTe,
  shortDescription_en: scheme.description,
  shortDescription_te: scheme.description,
  description_en: scheme.description,
  description_te: scheme.description,
  readMore_en: [scheme.benefits, scheme.eligibility, scheme.steps].flat().filter(Boolean).map((item) => `<p>${item}</p>`).join(''),
  readMore_te: [scheme.benefits, scheme.eligibility, scheme.steps].flat().filter(Boolean).map((item) => `<p>${item}</p>`).join(''),
  thumbnail: scheme.image,
  image: scheme.image,
  images: [scheme.image],
  videos: scheme.videoSrc ? [{ title: `${scheme.nameEn} Video`, url: scheme.videoSrc }] : [],
  playlistThumbnail: scheme.poster || scheme.image,
  thumbnailImage: scheme.poster || scheme.image,
  videoThumbnail: scheme.poster || scheme.image,
  thumbnailUrl: scheme.poster || scheme.image,
  thumbnailPath: '',
  thumbnailLabel_en: `${scheme.nameEn} Video`,
  thumbnailLabel_te: `${scheme.nameTe} Video`,
  order: index + 1,
  isPublished: true,
  isActive: true
});

const thumbnailDraft = (scheme, item) => ({
  playlistThumbnail: item?.thumbnailUrl || item?.playlistThumbnail || item?.thumbnailImage || item?.videoThumbnail || '',
  thumbnailUrl: item?.thumbnailUrl || item?.playlistThumbnail || item?.thumbnailImage || item?.videoThumbnail || '',
  thumbnailPath: item?.thumbnailPath || item?.playlistThumbnailPath || item?.videoThumbnailPath || '',
  previewUrl: '',
  thumbnailLabel_en: item?.thumbnailLabel_en || `${item?.title_en || scheme.nameEn} Video`
});

const Super6ThumbnailManager = ({ items = [] }) => {
  const crud = useCrud('super6Schemes');
  const rows = super6Schemes.slice(0, 6).map((scheme, index) => ({
    scheme,
    item: findSchemeDoc(items, scheme, index),
    index
  }));

  return (
    <section className="grid gap-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
      <div>
        <p className="text-xs font-black uppercase tracking-wide text-tdp-red">Super 6 Thumbnail Manager</p>
        <h2 className="mt-1 text-2xl font-black text-slate-950">Video Playlist Thumbnails</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">Upload one compressed 16:9 thumbnail for each fixed Super 6 scheme. These images appear below each public video player.</p>
      </div>
      <div className="grid gap-4">
        {rows.map(({ scheme, item, index }) => (
          <ThumbnailRow key={scheme.id} scheme={scheme} item={item} index={index} crud={crud} />
        ))}
      </div>
    </section>
  );
};

const ThumbnailRow = ({ scheme, item, index, crud }) => {
  const [draft, setDraft] = useState(() => thumbnailDraft(scheme, item));
  const [imageUploading, setImageUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    setDraft(thumbnailDraft(scheme, item));
    setSaveError('');
  }, [item, scheme]);

  const update = (key, value) => setDraft((state) => ({ ...state, [key]: value }));
  const updateThumbnail = (url) => setDraft((state) => ({
    ...state,
    playlistThumbnail: url,
    thumbnailUrl: url,
    ...(!url ? { thumbnailPath: '', previewUrl: '' } : {})
  }));
  const updateLocalPreview = (uploaded) => {
    if (!uploaded?.previewUrl) return;
    setDraft((state) => ({
      ...state,
      previewUrl: uploaded.previewUrl
    }));
  };
  const updateUploadedThumbnail = (uploaded) => {
    if (!uploaded) return;
    setDraft((state) => ({
      ...state,
      playlistThumbnail: uploaded.url || uploaded.downloadURL || state.playlistThumbnail,
      thumbnailUrl: uploaded.url || uploaded.downloadURL || state.thumbnailUrl,
      thumbnailPath: uploaded.path || uploaded.fullPath || state.thumbnailPath || '',
      previewUrl: ''
    }));
  };

  const save = async () => {
    if (imageUploading) return toast.error('Please wait until thumbnail upload finishes');
    const thumbnailUrl = draft.thumbnailUrl || draft.playlistThumbnail;
    if (!thumbnailUrl) return toast.error(`Upload a thumbnail for ${scheme.nameEn}`);
    setSaving(true);
    setSaveError('');
    try {
      const payload = await withSaveTimeout(translatePayloadFields({
        ...(item || defaultSchemePayload(scheme, index)),
        schemeId: scheme.id,
        order: index + 1,
        playlistThumbnail: thumbnailUrl,
        thumbnailImage: thumbnailUrl,
        videoThumbnail: thumbnailUrl,
        thumbnailUrl,
        thumbnailPath: draft.thumbnailPath || item?.thumbnailPath || '',
        thumbnailLabel_en: draft.thumbnailLabel_en || `${scheme.nameEn} Video`,
        isPublished: true,
        isActive: true
      }, ['thumbnailLabel']), `Saving ${scheme.nameEn} thumbnail timed out. Please try again.`);
      if (item?.id) await withSaveTimeout(crud.update.mutateAsync({ id: item.id, data: payload }), `Saving ${scheme.nameEn} thumbnail timed out. Please try again.`);
      else await withSaveTimeout(crud.create.mutateAsync(payload), `Saving ${scheme.nameEn} thumbnail timed out. Please try again.`);
      toast.success(`${scheme.nameEn} thumbnail saved`);
    } catch (error) {
      const message = error.message || 'Unable to save thumbnail';
      setSaveError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[220px_1fr_auto] lg:items-start">
      <div>
        <p className="text-xs font-black uppercase tracking-wide text-slate-500">Scheme {index + 1}</p>
        <h3 className="mt-1 text-lg font-black text-slate-950">{scheme.nameEn}</h3>
        <p className="telugu mt-1 text-sm font-bold text-slate-500">{scheme.nameTe}</p>
      </div>
      <div className="grid gap-3 md:grid-cols-[240px_1fr]">
        <ImageUploader
          label="Video Playlist Thumbnail"
          value={draft.thumbnailUrl || draft.playlistThumbnail || ''}
          aspectRatio="16/9"
          storageFolder={`super6/thumbnails/${scheme.id}`}
          onUploadStateChange={setImageUploading}
          onUpload={updateLocalPreview}
          onChange={updateThumbnail}
          onUploadComplete={updateUploadedThumbnail}
        />
        <div className="grid content-start gap-3">
          <input className="min-h-12 rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-tdp-yellow" placeholder={`${scheme.nameEn} Video`} value={draft.thumbnailLabel_en || ''} onChange={(event) => update('thumbnailLabel_en', event.target.value)} />
          <ThumbnailPreview source={draft.previewUrl || draft.thumbnailUrl || draft.playlistThumbnail} path={draft.thumbnailPath} isUploading={imageUploading} />
        </div>
      </div>
      <div className="grid gap-2">
        <button type="button" onClick={save} disabled={imageUploading || saving} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-tdp-red px-5 py-3 font-bold text-white shadow-red disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none">
          <Save size={18} />{saving ? 'Saving...' : 'Save'}
        </button>
        {saveError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">{saveError}</p>}
      </div>
    </article>
  );
};

const ManageSuper6 = () => {
  const { data = [], isLoading } = useCollection('super6Schemes', { orderByField: 'order', orderDirection: 'asc' });
  const crud = useCrud('super6Schemes');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [videoDraft, setVideoDraft] = useState({ title: '', url: '' });
  const [imageUploading, setImageUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const seededCount = useMemo(() => data.length, [data.length]);
  const update = (key, value) => setForm((state) => ({ ...state, [key]: value }));

  const edit = (item) => {
    setEditing(item.id);
    setForm({ ...emptyForm(), ...item, videos: normalizeVideos(item.videos || item.videoUrls || []) });
    setVideoDraft({ title: '', url: '' });
    setSaveError('');
  };

  const reset = () => {
    setEditing(null);
    setForm(emptyForm());
    setVideoDraft({ title: '', url: '' });
    setSaveError('');
  };

  const addVideo = () => {
    const url = videoDraft.url.trim();
    if (!url) return;
    update('videos', [...normalizeVideos(form.videos), { title: videoDraft.title.trim() || `Video ${normalizeVideos(form.videos).length + 1}`, url }]);
    setVideoDraft({ title: '', url: '' });
  };

  const addLocalPreview = (files) => {
    const previews = Array.from(files || []).map((file) => ({ title: file.name.replace(/\.[^/.]+$/, ''), url: URL.createObjectURL(file), previewOnly: true }));
    if (previews.length) update('videos', [...normalizeVideos(form.videos), ...previews]);
  };

  useEffect(() => () => {
    normalizeVideos(form.videos).forEach((video) => {
      if (String(video.url).startsWith('blob:')) URL.revokeObjectURL(video.url);
    });
  }, [form.videos]);

  const seedDefaults = async () => {
    if (data.length >= 6) return toast('Six Super 6 entries already exist');
    try {
      await Promise.all(super6Schemes.slice(0, 6).map((scheme, index) => crud.create.mutateAsync({
        schemeId: scheme.id,
        title_en: scheme.nameEn,
        title_te: scheme.nameTe,
        shortDescription_en: scheme.description,
        shortDescription_te: scheme.description,
        description_en: scheme.description,
        description_te: scheme.description,
        readMore_en: [scheme.benefits, scheme.eligibility, scheme.steps].flat().filter(Boolean).map((item) => `<p>${item}</p>`).join(''),
        readMore_te: [scheme.benefits, scheme.eligibility, scheme.steps].flat().filter(Boolean).map((item) => `<p>${item}</p>`).join(''),
        thumbnail: scheme.image,
        image: scheme.image,
        images: [scheme.image],
        videos: scheme.videoSrc ? [{ title: `${scheme.nameEn} Video`, url: scheme.videoSrc }] : [],
        playlistThumbnail: scheme.poster || scheme.image,
        thumbnailImage: scheme.poster || scheme.image,
        videoThumbnail: scheme.poster || scheme.image,
        thumbnailUrl: scheme.poster || scheme.image,
        thumbnailPath: '',
        thumbnailLabel_en: `${scheme.nameEn} Video`,
        thumbnailLabel_te: `${scheme.nameTe} Video`,
        order: index + 1,
        isPublished: true,
        isActive: true
      })));
      toast.success('Default Super 6 entries added');
    } catch (error) {
      toast.error(error.message || 'Unable to seed Super 6 entries');
    }
  };

  const save = async (event) => {
    event.preventDefault();
    if (imageUploading) return toast.error('Please wait until image upload finishes');
    if (!form.title_en && !form.image && !form.thumbnail) return toast.error('Title or thumbnail is required');
    setSaving(true);
    setSaveError('');
    try {
      const image = form.image || form.thumbnail || form.images?.[0] || '';
      const payload = await withSaveTimeout(translatePayloadFields({
        ...form,
        image,
        thumbnail: form.thumbnail || image,
        images: form.images?.length ? form.images : image ? [image] : [],
        videos: normalizeVideos(form.videos).filter((video) => video.url && !String(video.url).startsWith('blob:')).map(({ title, url }) => ({ title, url }))
      }), 'Saving Super 6 scheme timed out. Please try again.');
      if (editing) await withSaveTimeout(crud.update.mutateAsync({ id: editing, data: payload }), 'Saving Super 6 scheme timed out. Please try again.');
      else await withSaveTimeout(crud.create.mutateAsync(payload), 'Saving Super 6 scheme timed out. Please try again.');
      toast.success('Super 6 scheme saved');
      reset();
    } catch (error) {
      const message = error.message || 'Save failed';
      setSaveError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl bg-gradient-to-r from-slate-950 to-slate-800 p-5 text-white shadow-xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-tdp-yellow">Separate Admin Panel</p>
            <h1 className="mt-1 text-2xl font-black md:text-3xl">Super 6 Schemes Manager</h1>
            <p className="mt-1 text-sm text-white/65">Manage exactly the six flagship schemes, long descriptions, thumbnails, and local/hosted video paths.</p>
          </div>
          <button onClick={seedDefaults} className="rounded-xl bg-tdp-yellow px-4 py-2 text-sm font-black text-tdp-navy shadow-yellow">Seed Defaults ({seededCount}/6)</button>
        </div>
      </div>

      <Super6ThumbnailManager items={data} />

      <form onSubmit={save} className="grid gap-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
          <div className="grid gap-4">
            <input className="min-h-12 rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-tdp-yellow" placeholder="Scheme title in English" value={form.title_en} onChange={(event) => update('title_en', event.target.value)} />
            <textarea className="min-h-24 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-tdp-yellow" placeholder="Short description" value={form.shortDescription_en} onChange={(event) => update('shortDescription_en', event.target.value)} />
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <RichTextEditor value={form.description_en} onChange={(value) => update('description_en', value)} placeholder="Full description" />
            </div>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <RichTextEditor value={form.readMore_en} onChange={(value) => update('readMore_en', value)} placeholder="Read More content" />
            </div>
          </div>
          <div className="grid content-start gap-4">
            <label>
              <span className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">Display Order</span>
              <input type="number" min="1" max="6" className="min-h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" value={form.order} onChange={(event) => update('order', Number(event.target.value))} />
            </label>
            <label className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-700"><input type="checkbox" checked={!!form.isPublished} onChange={(event) => update('isPublished', event.target.checked)} /> Published</label>
            <label className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-700"><input type="checkbox" checked={!!form.isActive} onChange={(event) => update('isActive', event.target.checked)} /> Active</label>
          </div>
        </div>

        <ImageUploader onUploadStateChange={setImageUploading} value={form.images?.length ? form.images : form.image || form.thumbnail || []} onChange={(value) => Array.isArray(value) ? update('images', value) : update('thumbnail', value)} />

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-950">Videos</p>
          <p className="mt-1 text-xs text-slate-500">Use deployed paths like /videos/scheme.mp4 or hosted video URLs for permanent playback. Local file selection previews immediately but needs video storage to persist after reload.</p>
          <div className="mt-3 grid gap-2 md:grid-cols-[180px_1fr_auto_auto]">
            <input className="min-h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-tdp-yellow" placeholder="Video title" value={videoDraft.title} onChange={(event) => setVideoDraft((state) => ({ ...state, title: event.target.value }))} />
            <input className="min-h-11 rounded-lg border border-slate-200 px-3 outline-none focus:border-tdp-yellow" placeholder="/videos/super6.mp4 or https://..." value={videoDraft.url} onChange={(event) => setVideoDraft((state) => ({ ...state, url: event.target.value }))} />
            <button type="button" onClick={addVideo} className="inline-flex items-center justify-center gap-2 rounded-lg bg-tdp-red px-4 py-2 text-sm font-black text-white"><Plus size={16} /> Add URL</button>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700">
              Local Preview
              <input type="file" accept="video/*" multiple className="hidden" onChange={(event) => addLocalPreview(event.target.files)} />
            </label>
          </div>
          {!!form.videos?.length && (
            <div className="mt-4 grid gap-2">
              {normalizeVideos(form.videos).map((video, index) => (
                <div key={`${video.url}-${index}`} className="grid gap-3 rounded-lg bg-white p-3 text-sm md:grid-cols-[180px_1fr_auto] md:items-center">
                  <input className="min-h-10 rounded-lg border border-slate-200 px-3 font-semibold text-slate-700" value={video.title || ''} onChange={(event) => update('videos', normalizeVideos(form.videos).map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))} />
                  <span className="min-w-0 truncate font-semibold text-slate-700">{video.url}</span>
                  <button type="button" onClick={() => update('videos', form.videos.filter((_, itemIndex) => itemIndex !== index))} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-50 text-tdp-red" aria-label="Remove video"><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <p className="mb-3 inline-flex items-center gap-2 text-sm font-black text-slate-950"><Eye size={16} /> Card Preview</p>
          <div className="max-w-sm overflow-hidden rounded-lg border border-yellow-300 bg-white shadow-md">
            <div className="aspect-video bg-slate-100"><img src={form.thumbnail || form.image || form.images?.[0] || '/og-image.svg'} alt="" className="h-full w-full object-cover" /></div>
            <div className="p-4">
              <h3 className="line-clamp-2 text-lg font-black text-slate-950">{form.title_en || 'Super 6 Scheme Title'}</h3>
              <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{form.shortDescription_en || 'Short description preview appears here.'}</p>
              <span className="mt-4 inline-flex rounded-lg bg-tdp-yellow px-4 py-2 text-sm font-black text-tdp-navy">Read More</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button disabled={imageUploading || saving} className="inline-flex items-center gap-2 rounded-xl bg-tdp-red px-5 py-3 font-bold text-white shadow-red transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"><Save size={18} />{saving ? 'Saving...' : editing ? 'Update' : 'Save'}</button>
          <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700"><XCircle size={18} />Cancel</button>
        </div>
        {saveError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{saveError}</p>}
      </form>

      {isLoading ? <div className="rounded-2xl bg-white p-6 shadow-sm">Loading...</div> : <ContentTable items={data} onEdit={edit} onDelete={(id) => crud.remove.mutate(id)} language="en" />}
    </div>
  );
};

const ThumbnailPreview = ({ source, path, isUploading }) => {
  const [failed, setFailed] = useState(false);
  const { src, isResolving } = useResolvedImage(failed && path ? path : source, path);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div className="overflow-hidden rounded-lg border-2 border-tdp-yellow bg-black">
      {src && !failed ? (
        <img src={src} alt="" className="aspect-video w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <div className="grid aspect-video place-items-center text-slate-400">
          {isUploading || isResolving ? 'Preparing thumbnail...' : <ImagePlus size={30} />}
        </div>
      )}
    </div>
  );
};

const normalizeVideos = (videos = []) => videos.filter(Boolean).map((video, index) => {
  if (typeof video === 'string') return { title: `Video ${index + 1}`, url: video };
  return { title: video.title || `Video ${index + 1}`, url: video.url || video.src || '', previewOnly: video.previewOnly };
}).filter((video) => video.url);

export default ManageSuper6;
