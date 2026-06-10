import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Landmark, MapPinned, Plus, Save, Trash2, XCircle } from 'lucide-react';
import ImageUploader from '@/components/admin/ImageUploader';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { useCollection, useCrud } from '@/hooks/useFirestore';
import { confirmToast, toastError, toastSuccess } from '@/utils/toastUtils.jsx';

const sections = [
  {
    key: 'about',
    title: 'General Info',
    eyebrow: 'About text and key stats',
    icon: Landmark,
    categories: ['about']
  },
  {
    key: 'history',
    title: 'History of Narasaraopet',
    eyebrow: 'Animated public timeline entries',
    icon: Landmark,
    categories: ['history', 'timeline']
  },
  {
    key: 'attraction',
    title: 'Attractions / Places',
    eyebrow: 'Photo cards with read more and Google Maps links',
    icon: MapPinned,
    categories: ['attraction', 'temple', 'tourism', 'development']
  }
];

const emptyEntry = (category = 'attraction', order = 1) => ({
  title_en: '',
  title_te: '',
  description_en: '',
  description_te: '',
  category,
  dateYear: '',
  linkUrl: '',
  mapEmbedUrl: '',
  images: [],
  image: '',
  order,
  stat_population: '',
  stat_district: '',
  stat_mandalsCount: '',
  isActive: true,
  isPublished: true
});

const ManageNarasaraopet = () => {
  const { data = [], isLoading } = useCollection('narasaraopetSections', { orderByField: 'order', orderDirection: 'asc' });
  const crud = useCrud('narasaraopetSections');
  const sorted = useMemo(() => [...data].sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99)), [data]);

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl bg-gradient-to-r from-slate-950 to-slate-800 p-5 text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-wide text-tdp-yellow">Narasaraopet Page Manager</p>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">Complete Constituency Page Control</h1>
        <p className="mt-1 text-sm text-white/65">Manage history, places, Google Maps links, photos, and general profile stats for the public Narasaraopet page.</p>
      </div>

      {sections.map((section) => (
        <SectionPanel
          key={section.key}
          section={section}
          items={sorted.filter((item) => section.categories.includes(item.category))}
          isLoading={isLoading}
          crud={crud}
        />
      ))}
    </div>
  );
};

const SectionPanel = ({ section, items, isLoading, crud }) => {
  const [adding, setAdding] = useState(false);
  const Icon = section.icon;
  const newOrder = items.length + 1;

  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-tdp-red"><Icon size={15} /> {section.eyebrow}</p>
          <h2 className="mt-1 text-xl font-black text-slate-950 md:text-2xl">{section.title}</h2>
        </div>
        <button type="button" onClick={() => setAdding(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-tdp-yellow px-4 text-sm font-black text-tdp-navy shadow-yellow">
          <Plus size={17} /> Add New Entry
        </button>
      </div>

      <div className="grid gap-4">
        {adding && (
          <EntryEditor
            item={emptyEntry(section.categories[0], newOrder)}
            crud={crud}
            onDone={() => setAdding(false)}
            onCancel={() => setAdding(false)}
          />
        )}

        {isLoading ? (
          <div className="rounded-xl bg-slate-50 p-5 font-bold text-slate-500">Loading entries...</div>
        ) : (
          items.map((item, index) => <EntryEditor key={item.id} item={{ ...emptyEntry(item.category, index + 1), ...item }} crud={crud} />)
        )}

        {!isLoading && !items.length && !adding && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center font-bold text-slate-500">No entries yet. Add the first one for this section.</div>
        )}
      </div>
    </section>
  );
};

