import { Link, Navigate, Outlet } from 'react-router-dom';
import { Bell, ExternalLink, Home, Images, LayoutDashboard, Menu, Newspaper, Vote } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useCollection } from '@/hooks/useFirestore';

const AdminLayout = () => {
  const { user, loading } = useAuth();
  const { data: messages = [] } = useCollection('contactRequests', { orderByField: 'createdAt', orderDirection: 'desc', enabled: !!user });
  const unread = messages.filter((item) => item.status === 'new' || item.isRead === false).length;
  if (loading && !user) return <LoadingSpinner label="Checking admin session..." />;
  if (!user) {
    sessionStorage.removeItem('tdp-admin-session');
    localStorage.removeItem('tdp-admin-session');
    return <Navigate to="/admin/login" replace />;
  }
  return (
    <div className="min-h-screen bg-slate-100">
      <AdminSidebar />
      <main className="pb-20 md:ml-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between px-4 md:px-8">
            <div className="flex items-center gap-3">
              <button className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 md:hidden" aria-label="Menu"><Menu size={20} /></button>
              <div>
                <p className="text-sm font-bold text-slate-950">Admin Portal</p>
                <p className="text-xs text-slate-500">English-only editing, automatic public language fallback</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700 md:inline-flex">Live</span>
              <Link to="/admin/messages" className="relative grid h-10 w-10 place-items-center rounded-xl bg-yellow-50 text-yellow-700" aria-label="Notifications">
                <Bell size={18} />
                {!!unread && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-tdp-red px-1 text-[10px] font-black text-white">{unread}</span>}
              </Link>
              <Link to="/" className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white" title="View site"><ExternalLink size={18} /></Link>
            </div>
          </div>
        </header>
        <div className="p-4 md:p-8"><Outlet /></div>
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-40 grid h-16 grid-cols-5 border-t border-slate-200 bg-white shadow-[0_-8px_24px_rgba(15,23,42,0.12)] md:hidden">
        {[
          ['/admin/dashboard', LayoutDashboard, 'Dash'],
          ['/admin/home', Home, 'Home'],
          ['/admin/daily-work', Vote, 'Work'],
          ['/admin/news', Newspaper, 'News'],
          ['/admin/gallery', Images, 'Gallery']
        ].map(([path, Icon, label]) => (
          <Link key={path} to={path} className="flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold text-slate-600">
            <Icon size={20} />{label}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default AdminLayout;
