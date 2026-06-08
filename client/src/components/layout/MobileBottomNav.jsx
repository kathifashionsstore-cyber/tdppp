import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CalendarCheck, Menu, Newspaper, Phone, Star, X } from 'lucide-react';

const drawerLinks = [
  { hash: '#home', tab: 'home', label: 'Home' },
  { hash: '#graphs', tab: 'super6', label: 'Super 6 Progress' },
  { hash: '#news', tab: 'news', label: 'News' },
  { hash: '#daily', tab: 'daily', label: 'Daily Works' },
  { hash: '#leader', tab: 'leader', label: 'Leader' },
  { hash: '#narasaraopet', tab: 'narasaraopet', label: 'Narasaraopet' },
  { hash: '#festivals', tab: 'festivals', label: 'Festival Banners' },
  { hash: '#donate', tab: 'donate', label: 'Donate' },
  { hash: '#contact', tab: 'contact', label: 'Contact' }
];

const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [arrivingHome, setArrivingHome] = useState(false);

  const jump = (hash, tab = 'home') => {
    setMenuOpen(false);
    setActiveTab(tab);
    if (tab === 'home') {
      setArrivingHome(true);
      window.setTimeout(() => setArrivingHome(false), 560);
    }

    if (location.pathname !== '/') {
      navigate('/');
      window.setTimeout(() => scrollToHash(hash), 170);
      return;
    }

    scrollToHash(hash);
  };

  useEffect(() => {
    if (location.pathname !== '/') return;

    const sections = [
      ['home', '#home'],
      ['super6', '#graphs'],
      ['news', '#news'],
      ['daily', '#daily']
    ];

    const onScroll = () => {
      const current = sections.findLast(([, hash]) => {
        const element = document.querySelector(hash);
        return element && element.getBoundingClientRect().top <= 140;
      });
      if (current) setActiveTab(current[0]);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.pathname]);

  return (
    <>
      <nav className="mobile-tab-bar md:hidden" aria-label="Mobile bottom navigation">
        <svg className="tab-bar-notch-bg" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 375 72" aria-hidden="true">
          <path
            d="M0,0 L145,0 C152,0 155,2 157,8 Q160,20 162,32 C164,44 168,52 175,54 C179,56 183,58 187.5,58 C192,58 196,56 200,54 C207,52 211,44 213,32 Q215,20 218,8 C220,2 223,0 230,0 L375,0 L375,72 L0,72 Z"
            fill="white"
          />
        </svg>
        <div className="tab-items-row">
          <Tab icon={Star} label="Super 6" active={activeTab === 'super6'} badge="6" onClick={() => jump('#graphs', 'super6')} />
          <Tab icon={Newspaper} label="News" active={activeTab === 'news'} onClick={() => jump('#news', 'news')} />
          <div className="tab-home-container">
            <button
              type="button"
              className={`tab-home-btn ${activeTab === 'home' ? 'is-home-active' : ''} ${arrivingHome ? 'arriving' : ''}`}
              onClick={() => jump('#home', 'home')}
              aria-label="Home page"
            >
              <BicycleSvg />
              <span className="tab-home-label">Home</span>
            </button>
          </div>
          <Tab icon={CalendarCheck} label="Daily" active={activeTab === 'daily'} onClick={() => jump('#daily', 'daily')} />
          <Tab icon={Menu} label="Menu" active={menuOpen} onClick={() => setMenuOpen(true)} />
        </div>
      </nav>

      <div className={`mobile-drawer md:hidden ${menuOpen ? 'is-open' : ''}`} aria-hidden={!menuOpen}>
        <button className="drawer-backdrop" aria-label="Close menu" onClick={() => setMenuOpen(false)} />
        <aside className="drawer-panel">
          <div className="drawer-header">
            <img src="/logo-tdp.png" alt="TDP Logo" className="h-11 w-11 rounded-full bg-white object-contain p-1" />
            <div className="min-w-0">
              <span className="block truncate font-black text-white">Telugu Desam Party</span>
              <small className="block truncate text-tdp-yellow">Narasaraopet Constituency</small>
            </div>
            <button type="button" className="drawer-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={16} /></button>
          </div>
          <nav className="drawer-nav">
            {drawerLinks.map((item) => (
              <button key={item.hash} type="button" className="drawer-link w-full text-left" onClick={() => jump(item.hash, item.tab)}>
                {item.label}
              </button>
            ))}
            <Link to="/super6" onClick={() => setMenuOpen(false)} className="drawer-link">Super 6 Schemes</Link>
            <Link to="/narasaraopet" onClick={() => setMenuOpen(false)} className="drawer-link">Full Constituency Page</Link>
          </nav>
          <div className="drawer-footer">
            <p className="inline-flex items-center justify-center gap-2"><Phone size={13} /> 9398724704</p>
          </div>
        </aside>
      </div>
    </>
  );
};

