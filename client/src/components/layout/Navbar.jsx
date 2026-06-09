import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Facebook, Instagram, Mail, Menu, Phone, Send, Sparkles, X, Youtube } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '@/components/ui/LanguageToggle';
import BicycleIcon from '@/components/ui/BicycleIcon';
import { NAV_ITEMS } from '@/utils/constants';

const navClass = ({ isActive }) => `rounded-full px-3 py-2 text-sm font-black transition ${isActive ? 'bg-tdp-yellow text-tdp-red shadow-yellow' : 'text-white hover:bg-white/12 hover:text-tdp-yellow'}`;

const Navbar = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t } = useTranslation();
  return (
    <>
      <div className="hidden bg-gradient-to-r from-tdp-red via-slate-950 to-tdp-navy text-xs text-white md:block">
        <div className="container-page flex items-center justify-between py-2">
          <div className="flex gap-4"><a href="tel:9398724704" className="inline-flex items-center gap-1"><Phone size={13} /> +91 9398724704</a><span className="inline-flex items-center gap-1"><Mail size={13} /> office@tdpnrt.org</span></div>
          <div className="flex gap-3"><Facebook size={15} /><Youtube size={15} /><Instagram size={15} /><Send size={15} /></div>
        </div>
      </div>
      <header className="sticky top-8 z-50 border-b border-white/10 bg-gradient-to-r from-[#111827] via-tdp-red to-[#f5a623] shadow-lg backdrop-blur md:top-10">
        <div className="container-page flex h-[72px] items-center justify-between">
          <NavLink to="/" className="flex items-center gap-3 font-black text-white">
            <span className="relative grid h-12 w-12 place-items-center rounded-full bg-white shadow-yellow ring-4 ring-yellow-300/30">
              <span className="absolute inset-x-1 bottom-1 h-1 rounded-full bg-black/10" />
              <span className="animate-cycle-run"><BicycleIcon size={34} color="#CC0000" opacity={1} /></span>
            </span>
            <span className="leading-tight"><span className="block telugu">Mana TDP</span><span className="inline-flex items-center gap-1 text-sm text-tdp-yellow"><Sparkles size={13} />Narasaraopet</span></span>
          </NavLink>
          <nav className="hidden items-center gap-1 rounded-full border border-white/15 bg-black/18 p-1 shadow-inner backdrop-blur md:flex">
            {NAV_ITEMS.map((item) => <NavLink key={item.key} to={item.path} className={navClass}>{t(`nav.${item.key}`)}</NavLink>)}
          </nav>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <button className="grid h-10 w-10 place-items-center rounded-full border border-white/30 bg-white/15 text-white md:hidden" onClick={() => setDrawerOpen(true)} aria-label="Open menu"><Menu /></button>
          </div>
        </div>
      </header>
      {drawerOpen && (
        <div className="fixed inset-0 z-[80] bg-black/40 md:hidden" onClick={() => setDrawerOpen(false)}>
          <aside className="h-full w-80 max-w-[86vw] overflow-y-auto bg-gradient-to-b from-slate-950 via-tdp-red to-tdp-yellow p-5 text-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3"><span className="grid h-12 w-12 place-items-center rounded-full bg-white"><span className="animate-cycle-run"><BicycleIcon size={36} color="#CC0000" opacity={1} /></span></span><div><p className="font-bold">Dr. Aravinda Babu</p><p className="text-xs text-white/70">MLA Narasaraopet</p></div></div>
              <button onClick={() => setDrawerOpen(false)} className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white"><X /></button>
            </div>
            <div className="mb-5"><LanguageToggle /></div>
            <nav className="grid gap-1">
              {NAV_ITEMS.map((item) => <NavLink key={item.key} to={item.path} onClick={() => setDrawerOpen(false)} className="rounded-lg px-3 py-3 font-bold text-white hover:bg-white/15">{t(`nav.${item.key}`)}</NavLink>)}
            </nav>
            <div className="flex gap-4 pt-8 text-white"><Facebook /><Youtube /><Instagram /><Send /></div>
          </aside>
        </div>
      )}
    </>
  );
};

export default Navbar;
