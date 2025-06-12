
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
// import { getAuth } from "firebase/auth"; // Gelecekte Firebase Auth için eklenebilir
// import { getDatabase } from "firebase/database"; // Realtime Database için eklenebilir
// import { getAnalytics } from "firebase/analytics"; // Analytics için eklenebilir

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
// const auth = getAuth(app); // Gelecekte Firebase Auth için
// const database = getDatabase(app); // Realtime Database için

export { db, app };
