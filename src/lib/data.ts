import { db } from "./firebase";

import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    setDoc,
    writeBatch,
    serverTimestamp,
    DocumentSnapshot,
    limit,
    arrayUnion,
    arrayRemove,
    FieldPath,
    QueryDocumentSnapshot,
} from "firebase/firestore";

import { getAuth, deleteUser, updateProfile } from "firebase/auth";
import { auth as firebaseAuth } from "./firebase";
import { createUserAccountViaAPI } from "./auth-api";
import { FirebaseError } from "firebase/app";
import { addNotification } from "./notifications";

export interface ContractStats {
    totalContracts: number;
    finishedContracts: number;
    pendingApprovalContracts: number;
    expiringContracts: number;
    totalValue: number;
    expiringThisYear: number;
}

export type ContractStatus = "requested" | "draft" | "legal_review" | "management_review" | "wwf_signing" | "counterparty_signing" | "implementation" | "amendment" | "contract_end" | "approval" | "finished" | "legal_send_back" | "management_send_back" | "legal_declined" | "management_declined";
export type ContractType = "consultancy" | "wos" | "service" | "moa_mou" | "employment" | "amendment" | "grant" | "subgrant" | "lease" | "donation";

export interface Folder {
    id: string;
    name: string;
    description?: string;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    contractCount?: number;
}

export interface ConsultancyFields {
    consultantName?: string;
    positionTitle?: string;
    grossProfessionalFee?: number;
    paymentSchedules?: string;
    costCenter?: string;
    termsOfReferenceLink?: string;
}

export interface WOSFields {
    serviceProviderName?: string;
    positionTitle?: string;
    grossTechnicalServiceFee?: number;
    paymentSchedules?: string;
    costCenter?: string;
    scopeOfWorkLink?: string;
}

export interface ServiceAgreementFields {
    serviceProviderName?: string;
    positionTitle?: string;
    grossTechnicalServiceFee?: number;
    paymentSchedules?: string;
    costCenter?: string;
    scopeOfWorkLink?: string;
}

export interface MOAMOUFields {
    contractingPartyName?: string;
    registeredAddress?: string;
    authorizedRepresentative?: string;
    authorizedRepresentativeDesignation?: string;
    recitals?: string;
    purpose?: string;
    kkpfiRoles?: string;
    contractingPartyRoles?: string;
    mutualObligations?: string;
}

export interface EmploymentFields {
    positionTitle?: string;
    costCenter?: string;
    numberOfStaff?: number;
    salaryRate?: number;
    communicationAllowance?: number;
    requisitionReason?: "new_position" | "additional" | "replacement";
    replacementReason?: string;
    employmentClassification?: "core" | "project";
    projectDurationMonths?: number;
}

export interface AmendmentFields {
    originalContractType?: ContractType;
    durationAmendment?: string;
    deliverablesAmendment?: string;
    paymentAmendment?: string;
    paymentSchedulesAmendment?: string;
}

export interface GrantAgreementFields {
    donorName?: string;
    donorAddress?: string;
    projectLocation?: string;
    primaryDonor?: string;
    primaryDonorFundingSourceAgreementNumber?: string;
    contractAmount?: number;
    bankAccountInformation?: string;
    paymentSchedules?: string;
    donorContacts?: string;
    kkpfiContacts?: string;
    deliverables?: string;
    authorizedSignatoryName?: string;
    authorizedSignatoryDesignation?: string;
}

export interface SubgrantFields {
    recipientOrganizationName?: string;
    recipientOrganizationAddress?: string;
    recipientOrganizationContact?: string;
    projectLocation?: string;
    primaryDonor?: string;
    primaryDonorFundingSourceAgreementNumber?: string;
    contractAmount?: number;
    bankAccountInformation?: string;
    paymentSchedules?: string;
    recipientOrganizationContacts?: string;
    kkpfiContacts?: string;
    deliverables?: string;
    authorizedSignatoryName?: string;
    authorizedSignatoryDesignation?: string;
}

export interface LeaseFields {
    lessorName?: string;
    lessorAddress?: string;
    propertyDescription?: string;
    propertyAddress?: string;
    leasePurpose?: string;
    monthlyRentalFee?: number;
    paymentDueDate?: string;
    costCenter?: string;
}

export interface DonationFields {
    recipientOrganizationName?: string;
    authorizedRepresentative?: string;
    recipientAddress?: string;
    transferPurpose?: string;
    donatedItems?: string;
    doneeObligations?: string;
}

export type ContractTypeFields = ConsultancyFields | WOSFields | ServiceAgreementFields | MOAMOUFields | EmploymentFields | AmendmentFields | GrantAgreementFields | SubgrantFields | LeaseFields | DonationFields;

export interface SupportingDocument {
    name: string;
    checked: boolean;
    required?: boolean;
}

export interface Contract {
    id: string;
    title: string;
    projectName: string;
    type: ContractType;
    status: ContractStatus;
    owner: string;
    recipientEmail?: string;
    folderId?: string;
    parties: {
        name: string;
        email: string;
        role: string;
    }[];
    startDate: string;
    endDate: string | null;
    value: number | null;
    description: string;
    documentLink?: string;
    createdAt: string;
    updatedAt: string;
    archived?: boolean;
    archivedAt?: string;
    archivedBy?: string;
    lastActivityAt?: string;
    inactivityNotificationDays?: number;
    reviewerInactivityDays?: number;
    regularInactivityDays?: number;
    isAmended?: boolean;
    amendmentStage?: "amendment" | "management" | "wwf" | "counterparty";
    originalStatus?: ContractStatus;
    typeSpecificFields?: ContractTypeFields;
    supportingDocuments?: SupportingDocument[];
    timeline?: {
        timestamp: string;
        action: string;
        userEmail: string;
        userName?: string;
        details?: string;
    }[];
    comments?: Comment[];
    approvers?: {
        legal?: {
            email: string;
            name: string;
            approved: boolean;
            declined?: boolean;
            approvedAt?: string;
            declinedAt?: string;
        }[] | {
            email: string;
            name: string;
            approved: boolean;
            declined?: boolean;
            approvedAt?: string;
            declinedAt?: string;
        };
        management?: {
            email: string;
            name: string;
            approved: boolean;
            declined?: boolean;
            approvedAt?: string;
            declinedAt?: string;
        }[] | {
            email: string;
            name: string;
            approved: boolean;
            declined?: boolean;
            approvedAt?: string;
            declinedAt?: string;
        };
        approver?: {
            email: string;
            name: string;
            approved: boolean;
            declined?: boolean;
            approvedAt?: string;
            declinedAt?: string;
        }[];
    };
    approverLimits?: {
        legal: number;
        management: number;
        approver: number;
    };
}

export interface Comment {
    id: string;
    text: string;
    userEmail: string;
    userName?: string;
    timestamp: string;
    replies?: Comment[];
}

export const statusColors: Record<ContractStatus, {
    bg: string;
    text: string;
    border: string;
}> = {
    requested: {
        bg: "bg-blue-50",
        text: "text-blue-800",
        border: "border-blue-200"
    },

    draft: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        border: "border-gray-200"
    },

    legal_review: {
        bg: "bg-purple-50",
        text: "text-purple-800",
        border: "border-purple-200"
    },

    management_review: {
        bg: "bg-orange-50",
        text: "text-orange-800",
        border: "border-orange-200"
    },

    wwf_signing: {
        bg: "bg-indigo-50",
        text: "text-indigo-800",
        border: "border-indigo-200"
    },

    counterparty_signing: {
        bg: "bg-pink-50",
        text: "text-pink-800",
        border: "border-pink-200"
    },

    implementation: {
        bg: "bg-cyan-50",
        text: "text-cyan-800",
        border: "border-cyan-200"
    },

    amendment: {
        bg: "bg-amber-50",
        text: "text-amber-800",
        border: "border-amber-200"
    },

    contract_end: {
        bg: "bg-green-50",
        text: "text-green-800",
        border: "border-green-200"
    },

    legal_send_back: {
        bg: "bg-red-50",
        text: "text-red-800",
        border: "border-red-200"
    },

    management_send_back: {
        bg: "bg-red-50",
        text: "text-red-800",
        border: "border-red-200"
    },

    legal_declined: {
        bg: "bg-red-50",
        text: "text-red-800",
        border: "border-red-200"
    },

    management_declined: {
        bg: "bg-red-50",
        text: "text-red-800",
        border: "border-red-200"
    },

    approval: {
        bg: "bg-yellow-50",
        text: "text-yellow-800",
        border: "border-yellow-200"
    },

    finished: {
        bg: "bg-green-50",
        text: "text-green-800",
        border: "border-green-200"
    }
};

export const contractTypeLabels: Record<ContractType, string> = {
    consultancy: "Consultancy",
    wos: "Work Order for Services (WOS)",
    service: "Service Agreement",
    moa_mou: "Memorandum of Agreement/Understanding (MOA/MOU)",
    employment: "Employment Contract",
    amendment: "Request for Amendment",
    grant: "Grant Agreement",
    subgrant: "Subgrant Agreement",
    lease: "Lease Contract",
    donation: "Deed of Donation"
};

export const getRequiredSupportingDocuments = (contractType: ContractType): string[] => {
    switch (contractType) {
    case "consultancy":
        return [
            "BIR Certificate of Registration",
            "Sample Invoice or OR",
            "Sworn Declaration of Gross Receipts (if applicable)",
            "Canvass Summary",
            "Justification Form (if no canvass summary is provided)",
            "Proposals of all bidders"
        ];
    case "wos":
        return [];
    case "service":
        return [
            "BIR Certificate of Registration",
            "Sample Invoice or OR",
            "Sworn Declaration of Gross Receipts",
            "Canvass Summary",
            "Justification Form"
        ];
    case "moa_mou":
        return [];
    case "employment":
        return [];
    case "amendment":
        return [];
    case "grant":
        return [];
    case "subgrant":
        return [
            "BIR Certificate of Registration"
        ];
    case "lease":
        return [
            "BIR Certificate of Registration",
            "Sample Invoice/OR (if applicable)"
        ];
    case "donation":
        return [];
    default:
        return [];
    }
};

