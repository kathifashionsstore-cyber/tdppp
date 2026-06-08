import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useDoc, useCrud } from '@/hooks/useFirestore';
import ImageUploader from '@/components/admin/ImageUploader';
import { translatePayloadFields } from '@/services/translationService';

const emptySlide = () => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  alt_en: '',
  label: '',
  image: '',
  order: 1,
  isActive: true
});

const ManageHero = () => {
  const { data } = useDoc('heroSections', 'global');
  const crud = useCrud('heroSections');
  const [form, setForm] = useState(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const merged = form || { ...(data || {}), slides: data?.slides || [] };
  const slides = useMemo(() => [...(merged.slides || [])].sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99)), [merged.slides]);

  const setSlides = (nextSlides) => setForm({ ...merged, slides: nextSlides });
  const updateSlide = (id, key, value) => setSlides((merged.slides || []).map((slide) => slide.id === id ? { ...slide, [key]: value } : slide));
  const updateSlideFields = (id, fields) => setSlides((merged.slides || []).map((slide) => slide.id === id ? { ...slide, ...fields } : slide));
  const addSlide = () => setSlides([...(merged.slides || []), { ...emptySlide(), order: (merged.slides || []).length + 1 }]);
  const removeSlide = (id) => setSlides((merged.slides || []).filter((slide) => slide.id !== id));

  const save = async () => {
    if (imageUploading) return toast.error('Please wait until hero image upload finishes');
    setSaving(true);
    try {
      const translatedSlides = await Promise.all((merged.slides || []).map((slide, index) => translatePayloadFields({
        ...slide,
        id: slide.id || `${Date.now()}-${index}`,
        alt_en: slide.alt_en || slide.label || '',
        label: slide.label || slide.alt_en || '',
        order: Number(slide.order) || index + 1,
        isActive: slide.isActive !== false
      }, ['alt'])));
      await crud.set.mutateAsync({
        id: 'global',
        data: {
          title_en: 'Dr. Chadalavada Aravinda Babu',
          subtitle_en: 'MLA - Narasaraopet | Telugu Desam Party',
          slides: translatedSlides
        }
      });
      toast.success('Global hero slideshow saved');
      setForm(null);
    } catch (error) {
      toast.error(error.message || 'Unable to save hero slides');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl bg-gradient-to-r from-slate-950 to-slate-800 p-5 text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-wide text-tdp-yellow">Global Hero Slideshow</p>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">All Pages Hero Images Manager</h1>
        <p className="mt-1 text-sm text-white/65">These slides appear identically at the top of Home, News, Gallery, Daily Work, Super 6, Schemes, Narasaraopet, and Contact.</p>
      </div>

      <div className="grid gap-4">
        {slides.map((slide) => (
          <section key={slide.id} className="grid gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-[240px_1fr_auto] md:p-5">
            <ImageUploader value={slide.image} onUploadStateChange={setImageUploading} onChange={(url) => updateSlide(slide.id, 'image', url)} />
            <div className="grid content-start gap-3">
              <input className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Alt text / label" value={slide.alt_en || slide.label || ''} onChange={(e) => updateSlideFields(slide.id, { alt_en: e.target.value, label: e.target.value })} />
              <input type="number" min="1" className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Order" value={slide.order || 1} onChange={(e) => updateSlide(slide.id, 'order', Number(e.target.value))} />
              <label className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-700">
                <input type="checkbox" checked={slide.isActive !== false} onChange={(e) => updateSlide(slide.id, 'isActive', e.target.checked)} /> Active
              </label>
            </div>
            <button onClick={() => removeSlide(slide.id)} className="grid h-12 w-12 place-items-center rounded-xl bg-red-50 text-tdp-red" aria-label="Delete hero slide"><Trash2 size={18} /></button>
          </section>
        ))}
      </div>

      {!slides.length && <div className="rounded-2xl border border-dashed border-yellow-300 bg-yellow-50 p-8 text-center font-bold text-yellow-900">No hero photos yet. Add your first slideshow image.</div>}

      <div className="flex flex-wrap gap-3">
        <button onClick={addSlide} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-800"><Plus size={18} />Add Image</button>
        <button onClick={save} disabled={imageUploading || saving} className="inline-flex items-center gap-2 rounded-xl bg-tdp-red px-5 py-3 font-bold text-white shadow-red disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"><Save size={18} />{saving ? 'Saving...' : 'Save Hero'}</button>
      </div>
    </div>
  );
};

export default ManageHero;
