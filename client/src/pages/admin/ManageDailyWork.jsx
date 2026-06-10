import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarDays, Camera, Clock3, ImagePlus, Plus, Save, Trash2, XCircle } from 'lucide-react';
import ImageUploader from '@/components/admin/ImageUploader';
import ContentTable from '@/components/admin/ContentTable';
import { useCollection, useCrud } from '@/hooks/useFirestore';
import { formatDate } from '@/utils/dateUtils';
import { confirmToast, toastError, toastSuccess } from '@/utils/toastUtils.jsx';
import { toDate } from '@/utils/helpers';
import { toImgBBUploadMeta } from '@/utils/imageUploadMeta';

const DRAFT_KEY = 'daily-work-schedule-draft';
const PHOTO_DRAFT_KEY = 'daily-work-photo-draft';

const todayInput = () => toDateInputValue(new Date());

const createEntry = (order = 1) => ({
  timeValue: '',
  meridiem: 'AM',
  time: '',
  activity_en: '',
  activity_te: '',
  location_en: '',
  location_te: '',
  order
});

const emptySchedule = () => ({
  dateInput: todayInput(),
  topImage: '',
  topImageUpload: null,
  greeting_te: 'Namaskaram to everyone',
  title_te: 'Tour schedule of Honorable Narasaraopet MLA Dr. Chadalavada Aravinda Babu',
  closingNote_te: '',
  signature_te: 'Itlu\nMLA Office',
  entries: [createEntry(1)],
  isPublished: true
});

const emptyPhoto = () => ({
  title_en: '',
  description_en: '',
  dateInput: todayInput(),
  image: '',
  images: [],
  imageUpload: null,
  category: 'visit',
  isPublished: true
});

