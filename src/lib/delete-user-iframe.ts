/**
 * This file contains a solution for deleting Firebase Auth users
 * using an iframe to avoid affecting the current user's session
 */

/**
 * Creates an invisible iframe and uses it to delete a user from Firebase Authentication
 * This approach prevents the current user from being logged out
 * 
 * @param email The email of the user to delete
 * @param password The password of the user (default is '12345678')
 * @returns A promise that resolves to true if successful, false otherwise
 */
export const deleteUserWithIframe = async (email: string, password: string = '12345678'): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      // Create an invisible iframe
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      // Set a timeout to handle cases where the iframe doesn't load or execute properly
      const timeoutId = setTimeout(() => {
        document.body.removeChild(iframe);
        console.error('Iframe deletion timed out');
        resolve(false);
      }, 10000); // 10 seconds timeout
      
      // Create the HTML content for the iframe
      // This will create a separate Firebase Auth instance and delete the user
      const iframeContent = `
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
                // Sign in with email and password
                const userCredential = await firebase.auth().signInWithEmailAndPassword("${email}", "${password}");
                const user = userCredential.user;
                
                // Delete the user
                await user.delete();
                
                // Send success message to parent
                window.parent.postMessage({ success: true, email: "${email}" }, "*");
              } catch (error) {
                console.error('Error in iframe:', error);
                // Send error message to parent
                window.parent.postMessage({ success: false, email: "${email}", error: error.message }, "*");
              }
            }
            
            // Execute the deletion when the page loads
            window.onload = deleteUser;
          </script>
        </head>
        <body>
          <p>Deleting user...</p>
        </body>
        </html>
      `;
      
      // Set up message listener to receive result from iframe
      const messageListener = (event: MessageEvent) => {
        if (event.data && event.data.email === email) {
          // Clean up
          window.removeEventListener('message', messageListener);
          clearTimeout(timeoutId);
          document.body.removeChild(iframe);
          
          // Resolve with the result
          resolve(event.data.success);
        }
      };
      
      window.addEventListener('message', messageListener);
      
      // Write the content to the iframe
      const iframeDocument = iframe.contentWindow?.document;
      if (iframeDocument) {
        iframeDocument.open();
        iframeDocument.write(iframeContent);
        iframeDocument.close();
      } else {
        // Clean up if we couldn't get the iframe document
        clearTimeout(timeoutId);
        document.body.removeChild(iframe);
        console.error('Could not access iframe document');
        resolve(false);
      }
    } catch (error) {
      console.error('Error setting up iframe for user deletion:', error);
      resolve(false);
    }
  });
};
