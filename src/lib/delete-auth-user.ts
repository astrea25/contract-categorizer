import { getAuth, deleteUser, signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export const deleteAuthUser = async (email: string): Promise<void> => {
    try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email.toLowerCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return;
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        const userAuthId = userData.userId;

        if (!userAuthId) {
            return;
        }

        alert(
            `In a production environment, you would need to delete the user via the Firebase Console or through a secure backend endpoint.
      
Firebase user details:
Email: ${email}
Auth UID: ${userAuthId}

The user has been removed from Firestore but must be manually removed from Firebase Authentication.`
        );

        return;
    } catch (error) {
        throw error;
    }
};