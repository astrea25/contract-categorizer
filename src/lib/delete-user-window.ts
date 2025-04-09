/**
 * This file contains a solution for deleting Firebase Auth users
 * using a popup window to avoid affecting the current user's session
 */

/**
 * Creates a popup window and uses it to delete a user from Firebase Authentication
 * This approach completely isolates the authentication contexts
 * 
 * @param email The email of the user to delete
 * @param password The password of the user (default is '12345678')
 * @returns A promise that resolves to true if successful, false otherwise
 */
export const deleteUserWithPopup = async (email: string, password: string = '12345678'): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      // Generate a unique ID for this deletion operation
      const operationId = `delete-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      // Store the callback in window object so the popup can access it
      (window as any)[operationId] = {
        resolve: (success: boolean) => {
          // Clean up
          delete (window as any)[operationId];
          resolve(success);
        }
      };
      
      // Create the HTML content for the popup
      const popupContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>User Deletion</title>
          <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js"></script>
          <script src="https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js"></script>
          <script>
            // Initialize Firebase with the same config
            const firebaseConfig = {
              apiKey: "${import.meta.env.VITE_FIREBASE_API_KEY}",
              authDomain: "${import.meta.env.VITE_FIREBASE_AUTH_DOMAIN}",
              projectId: "${import.meta.env.VITE_FIREBASE_PROJECT_ID}",
              storageBucket: "${import.meta.env.VITE_FIREBASE_STORAGE_BUCKET}",
              messagingSenderId: "${import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID}",
              appId: "${import.meta.env.VITE_FIREBASE_APP_ID}"
            };
            
            // Initialize Firebase
            firebase.initializeApp(firebaseConfig);
            
            // Function to delete the user
            async function deleteUser() {
              try {
                document.getElementById('status').textContent = 'Signing in...';
                
                // Sign in with email and password
                const userCredential = await firebase.auth().signInWithEmailAndPassword("${email}", "${password}");
                const user = userCredential.user;
                
                document.getElementById('status').textContent = 'Deleting user...';
                
                // Delete the user
                await user.delete();
                
                document.getElementById('status').textContent = 'User deleted successfully!';
                document.getElementById('result').textContent = 'Success';
                
                // Send success message to parent
                window.opener.${operationId}.resolve(true);
                
                // Close the window after a short delay
                setTimeout(() => window.close(), 2000);
              } catch (error) {
                console.error('Error in popup:', error);
                document.getElementById('status').textContent = 'Error: ' + error.message;
                document.getElementById('result').textContent = 'Failed';
                
                // Send error message to parent
                window.opener.${operationId}.resolve(false);
                
                // Keep the window open so the error can be seen
              }
            }
            
            // Execute the deletion when the page loads
            window.onload = deleteUser;
          </script>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              text-align: center;
            }
            .container {
              max-width: 400px;
              margin: 0 auto;
              border: 1px solid #ccc;
              padding: 20px;
              border-radius: 5px;
            }
            .status {
              margin: 20px 0;
              font-weight: bold;
            }
            .result {
              margin-top: 20px;
              font-size: 18px;
              font-weight: bold;
            }
            .success {
              color: green;
            }
            .failure {
              color: red;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>Deleting User Account</h2>
            <p>Email: ${email}</p>
            <div class="status" id="status">Initializing...</div>
            <div class="result" id="result"></div>
          </div>
        </body>
        </html>
      `;
      
      // Create a blob URL for the HTML content
      const blob = new Blob([popupContent], { type: 'text/html' });
      const blobUrl = URL.createObjectURL(blob);
      
      // Open a popup window with the content
      const popup = window.open(
        blobUrl,
        'UserDeletion',
        'width=500,height=400,resizable=yes,scrollbars=yes,status=yes'
      );
      
      if (!popup) {
        console.error('Popup blocked. Please allow popups for this site.');
        resolve(false);
        return;
      }
      
      // Set a timeout in case the popup is closed without resolving
      const timeoutId = setTimeout(() => {
        if ((window as any)[operationId]) {
          delete (window as any)[operationId];
          resolve(false);
        }
      }, 60000); // 1 minute timeout
      
      // Override the resolve function to clear the timeout
      const originalResolve = (window as any)[operationId].resolve;
      (window as any)[operationId].resolve = (success: boolean) => {
        clearTimeout(timeoutId);
        originalResolve(success);
      };
    } catch (error) {
      console.error('Error setting up popup for user deletion:', error);
      resolve(false);
    }
  });
};
