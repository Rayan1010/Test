import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';
import configData from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(configData) : getApp();

// Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Firestore with databaseId support
export const db = configData.firestoreDatabaseId 
  ? getFirestore(app, configData.firestoreDatabaseId)
  : getFirestore(app);

export { 
  signInWithPopup, 
  firebaseSignOut, 
  onAuthStateChanged 
};
export type { User };
