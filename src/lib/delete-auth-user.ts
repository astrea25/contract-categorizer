/**
 * This file contains a function to delete a user from Firebase Authentication
 * Note: This will log out the current user
 */

import { getAuth, signInWithEmailAndPassword, deleteUser } from 'firebase/auth';

/**
 * Deletes a user from Firebase Authentication
 * WARNING: This will log out the current user
 * 
 * @param email The email of the user to delete
 * @param password The password of the user (default is '12345678')
 * @returns A promise that resolves when the deletion is complete
 */
export const deleteAuthUser = async (email: string, password: string = '12345678'): Promise<void> => {
  try {
    const auth = getAuth();
    
    // Sign in as the user to delete
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Delete the user
    await deleteUser(user);
    
    console.log(`Successfully deleted Firebase Auth account for ${email}`);
  } catch (error) {
    console.error('Error deleting Firebase Auth account:', error);
    throw error;
  }
};
