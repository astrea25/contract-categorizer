import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isUserAllowed, registerUser } from "@/lib/data";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  // signUpWithEmail removed
  // signInWithGoogle removed
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

  // signInWithGoogle function removed

  const signInWithEmail = async (email: string, password: string) => {
    try {
      // Try with the provided password first
      let result;
      let usedDefaultPassword = false;

      try {
        result = await signInWithEmailAndPassword(auth, email, password);
      } catch (error: any) {
        // If wrong password, try with the default password (12345678)
        if (error.code === 'auth/wrong-password') {
          try {
            // Try with default password as a fallback
            result = await signInWithEmailAndPassword(auth, email, '12345678');
            usedDefaultPassword = true;
          } catch (defaultPasswordError) {
            // If default password also fails, show the original error
            setError('Invalid email or password.');
            return;
          }
        } else if (error.code === 'auth/user-not-found') {
          setError('Invalid email or password.');
          return;
        } else if (error.code === 'auth/too-many-requests') {
          setError('Too many unsuccessful login attempts. Please try again later.');
          return;
        } else {
          throw error; // Re-throw other errors
        }
      }

      if (!result) {
        setError('Failed to sign in.');
        return;
      }

      const isAllowed = await isUserAllowed(result.user.email || '');

      if (!isAllowed) {
        await firebaseSignOut(auth);
        setError('You are not authorized to access this application. Please request an invitation from an administrator.');
        return;
      }

      // If we used the default password, show a message to change it
      if (usedDefaultPassword) {
        setError('You have signed in with the default password. Please change your password for security reasons.');
      } else {
        setError(null);
      }
    } catch (error: any) {
      setError('Failed to sign in. Please try again.');
    }
  };

  // signUpWithEmail function removed

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
          // This means they must be in admin, users, legalTeam, or managementTeam collections
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
    signInWithEmail,
    signOut,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
