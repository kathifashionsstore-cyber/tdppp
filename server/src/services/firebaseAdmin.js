import admin from 'firebase-admin';

const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!admin.apps.length && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID || 'tdpnrt',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey
    })
  });
}

export const getAdminDb = () => {
  if (!admin.apps.length) throw new Error('Firebase Admin is not configured. Set service account env vars.');
  return admin.firestore();
};

export default admin;
