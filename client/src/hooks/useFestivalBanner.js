import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { isActiveDateRange } from '@/utils/dateUtils';

export const useFestivalBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [activeBanner, setActiveBanner] = useState(null);

  useEffect(() => {
    const checkAndShowBanner = async () => {
      if (sessionStorage.getItem('bannerSeen') === 'true') return;
      const snap = await getDocs(collection(db, 'festivalBanners'));
      const banners = snap.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .filter((banner) => banner.isActive)
        .sort((a, b) => {
          const priority = (b.priority || 0) - (a.priority || 0);
          if (priority) return priority;
          const left = b.createdAt?.toMillis?.() || b.createdAt || 0;
          const right = a.createdAt?.toMillis?.() || a.createdAt || 0;
          return left > right ? 1 : left < right ? -1 : 0;
        });
      for (const banner of banners) {
        if (isActiveDateRange(banner.startDate, banner.endDate)) {
          setActiveBanner(banner);
          setShowBanner(true);
          break;
        }
      }
    };
    checkAndShowBanner().catch(() => {});
  }, []);

  const closeBanner = () => {
    sessionStorage.setItem('bannerSeen', 'true');
    setShowBanner(false);
  };

  return { showBanner, activeBanner, closeBanner };
};
