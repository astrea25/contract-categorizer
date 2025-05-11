import { Contract, getContracts, normalizeApprovers } from './data';

// Type definition for approver
interface Approver {
  email: string;
  name: string;
  approved: boolean;
  declined?: boolean;
  approvedAt?: string | null;
  declinedAt?: string | null;
}

// Define a type for normalized approvers
interface NormalizedApprovers {
  legal: Approver[];
  management: Approver[];
  approver: Approver[];
}

/**
 * Gets contracts assigned to a specific user for approval
 *
 * @param userEmail The email of the user
 * @param isLegalTeam Whether the user is a legal team member
 * @param isManagementTeam Whether the user is a management team member
 * @param isApprover Whether the user is an approver
 * @returns An array of contracts assigned to the user for approval
 */
export const getContractsForApproval = async (
  userEmail: string,
  isLegalTeam: boolean,
  isManagementTeam: boolean,
  isApprover: boolean = false
): Promise<Contract[]> => {
  if (!userEmail) return [];

  console.log(`Getting contracts for approval - User: ${userEmail}, Roles: Legal=${isLegalTeam}, Management=${isManagementTeam}, Approver=${isApprover}`);

  // Get all non-archived contracts
  const allContracts = await getContracts(false);
  const lowercaseEmail = userEmail.toLowerCase();

  console.log(`Total contracts before filtering: ${allContracts.length}`);
  console.log(`Contract statuses:`, allContracts.map(c => ({ id: c.id, title: c.title, status: c.status })));

  // Filter contracts based on user role and approval assignment
  const filteredContracts = allContracts.filter(contract => {
    // Skip contracts that are already finished or in a state that doesn't require approval
    const skipStatuses = ['finished', 'contract_end', 'implementation', 'wwf_signing', 'counterparty_signing'];
    if (skipStatuses.includes(contract.status)) {
      console.log(`Contract ${contract.id} (${contract.title}) - Status: ${contract.status} - Skipped due to status`);
      return false;
    }

    // First normalize the approvers structure to ensure we always work with arrays
    const normalizedContract = normalizeApprovers(contract);
    const approvers = normalizedContract.approvers as NormalizedApprovers;

    // Check if the contract is in a state where it needs approval from the user's role
    if (isLegalTeam) {
      // If contract is not in legal_review or approval status, and not sent back by legal, skip it
      if (contract.status !== 'legal_review' &&
          contract.status !== 'approval' &&
          contract.status !== 'legal_send_back' &&
          contract.status !== 'legal_declined') {
        console.log(`Contract ${contract.id} (${contract.title}) - Status: ${contract.status} - Not in legal review status`);
        return false;
      }
    }

    if (isManagementTeam) {
      // If contract is not in management_review or approval status, and not sent back by management, skip it
      if (contract.status !== 'management_review' &&
          contract.status !== 'approval' &&
          contract.status !== 'management_send_back' &&
          contract.status !== 'management_declined') {
        console.log(`Contract ${contract.id} (${contract.title}) - Status: ${contract.status} - Not in management review status`);
        return false;
      }
    }

    // For legal team members
    if (isLegalTeam) {
      console.log(`DEBUG LEGAL: Checking contract ${contract.id} (${contract.title}) for legal team member ${lowercaseEmail}`);
      console.log(`DEBUG LEGAL: Contract status: ${contract.status}`);

      // Check if the contract is in a state where it needs legal team approval
      if (contract.status !== 'legal_review' &&
          contract.status !== 'approval' &&
          contract.status !== 'legal_send_back' &&
          contract.status !== 'legal_declined') {
        console.log(`DEBUG LEGAL: Contract ${contract.id} (${contract.title}) - Status: ${contract.status} - Not in legal review status`);
        return false;
      }

      // Check if approvers object exists
      if (!approvers) {
        console.log(`DEBUG LEGAL: No approvers object found for contract ${contract.id}`);

        // If the contract is in legal_review status and there are no approvers assigned yet,
        // show it to all legal team members
        if (contract.status === 'legal_review') {
          console.log(`DEBUG LEGAL: Contract ${contract.id} (${contract.title}) - No approvers assigned yet, but status is legal_review`);
          return true;
        }

        return false;
      }

      // Check if legal approvers field exists
      if (!approvers.legal ||
          (Array.isArray(approvers.legal) && approvers.legal.length === 0)) {
        console.log(`DEBUG LEGAL: No legal approvers found for contract ${contract.id}`);

        // If the contract is in legal_review status and there are no legal approvers assigned yet,
        // show it to all legal team members
        if (contract.status === 'legal_review') {
          console.log(`DEBUG LEGAL: Contract ${contract.id} (${contract.title}) - No legal approvers assigned yet, but status is legal_review`);
          return true;
        }

        return false;
      }

      // Make sure approvers.legal is an array
      const legalApprovers = Array.isArray(approvers.legal) ? approvers.legal : [approvers.legal];

      console.log(`DEBUG LEGAL: Legal approvers for contract ${contract.id}:`, legalApprovers);

      // Find if the user is a legal approver for this contract
      const userLegalApprover = legalApprovers.find(
        approver => approver.email.toLowerCase() === lowercaseEmail
      );

      if (userLegalApprover) {
        // If declined (sent back) is undefined, treat it as false
        const isSentBack = userLegalApprover.declined === true;
        const isApproved = userLegalApprover.approved === true;
        const shouldShow = !isApproved && !isSentBack;

        console.log(`DEBUG LEGAL: Contract ${contract.id} (${contract.title}) - Legal Approver: ${userLegalApprover.email}, Approved: ${isApproved}, Sent Back: ${isSentBack}, Should Show: ${shouldShow}`);

        return shouldShow; // Return true if the user should see this contract
      } else {
        console.log(`DEBUG LEGAL: Contract ${contract.id} (${contract.title}) - User ${lowercaseEmail} not found in legal approvers list`);

        // If the contract is in legal_review status and there are no specific legal approvers assigned,
        // show it to all legal team members
        if (contract.status === 'legal_review' && legalApprovers.length === 0) {
          console.log(`DEBUG LEGAL: Contract ${contract.id} (${contract.title}) - No specific legal approvers assigned, showing to all legal team members`);
          return true;
        }
      }
    }

    // For management team members
    if (isManagementTeam) {
      console.log(`DEBUG MANAGEMENT: Checking contract ${contract.id} (${contract.title}) for management team member ${lowercaseEmail}`);
      console.log(`DEBUG MANAGEMENT: Contract status: ${contract.status}`);

      // Check if the contract is in a state where it needs management team approval
      if (contract.status !== 'management_review' &&
          contract.status !== 'approval' &&
          contract.status !== 'management_send_back' &&
          contract.status !== 'management_declined') {
        console.log(`DEBUG MANAGEMENT: Contract ${contract.id} (${contract.title}) - Status: ${contract.status} - Not in management review status`);
        return false;
      }

      // Check if approvers object exists
      if (!approvers) {
        console.log(`DEBUG MANAGEMENT: No approvers object found for contract ${contract.id}`);

        // If the contract is in management_review status and there are no approvers assigned yet,
        // show it to all management team members
        if (contract.status === 'management_review') {
          console.log(`DEBUG MANAGEMENT: Contract ${contract.id} (${contract.title}) - No approvers assigned yet, but status is management_review`);
          return true;
        }

        return false;
      }

      // Check if management approvers field exists
      if (!approvers.management ||
          (Array.isArray(approvers.management) && approvers.management.length === 0)) {
        console.log(`DEBUG MANAGEMENT: No management approvers found for contract ${contract.id}`);

        // If the contract is in management_review status and there are no management approvers assigned yet,
        // show it to all management team members
        if (contract.status === 'management_review') {
          console.log(`DEBUG MANAGEMENT: Contract ${contract.id} (${contract.title}) - No management approvers assigned yet, but status is management_review`);
          return true;
        }

        return false;
      }

      // Make sure approvers.management is an array
      const managementApprovers = Array.isArray(approvers.management) ? approvers.management : [approvers.management];

      console.log(`DEBUG MANAGEMENT: Management approvers for contract ${contract.id}:`, managementApprovers);

      // Find if the user is a management approver for this contract
      const userManagementApprover = managementApprovers.find(
        approver => approver.email.toLowerCase() === lowercaseEmail
      );

      if (userManagementApprover) {
        // If declined (sent back) is undefined, treat it as false
        const isSentBack = userManagementApprover.declined === true;
        const isApproved = userManagementApprover.approved === true;
        const shouldShow = !isApproved && !isSentBack;

        console.log(`DEBUG MANAGEMENT: Contract ${contract.id} (${contract.title}) - Management Approver: ${userManagementApprover.email}, Approved: ${isApproved}, Sent Back: ${isSentBack}, Should Show: ${shouldShow}`);

        return shouldShow; // Return true if the user should see this contract
      } else {
        console.log(`DEBUG MANAGEMENT: Contract ${contract.id} (${contract.title}) - User ${lowercaseEmail} not found in management approvers list`);

        // If the contract is in management_review status and there are no specific management approvers assigned,
        // show it to all management team members
        if (contract.status === 'management_review' && managementApprovers.length === 0) {
          console.log(`DEBUG MANAGEMENT: Contract ${contract.id} (${contract.title}) - No specific management approvers assigned, showing to all management team members`);
          return true;
        }
      }
    }

    // For regular approvers
    if (isApprover) {
      console.log(`DEBUG APPROVER: Checking contract ${contract.id} (${contract.title}) for approver ${lowercaseEmail}`);
      console.log(`DEBUG APPROVER: Contract status: ${contract.status}`);
      console.log(`DEBUG APPROVER: Contract approvers:`, contract.approvers);

      // Check if the contract is in a state where it needs approval from an approver
      // Approvers should see contracts in approval status or that have been sent back
      if (contract.status !== 'approval' &&
          contract.status !== 'draft' &&
          contract.status !== 'requested' &&
          !contract.status.includes('send_back') &&
          !contract.status.includes('declined')) {
        console.log(`DEBUG APPROVER: Contract ${contract.id} (${contract.title}) - Status: ${contract.status} - Not in approver status`);
        return false;
      }

      // Check if approvers object exists
      if (!approvers) {
        console.log(`DEBUG APPROVER: No approvers object found for contract ${contract.id}`);

        // If the contract is in a state that needs approval and there are no approvers assigned yet,
        // show it to all approvers so they can be assigned
        if (contract.status === 'approval' ||
            contract.status === 'draft' ||
            contract.status === 'requested') {
          console.log(`DEBUG APPROVER: Contract ${contract.id} (${contract.title}) - No approvers assigned yet, but status requires approval`);
          return true;
        }

        return false;
      }

      // Check if approver field exists
      if (!approvers.approver ||
          (Array.isArray(approvers.approver) && approvers.approver.length === 0)) {
        console.log(`DEBUG APPROVER: No approver field found or empty array in approvers object for contract ${contract.id}`);

        // If the contract is in a state that needs approval and there are no approvers assigned yet,
        // show it to all approvers so they can be assigned
        if (contract.status === 'approval' ||
            contract.status === 'draft' ||
            contract.status === 'requested') {
          console.log(`DEBUG APPROVER: Contract ${contract.id} (${contract.title}) - No approvers assigned yet, but status requires approval`);
          return true;
        }

        return false;
      }

      // For approvers, we need to check if they are assigned to this contract
      // and if they haven't already approved or declined it
      const approversList = Array.isArray(approvers.approver) ? approvers.approver : [approvers.approver];

      console.log(`DEBUG APPROVER: Approvers list for contract ${contract.id}:`, approversList);

      const userApprover = approversList.find(
        approver => approver.email.toLowerCase() === lowercaseEmail
      );

      if (userApprover) {
        // If declined (sent back) is undefined, treat it as false
        const isSentBack = userApprover.declined === true;
        const isApproved = userApprover.approved === true;
        const shouldShow = !isApproved && !isSentBack;

        // Log for debugging
        console.log(`DEBUG APPROVER: Contract ${contract.id} (${contract.title}) - Approver: ${userApprover.email}, Approved: ${isApproved}, Sent Back: ${isSentBack}, Should Show: ${shouldShow}, Status: ${contract.status}`);

        return shouldShow; // Return true if the user should see this contract
      } else {
        console.log(`DEBUG APPROVER: Contract ${contract.id} (${contract.title}) - User ${lowercaseEmail} not found in approvers list`);

        // If the contract is in a state that needs approval and there are no specific approvers assigned,
        // show it to all approvers
        if ((contract.status === 'approval' || contract.status === 'draft' || contract.status === 'requested') && approversList.length === 0) {
          console.log(`DEBUG APPROVER: Contract ${contract.id} (${contract.title}) - No specific approvers assigned, showing to all approvers`);
          return true;
        }
      }
    }

    return false;
  });

  console.log(`Contracts for approval count: ${filteredContracts.length}`);
  console.log(`Contracts for approval details:`, filteredContracts.map(c => ({ id: c.id, title: c.title, status: c.status })));

  return filteredContracts;
};

