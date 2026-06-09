import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './Navbar';
import MobileBottomNav from './MobileBottomNav';
import Footer from './Footer';
import AnnouncementBar from '@/components/ui/AnnouncementBar';
import FestivalBanner from '@/components/ui/FestivalBanner';
import Chatbot from '@/components/ui/Chatbot';
import BackToTop from '@/components/ui/BackToTop';
import FloatingSocials from '@/components/ui/FloatingSocials';
import SuperSixSection from '@/components/ui/SuperSixSection';
import { trackPageView } from '@/services/analyticsService';

const Layout = () => {
  const location = useLocation();
  useEffect(() => {
    const page = location.pathname === '/' ? 'home' : location.pathname.split('/')[1] || 'home';
    trackPageView(page);
  }, [location.pathname]);
  return (
    <div className="min-h-screen bg-[var(--off-white)] pt-8 md:pt-10">
      <AnnouncementBar />
      <Navbar />
      <main className="safe-bottom md:pb-0"><Outlet /></main>
      <Footer />
      <FestivalBanner />
      <FloatingSocials />
      <SuperSixSection />
      <Chatbot />
      <BackToTop />
      <MobileBottomNav />
    </div>
  );
};

export default Layout;
