import { Facebook, Instagram, MessageCircle, Twitter } from 'lucide-react';

const links = [
  { label: 'WhatsApp', href: 'https://wa.me/919398724704', icon: MessageCircle, color: '#22C55E' },
  { label: 'Facebook', href: 'https://facebook.com', icon: Facebook, color: '#1877F2' },
  { label: 'Instagram', href: 'https://instagram.com', icon: Instagram, color: '#E1306C' },
  { label: 'Twitter', href: 'https://twitter.com', icon: Twitter, color: '#111827' }
];

const FloatingSocials = () => (
  <div className="fixed left-3 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-2 md:flex">
    {links.map(({ label, href, icon: Icon, color }) => (
      <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="grid h-11 w-11 place-items-center rounded-full bg-white text-white shadow-lg ring-1 ring-black/5 transition hover:translate-x-1" style={{ background: color }} aria-label={label}>
        <Icon size={18} />
      </a>
    ))}
  </div>
);

export default FloatingSocials;