/**
 * Gets contracts that have been approved by the user
 *
 * @param userEmail The email of the user
 * @param isLegalTeam Whether the user is a legal team member
 * @param isManagementTeam Whether the user is a management team member
 * @param isApprover Whether the user is an approver
 * @returns An array of contracts approved by the user
 */
export const getApprovedContracts = async (
  userEmail: string,
  isLegalTeam: boolean,
  isManagementTeam: boolean,
  isApprover: boolean = false
): Promise<Contract[]> => {
  if (!userEmail) return [];

  // Get all non-archived contracts
  const allContracts = await getContracts(false);
  const lowercaseEmail = userEmail.toLowerCase();

  // Filter contracts based on user role and approval status
  return allContracts.filter(contract => {
    // First normalize the approvers structure
    const normalizedContract = normalizeApprovers(contract);
    const approvers = normalizedContract.approvers as NormalizedApprovers;

    // For legal team members
    if (isLegalTeam && approvers?.legal) {
      const userLegalApprover = approvers.legal.find(
        approver => approver.email.toLowerCase() === lowercaseEmail && approver.approved
      );

      if (userLegalApprover) return true;
    }

    // For management team members
    if (isManagementTeam && approvers?.management) {
      const userManagementApprover = approvers.management.find(
        approver => approver.email.toLowerCase() === lowercaseEmail && approver.approved
      );

      if (userManagementApprover) return true;
    }

    // For regular approvers
    if (isApprover && approvers?.approver) {
      const approversList = Array.isArray(approvers.approver) ? approvers.approver : [approvers.approver];

      // Log all approvers for debugging
      console.log(`Contract ${contract.id} (${contract.title}) - Status: ${contract.status} - Approvers:`,
        approversList.map(a => ({
          email: a.email,
          approved: a.approved,
          declined: a.declined
        }))
      );

      const userApprover = approversList.find(
        approver => approver.email.toLowerCase() === lowercaseEmail && approver.approved
      );

      // Log for debugging
      if (userApprover) {
        console.log(`Approved contract ${contract.id} (${contract.title}) - Approver: ${userApprover.email}, Status: ${contract.status}`);
        return true;
      } else {
        console.log(`Contract ${contract.id} (${contract.title}) - User ${lowercaseEmail} not found as approved approver`);
      }
    }

    return false;
  });
};



