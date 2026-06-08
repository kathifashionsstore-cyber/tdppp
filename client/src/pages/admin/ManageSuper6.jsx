import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Save, Trash2, XCircle } from 'lucide-react';
import ContentTable from '@/components/admin/ContentTable';
import ImageUploader from '@/components/admin/ImageUploader';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { useCollection, useCrud } from '@/hooks/useFirestore';
import { super6Schemes } from '@/data/super6Data';
import { translatePayloadFields } from '@/services/translationService';

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

const ManageSuper6 = () => {
  const { data = [], isLoading } = useCollection('super6Schemes', { orderByField: 'order', orderDirection: 'asc' });
  const crud = useCrud('super6Schemes');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [videoDraft, setVideoDraft] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const seededCount = useMemo(() => data.length, [data.length]);
  const update = (key, value) => setForm((state) => ({ ...state, [key]: value }));

  const edit = (item) => {
    setEditing(item.id);
    setForm({ ...emptyForm(), ...item, videos: item.videos || item.videoUrls || [] });
    setVideoDraft('');
  };

  const reset = () => {
    setEditing(null);
    setForm(emptyForm());
    setVideoDraft('');
  };

  const addVideo = () => {
    const value = videoDraft.trim();
    if (!value) return;
    update('videos', [...(form.videos || []), value]);
    setVideoDraft('');
  };

  const addLocalPreview = (files) => {
    const urls = Array.from(files || []).map((file) => URL.createObjectURL(file));
    if (urls.length) update('videos', [...(form.videos || []), ...urls]);
  };

  useEffect(() => () => {
    (form.videos || []).forEach((url) => {
      if (String(url).startsWith('blob:')) URL.revokeObjectURL(url);
    });
  }, [form.videos]);

  const seedDefaults = async () => {
    if (data.length >= 6) return toast('Six Super 6 entries already exist');
    try {
      await Promise.all(super6Schemes.slice(0, 6).map((scheme, index) => crud.create.mutateAsync({
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
        videos: scheme.videoSrc ? [scheme.videoSrc] : [],
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
    try {
      const image = form.image || form.thumbnail || form.images?.[0] || '';
      const payload = await translatePayloadFields({
        ...form,
        image,
        thumbnail: form.thumbnail || image,
        images: form.images?.length ? form.images : image ? [image] : [],
        videos: (form.videos || []).filter(Boolean).filter((url) => !String(url).startsWith('blob:'))
      });
      if (editing) await crud.update.mutateAsync({ id: editing, data: payload });
      else await crud.create.mutateAsync(payload);
      toast.success('Super 6 scheme saved');
      reset();
    } catch (error) {
      toast.error(error.message || 'Save failed');
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
          <p className="mt-1 text-xs text-slate-500">Use deployed paths like /videos/scheme.mp4 or hosted video URLs for permanent playback. Local file selection previews immediately but is not saved.</p>
          <div className="mt-3 flex flex-col gap-2 md:flex-row">
            <input className="min-h-11 flex-1 rounded-lg border border-slate-200 px-3 outline-none focus:border-tdp-yellow" placeholder="/videos/super6.mp4 or https://..." value={videoDraft} onChange={(event) => setVideoDraft(event.target.value)} />
            <button type="button" onClick={addVideo} className="inline-flex items-center justify-center gap-2 rounded-lg bg-tdp-red px-4 py-2 text-sm font-black text-white"><Plus size={16} /> Add URL</button>
            <label className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-black text-slate-700">
              Local Preview
              <input type="file" accept="video/*" multiple className="hidden" onChange={(event) => addLocalPreview(event.target.files)} />
            </label>
          </div>
          {!!form.videos?.length && (
            <div className="mt-4 grid gap-2">
              {form.videos.map((url, index) => (
                <div key={`${url}-${index}`} className="flex items-center justify-between gap-3 rounded-lg bg-white p-3 text-sm">
                  <span className="min-w-0 truncate font-semibold text-slate-700">{url}</span>
                  <button type="button" onClick={() => update('videos', form.videos.filter((_, itemIndex) => itemIndex !== index))} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-red-50 text-tdp-red" aria-label="Remove video"><Trash2 size={15} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button disabled={imageUploading || saving} className="inline-flex items-center gap-2 rounded-xl bg-tdp-red px-5 py-3 font-bold text-white shadow-red transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"><Save size={18} />{saving ? 'Saving...' : editing ? 'Update' : 'Save'}</button>
          <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700"><XCircle size={18} />Cancel</button>
        </div>
      </form>

      {isLoading ? <div className="rounded-2xl bg-white p-6 shadow-sm">Loading...</div> : <ContentTable items={data} onEdit={edit} onDelete={(id) => crud.remove.mutate(id)} language="en" />}
    </div>
  );
};

export default ManageSuper6;
