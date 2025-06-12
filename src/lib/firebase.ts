
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth"; // Import Firebase Auth

// Log all available environment variable keys for debugging
console.log("--- Firebase Environment Variables Diagnostics ---");
console.log("Available process.env keys:", Object.keys(process.env));

// Read all expected environment variables
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL; 
const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID; 

// Log the values of environment variables as read by the script
console.log("Attempted to read NEXT_PUBLIC_FIREBASE_API_KEY. Value:", apiKey);
console.log("Attempted to read NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN. Value:", authDomain);
console.log("Attempted to read NEXT_PUBLIC_FIREBASE_PROJECT_ID. Value:", projectId);
console.log("Attempted to read NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET. Value:", storageBucket);
console.log("Attempted to read NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID. Value:", messagingSenderId);
console.log("Attempted to read NEXT_PUBLIC_FIREBASE_APP_ID. Value:", appId);
console.log("Attempted to read NEXT_PUBLIC_FIREBASE_DATABASE_URL. Value:", databaseURL);
console.log("Attempted to read NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID. Value:", measurementId);
console.log("-------------------------------------------------");


// Check if critical environment variables are set
if (!apiKey || !authDomain || !projectId) {
  let errorMessage = "One or more critical Firebase environment variables are not set or not accessible: \n";
  if (!apiKey) errorMessage += "- NEXT_PUBLIC_FIREBASE_API_KEY is missing.\n";
  if (!authDomain) errorMessage += "- NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is missing.\n";
  if (!projectId) errorMessage += "- NEXT_PUBLIC_FIREBASE_PROJECT_ID is missing.\n";
  
  errorMessage += "\nPlease ensure they are correctly defined in your .env.local file at the root of your project (the same level as package.json). ";
  errorMessage += "After creating or modifying the .env.local file, you MUST RESTART your Next.js development server for the changes to take effect.";
  throw new Error(errorMessage);
}

const firebaseConfig = {
  apiKey,
  authDomain,
  databaseURL, 
  projectId,
  storageBucket, 
  messagingSenderId, 
  appId, 
  measurementId, 
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const db: Firestore = getFirestore(app);
const auth: Auth = getAuth(app);

export { db, auth, app };