/**
 * Checks if a contract needs approval from the current user
 *
 * @param contract The contract to check
 * @param userEmail The email of the user
 * @param isLegalTeam Whether the user is a legal team member
 * @param isManagementTeam Whether the user is a management team member
 * @param isApprover Whether the user is an approver
 * @returns True if the contract needs approval from the user, false otherwise
 */
export const needsApprovalFrom = (
  contract: Contract,
  userEmail: string,
  isLegalTeam: boolean,
  isManagementTeam: boolean,
  isApprover: boolean = false
): boolean => {
  if (!userEmail) return false;

  // Skip contracts that are already finished or in a state that doesn't require approval
  const skipStatuses = ['finished', 'contract_end', 'implementation', 'wwf_signing', 'counterparty_signing'];
  if (skipStatuses.includes(contract.status)) {
    return false;
  }

  const lowercaseEmail = userEmail.toLowerCase();
  // First normalize the approvers structure
  const normalizedContract = normalizeApprovers(contract);
  const approvers = normalizedContract.approvers as NormalizedApprovers;

  // Check if the contract is in a state where it needs approval from the user's role
  if (isLegalTeam) {
    // If contract is not in legal_review or approval status, and not sent back by legal, skip it
    if (contract.status !== 'legal_review' &&
        contract.status !== 'approval' &&
        contract.status !== 'legal_send_back' &&
        contract.status !== 'legal_declined') {
      return false;
    }
  }

  if (isManagementTeam) {
    // If contract is not in management_review or approval status, and not sent back by management, skip it
    if (contract.status !== 'management_review' &&
        contract.status !== 'approval' &&
        contract.status !== 'management_send_back' &&
        contract.status !== 'management_declined') {
      return false;
    }
  }

  // For legal team members
  if (isLegalTeam) {
    console.log(`DEBUG NEEDS APPROVAL LEGAL: Checking if contract ${contract.id} (${contract.title}) needs approval from ${lowercaseEmail}`);

    // Check if the contract is in a state where it needs legal team approval
    if (contract.status !== 'legal_review' &&
        contract.status !== 'approval' &&
        contract.status !== 'legal_send_back' &&
        contract.status !== 'legal_declined') {
      console.log(`DEBUG NEEDS APPROVAL LEGAL: Contract ${contract.id} (${contract.title}) - Status: ${contract.status} - Not in legal review status`);
      return false;
    }

    // Check if approvers object exists
    if (!approvers) {
      console.log(`DEBUG NEEDS APPROVAL LEGAL: No approvers object found for contract ${contract.id}`);

      // If the contract is in legal_review status and there are no approvers assigned yet,
      // show it to all legal team members
      if (contract.status === 'legal_review') {
        console.log(`DEBUG NEEDS APPROVAL LEGAL: Contract ${contract.id} (${contract.title}) - No approvers assigned yet, but status is legal_review`);
        return true;
      }

      return false;
    }

    // Check if legal approvers field exists
    if (!approvers.legal ||
        (Array.isArray(approvers.legal) && approvers.legal.length === 0)) {
      console.log(`DEBUG NEEDS APPROVAL LEGAL: No legal approvers found for contract ${contract.id}`);

      // If the contract is in legal_review status and there are no legal approvers assigned yet,
      // show it to all legal team members
      if (contract.status === 'legal_review') {
        console.log(`DEBUG NEEDS APPROVAL LEGAL: Contract ${contract.id} (${contract.title}) - No legal approvers assigned yet, but status is legal_review`);
        return true;
      }

      return false;
    }

    // Make sure approvers.legal is an array
    const legalApprovers = Array.isArray(approvers.legal) ? approvers.legal : [approvers.legal];

    const userLegalApprover = legalApprovers.find(
      approver => approver.email.toLowerCase() === lowercaseEmail
    );

    if (userLegalApprover) {
      // Check if the user has not approved and not sent back
      const isSentBack = userLegalApprover.declined === true;
      const isApproved = userLegalApprover.approved === true;
      const shouldShow = !isApproved && !isSentBack;

      console.log(`DEBUG NEEDS APPROVAL LEGAL: Contract ${contract.id} (${contract.title}) - Legal Approver: ${userLegalApprover.email}, Approved: ${isApproved}, Sent Back: ${isSentBack}, Should Show: ${shouldShow}`);

      return shouldShow;
    } else {
      console.log(`DEBUG NEEDS APPROVAL LEGAL: Contract ${contract.id} (${contract.title}) - User ${lowercaseEmail} not found in legal approvers list`);

      // If the contract is in legal_review status and there are no specific legal approvers assigned,
      // show it to all legal team members
      if (contract.status === 'legal_review' && legalApprovers.length === 0) {
        console.log(`DEBUG NEEDS APPROVAL LEGAL: Contract ${contract.id} (${contract.title}) - No specific legal approvers assigned, showing to all legal team members`);
        return true;
      }

      return false;
    }
  }

  // For management team members
  if (isManagementTeam) {
    console.log(`DEBUG NEEDS APPROVAL MANAGEMENT: Checking if contract ${contract.id} (${contract.title}) needs approval from ${lowercaseEmail}`);

    // Check if the contract is in a state where it needs management team approval
    if (contract.status !== 'management_review' &&
        contract.status !== 'approval' &&
        contract.status !== 'management_send_back' &&
        contract.status !== 'management_declined') {
      console.log(`DEBUG NEEDS APPROVAL MANAGEMENT: Contract ${contract.id} (${contract.title}) - Status: ${contract.status} - Not in management review status`);
      return false;
    }

    // Check if approvers object exists
    if (!approvers) {
      console.log(`DEBUG NEEDS APPROVAL MANAGEMENT: No approvers object found for contract ${contract.id}`);

      // If the contract is in management_review status and there are no approvers assigned yet,
      // show it to all management team members
      if (contract.status === 'management_review') {
        console.log(`DEBUG NEEDS APPROVAL MANAGEMENT: Contract ${contract.id} (${contract.title}) - No approvers assigned yet, but status is management_review`);
        return true;
      }

      return false;
    }

    // Check if management approvers field exists
    if (!approvers.management ||
        (Array.isArray(approvers.management) && approvers.management.length === 0)) {
      console.log(`DEBUG NEEDS APPROVAL MANAGEMENT: No management approvers found for contract ${contract.id}`);

      // If the contract is in management_review status and there are no management approvers assigned yet,
      // show it to all management team members
      if (contract.status === 'management_review') {
        console.log(`DEBUG NEEDS APPROVAL MANAGEMENT: Contract ${contract.id} (${contract.title}) - No management approvers assigned yet, but status is management_review`);
        return true;
      }

      return false;
    }

    // Make sure approvers.management is an array
    const managementApprovers = Array.isArray(approvers.management) ? approvers.management : [approvers.management];

    const userManagementApprover = managementApprovers.find(
      approver => approver.email.toLowerCase() === lowercaseEmail
    );

    if (userManagementApprover) {
      // Check if the user has not approved and not sent back
      const isSentBack = userManagementApprover.declined === true;
      const isApproved = userManagementApprover.approved === true;
      const shouldShow = !isApproved && !isSentBack;

      console.log(`DEBUG NEEDS APPROVAL MANAGEMENT: Contract ${contract.id} (${contract.title}) - Management Approver: ${userManagementApprover.email}, Approved: ${isApproved}, Sent Back: ${isSentBack}, Should Show: ${shouldShow}`);

      return shouldShow;
    } else {
      console.log(`DEBUG NEEDS APPROVAL MANAGEMENT: Contract ${contract.id} (${contract.title}) - User ${lowercaseEmail} not found in management approvers list`);

      // If the contract is in management_review status and there are no specific management approvers assigned,
      // show it to all management team members
      if (contract.status === 'management_review' && managementApprovers.length === 0) {
        console.log(`DEBUG NEEDS APPROVAL MANAGEMENT: Contract ${contract.id} (${contract.title}) - No specific management approvers assigned, showing to all management team members`);
        return true;
      }

      return false;
    }
  }

  // For regular approvers
  if (isApprover) {
    console.log(`DEBUG NEEDS APPROVAL: Checking if contract ${contract.id} (${contract.title}) needs approval from ${lowercaseEmail}`);
    console.log(`DEBUG NEEDS APPROVAL: Contract status: ${contract.status}`);
    console.log(`DEBUG NEEDS APPROVAL: Contract approvers:`, contract.approvers);

    // Check if the contract is in a state where it needs approval from an approver
    // Approvers should see contracts in approval status or that have been sent back
    if (contract.status !== 'approval' &&
        contract.status !== 'draft' &&
        contract.status !== 'requested' &&
        !contract.status.includes('send_back') &&
        !contract.status.includes('declined')) {
      console.log(`DEBUG NEEDS APPROVAL: Contract ${contract.id} (${contract.title}) - Status: ${contract.status} - Not in approver status`);
      return false;
    }

    // Check if approvers object exists
    if (!approvers) {
      console.log(`DEBUG NEEDS APPROVAL: No approvers object found for contract ${contract.id}`);

      // If the contract is in a state that needs approval and there are no approvers assigned yet,
      // show it to all approvers so they can be assigned
      if (contract.status === 'approval' ||
          contract.status === 'draft' ||
          contract.status === 'requested') {
        console.log(`DEBUG NEEDS APPROVAL: Contract ${contract.id} (${contract.title}) - No approvers assigned yet, but status requires approval`);
        return true;
      }

      return false;
    }

    // Check if approver field exists
    if (!approvers.approver ||
        (Array.isArray(approvers.approver) && approvers.approver.length === 0)) {
      console.log(`DEBUG NEEDS APPROVAL: No approver field found or empty array in approvers object for contract ${contract.id}`);

      // If the contract is in a state that needs approval and there are no approvers assigned yet,
      // show it to all approvers so they can be assigned
      if (contract.status === 'approval' ||
          contract.status === 'draft' ||
          contract.status === 'requested') {
        console.log(`DEBUG NEEDS APPROVAL: Contract ${contract.id} (${contract.title}) - No approvers assigned yet, but status requires approval`);
        return true;
      }

      return false;
    }

    // Make sure approvers.approver is an array
    const approversList = Array.isArray(approvers.approver) ? approvers.approver : [approvers.approver];

    const userApprover = approversList.find(
      approver => approver.email.toLowerCase() === lowercaseEmail
    );

    if (userApprover) {
      // Check if the user has not approved and not sent back
      const isSentBack = userApprover.declined === true;
      const isApproved = userApprover.approved === true;
      const shouldShow = !isApproved && !isSentBack;

      console.log(`DEBUG NEEDS APPROVAL: Contract ${contract.id} (${contract.title}) - Approver: ${userApprover.email}, Approved: ${isApproved}, Sent Back: ${isSentBack}, Should Show: ${shouldShow}`);

      return shouldShow;
    } else {
      console.log(`DEBUG NEEDS APPROVAL: Contract ${contract.id} (${contract.title}) - User ${lowercaseEmail} not found in approvers list`);

      // If the contract is in a state that needs approval and there are no specific approvers assigned,
      // show it to all approvers
      if ((contract.status === 'approval' || contract.status === 'draft' || contract.status === 'requested') && approversList.length === 0) {
        console.log(`DEBUG NEEDS APPROVAL: Contract ${contract.id} (${contract.title}) - No specific approvers assigned, showing to all approvers`);
        return true;
      }

      return false;
    }
  }

  return false;
};