const scrollToHash = (hash) => {
  const target = document.querySelector(hash);
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const Tab = ({ icon: Icon, label, active, badge, onClick }) => (
  <button type="button" className={`tab-item ${active ? 'is-active' : ''}`} onClick={onClick}>
    <span className="tab-icon">
      <Icon size={22} strokeWidth={2.25} />
      {badge && <span className="tab-badge">{badge}</span>}
    </span>
    <span className="tab-label">{label}</span>
    <span className="tab-dot" />
  </button>
);

const BicycleSvg = () => (
  <svg className="bicycle-svg" width="42" height="28" viewBox="0 0 72 44" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <g style={{ transformOrigin: '13px 30px' }}>
      <circle cx="13" cy="30" r="12" fill="none" stroke="white" strokeWidth="2.5" />
      <g className="rear-spokes" style={{ transformOrigin: '13px 30px' }}>
        <line x1="13" y1="18" x2="13" y2="42" stroke="white" strokeWidth="1.2" opacity="0.8" />
        <line x1="1" y1="30" x2="25" y2="30" stroke="white" strokeWidth="1.2" opacity="0.8" />
        <line x1="4.5" y1="21.5" x2="21.5" y2="38.5" stroke="white" strokeWidth="1" opacity="0.7" />
        <line x1="4.5" y1="38.5" x2="21.5" y2="21.5" stroke="white" strokeWidth="1" opacity="0.7" />
      </g>
      <circle cx="13" cy="30" r="2.5" fill="white" />
    </g>
    <g style={{ transformOrigin: '59px 30px' }}>
      <circle cx="59" cy="30" r="12" fill="none" stroke="white" strokeWidth="2.5" />
      <g className="front-spokes" style={{ transformOrigin: '59px 30px' }}>
        <line x1="59" y1="18" x2="59" y2="42" stroke="white" strokeWidth="1.2" opacity="0.8" />
        <line x1="47" y1="30" x2="71" y2="30" stroke="white" strokeWidth="1.2" opacity="0.8" />
        <line x1="50.5" y1="21.5" x2="67.5" y2="38.5" stroke="white" strokeWidth="1" opacity="0.7" />
        <line x1="50.5" y1="38.5" x2="67.5" y2="21.5" stroke="white" strokeWidth="1" opacity="0.7" />
      </g>
      <circle cx="59" cy="30" r="2.5" fill="white" />
    </g>
    <line x1="13" y1="30" x2="31" y2="22" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
    <line x1="13" y1="30" x2="27" y2="10" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <line x1="27" y1="10" x2="31" y2="22" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
    <line x1="27" y1="10" x2="45" y2="10" stroke="white" strokeWidth="2.8" strokeLinecap="round" />
    <line x1="45" y1="10" x2="31" y2="22" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="45" y1="10" x2="59" y2="30" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="27" y1="10" x2="25" y2="4" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <line x1="20" y1="4" x2="31" y2="4" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <line x1="45" y1="10" x2="48" y2="4" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <line x1="44" y1="4" x2="52" y2="4" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <circle cx="31" cy="22" r="3" fill="white" />
    <line x1="24" y1="26" x2="38" y2="18" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="24" cy="26" r="2" fill="#f5a623" />
    <circle cx="38" cy="18" r="2" fill="#f5a623" />
  </svg>
);

export default MobileBottomNav;
