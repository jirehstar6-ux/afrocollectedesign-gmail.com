import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, FacebookAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  initializeFirestore, 
  doc, 
  getDocFromServer,
  persistentLocalCache,
  persistentSingleTabManager,
  memoryLocalCache
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Try to initialize with persistent cache, fallback to memory if it fails
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    ignoreUndefinedProperties: true,
    localCache: persistentLocalCache({
      tabManager: persistentSingleTabManager({
        forceOwnership: true
      })
    })
  }, (firebaseConfig as any).firestoreDatabaseId || '(default)');
} catch (e) {
  console.warn("Firestore persistent cache failed, falling back to memory:", e);
  firestoreDb = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    ignoreUndefinedProperties: true,
    localCache: memoryLocalCache()
  }, (firebaseConfig as any).firestoreDatabaseId || '(default)');
}

export const db = firestoreDb;

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
export const facebookProvider = new FacebookAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signInWithFacebook = () => signInWithPopup(auth, facebookProvider);
export const logOut = () => signOut(auth);

// Optional: Connection check helper - silent version
export const checkConnection = async () => {
  return true; // Assume true to let SDK handle offline/online transition via cache
};
