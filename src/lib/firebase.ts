
import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAN7qiGBrfgIWdv5ycLAnNIqUyrVtVm02E",
  authDomain: "contract-management-25ae3.firebaseapp.com",
  projectId: "contract-management-25ae3",
  storageBucket: "contract-management-25ae3.appspot.com",
  messagingSenderId: "484868423681",
  appId: "1:484868423681:web:5a68b5aa36aad4cba0bb8b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// For development environments, use emulators if needed
if (window.location.hostname === 'localhost' || 
    window.location.hostname.includes('lovableproject.com')) {
  // Add Lovable's domains to provider's custom parameters for allowed domains
  googleProvider.setCustomParameters({
    // Allow redirects to any domain
    prompt: 'select_account'
  });
}

export default app;
