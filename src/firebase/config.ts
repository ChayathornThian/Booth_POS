import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  type Firestore 
} from 'firebase/firestore';
import type { FirebaseConfig } from '../types';

let currentApp: FirebaseApp | null = null;
let currentDb: Firestore | null = null;

// Default fallback config for ch-pos-76514
export const DEFAULT_ENV_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAJdn43j8jpXAT5LxRhaokz5TqZDdDyKyM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'ch-pos-76514.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'ch-pos-76514',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'ch-pos-76514.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '204568493457',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:204568493457:web:7e0778e665012f33ef2e30'
};

export function isFirebaseConfigured(config?: FirebaseConfig): boolean {
  const c = config || DEFAULT_ENV_FIREBASE_CONFIG;
  return Boolean(c.apiKey && c.projectId && c.appId);
}

export function initFirebase(customConfig?: FirebaseConfig): { app: FirebaseApp | null; db: Firestore | null } {
  const config = customConfig || DEFAULT_ENV_FIREBASE_CONFIG;

  if (!isFirebaseConfigured(config)) {
    return { app: null, db: null };
  }

  try {
    const apps = getApps();
    if (apps.length > 0) {
      currentApp = apps[0];
      currentDb = getFirestore(currentApp);
    } else {
      currentApp = initializeApp(config);
      try {
        currentDb = initializeFirestore(currentApp, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
          })
        });
      } catch {
        currentDb = getFirestore(currentApp);
      }
    }
    return { app: currentApp, db: currentDb };
  } catch (err) {
    console.error('Failed to initialize Firebase', err);
    return { app: null, db: null };
  }
}

export function getFirebaseDb(): Firestore | null {
  if (currentDb) return currentDb;
  return initFirebase().db;
}
