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