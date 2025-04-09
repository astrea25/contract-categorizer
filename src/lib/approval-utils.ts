import { Contract, getContracts } from './data';

/**
 * Gets contracts assigned to a specific user for approval
 *
 * @param userEmail The email of the user
 * @param isLegalTeam Whether the user is a legal team member
 * @param isManagementTeam Whether the user is a management team member
 * @returns An array of contracts assigned to the user for approval
 */
export const getContractsForApproval = async (
  userEmail: string,
  isLegalTeam: boolean,
  isManagementTeam: boolean
): Promise<Contract[]> => {
  if (!userEmail) return [];

  // Get all non-archived contracts
  const allContracts = await getContracts(false);
  const lowercaseEmail = userEmail.toLowerCase();

  // Log all contracts for debugging
  console.log('All contracts in getContractsForApproval:', allContracts.map(c => ({
    id: c.id,
    title: c.title,
    status: c.status,
    legal: c.approvers?.legal ? {
      email: c.approvers.legal.email,
      approved: c.approvers.legal.approved,
      declined: c.approvers.legal.declined
    } : null,
    management: c.approvers?.management ? {
      email: c.approvers.management.email,
      approved: c.approvers.management.approved,
      declined: c.approvers.management.declined
    } : null,
    userEmail: lowercaseEmail,
    isLegalTeam,
    isManagementTeam
  })));

  // Filter contracts based on user role and approval assignment
  const filteredContracts = allContracts.filter(contract => {
    console.log(`Checking contract ${contract.id} - ${contract.title}:`, {
      status: contract.status,
      isLegalTeam,
      isManagementTeam,
      hasLegalApprover: !!contract.approvers?.legal,
      hasManagementApprover: !!contract.approvers?.management,
      legalEmail: contract.approvers?.legal?.email,
      managementEmail: contract.approvers?.management?.email,
      userEmail: lowercaseEmail
    });

    // For legal team members
    if (isLegalTeam &&
        contract.approvers?.legal?.email?.toLowerCase() === lowercaseEmail) {

      // If declined is undefined, treat it as false
      const isDeclined = contract.approvers.legal.declined === true;
      const isApproved = contract.approvers.legal.approved === true;
      const shouldShow = !isApproved && !isDeclined;

      console.log(`Legal contract ${contract.id} - ${contract.title}:`, {
        approved: contract.approvers.legal.approved,
        isApproved,
        declined: contract.approvers.legal.declined,
        isDeclined,
        shouldShow,
        approvedType: typeof contract.approvers.legal.approved,
        declinedType: typeof contract.approvers.legal.declined
      });

      return shouldShow;
    }

    // For management team members
    if (isManagementTeam &&
        contract.approvers?.management?.email?.toLowerCase() === lowercaseEmail) {

      // If declined is undefined, treat it as false
      const isDeclined = contract.approvers.management.declined === true;
      const isApproved = contract.approvers.management.approved === true;
      const shouldShow = !isApproved && !isDeclined;

      console.log(`Management contract ${contract.id} - ${contract.title}:`, {
        approved: contract.approvers.management.approved,
        isApproved,
        declined: contract.approvers.management.declined,
        isDeclined,
        shouldShow,
        approvedType: typeof contract.approvers.management.approved,
        declinedType: typeof contract.approvers.management.declined
      });

      return shouldShow;
    }

    return false;
  });

  console.log('Filtered contracts:', filteredContracts.map(c => c.title));

  // Log the filtered contracts for debugging
  console.log('Filtered contracts after applying approval status filters:', filteredContracts.map(c => ({
    id: c.id,
    title: c.title,
    status: c.status,
    legal: c.approvers?.legal ? {
      email: c.approvers.legal.email,
      approved: c.approvers.legal.approved,
      declined: c.approvers.legal.declined
    } : null,
    management: c.approvers?.management ? {
      email: c.approvers.management.email,
      approved: c.approvers.management.approved,
      declined: c.approvers.management.declined
    } : null
  })));

  return filteredContracts;
};

/**
 * Gets contracts that have been approved by the user
 *
 * @param userEmail The email of the user
 * @param isLegalTeam Whether the user is a legal team member
 * @param isManagementTeam Whether the user is a management team member
 * @returns An array of contracts approved by the user
 */
