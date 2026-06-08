import { doc, getDoc, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

const todayId = () => new Date().toISOString().slice(0, 10);

export const trackPageView = async (page) => {
  const id = todayId();
  await setDoc(doc(db, 'analytics', id), {
    date: id,
    totalVisits: increment(1),
    [`pageViews.${page}`]: increment(1),
    updatedAt: serverTimestamp()
  }, { merge: true }).catch(() => {});
};

export const trackChatQuery = async (query, language) => {
  const id = todayId();
  await setDoc(doc(db, 'analytics', id), {
    date: id,
    chatbotQueries: increment(1),
    [`languageStats.${language}`]: increment(1),
    lastChatQuery: query,
    updatedAt: serverTimestamp()
  }, { merge: true }).catch(() => {});
};

export const getAnalyticsDay = async (id = todayId()) => {
  const snap = await getDoc(doc(db, 'analytics', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};
