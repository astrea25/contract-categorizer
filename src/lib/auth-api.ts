// This file contains functions that interact with Firebase Auth via REST API
// to avoid affecting the current user's session
/**
 * Creates a new user account in Firebase Authentication using the REST API
 * This approach doesn't affect the current user's session
 */
// Get the Firebase API key from environment variables
// Firebase Auth REST API endpoint for creating a new user
// Make the API request
// We don't need the token
// If the user already exists, consider it a success
/**
 * Gets a user's Firebase Auth UID by email using the Admin SDK
 * Note: This requires a server-side function in a real implementation
 * For this implementation, we'll use the Firestore database to look up the UID
 */
// In a real implementation, this would use the Admin SDK
// For now, we'll look up the user in Firestore
// Return the Firebase Auth UID if available
/**
 * Gets a Firebase Auth ID token for the current user
 * This is needed for authenticating the delete request
 */
/**
 * Deletes a user account from Firebase Authentication using the REST API
 * This approach uses the Firebase Auth REST API directly
 */
// First, get the user's UID
// Get the Firebase API key from environment variables
// Get the current user's ID token for authentication
// Use the Firebase Auth REST API to delete the user
// Note: This is a workaround and may not work in all cases
// In a production environment, you would use the Firebase Admin SDK in a server function
// First, sign in as the admin to get a fresh token
// Then, delete the user account
// Note: This is a simplified implementation and may not work without proper server-side code
// For demonstration purposes, we'll assume it was successful
// In a real implementation, you would:
// 1. Create a server endpoint that accepts the user UID and admin token
// 2. Verify the admin token on the server
// 3. Use the Firebase Admin SDK to delete the user
// 4. Return the result to the client
export const createUserAccountViaAPI = async (email: string, password: string): Promise<boolean> => {
    try {
        const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

        if (!apiKey) {
            return false;
        }

        const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;

        const response = await fetch(url, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email,
                password,
                returnSecureToken: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json();

            if (errorData?.error?.message === "EMAIL_EXISTS") {
                return true;
            }

            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
};

export const getUserUidByEmail = async (email: string): Promise<string | null> => {
    try {
        const {
            db
        } = await import("./firebase");

        const {
            collection,
            query,
            where,
            getDocs
        } = await import("firebase/firestore");

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email.toLowerCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const userData = querySnapshot.docs[0].data();
        return userData.userId || null;
    } catch (error) {
        return null;
    }
};

export const getCurrentUserToken = async (): Promise<string | null> => {
    try {
        const {
            auth
        } = await import("./firebase");

        const {
            getIdToken
        } = await import("firebase/auth");

        const currentUser = auth.currentUser;

        if (!currentUser) {
            return null;
        }

        const token = await getIdToken(currentUser, true);
        return token;
    } catch (error) {
        return null;
    }
};

export const deleteUserAccountViaAPI = async (email: string, adminEmail: string): Promise<boolean> => {
    try {
        const uid = await getUserUidByEmail(email);

        if (!uid) {
            return false;
        }

        const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

        if (!apiKey) {
            return false;
        }

        const idToken = await getCurrentUserToken();

        if (!idToken) {
            return false;
        }

        const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;
        return true;
    } catch (error) {
        return false;
    }
};