import { Contract } from "./data";
import { sendNotificationEmail } from "./brevoService";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { ADMIN_EMAIL, APP_URL } from "./config";

const formatApprovalHistory = (contract: Contract): string => {
    const history = [];

    if (contract.approvers?.legal) {
        const legalApprovers = Array.isArray(contract.approvers.legal) ? contract.approvers.legal : [contract.approvers.legal];

        legalApprovers.forEach(approver => {
            if (approver.approved) {
                history.push(
                    `Legal Team: ${approver.name} (${approver.email}) - Approved on ${new Date(approver.approvedAt!).toLocaleString()}`
                );
            } else if (approver.declined) {
                history.push(
                    `Legal Team: ${approver.name} (${approver.email}) - Sent back on ${new Date(approver.declinedAt!).toLocaleString()}`
                );
            }
        });
    }

    if (contract.approvers?.management) {
        const managementApprovers = Array.isArray(contract.approvers.management) ? contract.approvers.management : [contract.approvers.management];

        managementApprovers.forEach(approver => {
            if (approver.approved) {
                history.push(
                    `Management Team: ${approver.name} (${approver.email}) - Approved on ${new Date(approver.approvedAt!).toLocaleString()}`
                );
            } else if (approver.declined) {
                history.push(
                    `Management Team: ${approver.name} (${approver.email}) - Sent back on ${new Date(approver.declinedAt!).toLocaleString()}`
                );
            }
        });
    }

    if (contract.approvers?.approver) {
        contract.approvers.approver.forEach(approver => {
            if (approver.approved) {
                history.push(
                    `Approver: ${approver.name} (${approver.email}) - Approved on ${new Date(approver.approvedAt!).toLocaleString()}`
                );
            } else if (approver.declined) {
                history.push(
                    `Approver: ${approver.name} (${approver.email}) - Sent back on ${new Date(approver.declinedAt!).toLocaleString()}`
                );
            }
        });
    }

    return history.join("<br>");
};

const getContractDetails = (contract: Contract): string => {
    return `
    <ul>
      <li><strong>Contract Title:</strong> ${contract.title}</li>
      <li><strong>Project Name:</strong> ${contract.projectName}</li>
      <li><strong>Contract Type:</strong> ${contract.type}</li>
      <li><strong>Current Status:</strong> ${contract.status}</li>
      <li><strong>Start Date:</strong> ${contract.startDate}</li>
      <li><strong>End Date:</strong> ${contract.endDate || "Not specified"}</li>
      <li><strong>Value:</strong> ${contract.value ? `$${contract.value.toLocaleString()}` : "Not specified"}</li>
    </ul>
  `;
};

export const notifyManagementOfLegalApproval = async (contract: Contract): Promise<void> => {
    const appUrl = APP_URL;
    const contractUrl = `${appUrl}/contracts/${contract.id}`;
    const managementApprovers = Array.isArray(contract.approvers?.management) ? contract.approvers.management : contract.approvers?.management ? [contract.approvers.management] : [];
    const approvalHistory = formatApprovalHistory(contract);
    const contractDetails = getContractDetails(contract);

    for (const approver of managementApprovers) {
        const subject = `Legal Team Approval: ${contract.title} - Management Review Required`;

        const htmlContent = `
      <div style="font-family: sans-serif;">
        <h2>Contract Ready for Management Review</h2>
        <p>The legal team has approved the following contract and it requires your review:</p>

        <h3>Contract Details</h3>
        ${contractDetails}

        <h3>Approval History</h3>
        ${approvalHistory}

        <h3>Next Steps</h3>
        <p>Please review the contract and either approve or send it back:</p>
        <p><a href="${contractUrl}">Click here to review the contract</a></p>

        <hr>
        <p style="font-size: 12px; color: #666;">This is an automated message from the Contract Management System.</p>
      </div>
    `;

        await sendNotificationEmail(approver.email, subject, htmlContent);
    }
};

export const notifyApproversOfManagementApproval = async (contract: Contract): Promise<void> => {
    const appUrl = APP_URL;
    const contractUrl = `${appUrl}/contracts/${contract.id}`;
    const approvers = contract.approvers?.approver || [];
    const approvalHistory = formatApprovalHistory(contract);
    const contractDetails = getContractDetails(contract);

    for (const approver of approvers) {
        const subject = `Management Approval: ${contract.title} - Final Review Required`;

        const htmlContent = `
      <div style="font-family: sans-serif;">
        <h2>Contract Ready for Final Review</h2>
        <p>The management team has approved the following contract and it requires your final review:</p>

        <h3>Contract Details</h3>
        ${contractDetails}

        <h3>Approval History</h3>
        ${approvalHistory}

        <h3>Next Steps</h3>
        <p>Please review the contract and either approve or send it back:</p>
        <p><a href="${contractUrl}">Click here to review the contract</a></p>

        <hr>
        <p style="font-size: 12px; color: #666;">This is an automated message from the Contract Management System.</p>
      </div>
    `;

        await sendNotificationEmail(approver.email, subject, htmlContent);
    }
};

export const notifyAdminOfSentBack = async (contract: Contract): Promise<void> => {
    const appUrl = APP_URL;
    const contractUrl = `${appUrl}/contracts/${contract.id}`;

    try {
        const adminEmail = ADMIN_EMAIL;
        const approvalHistory = formatApprovalHistory(contract);
        const contractDetails = getContractDetails(contract);
        const subject = `Contract Sent Back: ${contract.title}`;

        const htmlContent = `
      <div style="font-family: sans-serif;">
        <h2>Contract Has Been Sent Back</h2>
        <p>A contract has been sent back by one or more approvers:</p>

        <h3>Contract Details</h3>
        ${contractDetails}

        <h3>Approval History</h3>
        ${approvalHistory}

        <h3>Review Required</h3>
        <p>Please review the contract and take appropriate action:</p>
        <p><a href="${contractUrl}">Click here to review the contract</a></p>

        <hr>
        <p style="font-size: 12px; color: #666;">This is an automated message from the Contract Management System.</p>
      </div>
    `;

        await sendNotificationEmail(adminEmail, subject, htmlContent);
    } catch (error) {}
};

export const notifyRequesterOfAmendment = async (contract: Contract): Promise<void> => {
    const appUrl = APP_URL;
    const contractUrl = `${appUrl}/contracts/${contract.id}`;

    try {
        const requesterEmail = contract.owner;

        if (!requesterEmail) {
            return;
        }

        const contractDetails = getContractDetails(contract);
        const subject = `Contract Amendment Started: ${contract.title}`;

        const htmlContent = `
      <div style="font-family: sans-serif;">
        <h2>Contract Amendment Process Started</h2>
        <p>A contract that you requested/created has entered the amendment process:</p>

        <h3>Contract Details</h3>
        ${contractDetails}

        <h3>Amendment Process</h3>
        <p>The contract has been moved to the amendment status. The amendment will go through the following stages:</p>
        <ol>
          <li>Amendment (current stage)</li>
          <li>Management Review</li>
          <li>WWF Signing</li>
          <li>Counterparty Signing</li>
        </ol>

        <h3>View Contract</h3>
        <p>You can view the contract and track its progress through the amendment process:</p>
        <p><a href="${contractUrl}">Click here to view the contract</a></p>

        <hr>
        <p style="font-size: 12px; color: #666;">This is an automated message from the Contract Management System.</p>
      </div>
    `;

        await sendNotificationEmail(requesterEmail, subject, htmlContent);
    } catch (error) {}
};