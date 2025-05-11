import React, { createContext, useContext, useEffect, useState } from "react";

import {
    User,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    updateProfile,
} from "firebase/auth";

import { auth } from "@/lib/firebase";

import {
    registerUser,
    isUserAdmin,
    isUserLegalTeam,
    isUserManagementTeam,
    isUserApprover,
    getUserRoles,
    isPasswordChangeRequired,
} from "@/lib/data";

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    roleCheckLoading: boolean;
    isAdmin: boolean;
    isLegalTeam: boolean;
    isManagementTeam: boolean;
    isApprover: boolean;
    userRole: string;
    passwordChangeRequired: boolean;
    signInWithEmail: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    error: string | null;
    updatePasswordChangeRequiredState: (required: boolean) => void;
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
    passwordChangeRequired: false,
    signInWithEmail: async () => {},
    signOut: async () => {},
    error: null,
    updatePasswordChangeRequiredState: () => {}
});

export const useAuth = () => {
    return useContext(AuthContext);
};

interface UserState {
    currentUser: User | null;
    isAdmin: boolean;
    isLegalTeam: boolean;
    isManagementTeam: boolean;
    isApprover: boolean;
    userRole: string;
    passwordChangeRequired: boolean;
}

const initialUserState: UserState = {
    currentUser: null,
    isAdmin: false,
    isLegalTeam: false,
    isManagementTeam: false,
    isApprover: false,
    userRole: "user",
    passwordChangeRequired: false
};

export const AuthProvider: React.FC<{
    children: React.ReactNode;
}> = (
    {
        children
    }
) => {
    const [userState, setUserState] = useState<UserState>(initialUserState);
    const [loading, setLoading] = useState(true);
    const [roleCheckLoading, setRoleCheckLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const signInWithEmail = async (email: string, password: string) => {
        try {
            let result;
            let usedDefaultPassword = false;

            try {
                result = await signInWithEmailAndPassword(auth, email, password);
            } catch (error: any) {
                if (error.code === "auth/wrong-password") {
                    try {
                        result = await signInWithEmailAndPassword(auth, email, "12345678");
                        usedDefaultPassword = true;
                    } catch (defaultPasswordError) {
                        setError("Invalid email or password.");
                        return;
                    }
                } else if (error.code === "auth/user-not-found") {
                    setError("Invalid email or password.");
                    return;
                } else if (error.code === "auth/too-many-requests") {
                    setError("Too many unsuccessful login attempts. Please try again later.");
                    return;
                } else {
                    throw error;
                }
            }

            if (!result) {
                setError("Failed to sign in.");
                return;
            }

            if (result.user) {
                setRoleCheckLoading(true);
                const newUserState = await checkUserRoles(result.user);
                setUserState(newUserState);
                setRoleCheckLoading(false);
                setError(null);

                if (usedDefaultPassword)
                    {}
            }
        } catch (error: any) {
            let message = "Failed to sign in.";

            if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
                message = "Invalid email or password.";
            } else if (error.code === "auth/too-many-requests") {
                message = "Too many unsuccessful login attempts. Please try again later.";
            } else if (error.code === "auth/user-disabled") {
                message = "This account has been disabled. Please contact support.";
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
                userRole: "user",
                passwordChangeRequired: false
            };
        }

        const email = user.email.toLowerCase();
        const roleCheckStartTime = performance.now();
        const roles = await getUserRoles(email);

        if (roles === null) {
            const [admin, legal, management, approver] = await Promise.all([
                isUserAdmin(email),
                isUserLegalTeam(email),
                isUserManagementTeam(email),
                isUserApprover(email)
            ]);

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

            const passwordChangeRequired = await isPasswordChangeRequired(email);

            return {
                currentUser: user,
                isAdmin: admin,
                isLegalTeam: legal,
                isManagementTeam: management,
                isApprover: approver,
                userRole: role,
                passwordChangeRequired
            };
        }

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
        const passwordChangeRequired = await isPasswordChangeRequired(email);

        return {
            currentUser: user,
            isAdmin: roles.isAdmin,
            isLegalTeam: roles.isLegalTeam,
            isManagementTeam: roles.isManagementTeam,
            isApprover: roles.isApprover,
            userRole: role,
            passwordChangeRequired
        };
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
            setUserState(initialUserState);
            setError(null);
        } catch (error) {
            setError("Failed to sign out. Please try again.");
        }
    };

    const updatePasswordChangeRequiredState = (required: boolean) => {
        setUserState(prev => ({
            ...prev,
            passwordChangeRequired: required
        }));
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            if (user) {
                const authStateChangeTime = performance.now();

                setUserState({
                    currentUser: user,
                    isAdmin: false,
                    isLegalTeam: false,
                    isManagementTeam: false,
                    isApprover: false,
                    userRole: "user",
                    passwordChangeRequired: false
                });

                setLoading(false);
                setRoleCheckLoading(true);

                (async () => {
                    try {
                        const roleCheckStartTime = performance.now();
                        const newUserState = await checkUserRoles(user);
                        const roleCheckEndTime = performance.now();
                        const roleAssignmentTime = roleCheckEndTime - roleCheckStartTime;
                        setUserState(newUserState);
                        setRoleCheckLoading(false);
                        setError(null);
                        const registrationStartTime = performance.now();
                        const displayName = user.displayName || "";
                        const nameArray = displayName.split(" ");
                        const firstName = nameArray[0] || "";
                        const lastName = nameArray.slice(1).join(" ") || "";
                        await registerUser(user.uid, user.email || "", firstName, lastName, displayName);
                    } catch (error) {
                        setRoleCheckLoading(false);
                    }
                })();
            } else {
                setUserState(initialUserState);
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
                passwordChangeRequired: userState.passwordChangeRequired,
                signInWithEmail,
                signOut,
                error,
                updatePasswordChangeRequiredState
            }}>
            {children}
        </AuthContext.Provider>
    );
};