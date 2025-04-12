import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { registerUser, isUserAdmin, isUserLegalTeam, isUserManagementTeam, isUserApprover, getUserRoles } from "@/lib/data";

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  roleCheckLoading: boolean;
  isAdmin: boolean;
  isLegalTeam: boolean;
  isManagementTeam: boolean;
  isApprover: boolean;
  userRole: string;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  roleCheckLoading: false,
  isAdmin: false,
  isLegalTeam: false,
  isManagementTeam: false,
  isApprover: false,
  userRole: "",
  signInWithEmail: async () => {},
  signOut: async () => {},
  error: null
});

export const useAuth = () => {
  return useContext(AuthContext);
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
  const [roleCheckLoading, setRoleCheckLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      // Check user roles and update state directly - skip the isUserAllowed check
      if (result.user) {
        setRoleCheckLoading(true);
        const newUserState = await checkUserRoles(result.user);
        setUserState(newUserState);
        setRoleCheckLoading(false);
        
        setError(null);

        // Show message about default password if it was used
        if (usedDefaultPassword) {
          // For simplicity, we'll rely on the existing toast system in the app
        }
      }
    } catch (error: any) {
      let message = 'Failed to sign in.';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = 'Invalid email or password.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many unsuccessful login attempts. Please try again later.';
      } else if (error.code === 'auth/user-disabled') {
        message = 'This account has been disabled. Please contact support.';
      }
      
      setError(message);
    }
  };

  const checkUserRoles = async (user: User): Promise<UserState> => {
    if (!user || !user.email) {
      return {
        currentUser: user,
        isAdmin: false,
        isLegalTeam: false,
        isManagementTeam: false,
        isApprover: false,
        userRole: "user"
      };
    }
    
    const email = user.email.toLowerCase();
    const roleCheckStartTime = performance.now();
    
    // Use single API call to fetch all roles at once - much faster than separate calls
    const roles = await getUserRoles(email);
    
    // If roles is null, fall back to parallel checks (though this should be rare)
    if (roles === null) {
      
      // Run all role checks in parallel as a fallback
      const [admin, legal, management, approver] = await Promise.all([
        isUserAdmin(email),
        isUserLegalTeam(email),
        isUserManagementTeam(email),
        isUserApprover(email)
      ]);
      
      
      // Determine primary display role (for UI purposes)
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
              
      return {
        currentUser: user,
        isAdmin: admin,
        isLegalTeam: legal,
        isManagementTeam: management,
        isApprover: approver,
        userRole: role
      };
    }
    
    // If we got consolidated roles, use them
    let role = "user";
    if (roles.isAdmin) {
      role = "admin";
    } else if (roles.isLegalTeam) {
      role = "Legal Team";
    } else if (roles.isManagementTeam) {
      role = "Management Team";
    } else if (roles.isApprover) {
      role = "Approver";
    }
    
    const roleCheckEndTime = performance.now();
    const totalRoleCheckTime = roleCheckEndTime - roleCheckStartTime;
    
    return {
      currentUser: user,
      isAdmin: roles.isAdmin,
      isLegalTeam: roles.isLegalTeam,
      isManagementTeam: roles.isManagementTeam,
      isApprover: roles.isApprover,
      userRole: role
    };
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUserState(initialUserState);
      setError(null);
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out. Please try again.');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Set the user immediately to improve initial load time
      if (user) {
        const authStateChangeTime = performance.now();
        
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
        setRoleCheckLoading(true);

        // Then check roles asynchronously - skip the permission check
        (async () => {
          try {
            const roleCheckStartTime = performance.now();
            
            // Check user roles and update state
            const newUserState = await checkUserRoles(user);
            
            const roleCheckEndTime = performance.now();
            const roleAssignmentTime = roleCheckEndTime - roleCheckStartTime;
            
            setUserState(newUserState);
            setRoleCheckLoading(false);
            setError(null);

            // Register or update user data
            const registrationStartTime = performance.now();
            
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
                        
          } catch (error) {
            console.error("Error in auth state change:", error);
            setRoleCheckLoading(false);
          }
        })();
      } else {
        setUserState(initialUserState); // Reset to initial state
        setLoading(false);
        setRoleCheckLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser: userState.currentUser,
        loading,
        roleCheckLoading,
        isAdmin: userState.isAdmin,
        isLegalTeam: userState.isLegalTeam,
        isManagementTeam: userState.isManagementTeam,
        isApprover: userState.isApprover,
        userRole: userState.userRole,
        signInWithEmail,
        signOut,
        error
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};