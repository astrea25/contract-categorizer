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
import { ADMIN_EMAIL, APP_URL } from "./config";

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
        const appUrl = APP_URL;
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