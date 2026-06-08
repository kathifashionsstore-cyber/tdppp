import { useState } from 'react';
import toast from 'react-hot-toast';
import { useDoc, useCrud } from '@/hooks/useFirestore';

const fields = [
  ['siteName_en', 'Site name'],
  ['mlaName_en', 'MLA name'],
  ['constituency_en', 'Constituency'],
  ['phone', 'Phone'],
  ['email', 'Email'],
  ['address_en', 'Office address'],
  ['facebookUrl', 'Facebook URL'],
  ['twitterUrl', 'X / Twitter URL'],
  ['youtubeUrl', 'YouTube URL'],
  ['whatsappUrl', 'WhatsApp URL'],
  ['telegramUrl', 'Telegram URL'],
  ['instagramUrl', 'Instagram URL']
];

const Settings = () => {
  const { data } = useDoc('siteConfig', 'general');
  const crud = useCrud('siteConfig');
  const [form, setForm] = useState({});
  const merged = { ...(data || {}), ...form };
  const save = async () => {
    const payload = {
      ...merged,
      siteName_te: merged.siteName_te || merged.siteName_en,
      mlaName_te: merged.mlaName_te || merged.mlaName_en,
      constituency_te: merged.constituency_te || merged.constituency_en,
      address_te: merged.address_te || merged.address_en
    };
    await crud.set.mutateAsync({ id: 'general', data: payload });
    toast.success('Settings saved');
  };
  return (
    <div className="grid gap-6">
      <div className="rounded-2xl bg-gradient-to-r from-slate-950 to-slate-800 p-5 text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-wide text-tdp-yellow">Configuration</p>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">Site Settings</h1>
        <p className="mt-1 text-sm text-white/65">Edit the public contact and social details in one place.</p>
      </div>
      <div className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:grid-cols-2">
        {fields.map(([key, label]) => (
          <label key={key} className="grid gap-1 text-sm font-bold text-slate-700">
            {label}
            <input className="min-h-12 rounded-xl border border-slate-200 px-4 font-normal outline-none focus:border-tdp-yellow focus:ring-4 focus:ring-yellow-100" value={merged[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
          </label>
        ))}
        <button onClick={save} className="w-fit rounded-xl bg-tdp-red px-5 py-3 font-bold text-white shadow-red">Save Settings</button>
      </div>
    </div>
  );
};

export default Settings;
