import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import AdminLayout from '@/components/admin/AdminLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

const Home = lazy(() => import('@/pages/public/Home'));
const About = lazy(() => import('@/pages/public/About'));
const DailyWork = lazy(() => import('@/pages/public/DailyWork'));
const Gallery = lazy(() => import('@/pages/public/Gallery'));
const Schemes = lazy(() => import('@/pages/public/Schemes'));
const Super6 = lazy(() => import('@/pages/public/Super6'));
const Narasaraopet = lazy(() => import('@/pages/public/Narasaraopet'));
const Contact = lazy(() => import('@/pages/public/Contact'));
const News = lazy(() => import('@/pages/public/News'));
const Leaders = lazy(() => import('@/pages/public/Leaders'));
const DetailPage = lazy(() => import('@/pages/public/DetailPage'));
const AdminLogin = lazy(() => import('@/pages/admin/AdminLogin'));
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'));
const ManageHome = lazy(() => import('@/pages/admin/ManageHome'));
const ManageLeaders = lazy(() => import('@/pages/admin/ManageLeaders'));
const ManageHero = lazy(() => import('@/pages/admin/ManageHero'));
const ManageDailyWork = lazy(() => import('@/pages/admin/ManageDailyWork'));
const ManageGallery = lazy(() => import('@/pages/admin/ManageGallery'));
const ManageNews = lazy(() => import('@/pages/admin/ManageNews'));
const ManageSchemes = lazy(() => import('@/pages/admin/ManageSchemes'));
const ManageSuper6 = lazy(() => import('@/pages/admin/ManageSuper6'));
const ManageNarasaraopet = lazy(() => import('@/pages/admin/ManageNarasaraopet'));
const ManageBanners = lazy(() => import('@/pages/admin/ManageBanners'));
const ManageMessages = lazy(() => import('@/pages/admin/ManageMessages'));
const ManageAbout = lazy(() => import('@/pages/admin/ManageAbout'));
const ManageAnnouncements = lazy(() => import('@/pages/admin/ManageAnnouncements'));
const Analytics = lazy(() => import('@/pages/admin/Analytics'));
const Settings = lazy(() => import('@/pages/admin/Settings'));

const Page = ({ children }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.25 }}>{children}</motion.div>
);

const App = () => {
  const location = useLocation();
  return (
    <>
      <Suspense fallback={<LoadingSpinner fullScreen />}>
        <ErrorBoundary resetKey={location.pathname}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route element={<Layout />}>
                <Route index element={<Page><Home /></Page>} />
                <Route path="about" element={<Navigate to="/narasaraopet" replace />} />
                <Route path="leaders" element={<Page><Leaders /></Page>} />
                <Route path="daily-work" element={<Page><DailyWork /></Page>} />
                <Route path="daily-work/:id" element={<Page><DetailPage collectionName="dailyWork" page="dailywork" /></Page>} />
                <Route path="achievements" element={<Navigate to="/" replace />} />
                <Route path="gallery" element={<Page><Gallery /></Page>} />
                <Route path="super6" element={<Page><Super6 /></Page>} />
                <Route path="schemes" element={<Page><Schemes /></Page>} />
                <Route path="narasaraopet" element={<Page><Narasaraopet /></Page>} />
                <Route path="towns" element={<Navigate to="/narasaraopet" replace />} />
                <Route path="towns/:id" element={<Navigate to="/narasaraopet" replace />} />
                <Route path="contact" element={<Page><Contact /></Page>} />
                <Route path="news" element={<Page><News /></Page>} />
                <Route path="news/:id" element={<Page><DetailPage collectionName="news" page="news" /></Page>} />
              </Route>
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="home" element={<ManageHome />} />
                <Route path="leaders" element={<ManageLeaders />} />
                <Route path="hero" element={<ManageHero />} />
                <Route path="daily-work" element={<ManageDailyWork />} />
                <Route path="achievements" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="news" element={<ManageNews />} />
                <Route path="super6" element={<ManageSuper6 />} />
                <Route path="gallery" element={<ManageGallery />} />
                <Route path="schemes" element={<ManageSchemes />} />
                <Route path="narasaraopet" element={<ManageNarasaraopet />} />
                <Route path="towns" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="banners" element={<ManageBanners />} />
                <Route path="about" element={<ManageAbout />} />
                <Route path="announcements" element={<ManageAnnouncements />} />
                <Route path="messages" element={<ManageMessages />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </ErrorBoundary>
      </Suspense>
    </>
  );
};

export default App;
