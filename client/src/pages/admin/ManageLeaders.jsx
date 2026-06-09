import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '@/services/firebase';
import ImageUploadWithCompression from '@/components/admin/ImageUploadWithCompression';
import { LEADERS_DATA } from '@/data/leadersData';
import { toastError } from '@/utils/toastUtils.jsx';

const ManageLeaders = () => {
  const [leaders, setLeaders] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState({});

  useEffect(() => {
    getDoc(doc(db, 'siteConfig', 'leaders')).then((snap) => setLeaders(snap.exists() && snap.data().list?.length ? snap.data().list : LEADERS_DATA));
  }, []);

  const updateField = (leaderId, field, value) => setLeaders((items) => items.map((leader) => leader.id === leaderId ? { ...leader, [field]: value } : leader));

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'siteConfig', 'leaders'), { list: leaders });
      toast.success('Saved successfully');
    } catch (error) {
      toastError(error, 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-slate-950 to-slate-800 p-5 text-white shadow-xl md:flex-row md:items-center">
        <div><p className="text-xs font-bold uppercase tracking-wide text-tdp-yellow">Home Section</p><h1 className="mt-1 text-2xl font-black md:text-3xl">Manage Leaders</h1><p className="mt-1 text-sm text-white/65">Update leader photos, vision and achievements.</p></div>
        <button onClick={handleSave} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-tdp-yellow px-5 py-3 font-black text-slate-950 disabled:opacity-50"><Save size={18} />{saving ? 'Saving...' : 'Save All'}</button>
      </div>
      <div className="grid gap-5">
        {leaders.map((leader) => (
          <section key={leader.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:p-6">
            <div className="mb-5 flex items-center gap-4 border-b border-slate-100 pb-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border-4 border-yellow-300 bg-slate-100 shadow">
                <img src={leader.photo} alt={leader.name_en} className="h-full w-full object-cover object-top" />
              </div>
              <div className="min-w-0 flex-1"><h2 className="text-lg font-black text-slate-950">{leader.name_en}</h2><p className="text-sm text-slate-500">{leader.designation_en}</p>{uploading[leader.id] && <p className="mt-2 text-xs font-bold text-yellow-700">Compressing leader photo...</p>}</div>
            </div>
            <div className="mb-5">
              <ImageUploadWithCompression
                label={`${leader.name_en || 'Leader'} photo`}
                value={leader.photo || ''}
                aspectRatio="1/1"
                onUploadStateChange={(busy) => setUploading((state) => ({ ...state, [leader.id]: busy }))}
                onChange={(url) => updateField(leader.id, 'photo', url)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ['name_te', 'Name Telugu'], ['name_en', 'Name English'], ['designation_te', 'Designation Telugu'], ['designation_en', 'Designation English'], ['tagline_te', 'Tagline Telugu'], ['tagline_en', 'Tagline English']
              ].map(([field, label]) => <label key={field} className="grid gap-1 text-xs font-black uppercase tracking-wide text-slate-500">{label}<input className="min-h-11 rounded-xl border border-slate-200 px-3 text-sm font-normal normal-case outline-none focus:border-tdp-yellow" value={leader[field] || ''} onChange={(e) => updateField(leader.id, field, e.target.value)} /></label>)}
              {[
                ['vision_te', 'Vision Telugu'], ['vision_en', 'Vision English']
              ].map(([field, label]) => <label key={field} className="grid gap-1 text-xs font-black uppercase tracking-wide text-slate-500 md:col-span-2">{label}<textarea rows={3} className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-normal normal-case outline-none focus:border-tdp-yellow" value={leader[field] || ''} onChange={(e) => updateField(leader.id, field, e.target.value)} /></label>)}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default ManageLeaders;
