export const createUserAccountViaAPI = async (email: string, password: string): Promise<boolean> => {
    try {
        const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

        if (!apiKey) {
            return false;
        }

        const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`;

        const response = await fetch(url, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email,
                password,
                returnSecureToken: false
            })
        });

        if (!response.ok) {
            const errorData = await response.json();

            if (errorData?.error?.message === "EMAIL_EXISTS") {
                return true;
            }

            return false;
        }

        return true;
    } catch (error) {
        return false;
    }
};

export const getUserUidByEmail = async (email: string): Promise<string | null> => {
    try {
        const {
            db
        } = await import("./firebase");

        const {
            collection,
            query,
            where,
            getDocs
        } = await import("firebase/firestore");

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email.toLowerCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const userData = querySnapshot.docs[0].data();
        return userData.userId || null;
    } catch (error) {
        return null;
    }
};

export const getCurrentUserToken = async (): Promise<string | null> => {
    try {
        const {
            auth
        } = await import("./firebase");

        const {
            getIdToken
        } = await import("firebase/auth");

        const currentUser = auth.currentUser;

        if (!currentUser) {
            return null;
        }

        const token = await getIdToken(currentUser, true);
        return token;
    } catch (error) {
        return null;
    }
};

export const deleteUserAccountViaAPI = async (email: string, adminEmail: string): Promise<boolean> => {
    try {
        const uid = await getUserUidByEmail(email);

        if (!uid) {
            return false;
        }

        const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

        if (!apiKey) {
            return false;
        }

        const idToken = await getCurrentUserToken();

        if (!idToken) {
            return false;
        }

        const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`;
        return true;
    } catch (error) {
        return false;
    }
};