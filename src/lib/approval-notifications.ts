import { Contract } from './data';
import { sendNotificationEmail } from './brevoService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Formats the approval history into HTML for email
 */
const formatApprovalHistory = (contract: Contract): string => {
  const history = [];
  
  // Format legal team approvals
  if (contract.approvers?.legal) {
    const legalApprovers = Array.isArray(contract.approvers.legal) 
      ? contract.approvers.legal 
      : [contract.approvers.legal];
    
    legalApprovers.forEach(approver => {
      if (approver.approved) {
        history.push(`Legal Team: ${approver.name} (${approver.email}) - Approved on ${new Date(approver.approvedAt!).toLocaleString()}`);
      } else if (approver.declined) {
        history.push(`Legal Team: ${approver.name} (${approver.email}) - Sent back on ${new Date(approver.declinedAt!).toLocaleString()}`);
      }
    });
  }

  // Format management team approvals
  if (contract.approvers?.management) {
    const managementApprovers = Array.isArray(contract.approvers.management)
      ? contract.approvers.management
      : [contract.approvers.management];
    
    managementApprovers.forEach(approver => {
      if (approver.approved) {
        history.push(`Management Team: ${approver.name} (${approver.email}) - Approved on ${new Date(approver.approvedAt!).toLocaleString()}`);
      } else if (approver.declined) {
        history.push(`Management Team: ${approver.name} (${approver.email}) - Sent back on ${new Date(approver.declinedAt!).toLocaleString()}`);
      }
    });
  }

  // Format approver team approvals
  if (contract.approvers?.approver) {
    contract.approvers.approver.forEach(approver => {
      if (approver.approved) {
        history.push(`Approver: ${approver.name} (${approver.email}) - Approved on ${new Date(approver.approvedAt!).toLocaleString()}`);
      } else if (approver.declined) {
        history.push(`Approver: ${approver.name} (${approver.email}) - Sent back on ${new Date(approver.declinedAt!).toLocaleString()}`);
      }
    });
  }

  return history.join('<br>');
};

/**
 * Generates the contract details section for email
 */
const getContractDetails = (contract: Contract): string => {
  return `
    <ul>
      <li><strong>Contract Title:</strong> ${contract.title}</li>
      <li><strong>Project Name:</strong> ${contract.projectName}</li>
      <li><strong>Contract Type:</strong> ${contract.type}</li>
      <li><strong>Current Status:</strong> ${contract.status}</li>
      <li><strong>Start Date:</strong> ${contract.startDate}</li>
      <li><strong>End Date:</strong> ${contract.endDate || 'Not specified'}</li>
      <li><strong>Value:</strong> ${contract.value ? `$${contract.value.toLocaleString()}` : 'Not specified'}</li>
    </ul>
  `;
};

/**
 * Notifies management team when legal team approves
 */
export const notifyManagementOfLegalApproval = async (contract: Contract): Promise<void> => {
  const appUrl = import.meta.env.VITE_APP_URL || 'https://contract-management-system-omega.vercel.app';
  const contractUrl = `${appUrl}/contracts/${contract.id}`;

  // Get management team emails
  const managementApprovers = Array.isArray(contract.approvers?.management)
    ? contract.approvers.management
    : contract.approvers?.management ? [contract.approvers.management] : [];

  const approvalHistory = formatApprovalHistory(contract);
  const contractDetails = getContractDetails(contract);

  // Send email to each management team member
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

/**
 * Notifies approver team when management approves
 */
export const notifyApproversOfManagementApproval = async (contract: Contract): Promise<void> => {
  const appUrl = import.meta.env.VITE_APP_URL || 'https://contract-management-system-omega.vercel.app';
  const contractUrl = `${appUrl}/contracts/${contract.id}`;

  // Get approver team emails
  const approvers = contract.approvers?.approver || [];

  const approvalHistory = formatApprovalHistory(contract);
  const contractDetails = getContractDetails(contract);

  // Send email to each approver
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

/**
 * Notifies the first admin when a contract is sent back by any approver
 */
export const notifyAdminOfSentBack = async (contract: Contract): Promise<void> => {
  const appUrl = import.meta.env.VITE_APP_URL || 'https://contract-management-system-omega.vercel.app';
  const contractUrl = `${appUrl}/contracts/${contract.id}`;

  try {
    // Hardcoded admin email for now
    const adminEmail = 'aster.mangabat@student.ateneo.edu';
    console.log('Sending contract send-back notification to admin:', adminEmail);

    const approvalHistory = formatApprovalHistory(contract);
    const contractDetails = getContractDetails(contract);

    // Send email to the first admin
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
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
};