export const getApprovedContracts = async (
  userEmail: string,
  isLegalTeam: boolean,
  isManagementTeam: boolean
): Promise<Contract[]> => {
  if (!userEmail) return [];

  // Get all non-archived contracts
  const allContracts = await getContracts(false);
  const lowercaseEmail = userEmail.toLowerCase();

  // Filter contracts based on user role and approval status
  return allContracts.filter(contract => {
    // For legal team members
    if (isLegalTeam &&
        contract.approvers?.legal?.email.toLowerCase() === lowercaseEmail &&
        contract.approvers.legal.approved) {
      return true;
    }

    // For management team members
    if (isManagementTeam &&
        contract.approvers?.management?.email.toLowerCase() === lowercaseEmail &&
        contract.approvers.management.approved) {
      return true;
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
 * @returns True if the contract needs approval from the user, false otherwise
 */
export const needsApprovalFrom = (
  contract: Contract,
  userEmail: string,
  isLegalTeam: boolean,
  isManagementTeam: boolean
): boolean => {
  if (!userEmail) return false;

  const lowercaseEmail = userEmail.toLowerCase();

  // Check if the user is assigned as a legal approver and hasn't approved yet
  if (isLegalTeam &&
      contract.approvers?.legal?.email.toLowerCase() === lowercaseEmail &&
      !contract.approvers.legal.approved) {
    return true;
  }

  // Check if the user is assigned as a management approver and hasn't approved yet
  if (isManagementTeam &&
      contract.approvers?.management?.email.toLowerCase() === lowercaseEmail &&
      !contract.approvers.management.approved) {
    return true;
  }

  return false;
};

/**
 * Adds a "Disapprove" button to the ApprovalBoard component
 *
 * @param contract The contract to update
 * @param approvers The current approvers object
 * @param isLegalTeam Whether the user is a legal team member
 * @param isManagementTeam Whether the user is a management team member
 * @param userEmail The email of the user
 * @returns The updated approvers object
 */
export const disapproveContract = (
  contract: Contract,
  isLegalTeam: boolean,
  isManagementTeam: boolean,
  userEmail: string
): Contract['approvers'] => {
  if (!userEmail || !contract.approvers) return contract.approvers;

  const lowercaseEmail = userEmail.toLowerCase();
  const approvers = { ...contract.approvers };

  // Update legal approval status
  if (isLegalTeam &&
      approvers.legal?.email.toLowerCase() === lowercaseEmail &&
      approvers.legal.approved) {
    approvers.legal = {
      ...approvers.legal,
      approved: false,
      approvedAt: undefined
    };
  }

  // Update management approval status
  if (isManagementTeam &&
      approvers.management?.email.toLowerCase() === lowercaseEmail &&
      approvers.management.approved) {
    approvers.management = {
      ...approvers.management,
      approved: false,
      approvedAt: undefined
    };
  }

  return approvers;
};

/**
 * Gets contracts that the user has already responded to (approved or declined)
 *
 * @param userEmail The email of the user
 * @param isLegalTeam Whether the user is a legal team member
 * @param isManagementTeam Whether the user is a management team member
 * @returns An array of contracts that the user has already responded to
 */
export const getRespondedContracts = async (
  userEmail: string,
  isLegalTeam: boolean,
  isManagementTeam: boolean
): Promise<Contract[]> => {
  if (!userEmail) return [];

  // Get all non-archived contracts
  const allContracts = await getContracts(false);
  const lowercaseEmail = userEmail.toLowerCase();

  // Filter contracts based on user role and response status
  return allContracts.filter(contract => {
    // For legal team members
    if (isLegalTeam &&
        contract.approvers?.legal?.email.toLowerCase() === lowercaseEmail &&
        (contract.approvers.legal.approved || contract.approvers.legal.declined)) {
      return true;
    }

    // For management team members
    if (isManagementTeam &&
        contract.approvers?.management?.email.toLowerCase() === lowercaseEmail &&
        (contract.approvers.management.approved || contract.approvers.management.declined)) {
      return true;
    }

    return false;
  });
};
