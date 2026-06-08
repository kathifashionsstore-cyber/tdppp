import { useState } from 'react';
import toast from 'react-hot-toast';
import { Edit, Plus, Save, Trash2, XCircle } from 'lucide-react';
import { useDoc, useCrud } from '@/hooks/useFirestore';
import ImageUploader from '@/components/admin/ImageUploader';

const initialSlide = { title_en: '', subtitle_en: '', tag_en: '', ctaText_en: '', ctaLink: '/daily-work', image: '' };

const ManageHome = () => {
  const { data } = useDoc('heroSections', 'home');
  const crud = useCrud('heroSections');
  const [slide, setSlide] = useState(initialSlide);
  const [editingId, setEditingId] = useState(null);
  const slides = data?.slides || [];

  const reset = () => {
    setEditingId(null);
    setSlide(initialSlide);
  };

  const edit = (item) => {
    setEditingId(item.id);
    setSlide({ ...initialSlide, ...item });
  };

  const remove = async (id) => {
    await crud.set.mutateAsync({ id: 'home', data: { ...data, slides: slides.filter((item) => item.id !== id) } });
    toast.success('Slide deleted');
    if (editingId === id) reset();
  };

  const save = async () => {
    if (!slide.title_en && !slide.image) return toast.error('Add a title or image before saving');
    const payload = {
      ...slide,
      id: editingId || Date.now().toString(),
      title_te: slide.title_en,
      subtitle_te: slide.subtitle_en,
      tag_te: slide.tag_en,
      ctaText_te: slide.ctaText_en
    };
    const nextSlides = editingId ? slides.map((item) => item.id === editingId ? payload : item) : [...slides, payload];
    await crud.set.mutateAsync({ id: 'home', data: { ...data, slides: nextSlides } });
    toast.success(editingId ? 'Slide updated' : 'Slide added');
    reset();
  };
  return (
    <div className="grid gap-6">
      <div className="rounded-2xl bg-gradient-to-r from-slate-950 to-slate-800 p-5 text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-wide text-tdp-yellow">Home Page</p>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">Hero Slides</h1>
        <p className="mt-1 text-sm text-white/65">Short English content only. Language fallback is automatic.</p>
      </div>
      <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-3 md:grid-cols-2">
          <input className="min-h-12 rounded-xl border border-slate-200 px-4" placeholder="Slide title" value={slide.title_en} onChange={(e) => setSlide({ ...slide, title_en: e.target.value })} />
          <input className="min-h-12 rounded-xl border border-slate-200 px-4" placeholder="Subtitle" value={slide.subtitle_en} onChange={(e) => setSlide({ ...slide, subtitle_en: e.target.value })} />
          <input className="min-h-12 rounded-xl border border-slate-200 px-4" placeholder="Tag" value={slide.tag_en} onChange={(e) => setSlide({ ...slide, tag_en: e.target.value })} />
          <input className="min-h-12 rounded-xl border border-slate-200 px-4" placeholder="CTA text" value={slide.ctaText_en} onChange={(e) => setSlide({ ...slide, ctaText_en: e.target.value })} />
          <input className="min-h-12 rounded-xl border border-slate-200 px-4 md:col-span-2" placeholder="CTA link" value={slide.ctaLink} onChange={(e) => setSlide({ ...slide, ctaLink: e.target.value })} />
        </div>
        <div className="mt-4"><ImageUploader value={slide.image} onChange={(image) => setSlide({ ...slide, image })} /></div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={save} className="inline-flex items-center gap-2 rounded-xl bg-tdp-red px-5 py-3 font-bold text-white shadow-red"><Save size={18} />{editingId ? 'Update Slide' : 'Add Slide'}</button>
          {editingId && <button onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-5 py-3 font-bold text-slate-700"><XCircle size={18} />Cancel Edit</button>}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {slides.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
            <img src={item.image || '/og-image.svg'} className="h-40 w-full object-cover" alt="" />
            <div className="p-4">
              <p className="font-bold">{item.title_en || 'Untitled slide'}</p>
              <p className="line-clamp-2 text-sm text-slate-500">{item.subtitle_en}</p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => edit(item)} className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-blue-700"><Edit size={15} />Edit</button>
                <button onClick={() => remove(item.id)} className="inline-flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-bold text-tdp-red"><Trash2 size={15} />Delete</button>
              </div>
            </div>
          </div>
        ))}
        {!slides.length && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm font-semibold text-slate-500 md:col-span-3">
            <Plus className="mx-auto mb-2 text-slate-400" />
            No hero slides yet. Add the first image above.
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageHome;
