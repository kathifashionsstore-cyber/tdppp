import { Router } from 'express';
import admin, { getAdminDb } from '../services/firebaseAdmin.js';

const router = Router();

router.post('/track', async (req, res, next) => {
  try {
    const { page = 'home', event = 'pageView', data = {} } = req.body;
    const id = new Date().toISOString().slice(0, 10);
    await getAdminDb().collection('analytics').doc(id).set({
      date: id,
      [`pageViews.${page}`]: admin.firestore.FieldValue.increment(1),
      totalVisits: admin.firestore.FieldValue.increment(event === 'pageView' ? 1 : 0),
      lastEvent: event,
      lastData: data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;
