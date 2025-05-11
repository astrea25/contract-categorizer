export const deleteUserViaAPI = async (email: string): Promise<boolean> => {
    try {
        const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

        if (!apiKey) {
            return false;
        }

        const {
            getAuth,
            getIdToken
        } = await import("firebase/auth");

        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (!currentUser) {
            return false;
        }

        const idToken = await getIdToken(currentUser, true);
        const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdToken?key=${apiKey}`;

        const signInResponse = await fetch(signInUrl, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                idToken,
                returnSecureToken: true
            })
        });

        if (!signInResponse.ok) {
            const errorData = await signInResponse.json();
            return false;
        }

        const {
            collection,
            query,
            where,
            getDocs
        } = await import("firebase/firestore");

        const {
            db
        } = await import("./firebase");

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email.toLowerCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return false;
        }

        const userData = querySnapshot.docs[0].data();
        const uid = userData.userId;

        if (!uid) {
            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
};