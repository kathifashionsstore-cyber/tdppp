import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBp6dyQHsP05ptxyEIo0R71fpxvYbfHa8c',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'tdpnrt.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'tdpnrt',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'tdpnrt.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '538558202448',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:538558202448:web:8f6361480f96ea76cbc755',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-MDXPP8PBGP'
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = (() => {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } catch {
    return getFirestore(app);
  }
})();
export const storage = getStorage(app);

export const analyticsPromise = isSupported().then((supported) => supported ? getAnalytics(app) : null);
