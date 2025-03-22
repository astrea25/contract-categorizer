
import { initializeApp } from "firebase/app";
import { GoogleAuthProvider, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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

export default app;
