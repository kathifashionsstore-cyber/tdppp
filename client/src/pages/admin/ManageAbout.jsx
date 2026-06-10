import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
import ImageUploader from '@/components/admin/ImageUploader';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { useCrud, useDoc } from '@/hooks/useFirestore';
import { translatePayloadFields } from '@/services/translationService';
import { toImgBBUploadMeta } from '@/utils/imageUploadMeta';

const empty = {
  bio_en: '',
  bio_te: '',
  education: 'MS Orthopaedics, NTR University of Health Sciences, 1992',
  victory: '103,167 votes, margin of 19,705 votes',
  image: '/mla/aravinda-babu.jpg',
  imageUpload: null
};

const ManageAbout = () => {
  const { data } = useDoc('siteConfig', 'about');
  const crud = useCrud('siteConfig');
  const [form, setForm] = useState(empty);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm({ ...empty, ...data });
  }, [data]);

  const update = (key, value) => setForm((state) => ({ ...state, [key]: value }));
  const save = async (event) => {
    event.preventDefault();
    if (uploading) return toast.error('Please wait until image upload finishes');
    setSaving(true);
    try {
      const payload = await translatePayloadFields(form);
      await crud.set.mutateAsync({ id: 'about', data: payload });
      toast.success('Saved successfully');
    } catch (error) {
      toast.error(`Failed - ${error.message || 'Save failed'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl bg-gradient-to-r from-slate-950 to-slate-800 p-5 text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-wide text-tdp-yellow">About/MLA Info</p>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">Manage Home About Section</h1>
        <p className="mt-1 text-sm text-white/65">Controls the biography card below the shared hero on the home page.</p>
      </div>
      <form onSubmit={save} className="grid gap-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <div className="grid gap-4">
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <RichTextEditor value={form.bio_en} onChange={(value) => update('bio_en', value)} placeholder="Biography in English" />
            </div>
            <input className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" value={form.education} onChange={(event) => update('education', event.target.value)} placeholder="Educational qualifications" />
            <input className="min-h-12 rounded-xl border border-slate-200 px-4 outline-none focus:border-tdp-yellow" value={form.victory} onChange={(event) => update('victory', event.target.value)} placeholder="Election victory details" />
          </div>
          <ImageUploader
            value={form.image}
            onChange={(value) => update('image', value)}
            onUploadStateChange={setUploading}
            onUploadComplete={(uploaded) => {
              const metadata = toImgBBUploadMeta(uploaded);
              if (metadata) setForm((state) => ({ ...state, image: metadata.imageUrl, imageUpload: metadata, ...metadata }));
            }}
          />
        </div>
        <button disabled={uploading || saving} className="inline-flex w-max items-center gap-2 rounded-xl bg-tdp-red px-5 py-3 font-bold text-white shadow-red disabled:cursor-not-allowed disabled:bg-slate-400"><Save size={18} />{saving ? 'Saving...' : 'Save About Info'}</button>
      </form>
    </div>
  );
};

export default ManageAbout;