export const getSupportingDocuments = (contractType: ContractType): SupportingDocument[] => {
    const requiredDocs = getRequiredSupportingDocuments(contractType);

    switch (contractType) {
    case "consultancy":
        return [{
            name: "Signed Personnel Request Form",
            checked: false,
            required: false
        }, {
            name: "Terms of Reference",
            checked: false,
            required: false
        }, {
            name: "Profile (CV for individuals, company profile for firms)",
            checked: false,
            required: false
        }, {
            name: "BIR Certificate of Registration",
            checked: false,
            required: requiredDocs.includes("BIR Certificate of Registration")
        }, {
            name: "Sample Invoice or OR",
            checked: false,
            required: requiredDocs.includes("Sample Invoice or OR")
        }, {
            name: "Sworn Declaration of Gross Receipts (if applicable)",
            checked: false,
            required: requiredDocs.includes("Sworn Declaration of Gross Receipts (if applicable)")
        }, {
            name: "Canvass Summary",
            checked: false,
            required: requiredDocs.includes("Canvass Summary")
        }, {
            name: "Justification Form (if no canvass summary is provided)",
            checked: false,
            required: requiredDocs.includes("Justification Form (if no canvass summary is provided)")
        }, {
            name: "Proposals of all bidders",
            checked: false,
            required: requiredDocs.includes("Proposals of all bidders")
        }];
    case "wos":
        return [{
            name: "Signed Personnel Request Form",
            checked: false,
            required: false
        }, {
            name: "Terms of Reference",
            checked: false,
            required: false
        }, {
            name: "CV",
            checked: false,
            required: false
        }, {
            name: "Valid ID",
            checked: false,
            required: false
        }, {
            name: "NBI clearance/Barangay clearance",
            checked: false,
            required: false
        }];
    case "service":
        return [{
            name: "Signed Service Request Form",
            checked: false,
            required: false
        }, {
            name: "Terms of Reference",
            checked: false,
            required: false
        }, {
            name: "Profile (CV for individuals, company profile for firms)",
            checked: false,
            required: false
        }, {
            name: "BIR Certificate of Registration",
            checked: false,
            required: requiredDocs.includes("BIR Certificate of Registration")
        }, {
            name: "Sample Invoice or OR",
            checked: false,
            required: requiredDocs.includes("Sample Invoice or OR")
        }, {
            name: "Sworn Declaration of Gross Receipts (if applicable)",
            checked: false,
            required: requiredDocs.includes("Sworn Declaration of Gross Receipts")
        }, {
            name: "Canvass Summary",
            checked: false,
            required: requiredDocs.includes("Canvass Summary")
        }, {
            name: "Justification Form (if no canvass summary is provided)",
            checked: false,
            required: requiredDocs.includes("Justification Form")
        }, {
            name: "Proposals of all bidders",
            checked: false,
            required: false
        }];
    case "moa_mou":
        return [{
            name: "Appendices to the agreement (Terms of Reference, Work and Financial Plan, Schedules, and other relevant documents)",
            checked: false,
            required: false
        }];
    case "employment":
        return [{
            name: "Signed Personnel Request Form",
            checked: false,
            required: false
        }, {
            name: "Terms of Reference/Job Description",
            checked: false,
            required: false
        }];
    case "amendment":
        return [{
            name: "Original Contract",
            checked: false,
            required: false
        }, {
            name: "Amendment Request Form",
            checked: false,
            required: false
        }];
    case "grant":
        return [{
            name: "Project Proposal/Terms of Reference",
            checked: false,
            required: false
        }, {
            name: "Detailed Budget",
            checked: false,
            required: false
        }];
    case "subgrant":
        return [{
            name: "Project Proposal/Terms of Reference and Workplan",
            checked: false,
            required: false
        }, {
            name: "BIR Certificate of Registration",
            checked: false,
            required: requiredDocs.includes("BIR Certificate of Registration")
        }, {
            name: "Organizational Profile",
            checked: false,
            required: false
        }];
    case "lease":
        return [{
            name: "BIR Certificate of Registration",
            checked: false,
            required: requiredDocs.includes("BIR Certificate of Registration")
        }, {
            name: "Sample Invoice/OR (if applicable)",
            checked: false,
            required: requiredDocs.includes("Sample Invoice/OR (if applicable)")
        }];
    case "donation":
        return [{
            name: "Deed of Donation",
            checked: false,
            required: false
        }, {
            name: "Inventory of Donated Items",
            checked: false,
            required: false
        }, {
            name: "Proof of Ownership",
            checked: false,
            required: false
        }];
    default:
        return [];
    }
};

export const getContracts = async (includeArchived: boolean = false): Promise<Contract[]> => {
    const contractsCollection = collection(db, "contracts");

    try {
        const contractsSnapshot = await getDocs(contractsCollection);

        let contracts = contractsSnapshot.docs.map(doc => {
            const data = doc.data() as Record<string, any>;

            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
                updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt) : null,
                archivedAt: data.archivedAt ? (data.archivedAt.toDate ? data.archivedAt.toDate().toISOString() : data.archivedAt) : null,
                startDate: data.startDate,
                endDate: data.endDate,
                documentLink: data.documentLink
            } as Contract;
        });

        if (!includeArchived) {
            contracts = contracts.filter(contract => !contract.archived);
        }

        for (const contract of contracts) {
            if (contract.type && (!contract.supportingDocuments || contract.supportingDocuments.length === 0)) {
                contract.supportingDocuments = getSupportingDocuments(contract.type);
                const contractDoc = doc(db, "contracts", contract.id);

                await updateDoc(contractDoc, {
                    supportingDocuments: contract.supportingDocuments,
                    updatedAt: new Date().toISOString()
                });
            }
        }

        return contracts;
    } catch (error) {
        throw error;
    }
};

export const getArchivedContracts = async (): Promise<Contract[]> => {
    const contractsCollection = collection(db, "contracts");

    try {
        const contractsQuery = query(contractsCollection, where("archived", "==", true));
        const contractsSnapshot = await getDocs(contractsQuery);
        let contracts: Contract[] = [];

        if (contractsSnapshot.empty) {
            const allContractsSnapshot = await getDocs(contractsCollection);
            const allContractsWithArchived = allContractsSnapshot.docs.filter(doc => doc.data().archived === true);

            if (allContractsWithArchived.length > 0) {
                contracts = allContractsWithArchived.map(doc => {
                    const data = doc.data();

                    return {
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
                        updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt) : null,
                        archivedAt: data.archivedAt ? (data.archivedAt.toDate ? data.archivedAt.toDate().toISOString() : data.archivedAt) : null,
                        startDate: data.startDate,
                        endDate: data.endDate,
                        documentLink: data.documentLink
                    } as Contract;
                });
            } else {
                return [];
            }
        } else {
            contracts = contractsSnapshot.docs.map(doc => {
                const data = doc.data();

                return {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
                    updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt) : null,
                    archivedAt: data.archivedAt ? (data.archivedAt.toDate ? data.archivedAt.toDate().toISOString() : data.archivedAt) : null,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    documentLink: data.documentLink
                } as Contract;
            });
        }

        for (const contract of contracts) {
            if (contract.type && (!contract.supportingDocuments || contract.supportingDocuments.length === 0)) {
                contract.supportingDocuments = getSupportingDocuments(contract.type);
                const contractDoc = doc(db, "contracts", contract.id);

                await updateDoc(contractDoc, {
                    supportingDocuments: contract.supportingDocuments,
                    updatedAt: new Date().toISOString()
                });
            }
        }

        return contracts;
    } catch (error) {
        throw error;
    }
};

export const getContract = async (id: string): Promise<Contract | null> => {
    try {
        const contractDoc = doc(db, "contracts", id);
        const contractSnapshot = await getDoc(contractDoc);

        if (!contractSnapshot.exists()) {
            return null;
        }

        const data = contractSnapshot.data();

        const formattedContract = {
            id: contractSnapshot.id,
            ...data,
            createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
            updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt) : null,
            archivedAt: data.archivedAt ? (data.archivedAt.toDate ? data.archivedAt.toDate().toISOString() : data.archivedAt) : null,
            startDate: data.startDate,
            endDate: data.endDate,
            documentLink: data.documentLink,

            timeline: data.timeline ? data.timeline.map((item: any) => ({
                ...item,
                timestamp: item.timestamp && item.timestamp.toDate ? item.timestamp.toDate().toISOString() : item.timestamp
            })) : [],

            comments: data.comments || []
        } as Contract;

        if (formattedContract.type && (!formattedContract.supportingDocuments || formattedContract.supportingDocuments.length === 0)) {
            formattedContract.supportingDocuments = getSupportingDocuments(formattedContract.type);

            await updateDoc(contractDoc, {
                supportingDocuments: formattedContract.supportingDocuments,
                updatedAt: new Date().toISOString()
            });
        }

        return formattedContract;
    } catch (error) {
        throw error;
    }
};

interface ContractUpdateWithCustomTimeline extends Partial<Omit<Contract, "id" | "createdAt">> {
    _customTimelineEntry?: {
        action: string;
        details?: string;
        userEmail?: string;
        userName?: string;
    };
}

