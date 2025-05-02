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

  // Get all non-archived contracts
  const allContracts = await getContracts(false);
  const lowercaseEmail = userEmail.toLowerCase();

  // Filter contracts based on user role and approval assignment
  const filteredContracts = allContracts.filter(contract => {
    // Skip contracts that are already finished or in a state that doesn't require approval
    const skipStatuses = ['finished', 'contract_end', 'implementation', 'wwf_signing', 'counterparty_signing'];
    if (skipStatuses.includes(contract.status)) {
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
    if (isLegalTeam && approvers?.legal) {
      // Find if the user is a legal approver for this contract
      const userLegalApprover = approvers.legal.find(
        approver => approver.email.toLowerCase() === lowercaseEmail
      );

      if (userLegalApprover) {
        // If declined (sent back) is undefined, treat it as false
        const isSentBack = userLegalApprover.declined === true;
        const isApproved = userLegalApprover.approved === true;
        const shouldShow = !isApproved && !isSentBack;

        if (shouldShow) return true;
      }
    }

    // For management team members
    if (isManagementTeam && approvers?.management) {
      // Find if the user is a management approver for this contract
      const userManagementApprover = approvers.management.find(
        approver => approver.email.toLowerCase() === lowercaseEmail
      );

      if (userManagementApprover) {
        // If declined (sent back) is undefined, treat it as false
        const isSentBack = userManagementApprover.declined === true;
        const isApproved = userManagementApprover.approved === true;
        const shouldShow = !isApproved && !isSentBack;

        if (shouldShow) return true;
      }
    }

    // For regular approvers
    if (isApprover && approvers?.approver) {
      const userApprover = approvers.approver.find(
        approver => approver.email.toLowerCase() === lowercaseEmail
      );

      if (userApprover) {
        // If declined (sent back) is undefined, treat it as false
        const isSentBack = userApprover.declined === true;
        const isApproved = userApprover.approved === true;
        const shouldShow = !isApproved && !isSentBack;

        if (shouldShow) return true;
      }
    }

    return false;
  });

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
      const userApprover = approvers.approver.find(
        approver => approver.email.toLowerCase() === lowercaseEmail && approver.approved
      );

      if (userApprover) return true;
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
  if (isLegalTeam && approvers?.legal) {
    const userLegalApprover = approvers.legal.find(
      approver => approver.email.toLowerCase() === lowercaseEmail
    );

    if (userLegalApprover) {
      // Check if the user has not approved and not sent back
      const isSentBack = userLegalApprover.declined === true;
      const isApproved = userLegalApprover.approved === true;
      return !isApproved && !isSentBack;
    }
  }

  // For management team members
  if (isManagementTeam && approvers?.management) {
    const userManagementApprover = approvers.management.find(
      approver => approver.email.toLowerCase() === lowercaseEmail
    );

    if (userManagementApprover) {
      // Check if the user has not approved and not sent back
      const isSentBack = userManagementApprover.declined === true;
      const isApproved = userManagementApprover.approved === true;
      return !isApproved && !isSentBack;
    }
  }

  // For regular approvers
  if (isApprover && approvers?.approver) {
    const userApprover = approvers.approver.find(
      approver => approver.email.toLowerCase() === lowercaseEmail
    );

    if (userApprover) {
      // Check if the user has not approved and not sent back
      const isSentBack = userApprover.declined === true;
      const isApproved = userApprover.approved === true;
      return !isApproved && !isSentBack;
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

  // Get all non-archived contracts
  const allContracts = await getContracts(false);
  const lowercaseEmail = userEmail.toLowerCase();

  // Filter contracts based on user role and response status
  return allContracts.filter(contract => {
    // First normalize the approvers structure
    const normalizedContract = normalizeApprovers(contract);
    const approvers = normalizedContract.approvers as NormalizedApprovers;

    // For legal team members
    if (isLegalTeam && approvers?.legal) {
      const userLegalApprover = approvers.legal.find(
        approver => approver.email.toLowerCase() === lowercaseEmail &&
                   (approver.approved || approver.declined)
      );

      if (userLegalApprover) return true;
    }

    // For management team members
    if (isManagementTeam && approvers?.management) {
      const userManagementApprover = approvers.management.find(
        approver => approver.email.toLowerCase() === lowercaseEmail &&
                   (approver.approved || approver.declined)
      );

      if (userManagementApprover) return true;
    }

    // For regular approvers
    if (isApprover && approvers?.approver) {
      const userApprover = approvers.approver.find(
        approver => approver.email.toLowerCase() === lowercaseEmail &&
                   (approver.approved || approver.declined)
      );

      if (userApprover) return true;
    }

    return false;
  });
};
