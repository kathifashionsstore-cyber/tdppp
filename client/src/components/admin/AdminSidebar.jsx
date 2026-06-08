import { NavLink } from 'react-router-dom';
import { BarChart3, Flag, Home, Images, Landmark, LayoutDashboard, LogOut, Mail, Megaphone, Newspaper, Settings, Sparkles, Star, Users, Vote } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const items = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Home', path: '/admin/home', icon: Home },
  { label: 'About/MLA Info', path: '/admin/about', icon: Users },
  { label: 'Leaders', path: '/admin/leaders', icon: Users },
  { label: 'Page Heroes', path: '/admin/hero', icon: Sparkles },
  { label: 'Daily Work', path: '/admin/daily-work', icon: Vote },
  { label: 'News', path: '/admin/news', icon: Newspaper },
  { label: 'Gallery', path: '/admin/gallery', icon: Images },
  { label: 'Super 6 Schemes', path: '/admin/super6', icon: Star },
  { label: 'General Schemes', path: '/admin/schemes', icon: Flag },
  { label: 'Narasaraopet', path: '/admin/narasaraopet', icon: Landmark },
  { label: 'Festival Banners', path: '/admin/banners', icon: Sparkles },
  { label: 'Announcements', path: '/admin/announcements', icon: Megaphone },
  { label: 'Messages', path: '/admin/messages', icon: Mail },
  { label: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
  { label: 'Settings', path: '/admin/settings', icon: Settings }
];

const AdminSidebar = () => {
  const { logout } = useAuth();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col bg-[#111827] text-white shadow-2xl md:flex">
      <div className="border-b border-white/10 p-5">
        <p className="text-xl font-black text-tdp-yellow">TDP Admin</p>
        <p className="text-xs text-white/60">Content control center</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-3">
        {items.map(({ label, path, icon: Icon }) => (
          <NavLink key={path} to={path} className={({ isActive }) => `mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive ? 'bg-tdp-yellow text-tdp-navy shadow-lg' : 'text-white/75 hover:bg-white/10 hover:text-white'}`}>
            <Icon size={18} />{label}
          </NavLink>
        ))}
      </nav>
      <button onClick={logout} className="m-3 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-white/80 hover:bg-white/10">
        <LogOut size={18} />Logout
      </button>
    </aside>
  );
};

export default AdminSidebar;