export const createContract = async (
    contract: Omit<Contract, "id" | "createdAt" | "updatedAt">,
    creator: {
        email: string;
        displayName?: string | null;
    }
): Promise<string> => {
    const now = Timestamp.now();
    const initialStatus = contract.status || "requested";

    const initialTimelineEntry = {
        timestamp: now.toDate().toISOString(),
        action: "Contract Created with Requested Status",
        userEmail: creator.email,
        userName: creator.displayName || creator.email.split("@")[0] || "User",
        details: "Contract was initially created"
    };

    const cleanContract = JSON.parse(JSON.stringify(contract));

    if (!cleanContract.owner || cleanContract.owner === "undefined") {
        cleanContract.owner = creator.email || "Unassigned";
    }

    if (cleanContract.parties && Array.isArray(cleanContract.parties)) {
        cleanContract.parties = cleanContract.parties.map(party => ({
            ...party,
            name: party.name || party.email?.split("@")[0] || "User"
        }));
    }

    if (cleanContract.reviewerInactivityDays === undefined && cleanContract.regularInactivityDays === undefined) {
        cleanContract.reviewerInactivityDays = 3;
        cleanContract.regularInactivityDays = 1;
    }

    const newContract = {
        ...cleanContract,
        status: initialStatus,
        owner: cleanContract.owner,
        createdAt: now.toDate().toISOString(),
        updatedAt: now.toDate().toISOString(),
        lastActivityAt: now.toDate().toISOString(),
        archived: false,
        timeline: [initialTimelineEntry]
    };

    if (!newContract.approvers) {
        newContract.approvers = {};
    }

    if (!newContract.approverLimits) {
        newContract.approverLimits = {
            legal: 2,
            management: 5,
            approver: 1
        };
    }

    const docRef = await addDoc(collection(db, "contracts"), newContract);

    try {
        await addNotification({
            contractId: docRef.id,
            contractTitle: newContract.title,
            type: "contract_created",
            message: `New contract "${newContract.title}" created by ${creator.displayName || creator.email}`,
            recipientRole: "admin",
            createdBy: creator.email,
            createdByName: creator.displayName || creator.email.split("@")[0] || "User",
            read: false
        });
    } catch (error) {}

    return docRef.id;
};

export const updateContract = async (
    id: string,
    contractUpdates: ContractUpdateWithCustomTimeline,
    editor: {
        email: string;
        displayName?: string | null;
    }
): Promise<void> => {
    const contractDoc = doc(db, "contracts", id);
    const now = Timestamp.now();
    const currentContractSnap = await getDoc(contractDoc);

    if (!currentContractSnap.exists()) {
        throw new Error("Contract not found");
    }

    const currentContractData = currentContractSnap.data() as Contract;
    const cleanContractUpdates = JSON.parse(JSON.stringify(contractUpdates));

    const updateData: Record<string, any> = {
        ...cleanContractUpdates,
        updatedAt: now.toDate().toISOString(),
        lastActivityAt: now.toDate().toISOString()
    };

    const newTimelineEntries: any[] = [];

    if (contractUpdates.title && contractUpdates.title !== currentContractData.title) {
        newTimelineEntries.push({
            timestamp: now.toDate().toISOString(),
            action: "Title Updated",
            userEmail: editor.email,
            userName: editor.displayName || editor.email.split("@")[0] || "User",
            details: `Changed from "${currentContractData.title}" to "${contractUpdates.title}"`
        });
    }

    if (contractUpdates.projectName && contractUpdates.projectName !== currentContractData.projectName) {
        newTimelineEntries.push({
            timestamp: now.toDate().toISOString(),
            action: "Project Name Updated",
            userEmail: editor.email,
            userName: editor.displayName || editor.email.split("@")[0] || "User",
            details: `Changed from "${currentContractData.projectName}" to "${contractUpdates.projectName}"`
        });
    }

    if (contractUpdates.description && contractUpdates.description !== currentContractData.description) {
        newTimelineEntries.push({
            timestamp: now.toDate().toISOString(),
            action: "Description Updated",
            userEmail: editor.email,
            userName: editor.displayName || editor.email.split("@")[0] || "User"
        });
    }

    if (contractUpdates.type && contractUpdates.type !== currentContractData.type) {
        newTimelineEntries.push({
            timestamp: now.toDate().toISOString(),
            action: "Type Updated",
            userEmail: editor.email,
            userName: editor.displayName || editor.email.split("@")[0] || "User",
            details: `Changed from ${contractTypeLabels[currentContractData.type]} to ${contractTypeLabels[contractUpdates.type]}`
        });
    }

    if (contractUpdates.status && contractUpdates.status !== currentContractData.status) {
        const formattedStatus = contractUpdates.status.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

        const timelineEntry = {
            timestamp: now.toDate().toISOString(),
            action: `Status Changed to ${formattedStatus}`,
            userEmail: editor.email,
            userName: editor.displayName || editor.email.split("@")[0] || "User"
        };

        newTimelineEntries.push(timelineEntry);
    }

    if (contractUpdates.startDate && contractUpdates.startDate !== currentContractData.startDate) {
        newTimelineEntries.push({
            timestamp: now.toDate().toISOString(),
            action: "Start Date Updated",
            userEmail: editor.email,
            userName: editor.displayName || editor.email.split("@")[0] || "User",
            details: `Changed from ${currentContractData.startDate} to ${contractUpdates.startDate}`
        });
    }

    if (contractUpdates.endDate !== undefined && contractUpdates.endDate !== currentContractData.endDate) {
        newTimelineEntries.push({
            timestamp: now.toDate().toISOString(),
            action: "End Date Updated",
            userEmail: editor.email,
            userName: editor.displayName || editor.email.split("@")[0] || "User",
            details: `Changed from ${currentContractData.endDate || "Ongoing"} to ${contractUpdates.endDate || "Ongoing"}`
        });
    }

    if (contractUpdates.value !== undefined && contractUpdates.value !== currentContractData.value) {
        newTimelineEntries.push({
            timestamp: now.toDate().toISOString(),
            action: "Value Updated",
            userEmail: editor.email,
            userName: editor.displayName || editor.email.split("@")[0] || "User",
            details: `Changed from ${currentContractData.value?.toLocaleString() || "N/A"} to ${contractUpdates.value?.toLocaleString() || "N/A"}`
        });
    }

    if (contractUpdates.parties && arePartiesDifferent(contractUpdates.parties, currentContractData.parties)) {
        newTimelineEntries.push({
            timestamp: now.toDate().toISOString(),
            action: "Parties Updated",
            userEmail: editor.email,
            userName: editor.displayName || editor.email.split("@")[0] || "User"
        });
    }

    if (contractUpdates.documentLink !== undefined && contractUpdates.documentLink !== currentContractData.documentLink) {
        newTimelineEntries.push({
            timestamp: now.toDate().toISOString(),
            action: "Document Link Updated",
            userEmail: editor.email,
            userName: editor.displayName || editor.email.split("@")[0] || "User"
        });
    }

    if (contractUpdates.reviewerInactivityDays !== undefined && contractUpdates.reviewerInactivityDays !== currentContractData.reviewerInactivityDays) {
        newTimelineEntries.push({
            timestamp: now.toDate().toISOString(),
            action: "Reviewer Inactivity Threshold Updated",
            userEmail: editor.email,
            userName: editor.displayName || editor.email.split("@")[0] || "User",
            details: `Changed from ${currentContractData.reviewerInactivityDays || "3 (default)"} to ${contractUpdates.reviewerInactivityDays} business days`
        });
    }

    if (contractUpdates.regularInactivityDays !== undefined && contractUpdates.regularInactivityDays !== currentContractData.regularInactivityDays) {
        newTimelineEntries.push({
            timestamp: now.toDate().toISOString(),
            action: "Regular User Inactivity Threshold Updated",
            userEmail: editor.email,
            userName: editor.displayName || editor.email.split("@")[0] || "User",
            details: `Changed from ${currentContractData.regularInactivityDays || "1 (default)"} to ${contractUpdates.regularInactivityDays} business days`
        });
    }

    if (contractUpdates._customTimelineEntry) {
        const customEntry = contractUpdates._customTimelineEntry;

        newTimelineEntries.push({
            timestamp: now.toDate().toISOString(),
            action: customEntry.action,
            userEmail: editor.email,
            userName: editor.displayName || editor.email.split("@")[0] || "User",
            details: customEntry.details || ""
        });

        delete contractUpdates._customTimelineEntry;
    } else if (contractUpdates.approvers) {
        newTimelineEntries.push({
            timestamp: now.toDate().toISOString(),
            action: "Approvers Updated",
            userEmail: editor.email,
            userName: editor.displayName || editor.email.split("@")[0] || "User"
        });
    }

    if (newTimelineEntries.length > 0) {
        updateData.timeline = [...(currentContractData.timeline || []), ...newTimelineEntries];
    }

    try {
        await updateDoc(contractDoc, updateData);

        if (contractUpdates.status === "requested" && currentContractData.status !== "requested") {
            try {
                await addNotification({
                    contractId: id,
                    contractTitle: currentContractData.title,
                    type: "contract_requested",
                    message: `Contract "${currentContractData.title}" status changed to Requested by ${editor.displayName || editor.email}`,
                    recipientRole: "admin",
                    createdBy: editor.email,
                    createdByName: editor.displayName || editor.email.split("@")[0] || "User",
                    read: false
                });
            } catch (notificationError) {}
        }
    } catch (error) {
        throw error;
    }
};

const arePartiesDifferent = (newParties: any[], oldParties: any[]): boolean => {
    const sortParties = (p: any[]) => [...p].sort(
        (a, b) => (a.email || "").localeCompare(b.email || "") || (a.name || "").localeCompare(b.name || "")
    );

    if (!newParties && !oldParties)
        return false;

    if (!newParties || !oldParties)
        return true;

    if (newParties.length !== oldParties.length)
        return true;

    try {
        return JSON.stringify(sortParties(newParties)) !== JSON.stringify(sortParties(oldParties));
    } catch (e) {
        return true;
    }
};

export const deleteContract = async (id: string): Promise<void> => {
    const contractDoc = doc(db, "contracts", id);
    await deleteDoc(contractDoc);
};

export const archiveContract = async (
    id: string,
    archiver: {
        email: string;
        displayName?: string | null;
    }
): Promise<void> => {
    const contractDoc = doc(db, "contracts", id);
    const now = Timestamp.now();

    try {
        const currentContractSnap = await getDoc(contractDoc);
        const currentTimeline = currentContractSnap.data()?.timeline || [];

        const archiveTimelineEntry = {
            timestamp: now.toDate().toISOString(),
            action: "Contract Archived",
            userEmail: archiver.email,
            userName: archiver.displayName || ""
        };

        const updateData = {
            archived: true,
            archivedAt: now.toDate().toISOString(),
            archivedBy: archiver.email,
            updatedAt: now.toDate().toISOString(),
            timeline: [...currentTimeline, archiveTimelineEntry]
        };

        await updateDoc(contractDoc, updateData);
    } catch (error) {
        throw error;
    }
};