/**
 * Updates send back status for a contract
 *
 * @param contract The contract to update
 * @param isLegalTeam Whether the user is a legal team member
 * @param isManagementTeam Whether the user is a management team member
 * @param userEmail The email of the user
 * @returns The updated approvers object
 */
export const sendBackContract = (
  contract: Contract,
  isLegalTeam: boolean,
  isManagementTeam: boolean,
  userEmail: string
): Contract['approvers'] => {
  if (!userEmail || !contract.approvers) return contract.approvers;

  const lowercaseEmail = userEmail.toLowerCase();
  const normalizedContract = normalizeApprovers(contract);
  const approvers = normalizedContract.approvers as NormalizedApprovers;
  const result = { ...approvers };

  // Update legal approval status
  if (isLegalTeam && result.legal) {
    result.legal = result.legal.map(approver => {
      if (approver.email.toLowerCase() === lowercaseEmail && approver.approved) {
        return {
          ...approver,
          approved: false,
          approvedAt: undefined
        };
      }
      return approver;
    });
  }

  // Update management approval status
  if (isManagementTeam && result.management) {
    result.management = result.management.map(approver => {
      if (approver.email.toLowerCase() === lowercaseEmail && approver.approved) {
        return {
          ...approver,
          approved: false,
          approvedAt: undefined
        };
      }
      return approver;
    });
  }

  return result;
};

