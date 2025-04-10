import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { isUserAllowed, registerUser, isUserAdmin, isUserLegalTeam, isUserManagementTeam, isUserApprover } from "@/lib/data";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  isLegalTeam: boolean;
  isManagementTeam: boolean;
  isApprover: boolean;
  userRole: string;
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

// Define a user state interface to hold all user-related state
interface UserState {
  currentUser: User | null;
  isAdmin: boolean;
  isLegalTeam: boolean;
  isManagementTeam: boolean;
  isApprover: boolean;
  userRole: string;
}

// Initial user state
const initialUserState: UserState = {
  currentUser: null,
  isAdmin: false,
  isLegalTeam: false,
  isManagementTeam: false,
  isApprover: false,
  userRole: "user"
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Use a single state object for all user-related state
  const [userState, setUserState] = useState<UserState>(initialUserState);
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

      // Check user roles and update state
      if (result.user) {
        const newUserState = await checkUserRoles(result.user);
        setUserState(newUserState);
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

  // Function to check user roles
  const checkUserRoles = async (user: User): Promise<UserState> => {
    try {
      // Check roles
      const admin = await isUserAdmin(user.email || '');
      const legal = await isUserLegalTeam(user.email || '');
      const management = await isUserManagementTeam(user.email || '');
      const approver = await isUserApprover(user.email || '');

      // Determine primary display role (for UI purposes)
      // A user can be both admin and legal/management team member
      let role = "user";
      if (admin) {
        role = "admin";
      } else if (legal) {
        role = "Legal Team";
      } else if (management) {
        role = "Management Team";
      } else if (approver) {
        role = "Approver";
      }

      // Return the new user state with all role flags
      // This allows a user to have multiple roles (admin + legal or admin + management)
      return {
        currentUser: user,
        isAdmin: admin,
        isLegalTeam: legal,
        isManagementTeam: management,
        isApprover: approver,
        userRole: role
      };
    } catch (error) {
      console.error("Error checking user roles:", error);
      // Return default state with the current user
      return {
        currentUser: user,
        isAdmin: false,
        isLegalTeam: false,
        isManagementTeam: false,
        userRole: "user"
      };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setError(null);
      // Reset user state on sign out
      setUserState(initialUserState);
    } catch (error) {
      setError('Failed to sign out. Please try again.');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Set the user immediately to improve initial load time
      if (user) {
        // Set basic user state immediately
        setUserState({
          currentUser: user,
          isAdmin: false,
          isLegalTeam: false,
          isManagementTeam: false,
          isApprover: false,
          userRole: "user"
        });
        setLoading(false);

        // Then check permissions and roles asynchronously
        (async () => {
          try {
            // Check if user is allowed to access the application
            const isAllowed = await isUserAllowed(user.email || '');

            if (!isAllowed) {
              await firebaseSignOut(auth);
              setError('You are not authorized to access this application. Please request an invitation from an administrator.');
              setUserState(initialUserState); // Reset to initial state
            } else {
              // Check user roles and update state
              const newUserState = await checkUserRoles(user);
              setUserState(newUserState);
              setError(null);

              // Only register user data if they are already allowed to access the system
              // Extract name from display name if available
              const displayName = user.displayName || '';
              const nameArray = displayName.split(' ');
              const firstName = nameArray[0] || '';
              const lastName = nameArray.slice(1).join(' ') || '';

              // Register or update user data
              await registerUser(
                user.uid,
                user.email || '',
                firstName,
                lastName,
                displayName
              );
            }
          } catch (error) {
            console.error("Error in auth state change:", error);
          }
        })();
      } else {
        setUserState(initialUserState); // Reset to initial state
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser: userState.currentUser,
    loading,
    isAdmin: userState.isAdmin,
    isLegalTeam: userState.isLegalTeam,
    isManagementTeam: userState.isManagementTeam,
    userRole: userState.userRole,
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