export const unarchiveContract = async (
    id: string,
    restorer: {
        email: string;
        displayName?: string | null;
    }
): Promise<void> => {
    const contractDoc = doc(db, "contracts", id);
    const now = Timestamp.now();

    try {
        const currentContractSnap = await getDoc(contractDoc);
        const currentTimeline = currentContractSnap.data()?.timeline || [];

        const unarchiveTimelineEntry = {
            timestamp: now.toDate().toISOString(),
            action: "Contract Restored",
            userEmail: restorer.email,
            userName: restorer.displayName || ""
        };

        await updateDoc(contractDoc, {
            archived: false,
            archivedAt: null,
            archivedBy: null,
            updatedAt: now.toDate().toISOString(),
            timeline: [...currentTimeline, unarchiveTimelineEntry]
        });
    } catch (error) {
        throw error;
    }
};

import { sendNotificationEmail } from "./brevoService";

export const isUserAllowed = async (email: string): Promise<boolean> => {
    if (!email)
        return false;

    const deletedUsersRef = collection(db, "deleted_users");
    const deletedUserQuery = query(deletedUsersRef, where("email", "==", email.toLowerCase()));
    const deletedUserSnapshot = await getDocs(deletedUserQuery);

    if (!deletedUserSnapshot.empty) {
        return false;
    }

    const adminRef = collection(db, "admin");
    const adminQuery = query(adminRef, where("email", "==", email.toLowerCase()));
    const adminSnapshot = await getDocs(adminQuery);

    if (!adminSnapshot.empty) {
        return true;
    }

    const usersRef = collection(db, "users");
    const userQuery = query(usersRef, where("email", "==", email.toLowerCase()));
    const userSnapshot = await getDocs(userQuery);

    if (!userSnapshot.empty) {
        return true;
    }

    return false;
};

export const isUserAdmin = async (email: string): Promise<boolean> => {
    if (!email)
        return false;

    const roleStartTime = performance.now();

    try {
        const roles = await getUserRoles(email);

        if (roles !== null) {
            const roleEndTime = performance.now();
            return roles.isAdmin;
        }

        return await isUserAdminOriginal(email);
    } catch (error) {
        return await isUserAdminOriginal(email);
    }
};

export const addAdminUser = async (email: string, currentUserEmail?: string, displayName: string = ""): Promise<void> => {
    if (currentUserEmail) {
        const isAdmin = await isUserAdmin(currentUserEmail);

        if (!isAdmin) {
            throw new Error("Unauthorized: Only administrators can add admin users");
        }
    }

    const normalizedEmail = email.toLowerCase();
    const isLegal = await isUserLegalTeam(normalizedEmail);

    if (isLegal) {
        throw new Error("User is already a legal team member. A user cannot have multiple roles.");
    }

    const isManagement = await isUserManagementTeam(normalizedEmail);

    if (isManagement) {
        throw new Error(
            "User is already a management team member. A user cannot have multiple roles."
        );
    }

    const isApprover = await isUserApprover(normalizedEmail);

    if (isApprover) {
        throw new Error("User is already an approver. A user cannot have multiple roles.");
    }

    const adminRef = collection(db, "admin");
    const adminQuery = query(adminRef, where("email", "==", normalizedEmail));
    const adminSnapshot = await getDocs(adminQuery);

    if (adminSnapshot.empty) {
        await addDoc(adminRef, {
            email: normalizedEmail,
            displayName: displayName,
            createdAt: new Date().toISOString()
        });
    } else
        {}

    try {
        const now = new Date().toISOString();
        const userRolesRef = doc(db, "userRoles", normalizedEmail);
        const userRoleDoc = await getDoc(userRolesRef);

        if (!userRoleDoc.exists()) {
            const userRolesData = {
                email: normalizedEmail,
                isAdmin: true,
                isLegalTeam: false,
                isManagementTeam: false,
                isApprover: false,
                createdAt: now,
                updatedAt: now
            };

            await setDoc(userRolesRef, userRolesData);
        } else {
            await updateDoc(userRolesRef, {
                isAdmin: true,
                updatedAt: now
            });
        }
    } catch (error) {}
};

export const removeAdminUser = async (id: string, currentUserEmail?: string): Promise<void> => {
    if (currentUserEmail) {
        const isAdmin = await isUserAdmin(currentUserEmail);

        if (!isAdmin) {
            throw new Error("Unauthorized: Only administrators can remove admin users");
        }
    }

    const adminRef = doc(db, "admin", id);
    const adminDoc = await getDoc(adminRef);

    if (!adminDoc.exists()) {
        throw new Error("Admin user not found");
    }

    const adminData = adminDoc.data();
    const email = adminData.email?.toLowerCase();

    if (!email) {
        throw new Error("Admin email not found in document");
    }

    await deleteDoc(adminRef);

    try {
        const userRolesRef = doc(db, "userRoles", email);
        const userRoleDoc = await getDoc(userRolesRef);

        if (userRoleDoc.exists()) {
            await updateDoc(userRolesRef, {
                isAdmin: false,
                updatedAt: new Date().toISOString()
            });
        }
    } catch (error) {}
};

export const filterByStatus = (contracts: Contract[], status?: ContractStatus | "all"): Contract[] => {
    if (!status || status === "all")
        return contracts;

    return contracts.filter(contract => contract.status === status);
};

export const filterByType = (contracts: Contract[], type?: ContractType | "all"): Contract[] => {
    if (!type || type === "all")
        return contracts;

    return contracts.filter(contract => contract.type === type);
};

export const filterByProject = (contracts: Contract[], project?: string): Contract[] => {
    if (!project)
        return contracts;

    return contracts.filter(
        contract => contract.projectName.toLowerCase().includes(project.toLowerCase())
    );
};

export const filterByOwner = (contracts: Contract[], owner?: string): Contract[] => {
    if (!owner)
        return contracts;

    return contracts.filter(contract => contract.parties.some(
        party => (party.name.toLowerCase().includes(owner.toLowerCase()) || party.email.toLowerCase().includes(owner.toLowerCase())) && party.role.toLowerCase() === "owner"
    ));
};

export const filterByParty = (contracts: Contract[], party?: string): Contract[] => {
    if (!party)
        return contracts;

    return contracts.filter(contract => contract.parties.some(
        p => p.name.toLowerCase().includes(party.toLowerCase()) || p.email.toLowerCase().includes(party.toLowerCase())
    ));
};

export const filterByDateRange = (contracts: Contract[], startDate?: string | null, endDate?: string | null): Contract[] => {
    if (!startDate && !endDate)
        return contracts;

    return contracts.filter(contract => {
        try {
            if (startDate && contract.startDate) {
                try {
                    const contractStartDate = new Date(contract.startDate);
                    const filterStartDate = new Date(startDate);
                    const contractDateStr = contractStartDate.toISOString().split("T")[0];
                    const filterDateStr = filterStartDate.toISOString().split("T")[0];

                    if (contractDateStr < filterDateStr) {
                        return false;
                    }
                } catch (e) {}
            }

            if (endDate && contract.endDate) {
                try {
                    const contractEndDate = new Date(contract.endDate);
                    const filterEndDate = new Date(endDate);
                    const contractDateStr = contractEndDate.toISOString().split("T")[0];
                    const filterDateStr = filterEndDate.toISOString().split("T")[0];

                    if (contractDateStr > filterDateStr) {
                        return false;
                    }
                } catch (e) {}
            }

            return true;
        } catch (error) {
            return true;
        }
    });
};

export const getContractStats = async (): Promise<ContractStats> => {
    try {
        const contracts = await getContracts();
        const now = new Date();
        const currentYear = now.getFullYear();
        const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        const totalContracts = contracts.length;
        const finishedContracts = contracts.filter(c => c.status === "contract_end").length;

        const pendingApprovalContracts = contracts.filter(
            c => c.status === "legal_review" || c.status === "management_review" || c.status === "legal_send_back" || c.status === "management_send_back" || c.status === "approval" || c.status === "draft" || c.status === "requested"
        ).length;

        const expiringContracts = contracts.filter(c => {
            if (!c.endDate) {
                return false;
            }

            try {
                const endDate = new Date(c.endDate);

                if (isNaN(endDate.getTime())) {
                    return false;
                }

                const isExpiringSoon = endDate <= thirtyDaysFromNow && endDate >= now;
                return isExpiringSoon;
            } catch (error) {
                return false;
            }
        }).length;

        const totalValue = contracts.reduce((sum, contract) => {
            return sum + (contract.value || 0);
        }, 0);

        const expiringThisYear = contracts.filter(c => {
            if (!c.endDate) {
                return false;
            }

            try {
                const endDate = new Date(c.endDate);

                if (isNaN(endDate.getTime())) {
                    return false;
                }

                const isExpiringThisYear = endDate.getFullYear() === currentYear;
                return isExpiringThisYear;
            } catch (error) {
                return false;
            }
        }).length;

        const stats = {
            totalContracts,
            finishedContracts,
            pendingApprovalContracts,
            expiringContracts,
            totalValue,
            expiringThisYear
        };

        return stats;
    } catch (error) {
        throw error;
    }
};

export const registerUser = async (
    userId: string,
    email: string,
    firstName: string = "",
    lastName: string = "",
    displayName: string = ""
): Promise<void> => {
    const usersRef = collection(db, "users");
    const userQuery = query(usersRef, where("email", "==", email.toLowerCase()));
    const userSnapshot = await getDocs(userQuery);
    const finalDisplayName = displayName || `${firstName} ${lastName}`.trim();

    if (userSnapshot.empty) {
        await addDoc(usersRef, {
            userId,
            email: email.toLowerCase(),
            firstName,
            lastName,
            displayName: finalDisplayName,
            role: "user",
            createdAt: new Date().toISOString(),
            passwordChangeRequired: true
        });
    } else {
        const userDoc = userSnapshot.docs[0];
        const userData = userDoc.data();

        await updateDoc(doc(db, "users", userDoc.id), {
            displayName: finalDisplayName || userData.displayName,
            firstName: firstName || userData.firstName || "",
            lastName: lastName || userData.lastName || "",
            updatedAt: new Date().toISOString()
        });
    }
};

