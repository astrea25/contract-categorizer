import { getContracts, updateContract } from "./data";

export const fixInconsistentApprovalStates = async (): Promise<void> => {
    const allContracts = await getContracts(true);

    const contractsToFix = allContracts.filter(contract => {
        const legalApproved = contract.approvers?.legal?.approved === true;
        const legalSentBack = contract.approvers?.legal?.declined === true;
        const legalInconsistent = legalApproved && legalSentBack;
        const managementApproved = contract.approvers?.management?.approved === true;
        const managementSentBack = contract.approvers?.management?.declined === true;
        const managementInconsistent = managementApproved && managementSentBack;
        const legalNeedsDeclinedSet = legalApproved && contract.approvers?.legal?.declined === undefined;
        const managementNeedsDeclinedSet = managementApproved && contract.approvers?.management?.declined === undefined;
        const legalApprovedIsString = typeof contract.approvers?.legal?.approved === "string";
        const legalSentBackIsString = typeof contract.approvers?.legal?.declined === "string";
        const managementApprovedIsString = typeof contract.approvers?.management?.approved === "string";
        const managementSentBackIsString = typeof contract.approvers?.management?.declined === "string";
        return legalInconsistent || managementInconsistent || legalNeedsDeclinedSet || managementNeedsDeclinedSet || legalApprovedIsString || legalSentBackIsString || managementApprovedIsString || managementSentBackIsString;
    });

    for (const contract of contractsToFix) {
        const updatedApprovers = {
            ...contract.approvers
        };

        if (updatedApprovers.legal) {
            if (updatedApprovers.legal.approved === true && (updatedApprovers.legal.declined === true || updatedApprovers.legal.declined === undefined)) {
                updatedApprovers.legal = {
                    ...updatedApprovers.legal,
                    declined: false,
                    declinedAt: null
                };
            }

            if (typeof updatedApprovers.legal.approved === "string") {
                updatedApprovers.legal = {
                    ...updatedApprovers.legal,
                    approved: updatedApprovers.legal.approved === "true"
                };
            }

            if (typeof updatedApprovers.legal.declined === "string") {
                updatedApprovers.legal = {
                    ...updatedApprovers.legal,
                    declined: updatedApprovers.legal.declined === "true"
                };
            }
        }

        if (updatedApprovers.management) {
            if (updatedApprovers.management.approved === true && (updatedApprovers.management.declined === true || updatedApprovers.management.declined === undefined)) {
                updatedApprovers.management = {
                    ...updatedApprovers.management,
                    declined: false,
                    declinedAt: null
                };
            }

            if (typeof updatedApprovers.management.approved === "string") {
                updatedApprovers.management = {
                    ...updatedApprovers.management,
                    approved: updatedApprovers.management.approved === "true"
                };
            }

            if (typeof updatedApprovers.management.declined === "string") {
                updatedApprovers.management = {
                    ...updatedApprovers.management,
                    declined: updatedApprovers.management.declined === "true"
                };
            }
        }

        await updateContract(contract.id, {
            approvers: updatedApprovers
        }, "system");
    }
};