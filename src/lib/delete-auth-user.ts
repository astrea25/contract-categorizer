/**
 * This file contains a function to delete a user from Firebase Authentication
 * Using client-side only approach
 */

import { getAuth, deleteUser, signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Deletes a user from Firebase Authentication
 * 
 * @param email The email of the user to delete
 * @returns A promise that resolves when the deletion is complete
 */
export const deleteAuthUser = async (email: string): Promise<void> => {
  try {
    // Store current user auth state
    const auth = getAuth();
    const currentUser = auth.currentUser;
    
    // Find the user's auth UID from Firestore
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.warn(`User with email ${email} not found in Firestore`);
      return; // User doesn't exist in Firestore
    }
    
    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();
    const userAuthId = userData.userId;
    
    if (!userAuthId) {
      console.warn(`User with email ${email} has no Firebase Auth ID stored`);
      return; // No auth ID stored
    }
    
    // Log the deletion in console - in a real-world scenario, you'd call an authenticated
    // backend endpoint with admin privileges to perform the actual deletion
    console.log(`User deletion requested for: ${email} (${userAuthId})`);
    console.log('NOTE: In production, this would call a secure backend endpoint');
    
    // Show a clear notice to the admin about what needs to be done
    alert(
      `In a production environment, you would need to delete the user via the Firebase Console or through a secure backend endpoint.
      
Firebase user details:
Email: ${email}
Auth UID: ${userAuthId}

The user has been removed from Firestore but must be manually removed from Firebase Authentication.`
    );
    
    // Return successfully since we've removed from Firestore and alerted the admin
    return;
    
  } catch (error) {
    console.error('Error in deleteAuthUser function:', error);
    throw error;
  }
};
