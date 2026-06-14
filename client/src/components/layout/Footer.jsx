import { Link } from 'react-router-dom';
import { Facebook, Instagram, Mail, MapPin, Phone, Tv, Youtube } from 'lucide-react';
import BicycleIcon from '@/components/ui/BicycleIcon';

const Footer = () => (
  <footer className="bg-tdp-navy pb-20 text-white md:pb-0">
    <div className="container-page grid gap-8 py-10 md:grid-cols-4">
      <div className="md:col-span-2">
        <div className="mb-4 flex items-center gap-3">
          <BicycleIcon size={52} color="#FFD700" opacity={1} />
          <div>
            <p className="telugu text-xl font-black">నరసరావుపేట TDP</p>
            <p className="text-sm text-white/70">Dr. Chadalavada Aravinda Babu, MLA</p>
          </div>
        </div>
        <p className="max-w-xl text-sm text-white/75">A public information platform for Narasaraopet constituency development, daily work, schemes, news, and citizen contact.</p>
        <a href="tel:9398724704" className="mt-4 inline-flex rounded-full bg-tdp-yellow px-4 py-2 text-sm font-black text-tdp-navy">Website made by WayzenTech 9398724704</a>
      </div>
      <div>
        <p className="mb-3 font-bold text-tdp-yellow">Quick Links</p>
        <div className="grid gap-2 text-sm text-white/75"><Link to="/daily-work">Daily Work</Link><Link to="/super6">Super 6</Link><Link to="/schemes">Schemes</Link><Link to="/narasaraopet">Narasaraopet</Link><Link to="/gallery">Gallery</Link></div>
      </div>
      <div>
        <p className="mb-3 font-bold text-tdp-yellow">Contact</p>
        <div className="grid gap-2 text-sm text-white/75"><a href="tel:9398724704" className="inline-flex gap-2"><Phone size={15} />+91 9398724704</a><span className="inline-flex gap-2"><Mail size={15} />office@tdpnrt.org</span><span className="inline-flex gap-2"><MapPin size={15} />Narasaraopet, Palnadu</span></div>
        <div className="mt-4 flex gap-3"><Facebook /><Youtube /><Instagram /></div>
      </div>
    </div>
    <div className="border-t border-white/10 py-4 text-xs text-white/60">
      <div className="container-page flex items-center justify-between gap-4">
        <span>© 2026 Narasaraopet TDP. All rights reserved.</span>
        <a href="/tv" target="_blank" rel="noreferrer" className="inline-grid h-7 w-7 place-items-center rounded-full text-white/25 transition hover:bg-white/10 hover:text-white/60" aria-label="TV display">
          <Tv size={13} />
        </a>
      </div>
    </div>
  </footer>
);

export default Footer;
