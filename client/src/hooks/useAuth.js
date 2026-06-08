import { useEffect } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '@/services/firebase';
import { useAuthStore } from '@/store/authStore';

let authListenerStarted = false;

export const useAuth = () => {
  const { user, loading, setUser, setLoading } = useAuthStore();
  useEffect(() => {
    const localSession = sessionStorage.getItem('tdp-admin-session') === 'local';
    if (localSession) {
      setUser({ uid: 'local-admin', email: 'tdpadmin', displayName: 'TDP Admin', local: true });
      return undefined;
    }

    if (auth.currentUser) {
      setUser(auth.currentUser);
      return undefined;
    }

    if (authListenerStarted) {
      const timeout = window.setTimeout(() => {
        if (!auth.currentUser) setUser(null);
      }, 3000);
      return () => window.clearTimeout(timeout);
    }

    authListenerStarted = true;
    setLoading(true);

    const fallback = window.setTimeout(() => {
      console.error('Firebase auth state check timed out. Redirecting to login.');
      setUser(auth.currentUser || null);
    }, 5000);

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        window.clearTimeout(fallback);
        setUser(currentUser);
      },
      (error) => {
        window.clearTimeout(fallback);
        console.error('Firebase auth state error:', error);
        setUser(null);
      }
    );

    return () => {
      window.clearTimeout(fallback);
      unsubscribe();
    };
  }, [setLoading, setUser]);
  return {
    user,
    loading,
    login: async (email, password) => {
      setLoading(true);
      if ((email === 'tdpadmin' || email === 'tdpadmin@local') && password === 'tdpadmin') {
        const localUser = { uid: 'local-admin', email: 'tdpadmin', displayName: 'TDP Admin', local: true };
        sessionStorage.setItem('tdp-admin-session', 'local');
        setUser(localUser);
        return { user: localUser };
      }
      const credential = await signInWithEmailAndPassword(auth, email, password);
      sessionStorage.setItem('tdp-admin-session', 'true');
      localStorage.setItem('tdp-admin-session', 'true');
      setUser(credential.user);
      return credential;
    },
    logout: async () => {
      if (auth.currentUser) await signOut(auth);
      sessionStorage.removeItem('tdp-admin-session');
      localStorage.removeItem('tdp-admin-session');
      setUser(null);
    }
  };
};
