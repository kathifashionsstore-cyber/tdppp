import { CheckCircle2, Phone, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCollection, useCrud } from '@/hooks/useFirestore';
import { formatDate } from '@/utils/dateUtils';
import { confirmToast, toastError } from '@/utils/toastUtils.jsx';

const ManageMessages = () => {
  const { data = [], isLoading } = useCollection('contactRequests', { orderByField: 'createdAt', orderDirection: 'desc' });
  const crud = useCrud('contactRequests');
  const unread = data.filter((item) => item.status === 'new' || item.isRead === false).length;

  const markRead = async (item) => {
    try {
      await crud.update.mutateAsync({ id: item.id, data: { status: 'read', isRead: true } });
      toast.success('Message marked as read');
    } catch (error) {
      toastError(error, 'Unable to update message');
    }
  };

  const remove = async (id) => {
    const confirmed = await confirmToast({
      title: 'Delete message?',
      message: 'Delete this contact message? This cannot be undone.',
      confirmLabel: 'Delete'
    });
    if (!confirmed) return;
    try {
      await crud.remove.mutateAsync(id);
      toast.success('Message deleted');
    } catch (error) {
      toastError(error, 'Unable to delete message');
    }
  };

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl bg-gradient-to-r from-slate-950 to-slate-800 p-5 text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-wide text-tdp-yellow">Contact Inbox</p>
        <h1 className="mt-1 text-2xl font-black md:text-3xl">Messages Received</h1>
        <p className="mt-1 text-sm text-white/65">{unread ? `${unread} new message${unread > 1 ? 's' : ''} waiting` : 'All contact messages are up to date'}</p>
      </div>

      {isLoading && <div className="rounded-2xl bg-white p-6 shadow-sm">Loading messages...</div>}
      {!isLoading && !data.length && <div className="rounded-2xl bg-white p-10 text-center text-slate-500 shadow-sm">No contact messages yet.</div>}

      <div className="grid gap-4">
        {data.map((item) => {
          const isNew = item.status === 'new' || item.isRead === false;
          return (
            <article key={item.id} className={`rounded-2xl border bg-white p-5 shadow-sm ${isNew ? 'border-yellow-300 ring-4 ring-yellow-100' : 'border-slate-200'}`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    {isNew && <span className="rounded-full bg-tdp-red px-3 py-1 text-xs font-black uppercase text-white">New</span>}
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase text-slate-600">{item.subject || 'general'}</span>
                    <span className="text-xs font-semibold text-slate-400">{formatDate(item.createdAt, 'dd MMM yyyy, hh:mm a')}</span>
                  </div>
                  <h2 className="mt-3 text-xl font-black text-slate-950">{item.name || 'Visitor'}</h2>
                  <a href={`tel:${item.phone || ''}`} className="mt-1 inline-flex items-center gap-2 text-sm font-bold text-tdp-red"><Phone size={15} />{item.phone || 'No phone'}</a>
                  <p className="mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 leading-7 text-slate-700">{item.message}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  {isNew && <button onClick={() => markRead(item)} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-bold text-white"><CheckCircle2 size={16} />Read</button>}
                  <button onClick={() => remove(item.id)} className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-tdp-red" aria-label="Delete message"><Trash2 size={17} /></button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export default ManageMessages;