/**
 * Gets contracts that the user has already responded to (approved or declined)
 *
 * @param userEmail The email of the user
 * @param isLegalTeam Whether the user is a legal team member
 * @param isManagementTeam Whether the user is a management team member
 * @param isApprover Whether the user is an approver
 * @returns An array of contracts that the user has already responded to
 */
export const getRespondedContracts = async (
  userEmail: string,
  isLegalTeam: boolean,
  isManagementTeam: boolean,
  isApprover: boolean = false
): Promise<Contract[]> => {
  if (!userEmail) return [];

  console.log(`Getting responded contracts - User: ${userEmail}, Roles: Legal=${isLegalTeam}, Management=${isManagementTeam}, Approver=${isApprover}`);

  // Get all non-archived contracts
  const allContracts = await getContracts(false);
  const lowercaseEmail = userEmail.toLowerCase();

  console.log(`Total contracts before filtering for responses: ${allContracts.length}`);

  // Filter contracts based on user role and response status
  const respondedContracts = allContracts.filter(contract => {
    // First normalize the approvers structure
    const normalizedContract = normalizeApprovers(contract);
    const approvers = normalizedContract.approvers as NormalizedApprovers;

    // For legal team members
    if (isLegalTeam && approvers?.legal) {
      // Make sure approvers.legal is an array
      const legalApprovers = Array.isArray(approvers.legal) ? approvers.legal : [approvers.legal];

      console.log(`Checking legal approvers for contract ${contract.id} (${contract.title}):`, legalApprovers);

      const userLegalApprover = legalApprovers.find(
        approver => approver.email.toLowerCase() === lowercaseEmail &&
                   (approver.approved || approver.declined)
      );

      if (userLegalApprover) {
        console.log(`Responded contract ${contract.id} (${contract.title}) - Legal Approver: ${userLegalApprover.email}, Approved: ${userLegalApprover.approved}, Declined: ${userLegalApprover.declined}, Status: ${contract.status}`);
        return true;
      }
    }

    // For management team members
    if (isManagementTeam && approvers?.management) {
      // Make sure approvers.management is an array
      const managementApprovers = Array.isArray(approvers.management) ? approvers.management : [approvers.management];

      console.log(`Checking management approvers for contract ${contract.id} (${contract.title}):`, managementApprovers);

      const userManagementApprover = managementApprovers.find(
        approver => approver.email.toLowerCase() === lowercaseEmail &&
                   (approver.approved || approver.declined)
      );

      if (userManagementApprover) {
        console.log(`Responded contract ${contract.id} (${contract.title}) - Management Approver: ${userManagementApprover.email}, Approved: ${userManagementApprover.approved}, Declined: ${userManagementApprover.declined}, Status: ${contract.status}`);
        return true;
      }
    }

    // For regular approvers
    if (isApprover && approvers?.approver) {
      const approversList = Array.isArray(approvers.approver) ? approvers.approver : [approvers.approver];

      // Log all approvers for debugging
      console.log(`Checking approvers for contract ${contract.id} (${contract.title}) - Status: ${contract.status} - Approvers:`,
        approversList.map(a => ({
          email: a.email,
          approved: a.approved,
          declined: a.declined
        }))
      );

      const userApprover = approversList.find(
        approver => approver.email.toLowerCase() === lowercaseEmail &&
                   (approver.approved || approver.declined)
      );

      // Log for debugging
      if (userApprover) {
        console.log(`Responded contract ${contract.id} (${contract.title}) - Approver: ${userApprover.email}, Approved: ${userApprover.approved}, Declined: ${userApprover.declined}, Status: ${contract.status}`);
        return true;
      } else {
        console.log(`Contract ${contract.id} (${contract.title}) - User ${lowercaseEmail} not found as responded approver`);
      }
    }

    return false;
  });

  console.log(`Responded contracts count: ${respondedContracts.length}`);
  console.log(`Responded contracts:`, respondedContracts.map(c => ({ id: c.id, title: c.title, status: c.status })));

  return respondedContracts;
};
