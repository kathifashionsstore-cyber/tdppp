import { Router } from 'express';
import { getAdminDb } from '../services/firebaseAdmin.js';

const router = Router();

router.get('/banners/active', async (_req, res, next) => {
  try {
    const now = new Date();
    const snap = await getAdminDb().collection('festivalBanners').where('isActive', '==', true).orderBy('priority', 'desc').get();
    const banners = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })).filter((banner) => {
      const start = banner.startDate?.toDate?.() || new Date(banner.startDate);
      const end = banner.endDate?.toDate?.() || new Date(banner.endDate);
      return now >= start && now <= end;
    });
    res.json({ banners });
  } catch (error) {
    next(error);
  }
});

router.get('/:collection', async (req, res, next) => {
  try {
    const snap = await getAdminDb().collection(req.params.collection).limit(50).get();
    res.json({ items: snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) });
  } catch (error) {
    next(error);
  }
});

export default router;
