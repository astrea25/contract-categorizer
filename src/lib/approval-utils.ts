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