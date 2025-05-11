import { processAutomaticContractDeletion } from './data';
import { checkInactiveContractsAndNotify } from './inactivity-notification';

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
export const runContractDeletionTask = async (): Promise<{
  success: boolean;
  deletedCount: number;
  message: string;
}> => {
  try {
    // Process contract deletions based on system settings
    const deletedCount = await processAutomaticContractDeletion();

    console.log(`Successfully deleted ${deletedCount} expired archived contracts`);

    return {
      success: true,
      deletedCount,
      message: `Successfully deleted ${deletedCount} expired archived contracts`
    };
  } catch (error) {
    console.error('Error running contract deletion task:', error);

    return {
      success: false,
      deletedCount: 0,
      message: `Error running contract deletion task: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

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
export const runInactivityNotificationTask = async (): Promise<{
  success: boolean;
  notificationsSent: number;
  message: string;
}> => {
  try {
    // Check for inactive contracts and send notifications
    const notificationsSent = await checkInactiveContractsAndNotify();

    console.log(`Successfully sent ${notificationsSent} inactivity notifications`);

    return {
      success: true,
      notificationsSent,
      message: `Successfully sent ${notificationsSent} inactivity notifications`
    };
  } catch (error) {
    console.error('Error running inactivity notification task:', error);

    return {
      success: false,
      notificationsSent: 0,
      message: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
};