export const getFolders = async (userEmail?: string): Promise<Folder[]> => {
    const foldersCollection = collection(db, "folders");
    let foldersSnapshot;

    if (userEmail) {
        const foldersQuery = query(foldersCollection, where("createdBy", "==", userEmail.toLowerCase()));
        foldersSnapshot = await getDocs(foldersQuery);
    } else {
        foldersSnapshot = await getDocs(foldersCollection);
    }

    const folders = foldersSnapshot.docs.map(doc => {
        const data = doc.data() as Record<string, any>;

        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
            updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt) : null
        } as Folder;
    });

    const contracts = await getContracts();

    return folders.map(folder => ({
        ...folder,
        contractCount: contracts.filter(contract => contract.folderId === folder.id).length
    }));
};

export const createFolder = async (folder: Omit<Folder, "id" | "createdAt" | "updatedAt" | "contractCount">): Promise<string> => {
    const now = Timestamp.now();

    const folderToCreate = {
        ...folder,
        createdAt: now,
        updatedAt: now
    };

    const docRef = await addDoc(collection(db, "folders"), folderToCreate);
    return docRef.id;
};

export const deleteFolder = async (id: string): Promise<void> => {
    const contracts = await getContracts();
    const contractsInFolder = contracts.filter(contract => contract.folderId === id);

    for (const contract of contractsInFolder) {
        await updateContract(contract.id, {
            folderId: null
        }, {
            email: "system@internal",
            displayName: "System"
        });
    }

    const folderRef = doc(db, "folders", id);
    await deleteDoc(folderRef);
};

export const assignContractToFolder = async (
    contractId: string,
    folderId: string | null,
    user: {
        email: string;
        displayName?: string | null;
    }
): Promise<void> => {
    const contractDoc = doc(db, "contracts", contractId);
    const now = Timestamp.now();
    const currentContractSnap = await getDoc(contractDoc);

    if (!currentContractSnap.exists()) {
        throw new Error("Contract not found");
    }

    const currentData = currentContractSnap.data();
    const currentTimeline = currentData?.timeline || [];
    const currentFolderId = currentData?.folderId;

    if (currentFolderId === folderId) {
        return;
    }

    let folderName = "Unassigned";

    if (folderId) {
        const folderDoc = doc(db, "folders", folderId);
        const folderSnap = await getDoc(folderDoc);

        if (!folderSnap.exists()) {
            throw new Error("Folder not found");
        }

        const folderData = folderSnap.data() as Record<string, any>;
        folderName = folderData.name || folderId;
    }

    const folderTimelineEntry = {
        timestamp: now.toDate().toISOString(),
        action: folderId ? `Moved to Folder: ${folderName}` : "Removed from Folder",
        userEmail: user.email,
        userName: user.displayName || "",
        details: folderId ? `Assigned to folder ID: ${folderId}` : "Unassigned from any folder"
    };

    await updateDoc(contractDoc, {
        folderId: folderId,
        updatedAt: now.toDate().toISOString(),
        timeline: [...currentTimeline, folderTimelineEntry]
    });
};

export const filterByFolder = (contracts: Contract[], folderId?: string | "all"): Contract[] => {
    if (!folderId || folderId === "all")
        return contracts;

    return contracts.filter(contract => contract.folderId === folderId);
};

export const renameFolder = async (
    id: string,
    updates: {
        name?: string;
        description?: string;
    }
): Promise<void> => {
    const folderRef = doc(db, "folders", id);
    const now = Timestamp.now();

    await updateDoc(folderRef, {
        ...updates,
        updatedAt: now
    });
};

export const addComment = async (contractId: string, text: string, userEmail: string, userName?: string): Promise<string> => {
    const contractRef = doc(db, "contracts", contractId);
    const contract = await getContract(contractId);

    if (!contract) {
        throw new Error("Contract not found");
    }

    const now = Timestamp.now();
    const commentId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const newComment: Comment = {
        id: commentId,
        text,
        userEmail,
        userName,
        timestamp: now.toDate().toISOString(),
        replies: []
    };

    const existingComments = contract.comments || [];
    const updatedComments = [...existingComments, newComment];

    await updateDoc(contractRef, {
        comments: updatedComments,
        updatedAt: now
    });

    const existingTimeline = contract.timeline || [];

    const updatedTimeline = [...existingTimeline, {
        timestamp: now.toDate().toISOString(),
        action: "Comment Added",
        userEmail,
        details: text.length > 50 ? `${text.substring(0, 50)}...` : text
    }];

    await updateDoc(contractRef, {
        timeline: updatedTimeline
    });

    return commentId;
};

export const addReply = async (
    contractId: string,
    parentCommentId: string,
    text: string,
    userEmail: string,
    userName?: string
): Promise<string> => {
    const contractRef = doc(db, "contracts", contractId);
    const contract = await getContract(contractId);

    if (!contract) {
        throw new Error("Contract not found");
    }

    const now = Timestamp.now();
    const replyId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const newReply: Comment = {
        id: replyId,
        text,
        userEmail,
        userName,
        timestamp: now.toDate().toISOString()
    };

    const existingComments = contract.comments || [];

    const updatedComments = existingComments.map(comment => {
        if (comment.id === parentCommentId) {
            return {
                ...comment,
                replies: [...(comment.replies || []), newReply]
            };
        }

        return comment;
    });

    await updateDoc(contractRef, {
        comments: updatedComments,
        updatedAt: now
    });

    return replyId;
};

export const deleteComment = async (contractId: string, commentId: string, parentCommentId?: string): Promise<void> => {
    const contractRef = doc(db, "contracts", contractId);
    const contract = await getContract(contractId);

    if (!contract) {
        throw new Error("Contract not found");
    }

    const existingComments = contract.comments || [];
    let updatedComments: Comment[] = [];

    if (parentCommentId) {
        updatedComments = existingComments.map(comment => {
            if (comment.id === parentCommentId) {
                return {
                    ...comment,
                    replies: (comment.replies || []).filter(reply => reply.id !== commentId)
                };
            }

            return comment;
        });
    } else {
        updatedComments = existingComments.filter(comment => comment.id !== commentId);
    }

    await updateDoc(contractRef, {
        comments: updatedComments,
        updatedAt: Timestamp.now()
    });
};

export const addLegalTeamMember = async (email: string, displayName: string = ""): Promise<void> => {
    const normalizedEmail = email.toLowerCase();
    const isAdmin = await isUserAdmin(normalizedEmail);

    if (isAdmin) {
        throw new Error("User is already an admin. A user cannot have multiple roles.");
    }

    const isManagement = await isUserManagementTeam(normalizedEmail);

    if (isManagement) {
        throw new Error(
            "User is already a management team member. A user cannot have multiple roles."
        );
    }

    const isApprover = await isUserApprover(normalizedEmail);

    if (isApprover) {
        throw new Error("User is already an approver. A user cannot have multiple roles.");
    }

    const legalTeamRef = collection(db, "legalTeam");
    const legalTeamQuery = query(legalTeamRef, where("email", "==", normalizedEmail));
    const legalTeamSnapshot = await getDocs(legalTeamQuery);

    if (legalTeamSnapshot.empty) {
        await addDoc(legalTeamRef, {
            email: normalizedEmail,
            displayName,
            createdAt: new Date().toISOString()
        });
    } else
        {}

    try {
        const now = new Date().toISOString();
        const userRolesRef = doc(db, "userRoles", normalizedEmail);
        const userRoleDoc = await getDoc(userRolesRef);

        if (!userRoleDoc.exists()) {
            const userRolesData = {
                email: normalizedEmail,
                isAdmin: false,
                isLegalTeam: true,
                isManagementTeam: false,
                isApprover: false,
                createdAt: now,
                updatedAt: now
            };

            await setDoc(userRolesRef, userRolesData);
        } else {
            await updateDoc(userRolesRef, {
                isLegalTeam: true,
                updatedAt: now
            });
        }
    } catch (error) {}
};

