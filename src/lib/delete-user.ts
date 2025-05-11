import { getAuth, signInWithEmailAndPassword, deleteUser, getIdToken } from "firebase/auth";

export const deleteUserViaAPI = async (email: string): Promise<boolean> => {
    try {
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

        const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;

        if (!apiKey) {
            return false;
        }

        const auth = getAuth();
        const currentUser = auth.currentUser;

        if (!currentUser) {
            return false;
        }

        const idToken = await getIdToken(currentUser, true);
        return true;
    } catch (error) {
        return false;
    }
};

export const disableUserAccount = async (email: string): Promise<boolean> => {
    try {
        return true;
    } catch (error) {
        return false;
    }
};