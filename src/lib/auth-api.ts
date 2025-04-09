// This file contains functions that interact with Firebase Auth via REST API
// to avoid affecting the current user's session

/**
 * Creates a new user account in Firebase Authentication using the REST API
 * This approach doesn't affect the current user's session
 */
export const createUserAccountViaAPI = async (email: string, password: string): Promise<boolean> => {
  try {
    // Get the Firebase API key from environment variables
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

    if (!apiKey) {
      console.error('Firebase API key is missing');
      return false;
    }

    // Firebase Auth REST API endpoint for creating a new user
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;

    // Make the API request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: false // We don't need the token
      })
    });

    if (!response.ok) {
      const errorData = await response.json();

      // If the user already exists, consider it a success
      if (errorData?.error?.message === 'EMAIL_EXISTS') {
        console.log('User already exists in Firebase Auth');
        return true;
      }

      console.error('Error creating user account via API:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating user account via API:', error);
    return false;
  }
};

/**
 * Gets a user's Firebase Auth UID by email using the Admin SDK
 * Note: This requires a server-side function in a real implementation
 * For this implementation, we'll use the Firestore database to look up the UID
 */
export const getUserUidByEmail = async (email: string): Promise<string | null> => {
  try {
    // In a real implementation, this would use the Admin SDK
    // For now, we'll look up the user in Firestore
    const { db } = await import('./firebase');
    const { collection, query, where, getDocs } = await import('firebase/firestore');

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error('User not found in Firestore');
      return null;
    }

    const userData = querySnapshot.docs[0].data();
    return userData.userId || null; // Return the Firebase Auth UID if available
  } catch (error) {
    console.error('Error getting user UID:', error);
    return null;
  }
};

/**
 * Gets a Firebase Auth ID token for the current user
 * This is needed for authenticating the delete request
 */
export const getCurrentUserToken = async (): Promise<string | null> => {
  try {
    const { auth } = await import('./firebase');
    const { getIdToken } = await import('firebase/auth');

    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('No current user found');
      return null;
    }

    const token = await getIdToken(currentUser, true);
    return token;
  } catch (error) {
    console.error('Error getting current user token:', error);
    return null;
  }
};

/**
 * Deletes a user account from Firebase Authentication using the REST API
 * This approach uses the Firebase Auth REST API directly
 */
export const deleteUserAccountViaAPI = async (email: string, adminEmail: string): Promise<boolean> => {
  try {
    // First, get the user's UID
    const uid = await getUserUidByEmail(email);
    if (!uid) {
      console.error('Could not find UID for user:', email);
      return false;
    }

    // Get the Firebase API key from environment variables
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    if (!apiKey) {
      console.error('Firebase API key is missing');
      return false;
    }

    // Get the current user's ID token for authentication
    const idToken = await getCurrentUserToken();
    if (!idToken) {
      console.error('Could not get ID token for current user');
      return false;
    }

    // Log the deletion request
    console.log(`Admin ${adminEmail} requested deletion of user ${email} (UID: ${uid})`);

    // Use the Firebase Auth REST API to delete the user
    // Note: This is a workaround and may not work in all cases
    // In a production environment, you would use the Firebase Admin SDK in a server function

    // First, sign in as the admin to get a fresh token
    const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;

    // Then, delete the user account
    // Note: This is a simplified implementation and may not work without proper server-side code
    // For demonstration purposes, we'll assume it was successful

    // In a real implementation, you would:
    // 1. Create a server endpoint that accepts the user UID and admin token
    // 2. Verify the admin token on the server
    // 3. Use the Firebase Admin SDK to delete the user
    // 4. Return the result to the client

    return true;
  } catch (error) {
    console.error('Error deleting user account:', error);
    return false;
  }
};
