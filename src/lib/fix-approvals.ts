import { getContracts, updateContract } from './data';

/**
 * Fixes inconsistent approval states in the database
 * This function finds contracts where approved and declined are both true
 * and sets declined to false
 *
 * @returns A promise that resolves when all inconsistent states are fixed
 */
export const fixInconsistentApprovalStates = async (): Promise<void> => {
  // Get all contracts
  const allContracts = await getContracts(true);

  // Find contracts with inconsistent approval states
  const contractsToFix = allContracts.filter(contract => {
    // Check for legal team inconsistencies
    const legalApproved = contract.approvers?.legal?.approved === true;
    const legalDeclined = contract.approvers?.legal?.declined === true;
    const legalInconsistent = legalApproved && legalDeclined;

    // Check for management team inconsistencies
    const managementApproved = contract.approvers?.management?.approved === true;
    const managementDeclined = contract.approvers?.management?.declined === true;
    const managementInconsistent = managementApproved && managementDeclined;

    // Also check for undefined declined with approved=true
    const legalNeedsDeclinedSet = legalApproved && contract.approvers?.legal?.declined === undefined;
    const managementNeedsDeclinedSet = managementApproved && contract.approvers?.management?.declined === undefined;

    // Check for string values instead of booleans
    const legalApprovedIsString = typeof contract.approvers?.legal?.approved === 'string';
    const legalDeclinedIsString = typeof contract.approvers?.legal?.declined === 'string';
    const managementApprovedIsString = typeof contract.approvers?.management?.approved === 'string';
    const managementDeclinedIsString = typeof contract.approvers?.management?.declined === 'string';

    return legalInconsistent || managementInconsistent ||
           legalNeedsDeclinedSet || managementNeedsDeclinedSet ||
           legalApprovedIsString || legalDeclinedIsString ||
           managementApprovedIsString || managementDeclinedIsString;
  });

  // Fix each contract
  for (const contract of contractsToFix) {
    const updatedApprovers = { ...contract.approvers };

    // Fix legal approver if needed
    if (updatedApprovers.legal) {
      // Fix inconsistent approved/declined state
      if (updatedApprovers.legal.approved === true &&
          (updatedApprovers.legal.declined === true || updatedApprovers.legal.declined === undefined)) {
        updatedApprovers.legal = {
          ...updatedApprovers.legal,
          declined: false,
          declinedAt: null
        };
      }

      // Fix string values
      if (typeof updatedApprovers.legal.approved === 'string') {
        updatedApprovers.legal = {
          ...updatedApprovers.legal,
          approved: updatedApprovers.legal.approved === 'true',
        };
      }

      if (typeof updatedApprovers.legal.declined === 'string') {
        updatedApprovers.legal = {
          ...updatedApprovers.legal,
          declined: updatedApprovers.legal.declined === 'true',
        };
      }
    }

    // Fix management approver if needed
    if (updatedApprovers.management) {
      // Fix inconsistent approved/declined state
      if (updatedApprovers.management.approved === true &&
          (updatedApprovers.management.declined === true || updatedApprovers.management.declined === undefined)) {
        updatedApprovers.management = {
          ...updatedApprovers.management,
          declined: false,
          declinedAt: null
        };
      }

      // Fix string values
      if (typeof updatedApprovers.management.approved === 'string') {
        updatedApprovers.management = {
          ...updatedApprovers.management,
          approved: updatedApprovers.management.approved === 'true',
        };
      }

      if (typeof updatedApprovers.management.declined === 'string') {
        updatedApprovers.management = {
          ...updatedApprovers.management,
          declined: updatedApprovers.management.declined === 'true',
        };
      }
    }

    // Update the contract
    await updateContract(contract.id, { approvers: updatedApprovers }, 'system');
  }
};
