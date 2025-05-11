// Type definition for approver
// Define a type for normalized approvers
/**
 * Gets contracts assigned to a specific user for approval
 *
 * @param userEmail The email of the user
 * @param isLegalTeam Whether the user is a legal team member
 * @param isManagementTeam Whether the user is a management team member
 * @param isApprover Whether the user is an approver
 * @returns An array of contracts assigned to the user for approval
 */
// Get all non-archived contracts
// Filter contracts based on user role and approval assignment
// Skip contracts that are already finished or in a state that doesn't require approval
// First normalize the approvers structure to ensure we always work with arrays
// Check if the contract is in a state where it needs approval from the user's role
// If contract is not in legal_review or approval status, and not sent back by legal, skip it
// If contract is not in management_review or approval status, and not sent back by management, skip it
// For legal team members
// Check if the contract is in a state where it needs legal team approval
// Check if approvers object exists
// If the contract is in legal_review status and there are no approvers assigned yet,
// show it to all legal team members
// Check if legal approvers field exists
// If the contract is in legal_review status and there are no legal approvers assigned yet,
// show it to all legal team members
// Make sure approvers.legal is an array
// Find if the user is a legal approver for this contract
// If declined (sent back) is undefined, treat it as false
// Return true if the user should see this contract
// If the contract is in legal_review status and there are no specific legal approvers assigned,
// show it to all legal team members
// For management team members
// Check if the contract is in a state where it needs management team approval
// Check if approvers object exists
// If the contract is in management_review status and there are no approvers assigned yet,
// show it to all management team members
// Check if management approvers field exists
// If the contract is in management_review status and there are no management approvers assigned yet,
// show it to all management team members
// Make sure approvers.management is an array
// Find if the user is a management approver for this contract
// If declined (sent back) is undefined, treat it as false
// Return true if the user should see this contract
// If the contract is in management_review status and there are no specific management approvers assigned,
// show it to all management team members
// For regular approvers
// Check if the contract is in a state where it needs approval from an approver
// Approvers should see contracts in approval status or that have been sent back
// Check if approvers object exists
// If the contract is in a state that needs approval and there are no approvers assigned yet,
// show it to all approvers so they can be assigned
// Check if approver field exists
// If the contract is in a state that needs approval and there are no approvers assigned yet,
// show it to all approvers so they can be assigned
// For approvers, we need to check if they are assigned to this contract
// and if they haven't already approved or declined it
// If declined (sent back) is undefined, treat it as false
// Log for debugging
// Return true if the user should see this contract
// If the contract is in a state that needs approval and there are no specific approvers assigned,
// show it to all approvers
/**
 * Gets contracts that have been approved by the user
 *
 * @param userEmail The email of the user
 * @param isLegalTeam Whether the user is a legal team member
 * @param isManagementTeam Whether the user is a management team member
 * @param isApprover Whether the user is an approver
 * @returns An array of contracts approved by the user
 */
// Get all non-archived contracts
// Filter contracts based on user role and approval status
// First normalize the approvers structure
// For legal team members
// For management team members
// For regular approvers
// Log all approvers for debugging
// Log for debugging
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
// Skip contracts that are already finished or in a state that doesn't require approval
// First normalize the approvers structure
// Check if the contract is in a state where it needs approval from the user's role
// If contract is not in legal_review or approval status, and not sent back by legal, skip it
// If contract is not in management_review or approval status, and not sent back by management, skip it
// For legal team members
// Check if the contract is in a state where it needs legal team approval
// Check if approvers object exists
// If the contract is in legal_review status and there are no approvers assigned yet,
// show it to all legal team members
// Check if legal approvers field exists
// If the contract is in legal_review status and there are no legal approvers assigned yet,
// show it to all legal team members
// Make sure approvers.legal is an array
// Check if the user has not approved and not sent back
// If the contract is in legal_review status and there are no specific legal approvers assigned,
// show it to all legal team members
// For management team members
// Check if the contract is in a state where it needs management team approval
// Check if approvers object exists
// If the contract is in management_review status and there are no approvers assigned yet,
// show it to all management team members
// Check if management approvers field exists
// If the contract is in management_review status and there are no management approvers assigned yet,
// show it to all management team members
// Make sure approvers.management is an array
// Check if the user has not approved and not sent back
// If the contract is in management_review status and there are no specific management approvers assigned,
// show it to all management team members
// For regular approvers
// Check if the contract is in a state where it needs approval from an approver
// Approvers should see contracts in approval status or that have been sent back
// Check if approvers object exists
// If the contract is in a state that needs approval and there are no approvers assigned yet,
// show it to all approvers so they can be assigned
// Check if approver field exists
// If the contract is in a state that needs approval and there are no approvers assigned yet,
// show it to all approvers so they can be assigned
// Make sure approvers.approver is an array
// Check if the user has not approved and not sent back
// If the contract is in a state that needs approval and there are no specific approvers assigned,
// show it to all approvers
/**
 * Updates send back status for a contract
 *
 * @param contract The contract to update
 * @param isLegalTeam Whether the user is a legal team member
 * @param isManagementTeam Whether the user is a management team member
 * @param userEmail The email of the user
 * @returns The updated approvers object
 */
