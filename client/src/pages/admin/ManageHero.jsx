import { useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useDoc, useCrud } from '@/hooks/useFirestore';
import ImageUploader from '@/components/admin/ImageUploader';
import { translatePayloadFields } from '@/services/translationService';

const pages = ['home', 'leaders', 'dailywork', 'gallery', 'news', 'schemes', 'narasaraopet', 'contact'];
const emptySlide = () => ({ id: Date.now().toString(), title_en: '', subtitle_en: '', image: '', ctaLink: '' });

const ManageHero = () => {
  const [page, setPage] = useState('home');
  const { data } = useDoc('heroSections', page);
  const crud = useCrud('heroSections');
  const [form, setForm] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const merged = form || { ...(data || {}), slides: (data?.slides || []).slice(0, 5) };
  const slides = merged.slides || [];
  const setSlides = (nextSlides) => setForm({ ...merged, slides: nextSlides.slice(0, 5) });
  const updateSlide = (index, key, value) => setSlides(slides.map((slide, i) => i === index ? { ...slide, [key]: value } : slide));
  const addSlide = () => {
    if (slides.length >= 5) return toast.error('Maximum 5 hero images allowed');
    setSlides([...slides, emptySlide()]);
  };
  const removeSlide = (index) => setSlides(slides.filter((_, i) => i !== index));
  const save = async () => {
    if (imageUploading) return toast.error('Please wait until hero image upload finishes');
    setSaving(true);
    try {
    const translatedSlides = await Promise.all(slides.map((slide) => translatePayloadFields({
      ...slide,
      title_en: slide.title_en || '',
      subtitle_en: slide.subtitle_en || '',
      ctaText_en: slide.ctaText_en || 'View More'
    }, ['title', 'subtitle', 'ctaText'])));
    const payload = {
      ...merged,
      slides: translatedSlides.slice(0, 5)
    };
    await crud.set.mutateAsync({ id: page, data: payload });
    toast.success('Hero slides saved');
    setForm(null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl bg-gradient-to-r from-slate-950 to-slate-800 p-5 text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-wide text-tdp-yellow">Hero Slides</p>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">All Page Hero Sections</h1>
        <p className="mt-1 text-sm text-white/65">Each page supports up to 5 images. Public pages slide every 2 seconds.</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {pages.map((item) => <button key={item} onClick={() => { setPage(item); setForm(null); }} className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold capitalize ${page === item ? 'bg-tdp-red text-white' : 'bg-white text-slate-700 shadow-sm'}`}>{item}</button>)}
      </div>
      <div className="grid gap-4">
        {slides.map((slide, index) => (
          <section key={slide.id || index} className="grid gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-[240px_1fr_auto] md:p-5">
            <ImageUploader value={slide.image} onUploadStateChange={setImageUploading} onChange={(url) => updateSlide(index, 'image', url)} />
            <div className="grid gap-3">
              <input className="min-h-12 rounded-xl border border-slate-200 px-4" placeholder="Short hero title" value={slide.title_en || ''} onChange={(e) => updateSlide(index, 'title_en', e.target.value)} />
              <input className="min-h-12 rounded-xl border border-slate-200 px-4" placeholder="Short subtitle" value={slide.subtitle_en || ''} onChange={(e) => updateSlide(index, 'subtitle_en', e.target.value)} />
              <input className="min-h-12 rounded-xl border border-slate-200 px-4" placeholder="Button link (optional)" value={slide.ctaLink || ''} onChange={(e) => updateSlide(index, 'ctaLink', e.target.value)} />
            </div>
            <button onClick={() => removeSlide(index)} className="grid h-12 w-12 place-items-center rounded-xl bg-red-50 text-tdp-red"><Trash2 size={18} /></button>
          </section>
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <button onClick={addSlide} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-800"><Plus size={18} />Add Image</button>
        <button onClick={save} disabled={imageUploading || saving} className="inline-flex items-center gap-2 rounded-xl bg-tdp-red px-5 py-3 font-bold text-white shadow-red disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"><Save size={18} />{saving ? 'Saving...' : 'Save Hero'}</button>
      </div>
    </div>
  );
};

export default ManageHero;
