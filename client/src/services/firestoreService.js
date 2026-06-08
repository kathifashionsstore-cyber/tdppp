import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { db } from './firebase';

const stamp = (data, isNew = false) => ({
  ...data,
  updatedAt: serverTimestamp(),
  ...(isNew ? { createdAt: serverTimestamp() } : {})
});

export const getDocument = async (collectionName, id) => {
  const snap = await getDoc(doc(db, collectionName, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const setDocument = async (collectionName, id, data) => {
  await setDoc(doc(db, collectionName, id), stamp(data), { merge: true });
  return { id, ...data };
};

export const addDocument = async (collectionName, data) => {
  const ref = await addDoc(collection(db, collectionName), stamp(data, true));
  return { id: ref.id, ...data };
};

export const updateDocument = async (collectionName, id, data) => {
  await updateDoc(doc(db, collectionName, id), stamp(data));
  return { id, ...data };
};

export const deleteDocument = (collectionName, id) => deleteDoc(doc(db, collectionName, id));

export const listDocuments = async (collectionName, options = {}) => {
  const clauses = [];
  if (options.publishedOnly) clauses.push(where('isPublished', '==', true));
  if (options.activeOnly) clauses.push(where('isActive', '==', true));
  if (options.category && options.category !== 'all') clauses.push(where('category', '==', options.category));
  const q = clauses.length ? query(collection(db, collectionName), ...clauses) : collection(db, collectionName);
  const snap = await getDocs(q);
  let items = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
  if (options.orderByField) {
    const direction = options.orderDirection === 'asc' ? 1 : -1;
    items = items.sort((a, b) => {
      const left = a[options.orderByField]?.toMillis?.() || a[options.orderByField] || 0;
      const right = b[options.orderByField]?.toMillis?.() || b[options.orderByField] || 0;
      return left > right ? direction : left < right ? -direction : 0;
    });
  }
  if (options.limitCount) items = items.slice(0, options.limitCount);
  return items;
};

export const subscribeDocuments = (collectionName, options = {}, callback, onError) => {
  const clauses = [];
  if (options.activeOnly) clauses.push(where('isActive', '==', true));
  if (options.publishedOnly) clauses.push(where('isPublished', '==', true));
  const q = clauses.length ? query(collection(db, collectionName), ...clauses) : collection(db, collectionName);
  return onSnapshot(q, (snap) => {
    let items = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
    if (options.orderByField) {
      const direction = options.orderDirection === 'desc' ? -1 : 1;
      items = items.sort((a, b) => {
        const left = a[options.orderByField]?.toMillis?.() || a[options.orderByField] || 0;
        const right = b[options.orderByField]?.toMillis?.() || b[options.orderByField] || 0;
        return left > right ? direction : left < right ? -direction : 0;
      });
    }
    if (options.limitCount) items = items.slice(0, options.limitCount);
    callback(items);
  }, onError);
};

export const trackCollectionView = async (collectionName, id) => {
  if (!id) return;
  await updateDoc(doc(db, collectionName, id), { views: increment(1) }).catch(() => {});
};

export const appendChatbotKnowledge = async (knowledge) => {
  await setDoc(doc(db, 'siteConfig', 'chatbotKnowledge'), {
    knowledge: arrayUnion(knowledge),
    lastUpdated: serverTimestamp()
  }, { merge: true });
};

export const collectionsApi = {
  getDocument,
  setDocument,
  addDocument,
  updateDocument,
  deleteDocument,
  listDocuments,
  subscribeDocuments
};