// Update legal approval status
// Update management approval status
/**
 * Gets contracts that the user has already responded to (approved or declined)
 *
 * @param userEmail The email of the user
 * @param isLegalTeam Whether the user is a legal team member
 * @param isManagementTeam Whether the user is a management team member
 * @param isApprover Whether the user is an approver
 * @returns An array of contracts that the user has already responded to
 */
// Get all non-archived contracts
// Filter contracts based on user role and response status
// First normalize the approvers structure
// For legal team members
// Make sure approvers.legal is an array
// For management team members
// Make sure approvers.management is an array
// For regular approvers
// Log all approvers for debugging
// Log for debugging
import { Contract, getContracts, normalizeApprovers } from "./data";

interface Approver {
    email: string;
    name: string;
    approved: boolean;
    declined?: boolean;
    approvedAt?: string | null;
    declinedAt?: string | null;
}

interface NormalizedApprovers {
    legal: Approver[];
    management: Approver[];
    approver: Approver[];
}

export const getContractsForApproval = async (
    userEmail: string,
    isLegalTeam: boolean,
    isManagementTeam: boolean,
    isApprover: boolean = false
): Promise<Contract[]> => {
    if (!userEmail)
        return [];

    const allContracts = await getContracts(false);
    const lowercaseEmail = userEmail.toLowerCase();

    const filteredContracts = allContracts.filter(contract => {
        const skipStatuses = [
            "finished",
            "contract_end",
            "implementation",
            "wwf_signing",
            "counterparty_signing"
        ];

        if (skipStatuses.includes(contract.status)) {
            return false;
        }

        const normalizedContract = normalizeApprovers(contract);
        const approvers = normalizedContract.approvers as NormalizedApprovers;

        if (isLegalTeam) {
            if (contract.status !== "legal_review" && contract.status !== "approval" && contract.status !== "legal_send_back" && contract.status !== "legal_declined") {
                return false;
            }
        }

        if (isManagementTeam) {
            if (contract.status !== "management_review" && contract.status !== "approval" && contract.status !== "management_send_back" && contract.status !== "management_declined") {
                return false;
            }
        }

        if (isLegalTeam) {
            if (contract.status !== "legal_review" && contract.status !== "approval" && contract.status !== "legal_send_back" && contract.status !== "legal_declined") {
                return false;
            }

            if (!approvers) {
                if (contract.status === "legal_review") {
                    return true;
                }

                return false;
            }

            if (!approvers.legal || (Array.isArray(approvers.legal) && approvers.legal.length === 0)) {
                if (contract.status === "legal_review") {
                    return true;
                }

                return false;
            }

            const legalApprovers = Array.isArray(approvers.legal) ? approvers.legal : [approvers.legal];
            const userLegalApprover = legalApprovers.find(approver => approver.email.toLowerCase() === lowercaseEmail);

            if (userLegalApprover) {
                const isSentBack = userLegalApprover.declined === true;
                const isApproved = userLegalApprover.approved === true;
                const shouldShow = !isApproved && !isSentBack;
                return shouldShow;
            } else {
                if (contract.status === "legal_review" && legalApprovers.length === 0) {
                    return true;
                }
            }
        }

        if (isManagementTeam) {
            if (contract.status !== "management_review" && contract.status !== "approval" && contract.status !== "management_send_back" && contract.status !== "management_declined") {
                return false;
            }

            if (!approvers) {
                if (contract.status === "management_review") {
                    return true;
                }

                return false;
            }

            if (!approvers.management || (Array.isArray(approvers.management) && approvers.management.length === 0)) {
                if (contract.status === "management_review") {
                    return true;
                }

                return false;
            }

            const managementApprovers = Array.isArray(approvers.management) ? approvers.management : [approvers.management];
            const userManagementApprover = managementApprovers.find(approver => approver.email.toLowerCase() === lowercaseEmail);

            if (userManagementApprover) {
                const isSentBack = userManagementApprover.declined === true;
                const isApproved = userManagementApprover.approved === true;
                const shouldShow = !isApproved && !isSentBack;
                return shouldShow;
            } else {
                if (contract.status === "management_review" && managementApprovers.length === 0) {
                    return true;
                }
            }
        }

        if (isApprover) {
            if (contract.status !== "approval" && contract.status !== "draft" && contract.status !== "requested" && !contract.status.includes("send_back") && !contract.status.includes("declined")) {
                return false;
            }

            if (!approvers) {
                if (contract.status === "approval" || contract.status === "draft" || contract.status === "requested") {
                    return true;
                }

                return false;
            }

            if (!approvers.approver || (Array.isArray(approvers.approver) && approvers.approver.length === 0)) {
                if (contract.status === "approval" || contract.status === "draft" || contract.status === "requested") {
                    return true;
                }

                return false;
            }

            const approversList = Array.isArray(approvers.approver) ? approvers.approver : [approvers.approver];
            const userApprover = approversList.find(approver => approver.email.toLowerCase() === lowercaseEmail);

            if (userApprover) {
                const isSentBack = userApprover.declined === true;
                const isApproved = userApprover.approved === true;
                const shouldShow = !isApproved && !isSentBack;
                return shouldShow;
            } else {
                if ((contract.status === "approval" || contract.status === "draft" || contract.status === "requested") && approversList.length === 0) {
                    return true;
                }
            }
        }

        return false;
    });

    return filteredContracts;
};