export const getLegalTeamMembers = async (): Promise<any[]> => {
    const legalTeamRef = collection(db, "legalTeam");
    const legalTeamSnapshot = await getDocs(legalTeamRef);

    return legalTeamSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

export const removeLegalTeamMember = async (id: string): Promise<void> => {
    const legalTeamRef = doc(db, "legalTeam", id);
    const legalTeamDoc = await getDoc(legalTeamRef);

    if (!legalTeamDoc.exists()) {
        throw new Error("Legal team member not found");
    }

    const legalTeamData = legalTeamDoc.data();
    const email = legalTeamData.email?.toLowerCase();

    if (!email) {
        throw new Error("Legal team member email not found in document");
    }

    await deleteDoc(legalTeamRef);

    try {
        const userRolesRef = doc(db, "userRoles", email);
        const userRoleDoc = await getDoc(userRolesRef);

        if (userRoleDoc.exists()) {
            await updateDoc(userRolesRef, {
                isLegalTeam: false,
                updatedAt: new Date().toISOString()
            });
        }
    } catch (error) {}
};

export const addManagementTeamMember = async (email: string, displayName: string = ""): Promise<void> => {
    const normalizedEmail = email.toLowerCase();
    const isAdmin = await isUserAdmin(normalizedEmail);

    if (isAdmin) {
        throw new Error("User is already an admin. A user cannot have multiple roles.");
    }

    const isLegal = await isUserLegalTeam(normalizedEmail);

    if (isLegal) {
        throw new Error("User is already a legal team member. A user cannot have multiple roles.");
    }

    const isApprover = await isUserApprover(normalizedEmail);

    if (isApprover) {
        throw new Error("User is already an approver. A user cannot have multiple roles.");
    }

    const managementTeamRef = collection(db, "managementTeam");
    const managementTeamQuery = query(managementTeamRef, where("email", "==", normalizedEmail));
    const managementTeamSnapshot = await getDocs(managementTeamQuery);

    if (managementTeamSnapshot.empty) {
        await addDoc(managementTeamRef, {
            email: normalizedEmail,
            displayName,
            createdAt: new Date().toISOString()
        });
    } else
        {}

    try {
        const now = new Date().toISOString();
        const userRolesRef = doc(db, "userRoles", normalizedEmail);
        const userRoleDoc = await getDoc(userRolesRef);

        if (!userRoleDoc.exists()) {
            const userRolesData = {
                email: normalizedEmail,
                isAdmin: false,
                isLegalTeam: false,
                isManagementTeam: true,
                isApprover: false,
                createdAt: now,
                updatedAt: now
            };

            await setDoc(userRolesRef, userRolesData);
        } else {
            await updateDoc(userRolesRef, {
                isManagementTeam: true,
                updatedAt: now
            });
        }
    } catch (error) {}
};

export const getManagementTeamMembers = async (): Promise<any[]> => {
    const managementTeamRef = collection(db, "managementTeam");
    const managementTeamSnapshot = await getDocs(managementTeamRef);

    return managementTeamSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

export const removeManagementTeamMember = async (id: string): Promise<void> => {
    const managementTeamRef = doc(db, "managementTeam", id);
    const managementTeamDoc = await getDoc(managementTeamRef);

    if (!managementTeamDoc.exists()) {
        throw new Error("Management team member not found");
    }

    const managementTeamData = managementTeamDoc.data();
    const email = managementTeamData.email?.toLowerCase();

    if (!email) {
        throw new Error("Management team member email not found in document");
    }

    await deleteDoc(managementTeamRef);

    try {
        const userRolesRef = doc(db, "userRoles", email);
        const userRoleDoc = await getDoc(userRolesRef);

        if (userRoleDoc.exists()) {
            await updateDoc(userRolesRef, {
                isManagementTeam: false,
                updatedAt: new Date().toISOString()
            });
        }
    } catch (error) {}
};

export const createUserRecord = async (email: string): Promise<string> => {
    try {
        const defaultPassword = "12345678";
        const success = await createUserAccountViaAPI(email, defaultPassword);

        if (!success)
            {}

        return defaultPassword;
    } catch (error) {
        return "12345678";
    }
};

export const inviteUser = async (email: string, role: string = "user", invitedBy: string): Promise<void> => {
    const normalizedEmail = email.toLowerCase();
    const userQuery = query(collection(db, "users"), where("email", "==", normalizedEmail));
    const userSnapshot = await getDocs(userQuery);

    if (!userSnapshot.empty) {
        return;
    }

    const userData = {
        email: normalizedEmail,
        role,
        invitedBy,
        createdAt: new Date().toISOString(),
        displayName: email.split("@")[0],
        status: "active",
        passwordChangeRequired: true
    };

    await addDoc(collection(db, "users"), userData);

    try {
        const now = new Date().toISOString();
        const userRolesRef = doc(db, "userRoles", normalizedEmail);
        const userRoleDoc = await getDoc(userRolesRef);

        if (!userRoleDoc.exists()) {
            const userRolesData = {
                email: normalizedEmail,
                isAdmin: false,
                isLegalTeam: false,
                isManagementTeam: false,
                isApprover: false,
                createdAt: now,
                updatedAt: now
            };

            await setDoc(userRolesRef, userRolesData);
        } else
            {}
    } catch (error) {}

    let defaultPassword = "12345678";

    try {
        defaultPassword = await createUserRecord(normalizedEmail);
    } catch (error) {}

    try {
        const appUrl = import.meta.env.VITE_APP_URL || "https://contract-management-system-omega.vercel.app";

        const htmlContent = `
      <div style="font-family: sans-serif;">
        <h2>Welcome to the Contract Management System</h2>
        <p>This is an automated notification from the Contract Management System.</p>
        <p>An account has been created for you by WWF-Philippines Team. This system helps manage and track contracts efficiently.</p>
        <p>You can log in immediately using the credentials below:</p>
        <p><strong>Login email:</strong> ${normalizedEmail}</p>
        <p><strong>Temporary access code:</strong> ${defaultPassword}</p>
        <p style="font-size: 12px; color: #999;">This is a temporary credential for your first login. For your security, please change it immediately after accessing the system.</p>
        <p>You can access the system here:</p>
        <p><a href="${appUrl}">${appUrl}</a></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
        <p style="font-size: 12px; color: #999;">
          Sent by Contract Management System – WWF Contracts<br />
        </p>
      </div>
    `;

        const textContent = `
Welcome to the Contract Management System

This is an automated notification from the Contract Management System.

An account has been created for you by WWF-Philippines Team. This system helps manage and track contracts efficiently.

You can log in immediately using the credentials below:

Login email: ${normalizedEmail}
Temporary access code: ${defaultPassword}

(This is a temporary credential for your first login. For your security, please change it immediately after accessing the system.)

You can access the system here:
${appUrl}

---
Sent by Contract Management System – WWF Contracts
    `;

        await sendNotificationEmail(
            normalizedEmail,
            "Your Contract Management System Account",
            htmlContent,
            textContent
        );
    } catch (error) {}
};

export const isUserLegalTeam = async (email: string): Promise<boolean> => {
    if (!email)
        return false;

    const roleStartTime = performance.now();

    try {
        const roles = await getUserRoles(email);

        if (roles !== null) {
            const roleEndTime = performance.now();
            return roles.isLegalTeam;
        }

        return await isUserLegalTeamOriginal(email);
    } catch (error) {
        return await isUserLegalTeamOriginal(email);
    }
};

export const getLegalTeamMemberRole = async (email: string): Promise<string | null> => {
    if (!email)
        return null;

    const legalTeamRef = collection(db, "legalTeam");
    const legalTeamQuery = query(legalTeamRef, where("email", "==", email.toLowerCase()));
    const legalTeamSnapshot = await getDocs(legalTeamQuery);

    if (legalTeamSnapshot.empty) {
        return null;
    }

    return "Legal Team";
};

export const isUserManagementTeam = async (email: string): Promise<boolean> => {
    if (!email)
        return false;

    const roleStartTime = performance.now();

    try {
        const roles = await getUserRoles(email);

        if (roles !== null) {
            const roleEndTime = performance.now();
            return roles.isManagementTeam;
        }

        return await isUserManagementTeamOriginal(email);
    } catch (error) {
        return await isUserManagementTeamOriginal(email);
    }
};

export const getManagementTeamMemberRole = async (email: string): Promise<string | null> => {
    if (!email)
        return null;

    const managementTeamRef = collection(db, "managementTeam");
    const managementTeamQuery = query(managementTeamRef, where("email", "==", email.toLowerCase()));
    const managementTeamSnapshot = await getDocs(managementTeamQuery);

    if (managementTeamSnapshot.empty) {
        return null;
    }

    return "Management Team";
};

export const isUserApprover = async (email: string): Promise<boolean> => {
    if (!email)
        return false;

    const roleStartTime = performance.now();

    try {
        const roles = await getUserRoles(email);

        if (roles !== null) {
            const roleEndTime = performance.now();
            return roles.isApprover;
        }

        return await isUserApproverOriginal(email);
    } catch (error) {
        return await isUserApproverOriginal(email);
    }
};

export const addApprover = async (email: string, displayName: string = ""): Promise<void> => {
    const normalizedEmail = email.toLowerCase();
    const isAdmin = await isUserAdmin(normalizedEmail);

    if (isAdmin) {
        throw new Error("User is already an admin. A user cannot have multiple roles.");
    }

    const isLegal = await isUserLegalTeam(normalizedEmail);

    if (isLegal) {
        throw new Error("User is already a legal team member. A user cannot have multiple roles.");
    }

    const isManagement = await isUserManagementTeam(normalizedEmail);

    if (isManagement) {
        throw new Error(
            "User is already a management team member. A user cannot have multiple roles."
        );
    }

    const approversRef = collection(db, "approvers");
    const approverQuery = query(approversRef, where("email", "==", normalizedEmail));
    const approverSnapshot = await getDocs(approverQuery);

    if (approverSnapshot.empty) {
        await addDoc(approversRef, {
            email: normalizedEmail,
            displayName,
            createdAt: new Date().toISOString()
        });
    } else
        {}

    try {
        const now = new Date().toISOString();
        const userRolesRef = doc(db, "userRoles", normalizedEmail);
        const userRoleDoc = await getDoc(userRolesRef);

        if (!userRoleDoc.exists()) {
            const userRolesData = {
                email: normalizedEmail,
                isAdmin: false,
                isLegalTeam: false,
                isManagementTeam: false,
                isApprover: true,
                createdAt: now,
                updatedAt: now
            };

            await setDoc(userRolesRef, userRolesData);
        } else {
            await updateDoc(userRolesRef, {
                isApprover: true,
                updatedAt: now
            });
        }
    } catch (error) {}
};

export const getApprovers = async (): Promise<any[]> => {
    const approversRef = collection(db, "approvers");
    const approversSnapshot = await getDocs(approversRef);

    return approversSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

export const removeApprover = async (id: string): Promise<void> => {
    const approverRef = doc(db, "approvers", id);
    const approverDoc = await getDoc(approverRef);

    if (!approverDoc.exists()) {
        throw new Error("Approver not found");
    }

    const approverData = approverDoc.data();
    const email = approverData.email?.toLowerCase();

    if (!email) {
        throw new Error("Approver email not found in document");
    }

    await deleteDoc(approverRef);

    try {
        const userRolesRef = doc(db, "userRoles", email);
        const userRoleDoc = await getDoc(userRolesRef);

        if (userRoleDoc.exists()) {
            await updateDoc(userRolesRef, {
                isApprover: false,
                updatedAt: new Date().toISOString()
            });
        }
    } catch (error) {}
};

export const getApproverRole = async (email: string): Promise<string | null> => {
    if (!email)
        return null;

    const approversRef = collection(db, "approvers");
    const approverQuery = query(approversRef, where("email", "==", email.toLowerCase()));
    const approverSnapshot = await getDocs(approverQuery);

    if (approverSnapshot.empty) {
        return null;
    }

    return "Approver";
};

export const normalizeApprovers = (contract: Contract): Contract => {
    if (!contract.approvers) {
        return {
            ...contract,

            approvers: {
                legal: [],
                management: [],
                approver: []
            },

            approverLimits: {
                legal: 2,
                management: 5,
                approver: 1
            }
        };
    }

    const normalizedApprovers: {
        legal: Array<{
            email: string;
            name: string;
            approved: boolean;
            declined?: boolean;
            approvedAt?: string;
            declinedAt?: string;
        }>;
        management: Array<{
            email: string;
            name: string;
            approved: boolean;
            declined?: boolean;
            approvedAt?: string;
            declinedAt?: string;
        }>;
        approver: Array<{
            email: string;
            name: string;
            approved: boolean;
            declined?: boolean;
            approvedAt?: string;
            declinedAt?: string;
        }>;
    } = {
        legal: [],
        management: [],
        approver: []
    };

    const approverLimits = contract.approverLimits || {
        legal: 2,
        management: 5,
        approver: 1
    };

    if (contract.approvers.legal) {
        if (!Array.isArray(contract.approvers.legal)) {
            normalizedApprovers.legal = [contract.approvers.legal];
        } else {
            normalizedApprovers.legal = contract.approvers.legal;
        }
    }

    if (contract.approvers.management) {
        if (!Array.isArray(contract.approvers.management)) {
            normalizedApprovers.management = [contract.approvers.management];
        } else {
            normalizedApprovers.management = contract.approvers.management;
        }
    }

    if (contract.approvers.approver) {
        if (!Array.isArray(contract.approvers.approver)) {
            normalizedApprovers.approver = [contract.approvers.approver];
        } else {
            normalizedApprovers.approver = contract.approvers.approver;
        }
    }

    return {
        ...contract,
        approvers: normalizedApprovers,
        approverLimits
    };
};

export const removeUser = async (id: string, adminEmail: string = ""): Promise<void> => {
    const userRef = doc(db, "users", id);
    const userSnapshot = await getDoc(userRef);

    if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        const email = userData.email?.toLowerCase();
        const userId = userData.userId;
        await deleteDoc(userRef);

        try {
            const {
                deleteAuthUser
            } = await import("./delete-auth-user");

            await deleteAuthUser(email);
            const deletedUsersRef = collection(db, "deleted_users");

            await addDoc(deletedUsersRef, {
                email,
                userId,
                deletedAt: new Date().toISOString(),
                deletedBy: adminEmail,
                firestore_deleted: true,
                auth_deleted_manually: false
            });
        } catch (error) {
            const deletedUsersRef = collection(db, "deleted_users");

            await addDoc(deletedUsersRef, {
                email,
                userId,
                deletedAt: new Date().toISOString(),
                deletedBy: adminEmail,
                firestore_deleted: true,
                auth_deleted_manually: false,
                deletion_error: (error as Error).message
            });
        }
    } else {
        return;
    }
};

export const updateUserProfile = async (
    userId: string,
    firstName: string = "",
    lastName: string = "",
    displayName: string = ""
): Promise<void> => {
    try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (user && user.uid === userId) {
            await updateProfile(user, {
                displayName: displayName
            });
        }

        const usersRef = collection(db, "users");
        const userQuery = query(usersRef, where("userId", "==", userId));
        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
            const userDoc = userSnapshot.docs[0];

            await updateDoc(doc(db, "users", userDoc.id), {
                firstName,
                lastName,
                displayName
            });
        }
    } catch (error) {
        throw error;
    }
};

