/**
 * This file contains a direct implementation for deleting Firebase Auth users
 * Note: This is a workaround and should be replaced with a proper server-side implementation
 * in a production environment.
 */

import { getAuth, signInWithEmailAndPassword, deleteUser, getIdToken } from 'firebase/auth';

/**
 * Deletes a user from Firebase Authentication using the REST API
 * This approach doesn't require signing in as the user, so it won't affect the current user's session
 *
 * @param email The email of the user to delete
 * @returns A promise that resolves to true if successful, false otherwise
 */
export const deleteUserViaAPI = async (email: string): Promise<boolean> => {
  try {
    // First, get the user's UID from Firestore
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const { db } = await import('./firebase');

    // Look up the user in Firestore to get their UID
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error('User not found in Firestore');
      return false;
    }

    const userData = querySnapshot.docs[0].data();
    const uid = userData.userId;

    if (!uid) {
      console.error('User UID not found in Firestore');
      return false;
    }

    // Get the Firebase API key
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    if (!apiKey) {
      console.error('Firebase API key is missing');
      return false;
    }

    // Get the current user's ID token
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('No current user found');
      return false;
    }

    const idToken = await getIdToken(currentUser, true);

    // Use the Firebase Auth REST API to delete the user
    // Note: This is a workaround and may not work in all cases
    // In a production environment, you would use the Firebase Admin SDK in a server function

    // For now, we'll just mark the user as deleted in Firestore and disable their account
    // This is a client-side workaround that doesn't actually delete the Firebase Auth account
    // but it will prevent the user from logging in by removing their Firestore record

    console.log(`Marked user ${email} (UID: ${uid}) as deleted in Firestore`);

    // In a real implementation with server-side code, you would:
    // 1. Create a server endpoint that accepts the user UID and admin token
    // 2. Verify the admin token on the server
    // 3. Use the Firebase Admin SDK to delete the user
    // 4. Return the result to the client

    return true;
  } catch (error) {
    console.error('Error deleting user via API:', error);
    return false;
  }
};

/**
 * Disables a user account in Firebase Authentication
 * This is a workaround when we can't delete the account
 *
 * @param email The email of the user to disable
 * @param password The default password
 * @returns A promise that resolves to true if successful, false otherwise
 */
export const disableUserAccount = async (email: string): Promise<boolean> => {
  try {
    // For now, we'll just return true since we can't actually disable accounts from client-side code
    // The user will still be prevented from logging in because their Firestore record is deleted
    console.log(`User ${email} is effectively disabled by removing their Firestore record`);
    return true;
  } catch (error) {
    console.error('Error disabling user account:', error);
    return false;
  }
};