export const getApprovedContracts = async (
    userEmail: string,
    isLegalTeam: boolean,
    isManagementTeam: boolean,
    isApprover: boolean = false
): Promise<Contract[]> => {
    if (!userEmail)
        return [];

    const allContracts = await getContracts(false);
    const lowercaseEmail = userEmail.toLowerCase();

    return allContracts.filter(contract => {
        const normalizedContract = normalizeApprovers(contract);
        const approvers = normalizedContract.approvers as NormalizedApprovers;

        if (isLegalTeam && approvers?.legal) {
            const userLegalApprover = approvers.legal.find(
                approver => approver.email.toLowerCase() === lowercaseEmail && approver.approved
            );

            if (userLegalApprover)
                return true;
        }

        if (isManagementTeam && approvers?.management) {
            const userManagementApprover = approvers.management.find(
                approver => approver.email.toLowerCase() === lowercaseEmail && approver.approved
            );

            if (userManagementApprover)
                return true;
        }

        if (isApprover && approvers?.approver) {
            const approversList = Array.isArray(approvers.approver) ? approvers.approver : [approvers.approver];

            const userApprover = approversList.find(
                approver => approver.email.toLowerCase() === lowercaseEmail && approver.approved
            );

            if (userApprover) {
                return true;
            } else
                {}
        }

        return false;
    });
};

