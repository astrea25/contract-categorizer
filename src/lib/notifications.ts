import { db } from './firebase';
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
} from 'firebase/firestore';
import { Contract } from './data';

// Define notification types
export type NotificationType =
  | 'contract_created'
  | 'contract_requested'
  | 'status_changed'
  | 'contract_sent_back'
  | 'contract_approved';

// Define recipient roles
export type RecipientRole = 'admin' | 'legal' | 'management' | 'approver' | 'user';

// Define notification interface
export interface Notification {
  id: string;
  contractId: string;
  contractTitle: string;
  type: NotificationType;
  message: string;
  createdAt: string;
  read: boolean;
  recipientRole: RecipientRole;
  createdBy?: string; // Email of the user who triggered the notification
  createdByName?: string; // Display name of the user who triggered the notification
  additionalData?: Record<string, any>; // Any additional data we might want to store
}

/**
 * Add a notification to the database
 *
 * @param notification The notification to add (without id and createdAt)
 * @returns The ID of the newly created notification
 */
export const addNotification = async (
  notification: Omit<Notification, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    const now = Timestamp.now();

    const newNotification = {
      ...notification,
      createdAt: now.toDate().toISOString(),
      read: false, // Always start as unread
    };

    const docRef = await addDoc(collection(db, 'notifications'), newNotification);

    // Update the unread counts in the notificationCounts collection
    await updateNotificationCount(notification.recipientRole, 1);

    return docRef.id;
  } catch (error) {
    console.error('Error adding notification:', error);
    // Return an empty string instead of throwing to prevent UI from breaking
    return '';
  }
};

/**
 * Get notifications for a specific role
 *
 * @param role The role to get notifications for
 * @param options Optional query options
 * @returns Array of notifications
 */
export const getNotifications = async (
  role: RecipientRole,
  options?: {
    limit?: number;
    onlyUnread?: boolean;
  }
): Promise<Notification[]> => {
  try {
    const notificationsRef = collection(db, 'notifications');

    // First, just filter by role without ordering to avoid index issues
    let q = query(
      notificationsRef,
      where('recipientRole', '==', role)
    );

    // Add optional filters
    if (options?.onlyUnread) {
      q = query(q, where('read', '==', false));
    }

    // Get all matching documents
    const querySnapshot = await getDocs(q);

    // Process the results in memory
    let notifications = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Notification));

    // Sort by createdAt in memory
    notifications.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA; // descending order (newest first)
    });

    // Apply limit in memory if needed
    if (options?.limit && notifications.length > options.limit) {
      notifications = notifications.slice(0, options.limit);
    }

    return notifications;
  } catch (error) {
    console.error('Error getting notifications:', error);
    // Return empty array instead of throwing to prevent UI from breaking
    return [];
  }
};

/**
 * Mark a notification as read
 *
 * @param notificationId The ID of the notification to mark as read
 * @param role The role of the recipient (needed to update counts)
 * @returns Promise that resolves when the notification is marked as read
 */
export const markNotificationAsRead = async (
  notificationId: string,
  role: RecipientRole
): Promise<void> => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    const notificationSnap = await getDoc(notificationRef);

    if (!notificationSnap.exists()) {
      console.warn('Notification not found:', notificationId);
      return;
    }

    const notificationData = notificationSnap.data() as Notification;

    // Only update if it's currently unread
    if (!notificationData.read) {
      await updateDoc(notificationRef, {
        read: true
      });

      // Decrement the unread count
      await updateNotificationCount(role, -1);
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    // Don't throw the error, just log it to prevent UI from breaking
  }
};

/**
 * Mark all notifications for a role as read
 *
 * @param role The role to mark all notifications as read for
 * @returns Promise that resolves when all notifications are marked as read
 */
export const markAllNotificationsAsRead = async (
  role: RecipientRole
): Promise<void> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('recipientRole', '==', role),
      where('read', '==', false)
    );

    const querySnapshot = await getDocs(q);

    // If no unread notifications, return early
    if (querySnapshot.empty) {
      return;
    }

    // Use a batch to update all notifications
    const batch = writeBatch(db);

    querySnapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();

    // Reset the unread count to 0
    await setNotificationCount(role, 0);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    // Don't throw the error, just log it to prevent UI from breaking
  }
};

/**
 * Get the unread notification count for a specific role
 *
 * @param role The role to get the count for
 * @returns The number of unread notifications
 */
export const getUnreadNotificationCount = async (
  role: RecipientRole
): Promise<number> => {
  try {
    const countRef = doc(db, 'notificationCounts', role);
    const countSnap = await getDoc(countRef);

    if (!countSnap.exists()) {
      // If the document doesn't exist, create it with count 0
      await setDoc(countRef, { count: 0 });
      return 0;
    }

    return countSnap.data().count || 0;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    // Return 0 on error to avoid breaking the UI
    return 0;
  }
};

/**
 * Update the notification count for a specific role
 *
 * @param role The role to update the count for
 * @param increment The amount to increment the count by (negative to decrement)
 * @returns Promise that resolves when the count is updated
 */
const updateNotificationCount = async (
  role: RecipientRole,
  incrementBy: number
): Promise<void> => {
  try {
    const countRef = doc(db, 'notificationCounts', role);

    // Check if the document exists
    const countSnap = await getDoc(countRef);

    if (!countSnap.exists()) {
      // If it doesn't exist, create it with the initial count
      await setDoc(countRef, { count: Math.max(0, incrementBy) });
    } else {
      // If it exists, increment the count (but never go below 0)
      const currentCount = countSnap.data().count || 0;
      const newCount = Math.max(0, currentCount + incrementBy);
      await updateDoc(countRef, {
        count: newCount
      });
    }
  } catch (error) {
    console.error('Error updating notification count:', error);
    // Don't throw the error, just log it to prevent UI from breaking
  }
};

/**
 * Set the notification count for a specific role
 *
 * @param role The role to set the count for
 * @param count The count to set
 * @returns Promise that resolves when the count is set
 */
const setNotificationCount = async (
  role: RecipientRole,
  count: number
): Promise<void> => {
  try {
    const countRef = doc(db, 'notificationCounts', role);
    const countSnap = await getDoc(countRef);

    if (!countSnap.exists()) {
      // If the document doesn't exist, create it
      await setDoc(countRef, { count });
    } else {
      // If it exists, update it
      await updateDoc(countRef, { count });
    }
  } catch (error) {
    console.error('Error setting notification count:', error);
    // Don't throw the error, just log it to prevent UI from breaking
  }
};
