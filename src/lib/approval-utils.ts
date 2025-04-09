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
  
  // Filter contracts based on user role and approval assignment
  return allContracts.filter(contract => {
    // For legal team members
    if (isLegalTeam && 
        contract.approvers?.legal?.email.toLowerCase() === lowercaseEmail && 
        !contract.approvers.legal.approved) {
      return true;
    }
    
    // For management team members
    if (isManagementTeam && 
        contract.approvers?.management?.email.toLowerCase() === lowercaseEmail && 
        !contract.approvers.management.approved) {
      return true;
    }
    
    return false;
  });
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
