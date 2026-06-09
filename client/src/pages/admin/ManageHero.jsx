import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ImagePlus, Plus, RotateCcw, Save, Trash2 } from 'lucide-react';
import { useCrud, useDoc } from '@/hooks/useFirestore';
import ImageUploader from '@/components/admin/ImageUploader';
import { translatePayloadFields } from '@/services/translationService';
import { confirmToast } from '@/utils/toastUtils.jsx';

const HERO_PAGES = [
  { key: 'home', label: 'Home', title: 'Dr. Chadalavada Aravinda Babu', subtitle: 'MLA - Narasaraopet, Telugu Desam Party' },
  { key: 'leaders', label: 'Leaders', title: 'Our Leadership', subtitle: 'State leaders guiding Andhra Pradesh and Narasaraopet development' },
  { key: 'daily-work', label: 'Daily Work', title: 'Daily Work', subtitle: 'Development works, visits, and public service updates' },
  { key: 'gallery', label: 'Gallery', title: 'Gallery', subtitle: 'Photos and videos of constituency work' },
  { key: 'super6', label: 'Super 6', title: 'Super 6 Schemes', subtitle: 'Flagship welfare schemes of Telugu Desam Party' },
  { key: 'schemes', label: 'Schemes', title: 'Government Schemes', subtitle: 'General welfare schemes, application links, and public information' },
  { key: 'narasaraopet', label: 'Narasaraopet', title: 'Narasaraopet Constituency', subtitle: 'Places, maps, history, and development updates' },
  { key: 'news', label: 'News', title: 'News', subtitle: 'Latest updates, announcements, and videos' },
  { key: 'contact', label: 'Contact', title: 'Contact MLA Office', subtitle: 'Reach the Narasaraopet constituency office' }
];

const makeSlide = (order = 1) => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  title_en: '',
  subtitle_en: '',
  alt_en: '',
  image: '',
  imageMobile: '',
  order,
  isActive: true
});

const defaultDoc = (page) => ({
  pageKey: page.key,
  title_en: page.title,
  subtitle_en: page.subtitle,
  slides: []
});

