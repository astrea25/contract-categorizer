/**
 * This function would typically be called by a cloud function
 * or scheduled task runner on the backend.
 *
 * For example in Firebase, you could use Cloud Functions with Pub/Sub:
 * exports.scheduledContractCleanup = functions.pubsub
 *   .schedule('every 24 hours')
 *   .onRun(async context => {
 *     await runContractDeletionTask();
 *     return null;
 *   });
 */
// Process contract deletions based on system settings
/**
 * This function checks for inactive contracts and sends notification emails.
 * It uses role-based thresholds: 3 business days for approvers/reviewers, 1 business day for others.
 * It would typically be called by a cloud function or scheduled task runner.
 *
 * For example in Firebase, you could use Cloud Functions with Pub/Sub:
 * exports.scheduledInactivityCheck = functions.pubsub
 *   .schedule('every 24 hours')
 *   .onRun(async context => {
 *     await runInactivityNotificationTask();
 *     return null;
 *   });
 */
// Check for inactive contracts and send notifications
import { processAutomaticContractDeletion } from "./data";
import { checkInactiveContractsAndNotify } from "./inactivity-notification";

export const runContractDeletionTask = async (): Promise<{
    success: boolean;
    deletedCount: number;
    message: string;
}> => {
    try {
        const deletedCount = await processAutomaticContractDeletion();

        return {
            success: true,
            deletedCount,
            message: `Successfully deleted ${deletedCount} expired archived contracts`
        };
    } catch (error) {
        return {
            success: false,
            deletedCount: 0,
            message: `Error running contract deletion task: ${error instanceof Error ? error.message : "Unknown error"}`
        };
    }
};

export const runInactivityNotificationTask = async (): Promise<{
    success: boolean;
    notificationsSent: number;
    message: string;
}> => {
    try {
        const notificationsSent = await checkInactiveContractsAndNotify();

        return {
            success: true,
            notificationsSent,
            message: `Successfully sent ${notificationsSent} inactivity notifications`
        };
    } catch (error) {
        return {
            success: false,
            notificationsSent: 0,
            message: `Error: ${error instanceof Error ? error.message : String(error)}`
        };
    }
};