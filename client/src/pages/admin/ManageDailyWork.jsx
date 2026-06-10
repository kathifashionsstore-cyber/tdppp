import { useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import toast from 'react-hot-toast';
import { CalendarDays, ClipboardList, CopyPlus, Plus, Save, Trash2, XCircle } from 'lucide-react';
import ImageUploader from '@/components/admin/ImageUploader';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { useCollection, useCrud } from '@/hooks/useFirestore';
import { formatDate } from '@/utils/dateUtils';
import { confirmToast, toastError, toastSuccess } from '@/utils/toastUtils.jsx';
import { toDate } from '@/utils/helpers';

const createEntry = (order = 1) => ({
  time: '',
  activity_en: '',
  activity_te: '',
  location_en: '',
  location_te: '',
  status: 'upcoming',
  autoCompleteTime: '',
  photos: [],
  order
});

const emptySchedule = () => ({
  date: new Date(),
  greeting_en: 'Namaskaram to everyone',
  greeting_te: '🙏 అందరికీ నమస్కారం 🙏',
  title_en: 'Tour schedule of Honorable Narasaraopet MLA Dr. Chadalavada Aravinda Babu',
  title_te: 'గౌరవ నరసరావుపేట శాసనసభ్యులు డాక్టర్ చదలవాడ అరవింద బాబు గారి పర్యటన వివరాలు',
  closingNote_en: '<p>Party leaders, cadre, and people of the concerned areas are requested to attend.</p>',
  closingNote_te: '<p>సంబంధిత నాయకులు, కార్యకర్తలు మరియు ప్రజలు పాల్గొనగలరు.</p>',
  signature_te: 'ఇట్లు\nశాసన సభ్యులు వారి కార్యాలయం',
  entries: [createEntry(1)],
  isPublished: true
});

const ManageDailyWork = () => {
  const { data = [], isLoading } = useCollection('dailySchedules', { orderByField: 'date', orderDirection: 'desc' });
  const crud = useCrud('dailySchedules');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptySchedule);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({});

  const uploadBusy = useMemo(() => Object.values(uploading).some(Boolean), [uploading]);
  const dayOfWeek = useMemo(() => toDate(form.date)?.toLocaleDateString('en-IN', { weekday: 'long' }) || '', [form.date]);

  const update = (key, value) => setForm((state) => ({ ...state, [key]: value }));
  const updateEntry = (index, key, value) => setForm((state) => ({
    ...state,
    entries: state.entries.map((entry, entryIndex) => entryIndex === index ? { ...entry, [key]: value } : entry)
  }));

  const addEntry = () => setForm((state) => ({
    ...state,
    entries: [...state.entries, createEntry(state.entries.length + 1)]
  }));

  const removeEntry = (index) => setForm((state) => ({
    ...state,
    entries: state.entries.filter((_, entryIndex) => entryIndex !== index).map((entry, entryIndex) => ({ ...entry, order: entryIndex + 1 }))
  }));

  const reset = () => {
    setEditing(null);
    setForm(emptySchedule());
    setUploading({});
  };

  const edit = (item) => {
    setEditing(item.id);
    setForm({
      ...emptySchedule(),
      ...item,
      date: toDate(item.date) || new Date(),
      entries: (item.entries?.length ? item.entries : [createEntry(1)]).map((entry, index) => ({
        ...createEntry(index + 1),
        ...entry,
        photos: entry.photos || entry.images || []
      }))
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeSchedule = async (item) => {
    const confirmed = await confirmToast({
      title: 'Delete schedule?',
      message: `Delete the schedule for ${formatDate(item.date)}? This cannot be undone.`,
      confirmLabel: 'Delete'
    });
    if (!confirmed) return;
    try {
      await crud.remove.mutateAsync(item.id);
      toastSuccess('Schedule deleted');
    } catch (error) {
      toastError(error, 'Delete failed');
    }
  };

  const save = async (event) => {
    event.preventDefault();
    if (uploadBusy) return toast.error('Please wait until all image uploads finish');
    const entries = form.entries
      .map((entry, index) => ({
        ...entry,
        order: Number(entry.order) || index + 1,
        time: entry.time.trim(),
        activity_en: entry.activity_en.trim(),
        activity_te: entry.activity_te.trim(),
        location_en: entry.location_en.trim(),
        location_te: entry.location_te.trim(),
        photos: entry.photos || []
      }))
      .filter((entry) => entry.time || entry.activity_en || entry.activity_te);
    if (!entries.length) return toast.error('Add at least one schedule entry');
    setSaving(true);
    try {
      const payload = {
        ...form,
        date: toDate(form.date) || new Date(),
        entries: entries.sort((a, b) => (a.order || 99) - (b.order || 99))
      };
      if (editing) await crud.update.mutateAsync({ id: editing, data: payload });
      else await crud.create.mutateAsync(payload);
      toast.success('Schedule saved successfully');
      reset();
    } catch (error) {
      toastError(error, 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl bg-gradient-to-r from-slate-950 to-slate-800 p-5 text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-wide text-tdp-yellow">Daily Work Manager</p>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">Today&apos;s Schedule Itinerary</h1>
        <p className="mt-1 text-sm text-white/65">Create the live public timeline, car progress state, and WhatsApp share text for each day.</p>
      </div>

      <form onSubmit={save} className="grid gap-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-tdp-red"><CalendarDays size={15} /> Schedule Header</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">{editing ? 'Edit Schedule' : 'Add New Schedule'}</h2>
          </div>
          <label className="inline-flex min-h-11 items-center gap-2 rounded-full bg-slate-100 px-4 text-sm font-black text-slate-700">
            <input type="checkbox" checked={!!form.isPublished} onChange={(event) => update('isPublished', event.target.checked)} />
            {form.isPublished ? 'Published' : 'Draft'}
          </label>
        </div>

        <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
          <div className="grid gap-3">
            <label className="grid gap-1 text-sm font-black text-slate-700">
              Date
              <DatePicker className="min-h-12 w-full rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" selected={toDate(form.date) || new Date()} onChange={(date) => update('date', date)} />
            </label>
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-yellow-800">Auto Day</p>
              <p className="mt-1 text-lg font-black text-slate-950">{dayOfWeek}</p>
            </div>
          </div>
          <div className="grid gap-3">
            <input className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Day greeting in English" value={form.greeting_en || ''} onChange={(event) => update('greeting_en', event.target.value)} />
            <input className="telugu min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Day greeting in Telugu" value={form.greeting_te || ''} onChange={(event) => update('greeting_te', event.target.value)} />
            <input className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="MLA title and name in English" value={form.title_en || ''} onChange={(event) => update('title_en', event.target.value)} />
            <input className="telugu min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="MLA title and name in Telugu" value={form.title_te || ''} onChange={(event) => update('title_te', event.target.value)} />
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-tdp-red"><ClipboardList size={15} /> Schedule Entries</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">Set manual status or add an auto-complete time for live updates.</p>
            </div>
            <button type="button" onClick={addEntry} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-tdp-yellow px-4 text-sm font-black text-tdp-navy shadow-yellow"><Plus size={17} /> Add New Entry</button>
          </div>

          <div className="grid gap-4">
            {form.entries.map((entry, index) => (
              <article key={index} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-black text-slate-950">Entry {index + 1}</h3>
                  <button type="button" onClick={() => removeEntry(index)} disabled={form.entries.length === 1} className="grid h-11 w-11 place-items-center rounded-full border border-red-200 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Delete entry"><Trash2 size={17} /></button>
                </div>
                <div className="grid gap-3 md:grid-cols-4">
                  <input className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Time, e.g. 9:00 AM" value={entry.time || ''} onChange={(event) => updateEntry(index, 'time', event.target.value)} />
                  <select className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" value={entry.status || 'upcoming'} onChange={(event) => updateEntry(index, 'status', event.target.value)}>
                    <option value="upcoming">Upcoming</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                  <input type="time" className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" value={entry.autoCompleteTime || ''} onChange={(event) => updateEntry(index, 'autoCompleteTime', event.target.value)} aria-label="Auto-complete time" />
                  <input type="number" className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Order" value={entry.order || index + 1} onChange={(event) => updateEntry(index, 'order', Number(event.target.value))} />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Activity in English" value={entry.activity_en || ''} onChange={(event) => updateEntry(index, 'activity_en', event.target.value)} />
                  <input className="telugu min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Activity in Telugu" value={entry.activity_te || ''} onChange={(event) => updateEntry(index, 'activity_te', event.target.value)} />
                  <input className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Location in English" value={entry.location_en || ''} onChange={(event) => updateEntry(index, 'location_en', event.target.value)} />
                  <input className="telugu min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Location in Telugu" value={entry.location_te || ''} onChange={(event) => updateEntry(index, 'location_te', event.target.value)} />
                </div>
                <ImageUploader
                  label="Completed Event Photos"
                  multiple
                  value={entry.photos || []}
                  onUploadStateChange={(busy) => setUploading((state) => ({ ...state, [index]: busy }))}
                  onChange={(value) => updateEntry(index, 'photos', Array.isArray(value) ? value : [value].filter(Boolean))}
                />
              </article>
            ))}
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">Closing Note English</div>
            <RichTextEditor value={form.closingNote_en || ''} onChange={(value) => update('closingNote_en', value)} placeholder="Closing note in English" />
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 bg-slate-50 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-slate-500">Closing Note Telugu</div>
            <RichTextEditor value={form.closingNote_te || ''} onChange={(value) => update('closingNote_te', value)} placeholder="Closing note in Telugu" />
          </div>
        </div>

        <textarea className="telugu min-h-28 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-tdp-yellow" placeholder="WhatsApp signature in Telugu" value={form.signature_te || ''} onChange={(event) => update('signature_te', event.target.value)} />

        <div className="flex flex-wrap gap-3">
          <button disabled={saving || uploadBusy} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-tdp-red px-5 font-bold text-white shadow-red transition hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"><Save size={18} />{saving ? 'Saving...' : editing ? 'Update Schedule' : 'Save Schedule'}</button>
          <button type="button" onClick={reset} className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 px-5 font-bold text-slate-700"><XCircle size={18} />Cancel</button>
        </div>
      </form>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
        <h2 className="mb-4 inline-flex items-center gap-2 text-xl font-black text-slate-950"><CopyPlus size={20} className="text-tdp-red" /> Saved Daily Schedules</h2>
        {isLoading ? (
          <div className="rounded-xl bg-slate-50 p-5 font-bold text-slate-500">Loading schedules...</div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr><th className="p-3">Date</th><th className="p-3">Greeting</th><th className="p-3">Entries</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr>
              </thead>
              <tbody>
                {data.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="p-3 font-mono text-xs">{formatDate(item.date)}</td>
                    <td className="p-3 font-black text-slate-800">{item.greeting_en || item.greeting_te || 'Daily schedule'}</td>
                    <td className="p-3">{item.entries?.length || 0}</td>
                    <td className="p-3"><span className={`rounded-full px-2 py-1 text-xs font-bold ${item.isPublished ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{item.isPublished ? 'Published' : 'Draft'}</span></td>
                    <td className="p-3 text-right">
                      <button type="button" onClick={() => edit(item)} className="mr-2 min-h-11 rounded-lg px-3 font-black text-blue-700">Edit</button>
                      <button type="button" onClick={() => removeSchedule(item)} className="min-h-11 rounded-lg px-3 font-black text-red-700">Delete</button>
                    </td>
                  </tr>
                ))}
                {!data.length && <tr><td colSpan="5" className="p-6 text-center font-bold text-slate-500">No schedules added yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default ManageDailyWork;
