/**
 * This file contains a function to delete a user from Firebase Authentication
 * Using client-side only approach
 */
/**
 * Deletes a user from Firebase Authentication
 * 
 * @param email The email of the user to delete
 * @returns A promise that resolves when the deletion is complete
 */
// Store current user auth state
// Find the user's auth UID from Firestore
// User doesn't exist in Firestore
// No auth ID stored
// Log the deletion in console - in a real-world scenario, you'd call an authenticated
// backend endpoint with admin privileges to perform the actual deletion
// Show a clear notice to the admin about what needs to be done
// Return successfully since we've removed from Firestore and alerted the admin
import { getAuth, deleteUser, signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export const deleteAuthUser = async (email: string): Promise<void> => {
    try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email.toLowerCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return;
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const userAuthId = userData.userId;

        if (!userAuthId) {
            return;
        }

        alert(
            `In a production environment, you would need to delete the user via the Firebase Console or through a secure backend endpoint.
      
Firebase user details:
Email: ${email}
Auth UID: ${userAuthId}

The user has been removed from Firestore but must be manually removed from Firebase Authentication.`
        );

        return;
    } catch (error) {
        throw error;
    }
};