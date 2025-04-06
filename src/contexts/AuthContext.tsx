import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User, 
  signInWithPopup,
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { isUserAllowed, registerUser } from "@/lib/data";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
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
      // Check if user is allowed BEFORE registering them
      const isAllowed = await isUserAllowed(result.user.email || '');
      
      if (!isAllowed) {
        await firebaseSignOut(auth);
        setError('You are not authorized to access this application. Please request an invitation from an administrator.');
        return;
      }
      
      // Only register if the user is already allowed to access the system
      // Extract first and last name from Google displayName
      const displayName = result.user.displayName || '';
      const nameArray = displayName.split(' ');
      const firstName = nameArray[0] || '';
      const lastName = nameArray.slice(1).join(' ') || '';
      
      // Register the user with first and last name from Google
      await registerUser(
        result.user.uid, 
        result.user.email || '', 
        firstName,
        lastName,
        displayName
      );
      
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
        setError('You are not authorized to access this application. Please request an invitation from an administrator.');
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

  const signUpWithEmail = async (email: string, password: string, firstName = '', lastName = '') => {
    try {
      // Check if the user is allowed to sign up BEFORE creating their account
      const isAllowed = await isUserAllowed(email);
      
      if (!isAllowed) {
        setError('You are not authorized to access this application. Please request an invitation from an administrator.');
        return;
      }
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user profile with the display name
      const displayName = `${firstName} ${lastName}`.trim();
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      
      // Register the user in Firestore with first and last name
      await registerUser(
        result.user.uid, 
        result.user.email || '', 
        firstName,
        lastName,
        displayName
      );
      
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
        // Check if user is allowed to access the application
        const isAllowed = await isUserAllowed(user.email || '');
        if (!isAllowed) {
          await firebaseSignOut(auth);
          setError('You are not authorized to access this application. Please request an invitation from an administrator.');
          setCurrentUser(null);
        } else {
          setCurrentUser(user);
          setError(null);

          // Only register user data if they are already allowed to access the system
          // This means they must be in admin, users, or shareInvites collections
          if (user.email) {
            import('@/lib/data').then(({ registerUser }) => {
              // Extract name from display name if available
              const displayName = user.displayName || '';
              const nameArray = displayName.split(' ');
              const firstName = nameArray[0] || '';
              const lastName = nameArray.slice(1).join(' ') || '';
              
              // Register or update user data
              registerUser(
                user.uid,
                user.email || '',
                firstName,
                lastName,
                displayName
              );
            });
          }
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
