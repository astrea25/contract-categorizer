import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  signInWithPopup,
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { isUserAllowed, registerUser } from "@/lib/data";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const isAllowed = await isUserAllowed(result.user.email || '');
      
      if (!isAllowed) {
        await firebaseSignOut(auth);
        setError('You are not authorized to access this application.');
        return;
      }
      
      setError(null);
    } catch (error) {
      setError('Failed to sign in. Please try again.');
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const isAllowed = await isUserAllowed(result.user.email || '');
      
      if (!isAllowed) {
        await firebaseSignOut(auth);
        setError('You are not authorized to access this application.');
        return;
      }
      
      setError(null);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('Invalid email or password.');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many unsuccessful login attempts. Please try again later.');
      } else {
        setError('Failed to sign in. Please try again.');
      }
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Register the user in Firestore
      await registerUser(result.user.uid, result.user.email || '', result.user.displayName || '');
      setError(null);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        setError('Email is already in use.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Email address is invalid.');
      } else {
        setError('Failed to sign up. Please try again.');
      }
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setError(null);
    } catch (error) {
      setError('Failed to sign out. Please try again.');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const isAllowed = await isUserAllowed(user.email || '');
        if (!isAllowed) {
          await firebaseSignOut(auth);
          setError('You are not authorized to access this application.');
          setCurrentUser(null);
        } else {
          setCurrentUser(user);
          setError(null);
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
