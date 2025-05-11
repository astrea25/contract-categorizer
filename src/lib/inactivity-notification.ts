// Helper function to get approvers based on contract status
// Admin always gets notifications
// Remove duplicates
/**
 * Checks for contracts that have been inactive for a specified number of business days
 * and sends notification emails to relevant users based on contract status.
 * Uses role-based thresholds: 3 business days for approvers/reviewers, 1 business day for others.
 *
 * @returns Promise resolving to the number of notifications sent
 */
// Get current date
// Query all non-archived contracts
// Process each contract
// Skip contracts without lastActivityAt timestamp
// Calculate business days since last activity (excluding weekends)
// Determine if the contract is in an approval/review stage
// Get appropriate threshold based on contract status and role
// Check if contract has been inactive for the specified period of business days
// Send notifications to relevant users
/**
 * Sends an inactivity notification email for a specific contract
 *
 * @param contract The contract that has been inactive
 * @param businessDaysSinceActivity Number of business days since last activity (optional)
 * @returns Promise resolving when all notifications have been sent
 */
// If business days weren't provided, calculate them
// Determine if the contract is in an approval/review stage
// Get the appropriate thresholds for display
// Prepare email content
// Get list of approvers based on contract status and send notifications
/**
 * Manually triggers an inactivity notification for a specific contract
 * This function will:
 * 1. Update the contract's lastActivityAt timestamp to be 31 days ago
 * 2. Send an inactivity notification email
 *
 * @param contractId The ID of the contract to send a notification for
 * @returns Promise resolving to true if successful
 */
// Get the contract
// Send the notification
import { db } from "./firebase";

import {
    collection,
    query,
    where,
    getDocs,
    Timestamp,
    orderBy,
    doc,
    getDoc,
    updateDoc,
} from "firebase/firestore";

import { sendNotificationEmail } from "./brevoService";
import { Contract, getContract } from "./data";
import { differenceInBusinessDays, getInactivityThreshold } from "./date-utils";
const ADMIN_EMAIL = "aster.mangabat@student.ateneo.edu";

const getApproversForStatus = (contract: Contract): string[] => {
    const approvers: string[] = [ADMIN_EMAIL];
    const status = contract.status || "";

    if (status === "requested" || status === "draft") {
        if (contract.owner) {
            approvers.push(contract.owner);
        }
    } else if (status.includes("legal")) {
        if (contract.approvers?.legal) {
            const legalTeam = Array.isArray(contract.approvers.legal) ? contract.approvers.legal : [contract.approvers.legal];
            approvers.push(...legalTeam.map(member => member.email));
        }
    } else if (status.includes("management")) {
        if (contract.approvers?.management) {
            const managementTeam = Array.isArray(contract.approvers.management) ? contract.approvers.management : [contract.approvers.management];
            approvers.push(...managementTeam.map(member => member.email));
        }
    } else if (status === "approval" && contract.approvers?.approver) {
        approvers.push(...contract.approvers.approver.map(member => member.email));
    }

    return [...new Set(approvers)];
};

export const checkInactiveContractsAndNotify = async (): Promise<number> => {
    try {
        const now = new Date();
        const contractsRef = collection(db, "contracts");
        const q = query(contractsRef, where("archived", "==", false));
        const contractsSnapshot = await getDocs(q);
        let notificationsSent = 0;

        for (const doc of contractsSnapshot.docs) {
            const contract = doc.data() as Contract;

            if (!contract.lastActivityAt)
                continue;

            const lastActivityDate = new Date(contract.lastActivityAt);
            const businessDaysSinceLastActivity = differenceInBusinessDays(lastActivityDate, now);
            const isInApprovalStage = contract.status?.includes("review") || contract.status?.includes("approval") || contract.status?.includes("send_back");
            const thresholdDays = getInactivityThreshold(contract, isInApprovalStage);

            if (businessDaysSinceLastActivity >= thresholdDays) {
                await sendInactivityNotification(contract, businessDaysSinceLastActivity);
                notificationsSent++;
            }
        }

        return notificationsSent;
    } catch (error) {
        throw error;
    }
};

export const sendInactivityNotification = async (contract: Contract, businessDaysSinceActivity?: number): Promise<void> => {
    try {
        const appUrl = import.meta.env.VITE_APP_URL || "https://contract-management-system-omega.vercel.app";
        const contractUrl = `${appUrl}/contracts/${contract.id}`;
        let daysSinceActivity = businessDaysSinceActivity;

        if (daysSinceActivity === undefined && contract.lastActivityAt) {
            daysSinceActivity = differenceInBusinessDays(new Date(contract.lastActivityAt), new Date());
        }

        const isInApprovalStage = contract.status?.includes("review") || contract.status?.includes("approval") || contract.status?.includes("send_back");
        const reviewerThreshold = contract.reviewerInactivityDays !== undefined ? contract.reviewerInactivityDays : 3;
        const regularThreshold = contract.regularInactivityDays !== undefined ? contract.regularInactivityDays : 1;
        const subject = `Inactive Contract Notification: ${contract.title} (ID: ${contract.id})`;

        const htmlContent = `
      <div style="font-family: sans-serif;">
        <h2>Contract Inactivity Notification</h2>
        <p>This is an automated notification from the Contract Management System.</p>
        <p>The following contract has not had any activity for ${daysSinceActivity || "several"} <strong>business days</strong> (excluding weekends):</p>
        <p><strong>Current thresholds:</strong> ${reviewerThreshold} business days for reviewers/approvers, ${regularThreshold} business days for other users</p>
        <ul>
          <li><strong>Contract ID:</strong> ${contract.id}</li>
          <li><strong>Contract Title:</strong> ${contract.title}</li>
          <li><strong>Project Name:</strong> ${contract.projectName}</li>
          <li><strong>Contract Type:</strong> ${contract.type}</li>
          <li><strong>Current Status:</strong> ${contract.status}</li>
          <li><strong>Last Activity:</strong> ${new Date(contract.lastActivityAt || "").toLocaleDateString()}</li>
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

The following contract has not had any activity for ${daysSinceActivity || "several"} business days (excluding weekends):

Current thresholds: ${reviewerThreshold} business days for reviewers/approvers, ${regularThreshold} business days for other users

Contract ID: ${contract.id}
Contract Title: ${contract.title}
Project Name: ${contract.projectName}
Contract Type: ${contract.type}
Current Status: ${contract.status}
Last Activity: ${new Date(contract.lastActivityAt || "").toLocaleDateString()}

Please review this contract to determine if any action is needed.

You can access the contract here: ${contractUrl}

This is an automated message. Please do not reply to this email.

Sent by Contract Management System
    `;

        const approvers = getApproversForStatus(contract);

        for (const email of approvers) {
            await sendNotificationEmail(email, subject, htmlContent, textContent);
        }
    } catch (error) {
        throw error;
    }
};

export const manuallyTriggerInactivityNotification = async (contractId: string): Promise<boolean> => {
    try {
        const contract = await getContract(contractId);

        if (!contract) {
            throw new Error("Contract not found");
        }

        await sendInactivityNotification(contract);
        return true;
    } catch (error) {
        throw error;
    }
};