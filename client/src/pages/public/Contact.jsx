import { useState } from 'react';
import toast from 'react-hot-toast';
import PageHero from './PageHero';
import { addDocument } from '@/services/firestoreService';

const Contact = () => {
  const [form, setForm] = useState({ name: '', phone: '', subject: 'general', message: '' });
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (!form.name || !form.phone || !form.message) return toast.error('Please fill all required fields');
    setSaving(true);
    try {
      await addDocument('contactRequests', { ...form, status: 'new', isRead: false });
      toast.success('Request submitted. Admin office received your message.');
      setForm({ name: '', phone: '', subject: 'general', message: '' });
    } catch {
      toast.error('Unable to submit right now. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <>
      <PageHero page="contact" title="Contact MLA Office" subtitle="Reach the Narasaraopet constituency office" />
      <section className="container-page grid gap-8 py-12 md:grid-cols-2">
        <form onSubmit={submit} className="rounded-lg bg-white p-6 shadow-md">
          <div className="grid gap-4">
            <input className="min-h-11 rounded border px-3" placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className="min-h-11 rounded border px-3" placeholder="Phone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <select className="min-h-11 rounded border px-3" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}><option value="work">Constituency work</option><option value="scheme">Scheme inquiry</option><option value="complaint">Complaint</option><option value="general">General</option></select>
            <textarea className="min-h-32 rounded border px-3 py-2" placeholder="Message *" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            <button disabled={saving} className="min-h-11 rounded bg-tdp-red px-5 font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-400">{saving ? 'Submitting...' : 'Submit'}</button>
          </div>
        </form>
        <div className="space-y-4"><div className="rounded-lg bg-white p-5 shadow-sm"><b>Phone</b><p><a href="tel:9398724704">+91 9398724704</a></p></div><div className="rounded-lg bg-white p-5 shadow-sm"><b>Email</b><p>office@tdpnrt.org</p></div><iframe title="Office map" className="h-64 w-full rounded-lg" loading="lazy" src="https://www.google.com/maps?q=Narasaraopet,Andhra%20Pradesh&output=embed" /></div>
      </section>
    </>
  );
};

export default Contact;
