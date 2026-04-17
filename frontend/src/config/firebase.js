import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY_HERE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "portfoliomate-ef497.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "portfoliomate-ef497",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "portfoliomate-ef497.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "102684491175",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID_HERE"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();