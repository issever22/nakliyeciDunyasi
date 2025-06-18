
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
// Firebase Auth import removed

const firebaseConfig = {
  apiKey: "AIzaSyCzxTXhQ9NkLCK1r05T_l6kbtOI12_jM6M",
  authDomain: "isseverapps-myhotel.firebaseapp.com",
  databaseURL: "https://isseverapps-myhotel-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "isseverapps-myhotel",
  storageBucket: "isseverapps-myhotel.firebasestorage.app",
  messagingSenderId: "10725516098",
  appId: "1:10725516098:web:8343b7ecab687932f3dedb",
  measurementId: "G-YV53P9B5NB"
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db: Firestore = getFirestore(app);
// Auth instance removed

export { db, app }; // auth export removed

    