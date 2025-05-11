export const deleteUserWithIframe = async (email: string, password: string = "12345678"): Promise<boolean> => {
    return new Promise(resolve => {
        try {
            const iframe = document.createElement("iframe");
            iframe.style.display = "none";
            document.body.appendChild(iframe);

            const timeoutId = setTimeout(() => {
                document.body.removeChild(iframe);
                resolve(false);
            }, 10000);

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

            const messageListener = (event: MessageEvent) => {
                if (event.data && event.data.email === email) {
                    window.removeEventListener("message", messageListener);
                    clearTimeout(timeoutId);
                    document.body.removeChild(iframe);
                    resolve(event.data.success);
                }
            };

            window.addEventListener("message", messageListener);
            const iframeDocument = iframe.contentWindow?.document;

            if (iframeDocument) {
                iframeDocument.open();
                iframeDocument.write(iframeContent);
                iframeDocument.close();
            } else {
                clearTimeout(timeoutId);
                document.body.removeChild(iframe);
                resolve(false);
            }
        } catch (error) {
            resolve(false);
        }
    });
};