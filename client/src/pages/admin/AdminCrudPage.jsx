import { useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import toast from 'react-hot-toast';
import { Save, XCircle } from 'lucide-react';
import ContentTable from '@/components/admin/ContentTable';
import ImageUploader from '@/components/admin/ImageUploader';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { useCollection, useCrud } from '@/hooks/useFirestore';
import { CATEGORIES } from '@/utils/constants';
import { autoIndexContent } from '@/services/chatbotService';
import { translatePayloadFields } from '@/services/translationService';

const tomorrow = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date;
};

const emptyByType = (type) => ({
  title_en: '',
  title_te: '',
  description_en: '',
  description_te: '',
  category: CATEGORIES[type]?.[0] || 'general',
  location_en: '',
  location_te: '',
  date: new Date(),
  publishedAt: new Date(),
  images: [],
  thumbnail: '',
  image: '',
  isPublished: true,
  isFeatured: false,
  isBreaking: false,
  isActive: true,
  priority: 1,
  showOnce: true,
  order: 1,
  linkUrl: '',
  mapEmbedUrl: '',
  videoUrl: '',
  startDate: new Date(),
  endDate: type === 'festivalBanners' ? tomorrow() : new Date()
});

const AdminCrudPage = ({ collectionName, title, type = collectionName }) => {
  const { data = [], isLoading } = useCollection(collectionName, { orderByField: collectionName === 'festivalBanners' ? 'priority' : 'createdAt', orderDirection: 'desc' });
  const crud = useCrud(collectionName);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyByType(type));
  const [imageUploading, setImageUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const categories = useMemo(() => CATEGORIES[collectionName] || CATEGORIES[type] || ['general'], [collectionName, type]);
  const update = (key, value) => setForm((state) => ({ ...state, [key]: value }));
  const label = type === 'towns' ? 'Name' : 'Title';

  const normalizePayload = async () => {
    const imageValue = form.image || form.thumbnail || form.images?.[0] || '';
    const fallbackTitle = collectionName === 'narasaraopetSections' && imageValue ? `Narasaraopet Photo Frame ${new Date().toLocaleDateString('en-IN')}` : '';
    const titleValue = form.title_en || form.name_en || fallbackTitle;
    const descriptionValue = form.description_en || form.content_en || form.message_en || '';
    const locationValue = form.location_en || '';
    const payload = {
      ...form,
      title_en: titleValue,
      name_en: form.name_en || titleValue,
      description_en: descriptionValue,
      content_en: form.content_en || descriptionValue,
      message_en: form.message_en || descriptionValue,
      location_en: locationValue,
      image: imageValue,
      thumbnail: collectionName === 'news' ? imageValue : form.thumbnail || imageValue,
      images: form.images?.length ? form.images : imageValue ? [imageValue] : []
    };
    return translatePayloadFields(payload);
  };

  const edit = (item) => {
    setEditing(item.id);
    setForm({
      ...emptyByType(type),
      ...item,
      date: item.date?.toDate?.() || item.date || new Date(),
      publishedAt: item.publishedAt?.toDate?.() || item.publishedAt || new Date(),
      startDate: item.startDate?.toDate?.() || item.startDate || new Date(),
      endDate: item.endDate?.toDate?.() || item.endDate || new Date()
    });
  };

  const reset = () => {
    setEditing(null);
    setForm(emptyByType(type));
  };

  const save = async (event) => {
    event.preventDefault();
    if (imageUploading) return toast.error('Please wait until image upload finishes');
    setSaving(true);
    try {
      const payload = await normalizePayload();
      if (!payload.title_en && !payload.name_en && !payload.image && !payload.images?.length) return toast.error(`${label} or image is required`);
      const result = editing ? await crud.update.mutateAsync({ id: editing, data: payload }) : await crud.create.mutateAsync(payload);
      if (['dailyWork', 'news', 'achievements'].includes(collectionName)) {
        autoIndexContent({ ...payload, id: result.id || editing }, collectionName).catch((error) => {
          console.warn('Content saved, but chatbot indexing failed:', error);
        });
      }
      toast.success(`${title} saved`);
      reset();
    } catch (error) {
      const message = error.code === 'permission-denied'
        ? 'Save failed: please log in again with Firebase admin access.'
        : error.message || 'Save failed. Please try again.';
      toast.error(message);
      console.error('Admin save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl bg-gradient-to-r from-slate-950 to-slate-800 p-5 text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-wide text-tdp-yellow">Admin Workspace</p>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-white/65">Write in English. Telugu fields are filled automatically for public language fallback.</p>
      </div>

      <form onSubmit={save} className="grid gap-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
          <div className="grid gap-4">
            <input className="min-h-12 rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-tdp-yellow focus:ring-4 focus:ring-yellow-100" placeholder={`${label} in English`} value={form.title_en || form.name_en || ''} onChange={(e) => type === 'towns' ? update('name_en', e.target.value) : update('title_en', e.target.value)} />
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <RichTextEditor value={form.description_en || form.content_en || form.message_en || ''} onChange={(value) => update(collectionName === 'news' ? 'content_en' : collectionName === 'festivalBanners' ? 'message_en' : 'description_en', value)} placeholder="Content in English" />
            </div>
          </div>
          <div className="grid gap-4">
            <select className="min-h-12 rounded-xl border border-slate-200 px-4 capitalize outline-none focus:border-tdp-yellow" value={form.category || form.type} onChange={(e) => update(collectionName === 'towns' ? 'type' : 'category', e.target.value)}>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
            {collectionName === 'gallery' && <select className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" value={form.type || 'photo'} onChange={(e) => update('type', e.target.value)}><option value="photo">Photo</option><option value="video">YouTube Video</option></select>}
            <DatePicker className="min-h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" selected={form.date || form.publishedAt || new Date()} onChange={(date) => update(collectionName === 'news' ? 'publishedAt' : 'date', date)} />
            <input className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Location" value={form.location_en || ''} onChange={(e) => update('location_en', e.target.value)} />
            {collectionName === 'gallery' && form.type === 'video' && <input className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Paste YouTube video link" value={form.url || ''} onChange={(e) => update('url', e.target.value)} />}
            {collectionName === 'news' && <input className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Optional YouTube video link" value={form.videoUrl || ''} onChange={(e) => update('videoUrl', e.target.value)} />}
            {collectionName === 'announcements' && <input className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Optional link URL, e.g. tel:9398724704" value={form.linkUrl || ''} onChange={(e) => update('linkUrl', e.target.value)} />}
            {collectionName === 'narasaraopetSections' && <input className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Optional Google Maps embed URL" value={form.mapEmbedUrl || ''} onChange={(e) => update('mapEmbedUrl', e.target.value)} />}
            {collectionName === 'narasaraopetSections' && <input className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Optional video URL" value={form.videoUrl || ''} onChange={(e) => update('videoUrl', e.target.value)} />}
            {['narasaraopetSections', 'announcements'].includes(collectionName) && <input type="number" className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Display order" value={form.order || 1} onChange={(e) => update('order', Number(e.target.value))} />}
          </div>
        </div>

        {collectionName === 'festivalBanners' && (
          <div className="grid gap-4 md:grid-cols-2">
            <DatePicker showTimeSelect className="min-h-12 w-full rounded-xl border border-slate-200 px-4" selected={form.startDate || new Date()} onChange={(date) => update('startDate', date)} />
            <DatePicker showTimeSelect className="min-h-12 w-full rounded-xl border border-slate-200 px-4" selected={form.endDate || new Date()} onChange={(date) => update('endDate', date)} />
          </div>
        )}

        {!(collectionName === 'gallery' && form.type === 'video') && <ImageUploader onUploadStateChange={setImageUploading} multiple={collectionName === 'dailyWork' || collectionName === 'gallery' || collectionName === 'narasaraopetSections'} value={form.images?.length ? form.images : form.image || form.thumbnail || []} onChange={(value) => Array.isArray(value) ? update('images', value) : update(collectionName === 'news' ? 'thumbnail' : 'image', value)} />}
        {collectionName === 'gallery' && form.type === 'video' && <ImageUploader onUploadStateChange={setImageUploading} value={form.thumbnail || ''} onChange={(value) => update('thumbnail', value)} />}

        <div className="flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">
          <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.isPublished} onChange={(e) => update('isPublished', e.target.checked)} /> Published</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.isFeatured} onChange={(e) => update('isFeatured', e.target.checked)} /> Featured</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.isActive} onChange={(e) => update('isActive', e.target.checked)} /> Active</label>
          {collectionName === 'news' && <label className="flex items-center gap-2"><input type="checkbox" checked={!!form.isBreaking} onChange={(e) => update('isBreaking', e.target.checked)} /> Breaking</label>}
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

export default AdminCrudPage;