export const updateUserPassword = async (user: any, currentPassword: string, newPassword: string): Promise<void> => {
    if (!user || !user.email) {
        throw new Error("User is required to update password");
    }

    try {
        const {
            EmailAuthProvider,
            reauthenticateWithCredential,
            updatePassword
        } = await import("firebase/auth");

        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword);
    } catch (error: any) {
        if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
            throw new Error("Current password is incorrect");
        }

        throw error;
    }
};

export const isPasswordChangeRequired = async (email: string): Promise<boolean> => {
    if (!email)
        return false;

    const normalizedEmail = email.toLowerCase();
    const usersRef = collection(db, "users");
    const userQuery = query(usersRef, where("email", "==", normalizedEmail));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
        return false;
    }

    const userData = userSnapshot.docs[0].data();
    return userData.passwordChangeRequired === true;
};

export const updatePasswordChangeRequired = async (email: string, required: boolean): Promise<void> => {
    if (!email)
        return;

    const normalizedEmail = email.toLowerCase();
    const usersRef = collection(db, "users");
    const userQuery = query(usersRef, where("email", "==", normalizedEmail));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
        return;
    }

    const userDoc = userSnapshot.docs[0];

    await updateDoc(doc(db, "users", userDoc.id), {
        passwordChangeRequired: required,
        updatedAt: new Date().toISOString()
    });
};

export const doesUserExist = async (email: string): Promise<boolean> => {
    if (!email)
        return false;

    const deletedUsersRef = collection(db, "deleted_users");
    const deletedUserQuery = query(deletedUsersRef, where("email", "==", email.toLowerCase()));
    const deletedUserSnapshot = await getDocs(deletedUserQuery);

    if (!deletedUserSnapshot.empty) {
        return false;
    }

    const adminRef = collection(db, "admin");
    const adminQuery = query(adminRef, where("email", "==", email.toLowerCase()));
    const adminSnapshot = await getDocs(adminQuery);

    if (!adminSnapshot.empty) {
        return true;
    }

    const usersRef = collection(db, "users");
    const userQuery = query(usersRef, where("email", "==", email.toLowerCase()));
    const userSnapshot = await getDocs(userQuery);
    return !userSnapshot.empty;
};

export const getUserContracts = async (userEmail: string, includeArchived: boolean = false): Promise<Contract[]> => {
    if (!userEmail)
        return [];

    const lowercaseEmail = userEmail.toLowerCase();
    const contracts = await getContracts(includeArchived);

    return contracts.filter(contract => {
        if (contract.owner.toLowerCase() === lowercaseEmail)
            return true;

        const parties = contract.parties || [];
        const isParty = parties.some(party => party.email.toLowerCase() === lowercaseEmail);

        if (isParty)
            return true;

        const normalizedContract = normalizeApprovers(contract);

        if (normalizedContract.approvers?.legal) {
            const legalApprovers = Array.isArray(normalizedContract.approvers.legal) ? normalizedContract.approvers.legal : [normalizedContract.approvers.legal];
            const userLegalApprover = legalApprovers.find(approver => approver.email.toLowerCase() === lowercaseEmail);

            if (userLegalApprover) {
                return true;
            }
        }

        if (normalizedContract.approvers?.management) {
            const managementApprovers = Array.isArray(normalizedContract.approvers.management) ? normalizedContract.approvers.management : [normalizedContract.approvers.management];
            const userManagementApprover = managementApprovers.find(approver => approver.email.toLowerCase() === lowercaseEmail);

            if (userManagementApprover) {
                return true;
            }
        }

        if (normalizedContract.approvers?.approver) {
            const userApprover = normalizedContract.approvers.approver.find(approver => approver.email.toLowerCase() === lowercaseEmail);

            if (userApprover) {
                return true;
            }
        }

        return false;
    });
};

export const getUserArchivedContracts = async (userEmail: string): Promise<Contract[]> => {
    if (!userEmail)
        return [];

    const isAdmin = await isUserAdmin(userEmail);

    if (isAdmin) {
        return getArchivedContracts();
    }

    const lowercaseEmail = userEmail.toLowerCase();
    const archivedContracts = await getArchivedContracts();

    const userArchivedContracts = archivedContracts.filter(contract => {
        if (contract.owner.toLowerCase() === lowercaseEmail) {
            return true;
        }

        const isParty = contract.parties.some(party => party.email.toLowerCase() === lowercaseEmail);

        if (isParty) {
            return true;
        }

        const normalizedContract = normalizeApprovers(contract);

        if (normalizedContract.approvers?.legal) {
            const legalApprovers = Array.isArray(normalizedContract.approvers.legal) ? normalizedContract.approvers.legal : [normalizedContract.approvers.legal];
            const userLegalApprover = legalApprovers.find(approver => approver.email.toLowerCase() === lowercaseEmail);

            if (userLegalApprover) {
                return true;
            }
        }

        if (normalizedContract.approvers?.management) {
            const managementApprovers = Array.isArray(normalizedContract.approvers.management) ? normalizedContract.approvers.management : [normalizedContract.approvers.management];
            const userManagementApprover = managementApprovers.find(approver => approver.email.toLowerCase() === lowercaseEmail);

            if (userManagementApprover) {
                return true;
            }
        }

        if (normalizedContract.approvers?.approver) {
            const userApprover = normalizedContract.approvers.approver.find(approver => approver.email.toLowerCase() === lowercaseEmail);

            if (userApprover) {
                return true;
            }
        }

        return false;
    });

    return userArchivedContracts;
};

