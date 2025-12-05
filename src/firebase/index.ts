
import { initializeApp, getApps, getApp, type FirebaseOptions, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

export interface FirebaseServices {
    app: FirebaseApp;
    auth: Auth;
    db: Firestore;
    storage: FirebaseStorage;
}

let firebaseInstance: FirebaseServices | null = null;

export function initializeFirebase(firebaseConfig: FirebaseOptions): FirebaseServices {
    if (!firebaseConfig.apiKey) {
        throw new Error('Firebase configuration is missing. Please check your .env.local file.');
    }
    
    // On the client, we want to reuse the same instance.
    if (typeof window !== 'undefined') {
        if (firebaseInstance) {
            return firebaseInstance;
        }
    }
    
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);

    firebaseInstance = { app, auth, db, storage };
    return firebaseInstance;
}
