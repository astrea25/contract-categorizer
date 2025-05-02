import { db } from './firebase';
import { collection, query, where, getDocs, Timestamp, orderBy, doc, getDoc, updateDoc } from 'firebase/firestore';
import { sendNotificationEmail } from './brevoService';
import { Contract, getContract } from './data';
import { differenceInDays } from 'date-fns';

/**
 * Checks for contracts that have been inactive for a specified number of days
 * and sends notification emails to the contract owner and recipient.
 *
 * @param inactivityDays Number of days of inactivity before sending a notification (default: 30)
 * @returns Promise resolving to the number of notifications sent
 */
export const checkInactiveContractsAndNotify = async (inactivityDays: number = 30): Promise<number> => {
  try {
    // Get current date
    const now = new Date();

    // Query all non-archived contracts
    const contractsRef = collection(db, 'contracts');
    const q = query(
      contractsRef,
      where('archived', '==', false)
    );

    const contractsSnapshot = await getDocs(q);
    let notificationsSent = 0;

    // Process each contract
    for (const doc of contractsSnapshot.docs) {
      const contract = doc.data() as Contract;

      // Skip contracts without lastActivityAt timestamp
      if (!contract.lastActivityAt) continue;

      const lastActivityDate = new Date(contract.lastActivityAt);
      const daysSinceLastActivity = differenceInDays(now, lastActivityDate);

      // Check if contract has been inactive for the specified period
      if (daysSinceLastActivity >= inactivityDays) {
        // Send notifications to both owner and recipient if available
        await sendInactivityNotification(contract);
        notificationsSent++;
      }
    }

    return notificationsSent;
  } catch (error) {
    console.error('Error checking inactive contracts:', error);
    throw error;
  }
};

/**
 * Sends an inactivity notification email for a specific contract
 *
 * @param contract The contract that has been inactive
 * @returns Promise resolving when all notifications have been sent
 */
export const sendInactivityNotification = async (contract: Contract): Promise<void> => {
  try {
    const appUrl = import.meta.env.VITE_APP_URL || 'https://contract-management-system-omega.vercel.app';
    const contractUrl = `${appUrl}/contracts/${contract.id}`;

    // Prepare email content
    const subject = `Inactive Contract Notification: ${contract.title}`;
    const htmlContent = `
      <div style="font-family: sans-serif;">
        <h2>Contract Inactivity Notification</h2>
        <p>This is an automated notification from the Contract Management System.</p>
        <p>The following contract has not had any activity for 30 days:</p>
        <ul>
          <li><strong>Contract Title:</strong> ${contract.title}</li>
          <li><strong>Project Name:</strong> ${contract.projectName}</li>
          <li><strong>Contract Type:</strong> ${contract.type}</li>
          <li><strong>Current Status:</strong> ${contract.status}</li>
          <li><strong>Last Activity:</strong> ${new Date(contract.lastActivityAt || '').toLocaleDateString()}</li>
        </ul>
        <p>Please review this contract to determine if any action is needed.</p>
        <p>You can access the contract here: <a href="${contractUrl}">${contractUrl}</a></p>
        <p style="font-size: 12px; color: #999;">This is an automated message. Please do not reply to this email.</p>
        <hr />
        <p style="font-size: 12px; color: #999;">Sent by Contract Management System</p>
      </div>
    `;

    const textContent = `
Contract Inactivity Notification

This is an automated notification from the Contract Management System.

The following contract has not had any activity for 30 days:

Contract Title: ${contract.title}
Project Name: ${contract.projectName}
Contract Type: ${contract.type}
Current Status: ${contract.status}
Last Activity: ${new Date(contract.lastActivityAt || '').toLocaleDateString()}

Please review this contract to determine if any action is needed.

You can access the contract here: ${contractUrl}

This is an automated message. Please do not reply to this email.

Sent by Contract Management System
    `;

    // Send to owner
    if (contract.owner) {
      await sendNotificationEmail(
        contract.owner,
        subject,
        htmlContent,
        textContent
      );
    }

    // Send to recipient if available
    if (contract.recipientEmail) {
      await sendNotificationEmail(
        contract.recipientEmail,
        subject,
        htmlContent,
        textContent
      );
    }
  } catch (error) {
    console.error('Error sending inactivity notification:', error);
    throw error;
  }
};

/**
 * Manually triggers an inactivity notification for a specific contract
 * This function will:
 * 1. Update the contract's lastActivityAt timestamp to be 31 days ago
 * 2. Send an inactivity notification email
 *
 * @param contractId The ID of the contract to send a notification for
 * @returns Promise resolving to true if successful
 */
export const manuallyTriggerInactivityNotification = async (contractId: string): Promise<boolean> => {
  try {
    // Get the contract
    const contract = await getContract(contractId);
    if (!contract) {
      throw new Error('Contract not found');
    }

    // Send the notification
    await sendInactivityNotification(contract);

    return true;
  } catch (error) {
    console.error('Error manually triggering inactivity notification:', error);
    throw error;
  }
};
