
export type FirebaseConfig = {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
};

export function getFirebaseConfig(): FirebaseConfig | null {
    const firebaseConfig: Partial<FirebaseConfig> = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    // A simple check to see if all keys are present.
    if (Object.values(firebaseConfig).some(value => !value)) {
        console.error("Firebase configuration is missing or incomplete. Ensure all required NEXT_PUBLIC_FIREBASE_* variables are set in .env.local");
        return null;
    }

    return firebaseConfig as FirebaseConfig;
}
