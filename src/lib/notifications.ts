import { db } from "./firebase";

import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    query,
    where,
    orderBy,
    Timestamp,
    limit,
    writeBatch,
    increment,
    DocumentReference,
    setDoc,
} from "firebase/firestore";

import { Contract } from "./data";
export type NotificationType = "contract_created" | "contract_requested" | "status_changed" | "contract_sent_back" | "contract_approved";
export type RecipientRole = "admin" | "legal" | "management" | "approver" | "user";

export interface Notification {
    id: string;
    contractId: string;
    contractTitle: string;
    type: NotificationType;
    message: string;
    createdAt: string;
    read: boolean;
    recipientRole: RecipientRole;
    createdBy?: string;
    createdByName?: string;
    additionalData?: Record<string, any>;
}

export const addNotification = async (notification: Omit<Notification, "id" | "createdAt">): Promise<string> => {
    try {
        const now = Timestamp.now();

        const newNotification = {
            ...notification,
            createdAt: now.toDate().toISOString(),
            read: false
        };

        const docRef = await addDoc(collection(db, "notifications"), newNotification);
        await updateNotificationCount(notification.recipientRole, 1);
        return docRef.id;
    } catch (error) {
        return "";
    }
};

export const getNotifications = async (
    role: RecipientRole,
    options?: {
        limit?: number;
        onlyUnread?: boolean;
    }
): Promise<Notification[]> => {
    try {
        const notificationsRef = collection(db, "notifications");
        let q = query(notificationsRef, where("recipientRole", "==", role));

        if (options?.onlyUnread) {
            q = query(q, where("read", "==", false));
        }

        const querySnapshot = await getDocs(q);

        let notifications = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as Notification));

        notifications.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
        });

        if (options?.limit && notifications.length > options.limit) {
            notifications = notifications.slice(0, options.limit);
        }

        return notifications;
    } catch (error) {
        return [];
    }
};

export const markNotificationAsRead = async (notificationId: string, role: RecipientRole): Promise<void> => {
    try {
        const notificationRef = doc(db, "notifications", notificationId);
        const notificationSnap = await getDoc(notificationRef);

        if (!notificationSnap.exists()) {
            return;
        }

        const notificationData = notificationSnap.data() as Notification;

        if (!notificationData.read) {
            await updateDoc(notificationRef, {
                read: true
            });

            await updateNotificationCount(role, -1);
        }
    } catch (error) {}
};

export const markAllNotificationsAsRead = async (role: RecipientRole): Promise<void> => {
    try {
        const notificationsRef = collection(db, "notifications");

        const q = query(
            notificationsRef,
            where("recipientRole", "==", role),
            where("read", "==", false)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return;
        }

        const batch = writeBatch(db);

        querySnapshot.docs.forEach(doc => {
            batch.update(doc.ref, {
                read: true
            });
        });

        await batch.commit();
        await setNotificationCount(role, 0);
    } catch (error) {}
};

export const getUnreadNotificationCount = async (role: RecipientRole): Promise<number> => {
    try {
        const countRef = doc(db, "notificationCounts", role);
        const countSnap = await getDoc(countRef);

        if (!countSnap.exists()) {
            await setDoc(countRef, {
                count: 0
            });

            return 0;
        }

        return countSnap.data().count || 0;
    } catch (error) {
        return 0;
    }
};

const updateNotificationCount = async (role: RecipientRole, incrementBy: number): Promise<void> => {
    try {
        const countRef = doc(db, "notificationCounts", role);
        const countSnap = await getDoc(countRef);

        if (!countSnap.exists()) {
            await setDoc(countRef, {
                count: Math.max(0, incrementBy)
            });
        } else {
            const currentCount = countSnap.data().count || 0;
            const newCount = Math.max(0, currentCount + incrementBy);

            await updateDoc(countRef, {
                count: newCount
            });
        }
    } catch (error) {}
};

const setNotificationCount = async (role: RecipientRole, count: number): Promise<void> => {
    try {
        const countRef = doc(db, "notificationCounts", role);
        const countSnap = await getDoc(countRef);

        if (!countSnap.exists()) {
            await setDoc(countRef, {
                count
            });
        } else {
            await updateDoc(countRef, {
                count
            });
        }
    } catch (error) {}
};