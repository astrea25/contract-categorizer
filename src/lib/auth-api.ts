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