const EntryEditor = ({ item, crud, onDone, onCancel }) => {
  const [form, setForm] = useState(() => normalizeForm(item));
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const isNew = !item.id;

  useEffect(() => {
    setForm(normalizeForm(item));
  }, [item]);

  const update = (key, value) => setForm((state) => ({ ...state, [key]: value }));

  const save = async (event) => {
    event.preventDefault();
    if (imageUploading) return toast.error('Please wait until image upload finishes');
    if (!form.title_en && !form.title_te && !form.description_en && !form.description_te && !form.images.length) return toast.error('Add a title, description, or photo');
    setSaving(true);
    try {
      const images = form.images?.length ? form.images : form.image ? [form.image] : [];
      const payload = {
        ...form,
        images,
        image: images[0] || '',
        order: Number(form.order) || 1,
        isPublished: !!form.isActive,
        stats: buildStats(form)
      };
      if (isNew) await crud.create.mutateAsync(payload);
      else await crud.update.mutateAsync({ id: item.id, data: payload });
      toast.success('Entry saved successfully');
      onDone?.();
    } catch (error) {
      toastError(error, 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (isNew) {
      onCancel?.();
      return;
    }
    const confirmed = await confirmToast({
      title: 'Delete entry?',
      message: `Delete "${form.title_en || form.title_te || 'this entry'}"? This cannot be undone.`,
      confirmLabel: 'Delete'
    });
    if (!confirmed) return;
    try {
      await crud.remove.mutateAsync(item.id);
      toastSuccess('Entry deleted');
    } catch (error) {
      toastError(error, 'Delete failed');
    }
  };

  return (
    <form onSubmit={save} className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{form.category} entry</p>
          <h3 className="font-black text-slate-950">{isNew ? 'New Entry' : form.title_en || form.title_te || 'Untitled Entry'}</h3>
        </div>
        <label className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-black text-slate-700 ring-1 ring-slate-200">
          <input type="checkbox" checked={!!form.isActive} onChange={(event) => update('isActive', event.target.checked)} />
          Active
        </label>
      </div>

      <ImageUploader label="Photo Upload" multiple value={form.images || []} maxSizeKB={300} onUploadStateChange={setImageUploading} onChange={(value) => update('images', Array.isArray(value) ? value : [value].filter(Boolean))} />

      <div className="grid gap-3 md:grid-cols-2">
        <input className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Title (English)" value={form.title_en || ''} onChange={(event) => update('title_en', event.target.value)} />
        <input className="telugu min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Title (Telugu)" value={form.title_te || ''} onChange={(event) => update('title_te', event.target.value)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">Description English</div>
          <RichTextEditor value={form.description_en || ''} onChange={(value) => update('description_en', value)} placeholder="Full description in English" />
        </div>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">Description Telugu</div>
          <RichTextEditor value={form.description_te || ''} onChange={(value) => update('description_te', value)} placeholder="Full description in Telugu" />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <select className="min-h-12 rounded-xl border border-slate-200 px-4 capitalize outline-none focus:border-tdp-yellow" value={form.category || 'attraction'} onChange={(event) => update('category', event.target.value)}>
          <option value="about">about</option>
          <option value="history">history</option>
          <option value="attraction">attraction</option>
          <option value="temple">temple</option>
          <option value="tourism">tourism</option>
          <option value="development">development</option>
          <option value="map">map</option>
        </select>
        <input className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Date / Year" value={form.dateYear || ''} onChange={(event) => update('dateYear', event.target.value)} />
        <input type="number" className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Order" value={form.order || 1} onChange={(event) => update('order', Number(event.target.value))} />
        <input className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Google Maps URL" value={form.linkUrl || ''} onChange={(event) => update('linkUrl', event.target.value)} />
      </div>

      {form.category === 'about' && (
        <div className="grid gap-3 rounded-xl border border-yellow-200 bg-yellow-50 p-4 md:grid-cols-3">
          <input className="min-h-12 rounded-xl border border-yellow-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Population" value={form.stat_population || ''} onChange={(event) => update('stat_population', event.target.value)} />
          <input className="min-h-12 rounded-xl border border-yellow-200 px-4 outline-none focus:border-tdp-yellow" placeholder="District" value={form.stat_district || ''} onChange={(event) => update('stat_district', event.target.value)} />
          <input className="min-h-12 rounded-xl border border-yellow-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Mandals count" value={form.stat_mandalsCount || ''} onChange={(event) => update('stat_mandalsCount', event.target.value)} />
        </div>
      )}

      <input className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Optional Google Maps embed URL" value={form.mapEmbedUrl || ''} onChange={(event) => update('mapEmbedUrl', event.target.value)} />

      <div className="flex flex-wrap gap-3">
        <button disabled={saving || imageUploading} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-tdp-red px-5 font-bold text-white shadow-red transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"><Save size={18} />{saving ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={remove} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-red-200 bg-white px-5 font-bold text-red-700"><Trash2 size={18} />Delete</button>
        {onCancel && <button type="button" onClick={onCancel} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 font-bold text-slate-700"><XCircle size={18} />Cancel</button>}
      </div>
    </form>
  );
};

const normalizeForm = (item) => {
  const stats = item.stats || [];
  const getStat = (label) => stats.find((stat) => String(stat.label || '').toLowerCase().includes(label))?.number || '';
  return {
    ...emptyEntry(item.category, item.order),
    ...item,
    images: item.images?.length ? item.images : item.image ? [item.image] : [],
    stat_population: item.stat_population || getStat('population'),
    stat_district: item.stat_district || getStat('district'),
    stat_mandalsCount: item.stat_mandalsCount || getStat('mandal')
  };
};

const buildStats = (form) => [
  form.stat_population ? { label: 'Population', number: form.stat_population } : null,
  form.stat_district ? { label: 'District', number: form.stat_district } : null,
  form.stat_mandalsCount ? { label: 'Mandals', number: form.stat_mandalsCount } : null
].filter(Boolean);

export default ManageNarasaraopet;
