
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth"; // Import Firebase Auth
// import { getDatabase } from "firebase/database"; // Realtime Database için eklenebilir
// import { getAnalytics } from "firebase/analytics"; // Analytics için eklenebilir

// Check if critical environment variables are set BEFORE attempting to use them
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  throw new Error(
    "Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is not set or not accessible in your environment variables. " +
    "Please ensure it is correctly defined in your .env.local file at the root of your project, " +
    "and that you have RESTARTED your Next.js development server after making changes to .env.local."
  );
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL, // Opsiyonel, Realtime Database için
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Opsiyonel, Analytics için
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  // if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  //   getAnalytics(app); // Analytics'i başlatmak için (opsiyonel)
  // }
} else {
  app = getApps()[0];
}

const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app); // Initialize Firebase Auth
// const database = getDatabase(app); // Realtime Database için

export { db, auth, app }; // Export auth instance
