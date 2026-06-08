import { Router } from 'express';
import admin, { getAdminDb } from '../services/firebaseAdmin.js';
import { answerQuestion } from '../services/chatbotEngine.js';

const router = Router();

router.post('/query', async (req, res, next) => {
  try {
    const { message, language = 'te', sessionId = 'anonymous' } = req.body;
    const db = getAdminDb();
    const snap = await db.collection('siteConfig').doc('chatbotKnowledge').get();
    const knowledge = snap.exists ? snap.data().knowledge || [] : [];
    const answer = answerQuestion(message, knowledge, language);
    const id = new Date().toISOString().slice(0, 10);
    await db.collection('analytics').doc(id).set({
      date: id,
      chatbotQueries: admin.firestore.FieldValue.increment(1),
      lastSessionId: sessionId
    }, { merge: true }).catch(() => {});
    res.json({ answer });
  } catch (error) {
    next(error);
  }
});

export default router;
