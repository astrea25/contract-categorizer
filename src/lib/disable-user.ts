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