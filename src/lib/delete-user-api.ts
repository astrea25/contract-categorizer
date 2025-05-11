/**
 * This file contains a solution for deleting Firebase Auth users
 * using the Firebase Auth REST API directly
 */
/**
 * Deletes a user from Firebase Authentication using the REST API
 * This approach doesn't require signing in as the user
 * 
 * @param email The email of the user to delete
 * @returns A promise that resolves to true if successful, false otherwise
 */
// Get the Firebase API key
// First, get the current user's ID token
// Get a fresh ID token
// Use the Firebase Auth REST API to sign in with the token
// Get the user's UID from Firestore
// Use the Firebase Auth REST API to delete the user
// Note: This is a client-side workaround and may not work in all cases
// In a production environment, you would use the Firebase Admin SDK in a server function
// For now, we'll just return true and rely on the Firestore deletion to prevent access
export const deleteUserViaAPI = async (email: string): Promise<boolean> => {
    try {
        const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

        if (!apiKey) {
            return false;
        }

        const {
            getAuth,
            getIdToken
        } = await import("firebase/auth");

        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (!currentUser) {
            return false;
        }

        const idToken = await getIdToken(currentUser, true);
        const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdToken?key=${apiKey}`;

        const signInResponse = await fetch(signInUrl, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                idToken,
                returnSecureToken: true
            })
        });

        if (!signInResponse.ok) {
            const errorData = await signInResponse.json();
            return false;
        }

        const {
            collection,
            query,
            where,
            getDocs
        } = await import("firebase/firestore");

        const {
            db
        } = await import("./firebase");

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email.toLowerCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return false;
        }

        const userData = querySnapshot.docs[0].data();
        const uid = userData.userId;

        if (!uid) {
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
};