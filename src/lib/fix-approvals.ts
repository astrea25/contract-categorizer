import { getContracts, updateContract } from './data';

/**
 * Fixes inconsistent approval states in the database
 * This function finds contracts where approved and sent back (declined) are both true
 * and sets sent back (declined) to false
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
    const legalSentBack = contract.approvers?.legal?.declined === true; // declined means sent back
    const legalInconsistent = legalApproved && legalSentBack;

    // Check for management team inconsistencies
    const managementApproved = contract.approvers?.management?.approved === true;
    const managementSentBack = contract.approvers?.management?.declined === true; // declined means sent back
    const managementInconsistent = managementApproved && managementSentBack;

    // Also check for undefined sent back (declined) with approved=true
    const legalNeedsDeclinedSet = legalApproved && contract.approvers?.legal?.declined === undefined;
    const managementNeedsDeclinedSet = managementApproved && contract.approvers?.management?.declined === undefined;

    // Check for string values instead of booleans
    const legalApprovedIsString = typeof contract.approvers?.legal?.approved === 'string';
    const legalSentBackIsString = typeof contract.approvers?.legal?.declined === 'string'; // declined means sent back
    const managementApprovedIsString = typeof contract.approvers?.management?.approved === 'string';
    const managementSentBackIsString = typeof contract.approvers?.management?.declined === 'string'; // declined means sent back

    return legalInconsistent || managementInconsistent ||
           legalNeedsDeclinedSet || managementNeedsDeclinedSet ||
           legalApprovedIsString || legalSentBackIsString ||
           managementApprovedIsString || managementSentBackIsString;
  });

  // Fix each contract
  for (const contract of contractsToFix) {
    const updatedApprovers = { ...contract.approvers };

    // Fix legal approver if needed
    if (updatedApprovers.legal) {
      // Fix inconsistent approved/sent back state
      if (updatedApprovers.legal.approved === true &&
          (updatedApprovers.legal.declined === true || updatedApprovers.legal.declined === undefined)) {
        updatedApprovers.legal = {
          ...updatedApprovers.legal,
          declined: false, // declined means sent back
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
      // Fix inconsistent approved/sent back state
      if (updatedApprovers.management.approved === true &&
          (updatedApprovers.management.declined === true || updatedApprovers.management.declined === undefined)) {
        updatedApprovers.management = {
          ...updatedApprovers.management,
          declined: false, // declined means sent back
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