export const getUserContractStats = async (userEmail: string): Promise<ContractStats> => {
    try {
        const contracts = await getUserContracts(userEmail);
        const now = new Date();
        const currentYear = now.getFullYear();
        const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        const totalContracts = contracts.length;
        const finishedContracts = contracts.filter(c => c.status === "contract_end").length;

        const pendingApprovalContracts = contracts.filter(
            c => c.status === "legal_review" || c.status === "management_review" || c.status === "legal_send_back" || c.status === "management_send_back" || c.status === "approval" || c.status === "draft" || c.status === "requested"
        ).length;

        const expiringContracts = contracts.filter(c => {
            if (!c.endDate) {
                return false;
            }

            try {
                const endDate = new Date(c.endDate);

                if (isNaN(endDate.getTime())) {
                    return false;
                }

                const isExpiringSoon = endDate <= thirtyDaysFromNow && endDate >= now;
                return isExpiringSoon;
            } catch (error) {
                return false;
            }
        }).length;

        const totalValue = contracts.reduce((sum, contract) => {
            return sum + (contract.value || 0);
        }, 0);

        const expiringThisYear = contracts.filter(c => {
            if (!c.endDate) {
                return false;
            }

            try {
                const endDate = new Date(c.endDate);

                if (isNaN(endDate.getTime())) {
                    return false;
                }

                const isExpiringThisYear = endDate.getFullYear() === currentYear;
                return isExpiringThisYear;
            } catch (error) {
                return false;
            }
        }).length;

        const stats = {
            totalContracts,
            finishedContracts,
            pendingApprovalContracts,
            expiringContracts,
            totalValue,
            expiringThisYear
        };

        return stats;
    } catch (error) {
        throw error;
    }
};

export const getUserRoles = async (email: string): Promise<{
    isAdmin: boolean;
    isLegalTeam: boolean;
    isManagementTeam: boolean;
    isApprover: boolean;
} | null> => {
    if (!email)
        return null;

    try {
        const startTime = performance.now();
        const userRolesRef = doc(db, "userRoles", email.toLowerCase());
        const userRoleDoc = await getDoc(userRolesRef);
        const endTime = performance.now();

        if (!userRoleDoc.exists()) {
            const migratedRoles = await migrateUserRoles(email);
            return migratedRoles;
        }

        const roleData = userRoleDoc.data();

        return {
            isAdmin: roleData.isAdmin || false,
            isLegalTeam: roleData.isLegalTeam || false,
            isManagementTeam: roleData.isManagementTeam || false,
            isApprover: roleData.isApprover || false
        };
    } catch (error) {
        return null;
    }
};

export const updateUserRoles = async (
    email: string,
    roles: {
        isAdmin?: boolean;
        isLegalTeam?: boolean;
        isManagementTeam?: boolean;
        isApprover?: boolean;
    }
): Promise<void> => {
    if (!email)
        return;

    try {
        const normalizedEmail = email.toLowerCase();
        const userRolesRef = doc(db, "userRoles", normalizedEmail);
        const userRoleDoc = await getDoc(userRolesRef);
        const now = new Date().toISOString();

        const userData = {
            email: normalizedEmail,
            ...roles,
            updatedAt: now
        };

        if (!userRoleDoc.exists()) {
            await setDoc(userRolesRef, {
                ...userData,
                createdAt: now
            });
        } else {
            await updateDoc(userRolesRef, userData);
        }
    } catch (error) {
        throw error;
    }
};

export const migrateUserRoles = async (email: string): Promise<{
    isAdmin: boolean;
    isLegalTeam: boolean;
    isManagementTeam: boolean;
    isApprover: boolean;
}> => {
    if (!email) {
        return {
            isAdmin: false,
            isLegalTeam: false,
            isManagementTeam: false,
            isApprover: false
        };
    }

    const migrationStartTime = performance.now();

    const [admin, legal, management, approver] = await Promise.all([
        isUserAdminOriginal(email),
        isUserLegalTeamOriginal(email),
        isUserManagementTeamOriginal(email),
        isUserApproverOriginal(email)
    ]);

    const roles = {
        isAdmin: admin,
        isLegalTeam: legal,
        isManagementTeam: management,
        isApprover: approver
    };

    try {
        await updateUserRoles(email, roles);
    } catch (error) {}

    const migrationEndTime = performance.now();
    return roles;
};

export const isUserAdminOriginal = isUserAdmin;
export const isUserLegalTeamOriginal = isUserLegalTeam;
export const isUserManagementTeamOriginal = isUserManagementTeam;
export const isUserApproverOriginal = isUserApprover;

export const initializeUserRolesCollection = async (currentUserEmail?: string): Promise<void> => {
    try {
        if (currentUserEmail) {
            const isAdmin = await isUserAdmin(currentUserEmail);

            if (!isAdmin) {
                throw new Error("Unauthorized: Only administrators can initialize user roles");
            }
        }

        const userRolesRef = collection(db, "userRoles");
        const userRolesSnapshot = await getDocs(userRolesRef);

        if (!userRolesSnapshot.empty) {
            const batch = writeBatch(db);

            userRolesSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
        }

        const adminRef = collection(db, "admin");
        const legalTeamRef = collection(db, "legalTeam");
        const managementTeamRef = collection(db, "managementTeam");
        const approversRef = collection(db, "approvers");
        const adminSnapshot = await getDocs(adminRef);
        const legalTeamSnapshot = await getDocs(legalTeamRef);
        const managementTeamSnapshot = await getDocs(managementTeamRef);
        const approversSnapshot = await getDocs(approversRef);

        const userRolesMap = new Map<string, {
            isAdmin: boolean;
            isLegalTeam: boolean;
            isManagementTeam: boolean;
            isApprover: boolean;
            email: string;
        }>();

        adminSnapshot.forEach(doc => {
            const data = doc.data();
            const email = data.email?.toLowerCase();

            if (!email) {
                return;
            }

            const existingRoles = userRolesMap.get(email) || {
                isAdmin: false,
                isLegalTeam: false,
                isManagementTeam: false,
                isApprover: false,
                email
            };

            existingRoles.isAdmin = true;
            userRolesMap.set(email, existingRoles);
        });

        legalTeamSnapshot.forEach(doc => {
            const data = doc.data();
            const email = data.email?.toLowerCase();

            if (!email) {
                return;
            }

            const existingRoles = userRolesMap.get(email) || {
                isAdmin: false,
                isLegalTeam: false,
                isManagementTeam: false,
                isApprover: false,
                email
            };

            existingRoles.isLegalTeam = true;
            userRolesMap.set(email, existingRoles);
        });

        managementTeamSnapshot.forEach(doc => {
            const data = doc.data();
            const email = data.email?.toLowerCase();

            if (!email) {
                return;
            }

            const existingRoles = userRolesMap.get(email) || {
                isAdmin: false,
                isLegalTeam: false,
                isManagementTeam: false,
                isApprover: false,
                email
            };

            existingRoles.isManagementTeam = true;
            userRolesMap.set(email, existingRoles);
        });

        approversSnapshot.forEach(doc => {
            const data = doc.data();
            const email = data.email?.toLowerCase();

            if (!email) {
                return;
            }

            const existingRoles = userRolesMap.get(email) || {
                isAdmin: false,
                isLegalTeam: false,
                isManagementTeam: false,
                isApprover: false,
                email
            };

            existingRoles.isApprover = true;
            userRolesMap.set(email, existingRoles);
        });

        if (userRolesMap.size === 0) {
            return;
        }

        const batch = writeBatch(db);
        const now = new Date().toISOString();

        userRolesMap.forEach(roles => {
            const userRoleDocRef = doc(db, "userRoles", roles.email);

            batch.set(userRoleDocRef, {
                ...roles,
                createdAt: now,
                updatedAt: now
            });
        });

        await batch.commit();
    } catch (error) {
        throw error;
    }
};

export const markUserDeletedInAuth = async (email: string, adminEmail: string = ""): Promise<void> => {
    try {
        const deletedUsersRef = collection(db, "deleted_users");
        const q = query(deletedUsersRef, where("email", "==", email.toLowerCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return;
        }

        const userDoc = querySnapshot.docs[0];

        await updateDoc(doc(db, "deleted_users", userDoc.id), {
            auth_deleted_manually: true,
            auth_deleted_at: new Date().toISOString(),
            auth_deleted_by: adminEmail
        });
    } catch (error) {
        throw error;
    }
};

export interface SystemSettings {
    archiveRetentionDays: number;
    autoDeleteEnabled: boolean;
    lastUpdated?: string;
    updatedBy?: string;
}

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
    archiveRetentionDays: 30,
    autoDeleteEnabled: true
};

export const getSystemSettings = async (): Promise<SystemSettings> => {
    const settingsDoc = doc(db, "systemSettings", "general");

    try {
        const settingsSnapshot = await getDoc(settingsDoc);

        if (!settingsSnapshot.exists()) {
            await setDoc(settingsDoc, DEFAULT_SYSTEM_SETTINGS);
            return DEFAULT_SYSTEM_SETTINGS;
        }

        return settingsSnapshot.data() as SystemSettings;
    } catch (error) {
        return DEFAULT_SYSTEM_SETTINGS;
    }
};

export const updateSystemSettings = async (
    settings: Partial<SystemSettings>,
    updater: {
        email: string;
        displayName?: string | null;
    }
): Promise<void> => {
    const isAdmin = await isUserAdmin(updater.email);

    if (!isAdmin) {
        throw new Error("Unauthorized: Only administrators can update system settings");
    }

    const settingsDoc = doc(db, "systemSettings", "general");
    const now = new Date().toISOString();

    try {
        const currentSettings = await getSystemSettings();

        const updatedSettings = {
            ...currentSettings,
            ...settings,
            lastUpdated: now,
            updatedBy: updater.email
        };

        await setDoc(settingsDoc, updatedSettings);
    } catch (error) {
        throw error;
    }
};

export const processAutomaticContractDeletion = async (forceDeleteAll: boolean = false): Promise<number> => {
    try {
        const settings = await getSystemSettings();

        if (!settings.autoDeleteEnabled && !forceDeleteAll) {
            return 0;
        }

        const archivedContracts = await getArchivedContracts();
        const now = new Date();
        let deletedCount = 0;

        for (const contract of archivedContracts) {
            if (!contract.archivedAt) {
                continue;
            }

            const archivedDate = new Date(contract.archivedAt);
            const daysSinceArchived = Math.floor((now.getTime() - archivedDate.getTime()) / (1000 * 60 * 60 * 24));

            if (forceDeleteAll || daysSinceArchived >= settings.archiveRetentionDays) {
                if (forceDeleteAll)
                    {} else
                    {}

                await deleteContract(contract.id);
                deletedCount++;
            } else
                {}
        }

        return deletedCount;
    } catch (error) {
        return 0;
    }
};