import { processAutomaticContractDeletion } from './data';

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