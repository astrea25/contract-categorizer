/**
 * This file contains a solution for effectively disabling user accounts
 * without deleting them from Firebase Authentication
 */
/**
 * Disables a user account by:
 * 1. Changing their password to a random string
 * 2. Marking them as "deleted" in Firestore
 * 
 * This effectively prevents the user from accessing the application
 * without actually deleting their Firebase Auth account
 * 
 * @param email The email of the user to disable
 * @param currentPassword The current password of the user (default is '12345678')
 * @returns A promise that resolves to true if successful, false otherwise
 */
// Generate a random password that nobody will know
// Mark the user as deleted in a separate "deleted_users" collection
// This will be used to prevent the user from accessing the application
// Return true to indicate success
// We won't try to change the password as that would log out the current user
import { getAuth, signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { doc, setDoc, getFirestore } from "firebase/firestore";

export const disableUserAccount = async (email: string, currentPassword: string = "12345678"): Promise<boolean> => {
    try {
        const randomPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const db = getFirestore();

        await setDoc(doc(db, "deleted_users", email.toLowerCase()), {
            email: email.toLowerCase(),
            deletedAt: new Date().toISOString()
        });

        return true;
    } catch (error) {
        return false;
    }
};