export const needsApprovalFrom = (
    contract: Contract,
    userEmail: string,
    isLegalTeam: boolean,
    isManagementTeam: boolean,
    isApprover: boolean = false
): boolean => {
    if (!userEmail)
        return false;

    const skipStatuses = [
        "finished",
        "contract_end",
        "implementation",
        "wwf_signing",
        "counterparty_signing"
    ];

    if (skipStatuses.includes(contract.status)) {
        return false;
    }

    const lowercaseEmail = userEmail.toLowerCase();
    const normalizedContract = normalizeApprovers(contract);
    const approvers = normalizedContract.approvers as NormalizedApprovers;

    if (isLegalTeam) {
        if (contract.status !== "legal_review" && contract.status !== "approval" && contract.status !== "legal_send_back" && contract.status !== "legal_declined") {
            return false;
        }
    }

    if (isManagementTeam) {
        if (contract.status !== "management_review" && contract.status !== "approval" && contract.status !== "management_send_back" && contract.status !== "management_declined") {
            return false;
        }
    }

    if (isLegalTeam) {
        if (contract.status !== "legal_review" && contract.status !== "approval" && contract.status !== "legal_send_back" && contract.status !== "legal_declined") {
            return false;
        }

        if (!approvers) {
            if (contract.status === "legal_review") {
                return true;
            }

            return false;
        }

        if (!approvers.legal || (Array.isArray(approvers.legal) && approvers.legal.length === 0)) {
            if (contract.status === "legal_review") {
                return true;
            }

            return false;
        }

        const legalApprovers = Array.isArray(approvers.legal) ? approvers.legal : [approvers.legal];
        const userLegalApprover = legalApprovers.find(approver => approver.email.toLowerCase() === lowercaseEmail);

        if (userLegalApprover) {
            const isSentBack = userLegalApprover.declined === true;
            const isApproved = userLegalApprover.approved === true;
            const shouldShow = !isApproved && !isSentBack;
            return shouldShow;
        } else {
            if (contract.status === "legal_review" && legalApprovers.length === 0) {
                return true;
            }

            return false;
        }
    }

    if (isManagementTeam) {
        if (contract.status !== "management_review" && contract.status !== "approval" && contract.status !== "management_send_back" && contract.status !== "management_declined") {
            return false;
        }

        if (!approvers) {
            if (contract.status === "management_review") {
                return true;
            }

            return false;
        }

        if (!approvers.management || (Array.isArray(approvers.management) && approvers.management.length === 0)) {
            if (contract.status === "management_review") {
                return true;
            }

            return false;
        }

        const managementApprovers = Array.isArray(approvers.management) ? approvers.management : [approvers.management];
        const userManagementApprover = managementApprovers.find(approver => approver.email.toLowerCase() === lowercaseEmail);

        if (userManagementApprover) {
            const isSentBack = userManagementApprover.declined === true;
            const isApproved = userManagementApprover.approved === true;
            const shouldShow = !isApproved && !isSentBack;
            return shouldShow;
        } else {
            if (contract.status === "management_review" && managementApprovers.length === 0) {
                return true;
            }

            return false;
        }
    }

    if (isApprover) {
        if (contract.status !== "approval" && contract.status !== "draft" && contract.status !== "requested" && !contract.status.includes("send_back") && !contract.status.includes("declined")) {
            return false;
        }

        if (!approvers) {
            if (contract.status === "approval" || contract.status === "draft" || contract.status === "requested") {
                return true;
            }

            return false;
        }

        if (!approvers.approver || (Array.isArray(approvers.approver) && approvers.approver.length === 0)) {
            if (contract.status === "approval" || contract.status === "draft" || contract.status === "requested") {
                return true;
            }

            return false;
        }

        const approversList = Array.isArray(approvers.approver) ? approvers.approver : [approvers.approver];
        const userApprover = approversList.find(approver => approver.email.toLowerCase() === lowercaseEmail);

        if (userApprover) {
            const isSentBack = userApprover.declined === true;
            const isApproved = userApprover.approved === true;
            const shouldShow = !isApproved && !isSentBack;
            return shouldShow;
        } else {
            if ((contract.status === "approval" || contract.status === "draft" || contract.status === "requested") && approversList.length === 0) {
                return true;
            }

            return false;
        }
    }

    return false;
};

export const sendBackContract = (
    contract: Contract,
    isLegalTeam: boolean,
    isManagementTeam: boolean,
    userEmail: string
): Contract["approvers"] => {
    if (!userEmail || !contract.approvers)
        return contract.approvers;

    const lowercaseEmail = userEmail.toLowerCase();
    const normalizedContract = normalizeApprovers(contract);
    const approvers = normalizedContract.approvers as NormalizedApprovers;

    const result = {
        ...approvers
    };

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

export const getRespondedContracts = async (
    userEmail: string,
    isLegalTeam: boolean,
    isManagementTeam: boolean,
    isApprover: boolean = false
): Promise<Contract[]> => {
    if (!userEmail)
        return [];

    const allContracts = await getContracts(false);
    const lowercaseEmail = userEmail.toLowerCase();

    const respondedContracts = allContracts.filter(contract => {
        const normalizedContract = normalizeApprovers(contract);
        const approvers = normalizedContract.approvers as NormalizedApprovers;

        if (isLegalTeam && approvers?.legal) {
            const legalApprovers = Array.isArray(approvers.legal) ? approvers.legal : [approvers.legal];

            const userLegalApprover = legalApprovers.find(
                approver => approver.email.toLowerCase() === lowercaseEmail && (approver.approved || approver.declined)
            );

            if (userLegalApprover) {
                return true;
            }
        }

        if (isManagementTeam && approvers?.management) {
            const managementApprovers = Array.isArray(approvers.management) ? approvers.management : [approvers.management];

            const userManagementApprover = managementApprovers.find(
                approver => approver.email.toLowerCase() === lowercaseEmail && (approver.approved || approver.declined)
            );

            if (userManagementApprover) {
                return true;
            }
        }

        if (isApprover && approvers?.approver) {
            const approversList = Array.isArray(approvers.approver) ? approvers.approver : [approvers.approver];

            const userApprover = approversList.find(
                approver => approver.email.toLowerCase() === lowercaseEmail && (approver.approved || approver.declined)
            );

            if (userApprover) {
                return true;
            } else
                {}
        }

        return false;
    });

    return respondedContracts;
};