const ManageDailyWork = () => {
  const { data: schedules = [], isLoading: schedulesLoading } = useCollection('dailySchedules', { orderByField: 'date', orderDirection: 'desc' });
  const { data: photoItems = [], isLoading: photosLoading } = useCollection('dailyWork', { orderByField: 'date', orderDirection: 'desc' });
  const scheduleCrud = useCrud('dailySchedules');
  const photoCrud = useCrud('dailyWork');
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [scheduleForm, setScheduleForm] = useState(emptySchedule);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleUploading, setScheduleUploading] = useState(false);
  const [lastAutosave, setLastAutosave] = useState('');
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [photoForm, setPhotoForm] = useState(emptyPhoto);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(DRAFT_KEY);
      if (saved) setScheduleForm((state) => ({ ...state, ...JSON.parse(saved) }));
      const savedPhoto = window.localStorage.getItem(PHOTO_DRAFT_KEY);
      if (savedPhoto) setPhotoForm((state) => ({ ...state, ...JSON.parse(savedPhoto) }));
    } catch {
      // Ignore malformed local drafts.
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      window.localStorage.setItem(DRAFT_KEY, JSON.stringify(scheduleForm));
      window.localStorage.setItem(PHOTO_DRAFT_KEY, JSON.stringify(photoForm));
      setLastAutosave(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 30_000);
    return () => window.clearInterval(timer);
  }, [photoForm, scheduleForm]);

  const dayOfWeek = useMemo(() => inputToDate(scheduleForm.dateInput).toLocaleDateString('en-IN', { weekday: 'long' }), [scheduleForm.dateInput]);
  const updateSchedule = (key, value) => setScheduleForm((state) => ({ ...state, [key]: value }));
  const updateEntry = (index, key, value) => setScheduleForm((state) => ({
    ...state,
    entries: state.entries.map((entry, entryIndex) => entryIndex === index ? { ...entry, [key]: value } : entry)
  }));
  const updatePhoto = (key, value) => setPhotoForm((state) => ({ ...state, [key]: value }));

  const addEntry = () => setScheduleForm((state) => ({ ...state, entries: [...state.entries, createEntry(state.entries.length + 1)] }));
  const removeEntry = (index) => setScheduleForm((state) => ({
    ...state,
    entries: state.entries.filter((_, entryIndex) => entryIndex !== index).map((entry, entryIndex) => ({ ...entry, order: entryIndex + 1 }))
  }));

  const resetSchedule = () => {
    setEditingSchedule(null);
    setScheduleForm(emptySchedule());
    window.localStorage.removeItem(DRAFT_KEY);
  };

  const resetPhoto = () => {
    setEditingPhoto(null);
    setPhotoForm(emptyPhoto());
    window.localStorage.removeItem(PHOTO_DRAFT_KEY);
  };

  const editSchedule = (item) => {
    setEditingSchedule(item.id);
    setScheduleForm({
      ...emptySchedule(),
      ...item,
      dateInput: toDateInputValue(item.date),
      topImage: item.topImage || item.topImageUrl || '',
      topImageUpload: item.topImageUpload || null,
      entries: (item.entries?.length ? item.entries : [createEntry(1)]).map((entry, index) => ({
        ...createEntry(index + 1),
        ...entry,
        ...splitTime(entry.time),
        order: entry.order || index + 1
      }))
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveSchedule = async (event) => {
    event.preventDefault();
    if (scheduleUploading) return toast.error('Please wait until the top image upload finishes');
    const entries = scheduleForm.entries
      .map((entry, index) => {
        const time = formatEntryTime(entry);
        const activity = entry.activity_te || entry.activity_en || '';
        const location = entry.location_te || entry.location_en || '';
        return {
          ...entry,
          time,
          activity_en: entry.activity_en || activity,
          activity_te: entry.activity_te || activity,
          location_en: entry.location_en || location,
          location_te: entry.location_te || location,
          status: 'upcoming',
          order: Number(entry.order) || index + 1
        };
      })
      .filter((entry) => entry.time && (entry.activity_en || entry.activity_te));
    if (!entries.length) return toast.error('Add at least one schedule entry');

    setScheduleSaving(true);
    try {
      const topImageUpload = scheduleForm.topImageUpload || null;
      const payload = {
        date: inputToDate(scheduleForm.dateInput),
        topImage: scheduleForm.topImage || '',
        topImageUrl: scheduleForm.topImage || '',
        ...(topImageUpload ? {
          topImageUpload,
          topImageDeleteUrl: topImageUpload.deleteUrl,
          topImageThumbUrl: topImageUpload.thumbUrl,
          topImageImgBBId: topImageUpload.imgbbId
        } : {}),
        greeting_te: scheduleForm.greeting_te || '',
        greeting_en: scheduleForm.greeting_te || '',
        title_te: scheduleForm.title_te || '',
        title_en: scheduleForm.title_te || '',
        closingNote_te: scheduleForm.closingNote_te || '',
        closingNote_en: scheduleForm.closingNote_te || '',
        signature_te: scheduleForm.signature_te || '',
        entries,
        isPublished: !!scheduleForm.isPublished
      };
      if (editingSchedule) await scheduleCrud.update.mutateAsync({ id: editingSchedule, data: payload });
      else await scheduleCrud.create.mutateAsync(payload);
      toast.success('Today\'s schedule published successfully');
      resetSchedule();
    } catch (error) {
      toastError(error, 'Schedule save failed');
    } finally {
      setScheduleSaving(false);
    }
  };

  const removeSchedule = async (item) => {
    const confirmed = await confirmToast({
      title: 'Delete schedule?',
      message: `Delete the schedule for ${formatDate(item.date)}?`,
      confirmLabel: 'Delete'
    });
    if (!confirmed) return;
    try {
      await scheduleCrud.remove.mutateAsync(item.id);
      toastSuccess('Schedule deleted');
    } catch (error) {
      toastError(error, 'Delete failed');
    }
  };

  const editPhoto = (item) => {
    setEditingPhoto(item.id);
    setPhotoForm({
      ...emptyPhoto(),
      ...item,
      dateInput: toDateInputValue(item.date || item.createdAt),
      image: item.image || item.images?.[0] || '',
      images: item.images?.length ? item.images : item.image ? [item.image] : [],
      imageUpload: item.imageUpload || null
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const savePhoto = async (event) => {
    event.preventDefault();
    if (photoUploading) return toast.error('Please wait until photo upload finishes');
    const image = photoForm.image || photoForm.images?.[0] || '';
    if (!image) return toast.error('Upload one photo');
    if (!photoForm.title_en.trim()) return toast.error('Title is required');
    setPhotoSaving(true);
    try {
      const imageUpload = photoForm.imageUpload || null;
      const payload = {
        title_en: photoForm.title_en.trim(),
        title_te: photoForm.title_te || photoForm.title_en.trim(),
        description_en: photoForm.description_en || '',
        description_te: photoForm.description_te || photoForm.description_en || '',
        date: inputToDate(photoForm.dateInput),
        image,
        images: [image],
        ...(imageUpload ? {
          imageUrl: imageUpload.imageUrl,
          displayUrl: imageUpload.displayUrl,
          thumbUrl: imageUpload.thumbUrl,
          deleteUrl: imageUpload.deleteUrl,
          imgbbId: imageUpload.imgbbId,
          sizeKB: imageUpload.sizeKB,
          format: imageUpload.format,
          imageUpload
        } : {}),
        category: photoForm.category || 'visit',
        isPublished: !!photoForm.isPublished,
        isActive: !!photoForm.isPublished
      };
      if (editingPhoto) await photoCrud.update.mutateAsync({ id: editingPhoto, data: payload });
      else await photoCrud.create.mutateAsync(payload);
      toast.success('Daily work photo saved');
      resetPhoto();
    } catch (error) {
      toastError(error, 'Photo save failed');
    } finally {
      setPhotoSaving(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl bg-gradient-to-r from-slate-950 to-slate-800 p-5 text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-wide text-tdp-yellow">Daily Work Manager</p>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">Today&apos;s Schedule + Work Photos</h1>
        <p className="mt-1 text-sm text-white/65">Mobile-friendly schedule publishing with autosave and a separate photo updates manager.</p>
        {lastAutosave && <p className="mt-3 text-xs font-black text-tdp-yellow">Draft autosaved at {lastAutosave}</p>}
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
        <div className="mb-5">
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-tdp-red"><Clock3 size={15} /> Today&apos;s Schedule Manager</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">{editingSchedule ? 'Edit Schedule' : 'Publish Today\'s Schedule'}</h2>
        </div>

        <form onSubmit={saveSchedule} className="grid gap-5">
          <label className="grid gap-1 text-sm font-black text-slate-700">
            Date
            <input type="date" value={scheduleForm.dateInput} onChange={(event) => updateSchedule('dateInput', event.target.value)} className="min-h-12 rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-tdp-yellow" />
          </label>

          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-yellow-800">Auto Day</p>
            <p className="mt-1 text-lg font-black text-slate-950">{dayOfWeek}</p>
          </div>

          <ImageUploader
            label="Top Image"
            value={scheduleForm.topImage || ''}
            aspectRatio="16/9"
            onUploadStateChange={setScheduleUploading}
            onChange={(url) => updateSchedule('topImage', url)}
            onUploadComplete={(uploaded) => {
              const metadata = toImgBBUploadMeta(uploaded);
              if (metadata) setScheduleForm((state) => ({ ...state, topImage: metadata.imageUrl, topImageUpload: metadata }));
            }}
          />

          <label className="grid gap-1 text-sm font-black text-slate-700">
            Greeting
            <input value={scheduleForm.greeting_te || ''} onChange={(event) => updateSchedule('greeting_te', event.target.value)} className="telugu min-h-12 rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-tdp-yellow" placeholder="Greeting" />
          </label>

          <label className="grid gap-1 text-sm font-black text-slate-700">
            MLA Title
            <input value={scheduleForm.title_te || ''} onChange={(event) => updateSchedule('title_te', event.target.value)} className="telugu min-h-12 rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-tdp-yellow" placeholder="MLA title" />
          </label>

          <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-tdp-red"><CalendarDays size={15} /> Schedule Entries</p>
                <p className="mt-1 text-sm font-semibold text-slate-500">Use native time inputs for mobile entry.</p>
              </div>
              <button type="button" onClick={addEntry} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-tdp-yellow px-4 text-base font-black text-tdp-navy shadow-yellow md:w-auto"><Plus size={17} /> Add Another Entry</button>
            </div>

            <div className="grid gap-4">
              {scheduleForm.entries.map((entry, index) => (
                <article key={index} className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-black text-slate-950">Entry {index + 1}</h3>
                    <button type="button" onClick={() => removeEntry(index)} disabled={scheduleForm.entries.length === 1} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 font-black text-red-700 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={17} /> Delete Entry</button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                    <label className="grid gap-1 text-sm font-black text-slate-700">
                      Time
                      <input type="time" value={entry.timeValue || ''} onChange={(event) => updateEntry(index, 'timeValue', event.target.value)} className="min-h-12 rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-tdp-yellow" />
                    </label>
                    <label className="grid gap-1 text-sm font-black text-slate-700">
                      AM/PM
                      <select value={entry.meridiem || 'AM'} onChange={(event) => updateEntry(index, 'meridiem', event.target.value)} className="min-h-12 rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-tdp-yellow">
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </label>
                  </div>
                  <label className="grid gap-1 text-sm font-black text-slate-700">
                    Activity
                    <input value={entry.activity_te || entry.activity_en || ''} onChange={(event) => { updateEntry(index, 'activity_te', event.target.value); updateEntry(index, 'activity_en', event.target.value); }} className="telugu min-h-12 rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-tdp-yellow" />
                  </label>
                  <label className="grid gap-1 text-sm font-black text-slate-700">
                    Location
                    <input value={entry.location_te || entry.location_en || ''} onChange={(event) => { updateEntry(index, 'location_te', event.target.value); updateEntry(index, 'location_en', event.target.value); }} className="telugu min-h-12 rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-tdp-yellow" />
                  </label>
                </article>
              ))}
            </div>
          </section>

          <label className="grid gap-1 text-sm font-black text-slate-700">
            Closing Note
            <textarea value={scheduleForm.closingNote_te || ''} onChange={(event) => updateSchedule('closingNote_te', event.target.value)} className="telugu min-h-32 rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-tdp-yellow" placeholder="Who should attend paragraph" />
          </label>

          <button disabled={scheduleSaving || scheduleUploading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-tdp-red px-5 text-base font-black uppercase tracking-[0.06em] text-white shadow-red disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none">
            <Save size={18} /> {scheduleSaving ? 'Publishing...' : 'Publish Today\'s Schedule'}
          </button>
          <button type="button" onClick={resetSchedule} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 font-black text-slate-700"><XCircle size={18} /> Reset Schedule Form</button>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
        <h2 className="mb-4 inline-flex items-center gap-2 text-xl font-black text-slate-950"><CalendarDays size={20} className="text-tdp-red" /> Saved Schedules</h2>
        {schedulesLoading ? (
          <div className="rounded-xl bg-slate-50 p-5 font-bold text-slate-500">Loading schedules...</div>
        ) : (
          <div className="grid gap-3">
            {schedules.map((item) => (
              <div key={item.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-mono text-xs text-slate-500">{formatDate(item.date)}</p>
                  <p className="font-black text-slate-950">{item.greeting_te || item.greeting_en || 'Daily schedule'}</p>
                  <p className="text-sm font-semibold text-slate-500">{item.entries?.length || 0} entries - {item.isPublished ? 'Published' : 'Draft'}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => editSchedule(item)} className="min-h-12 flex-1 rounded-xl border border-blue-200 px-4 font-black text-blue-700 md:flex-none">Edit</button>
                  <button type="button" onClick={() => removeSchedule(item)} className="min-h-12 flex-1 rounded-xl border border-red-200 px-4 font-black text-red-700 md:flex-none">Delete</button>
                </div>
              </div>
            ))}
            {!schedules.length && <div className="rounded-xl bg-slate-50 p-5 text-center font-bold text-slate-500">No schedules added yet.</div>}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
        <div className="mb-5">
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-tdp-red"><Camera size={15} /> Daily Work Photos Manager</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">{editingPhoto ? 'Edit Work Update' : 'Add New Work Update'}</h2>
        </div>

        <form onSubmit={savePhoto} className="grid gap-4">
          <ImageUploader
            label="Photo"
            value={photoForm.image || photoForm.images?.[0] || ''}
            aspectRatio="16/9"
            onUploadStateChange={setPhotoUploading}
            onChange={(url) => setPhotoForm((state) => ({ ...state, image: url, images: [url].filter(Boolean) }))}
            onUploadComplete={(uploaded) => {
              const metadata = toImgBBUploadMeta(uploaded);
              if (metadata) setPhotoForm((state) => ({ ...state, image: metadata.imageUrl, images: [metadata.imageUrl], imageUpload: metadata }));
            }}
          />
          <label className="grid gap-1 text-sm font-black text-slate-700">
            Title
            <input value={photoForm.title_en || ''} onChange={(event) => updatePhoto('title_en', event.target.value)} className="min-h-12 rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-tdp-yellow" />
          </label>
          <label className="grid gap-1 text-sm font-black text-slate-700">
            Date
            <input type="date" value={photoForm.dateInput} onChange={(event) => updatePhoto('dateInput', event.target.value)} className="min-h-12 rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-tdp-yellow" />
          </label>
          <label className="grid gap-1 text-sm font-black text-slate-700">
            Description
            <textarea value={photoForm.description_en || ''} onChange={(event) => updatePhoto('description_en', event.target.value)} className="min-h-32 rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-tdp-yellow" />
          </label>
          <label className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-50 px-4 text-sm font-black text-slate-700">
            <input type="checkbox" checked={!!photoForm.isPublished} onChange={(event) => updatePhoto('isPublished', event.target.checked)} />
            Published
          </label>
          <button disabled={photoSaving || photoUploading} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-tdp-red px-5 text-base font-black text-white shadow-red disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none">
            <ImagePlus size={18} /> {photoSaving ? 'Saving...' : 'Save Work Update'}
          </button>
          <button type="button" onClick={resetPhoto} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 font-black text-slate-700"><XCircle size={18} /> Reset Photo Form</button>
        </form>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
        <h2 className="mb-4 text-xl font-black text-slate-950">Saved Work Updates</h2>
        {photosLoading ? <div className="rounded-xl bg-slate-50 p-5 font-bold text-slate-500">Loading work updates...</div> : <ContentTable items={photoItems} onEdit={editPhoto} onDelete={(id) => photoCrud.remove.mutateAsync(id)} language="en" />}
      </section>
    </div>
  );
};

const toDateInputValue = (value) => {
  const date = toDate(value) || new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const inputToDate = (value) => {
  if (!value) return new Date();
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

const splitTime = (value = '') => {
  const text = String(value || '').trim();
  const match = text.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match) return {};
  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridiem = (match[3] || (hours >= 12 ? 'PM' : 'AM')).toUpperCase();
  if (hours > 12) hours -= 12;
  return {
    timeValue: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
    meridiem
  };
};

const formatEntryTime = (entry) => {
  if (!entry.timeValue) return entry.time || '';
  const [hour, minute] = entry.timeValue.split(':');
  let hourNumber = Number(hour || 0);
  if (hourNumber > 12) hourNumber -= 12;
  if (hourNumber === 0) hourNumber = 12;
  return `${hourNumber}:${minute || '00'} ${entry.meridiem || 'AM'}`;
};

export default ManageDailyWork;