const ManageHero = () => {
  const [activeKey, setActiveKey] = useState(HERO_PAGES[0].key);
  const activePage = HERO_PAGES.find((page) => page.key === activeKey) || HERO_PAGES[0];
  const { data, isLoading } = useDoc('heroSections', activeKey);
  const crud = useCrud('heroSections');
  const [draft, setDraft] = useState(defaultDoc(activePage));
  const [imageUploading, setImageUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft({ ...defaultDoc(activePage), ...(data || {}), pageKey: activePage.key, slides: data?.slides || [] });
  }, [activePage, data]);

  const slides = useMemo(
    () => [...(draft.slides || [])].sort((a, b) => (Number(a.order) || 99) - (Number(b.order) || 99)),
    [draft.slides]
  );

  const updateDraft = (key, value) => setDraft((state) => ({ ...state, [key]: value }));
  const setSlides = (nextSlides) => setDraft((state) => ({ ...state, slides: nextSlides }));
  const addSlide = () => setSlides([...(draft.slides || []), makeSlide((draft.slides || []).length + 1)]);
  const updateSlide = (id, fields) => setSlides((draft.slides || []).map((slide) => slide.id === id ? { ...slide, ...fields } : slide));
  const removeSlide = async (id) => {
    const confirmed = await confirmToast({
      title: 'Delete hero banner?',
      message: 'Remove this banner from the current draft?',
      confirmLabel: 'Delete'
    });
    if (confirmed) setSlides((draft.slides || []).filter((slide) => slide.id !== id));
  };
  const reset = () => setDraft({ ...defaultDoc(activePage), ...(data || {}), pageKey: activePage.key, slides: data?.slides || [] });

  const save = async () => {
    if (imageUploading) return toast.error('Please wait until banner upload finishes');
    const imageSlides = (draft.slides || []).filter((slide) => slide.image || slide.imageMobile);
    if (!imageSlides.length) return toast.error('Add at least one hero banner image before saving');
    setSaving(true);
    try {
      const translatedDoc = await translatePayloadFields({
        ...draft,
        pageKey: activePage.key,
        title_en: draft.title_en || activePage.title,
        subtitle_en: draft.subtitle_en || activePage.subtitle
      }, ['title', 'subtitle', 'description']);

      const translatedSlides = await Promise.all(imageSlides.map((slide, index) => translatePayloadFields({
        ...slide,
        id: slide.id || `${Date.now()}-${index}`,
        title_en: slide.title_en || '',
        subtitle_en: slide.subtitle_en || '',
        alt_en: slide.alt_en || slide.title_en || `${activePage.label} hero banner ${index + 1}`,
        order: Number(slide.order) || index + 1,
        isActive: slide.isActive !== false
      }, ['title', 'subtitle', 'alt'])));

      await crud.set.mutateAsync({
        id: activePage.key,
        data: {
          ...translatedDoc,
          slides: translatedSlides
        }
      });
      toast.success('Saved successfully');
    } catch (error) {
      toast.error(`Failed - ${error.message || 'Unable to save hero banners'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl bg-gradient-to-r from-slate-950 to-slate-800 p-5 text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-wide text-tdp-yellow">All Pages Hero Images Manager</p>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">Page Hero Banners</h1>
        <p className="mt-1 text-sm text-white/65">Choose a page, then add, edit, delete, reorder, and publish the hero banners shown at the top of that page.</p>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="mb-3 text-xs font-black uppercase tracking-wide text-slate-500">Select Page</p>
        <div className="flex flex-wrap gap-2">
          {HERO_PAGES.map((page) => (
            <button
              key={page.key}
              type="button"
              onClick={() => setActiveKey(page.key)}
              className={`rounded-xl px-4 py-2 text-sm font-black transition ${activeKey === page.key ? 'bg-tdp-red text-white shadow-red' : 'bg-slate-100 text-slate-700 hover:bg-yellow-50 hover:text-tdp-red'}`}
            >
              {page.label}
            </button>
          ))}
        </div>
      </div>

      <section className="grid gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            Hero title
            <input className="min-h-12 rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-tdp-yellow" value={draft.title_en || ''} onChange={(event) => updateDraft('title_en', event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm font-bold text-slate-700">
            Hero subtitle
            <input className="min-h-12 rounded-xl border border-slate-200 px-4 text-base outline-none focus:border-tdp-yellow" value={draft.subtitle_en || ''} onChange={(event) => updateDraft('subtitle_en', event.target.value)} />
          </label>
        </div>
      </section>

      <div className="grid gap-4">
        {isLoading ? <div className="rounded-2xl bg-white p-6 font-bold text-slate-500 shadow-sm">Loading {activePage.label} hero banners...</div> : slides.map((slide, index) => (
          <section key={slide.id} className="grid gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 lg:grid-cols-[280px_1fr_auto] lg:p-5">
            <div className="grid gap-3">
              <ImageUploader
                label="Desktop / Main Banner"
                value={slide.image || ''}
                aspectRatio="16/9"
                onUploadStateChange={setImageUploading}
                onChange={(url) => updateSlide(slide.id, { image: url })}
              />
              <ImageUploader
                label="Mobile Banner Optional"
                value={slide.imageMobile || ''}
                aspectRatio="4/5"
                onUploadStateChange={setImageUploading}
                onChange={(url) => updateSlide(slide.id, { imageMobile: url })}
              />
            </div>
            <div className="grid content-start gap-3">
              <div className="overflow-hidden rounded-xl bg-slate-100">
                {slide.image || slide.imageMobile ? (
                  <img src={slide.image || slide.imageMobile} alt="" className="aspect-video w-full object-cover" />
                ) : (
                  <div className="grid aspect-video place-items-center text-slate-400">
                    <ImagePlus size={32} />
                  </div>
                )}
              </div>
              <input className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Banner title (optional)" value={slide.title_en || ''} onChange={(event) => updateSlide(slide.id, { title_en: event.target.value })} />
              <input className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Banner subtitle (optional)" value={slide.subtitle_en || ''} onChange={(event) => updateSlide(slide.id, { subtitle_en: event.target.value })} />
              <input className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Alt text for accessibility" value={slide.alt_en || ''} onChange={(event) => updateSlide(slide.id, { alt_en: event.target.value })} />
              <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
                <input type="number" min="1" className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" placeholder="Order" value={slide.order || index + 1} onChange={(event) => updateSlide(slide.id, { order: Number(event.target.value) })} />
                <label className="flex min-h-12 items-center gap-2 rounded-xl bg-slate-50 px-4 text-sm font-bold text-slate-700">
                  <input type="checkbox" checked={slide.isActive !== false} onChange={(event) => updateSlide(slide.id, { isActive: event.target.checked })} /> Active on website
                </label>
              </div>
            </div>
            <button type="button" onClick={() => removeSlide(slide.id)} className="grid h-12 w-12 place-items-center rounded-xl bg-red-50 text-tdp-red" aria-label="Delete hero banner"><Trash2 size={18} /></button>
          </section>
        ))}
      </div>

      {!slides.length && !isLoading && (
        <div className="rounded-2xl border border-dashed border-yellow-300 bg-yellow-50 p-8 text-center">
          <ImagePlus className="mx-auto mb-2 text-yellow-700" size={32} />
          <p className="font-black text-yellow-950">No {activePage.label} hero banners yet.</p>
          <p className="mt-1 text-sm font-semibold text-yellow-800">Add a banner so the public page uses admin images instead of default placeholders.</p>
        </div>
      )}

      <div className="sticky bottom-4 z-10 flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white/92 p-3 shadow-xl backdrop-blur">
        <button type="button" onClick={addSlide} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-800"><Plus size={18} />Add Banner</button>
        <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 font-bold text-slate-700"><RotateCcw size={18} />Reset</button>
        <button type="button" onClick={save} disabled={imageUploading || saving} className="inline-flex items-center gap-2 rounded-xl bg-tdp-red px-5 py-3 font-bold text-white shadow-red disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none"><Save size={18} />{saving ? 'Saving...' : `Save ${activePage.label} Hero`}</button>
      </div>
    </div>
  );
};

export default ManageHero;
