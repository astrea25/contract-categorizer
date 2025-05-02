import { db } from './firebase';
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
} from 'firebase/firestore';
import { getAuth, deleteUser, updateProfile } from "firebase/auth";
import { auth as firebaseAuth } from "./firebase";
import { createUserAccountViaAPI } from "./auth-api";
import { FirebaseError } from "firebase/app";

export interface ContractStats {
  totalContracts: number;
  finishedContracts: number;
  pendingApprovalContracts: number;
  expiringContracts: number;
  totalValue: number;
  expiringThisYear: number;
}

export type ContractStatus = 'requested' | 'draft' | 'legal_review' | 'management_review' | 'wwf_signing' | 'counterparty_signing' | 'implementation' | 'amendment' | 'contract_end' | 'approval' | 'finished' | 'legal_send_back' | 'management_send_back' |
  // Deprecated status names (kept for backward compatibility)
  'legal_declined' | 'management_declined';
export type ContractType = 'consultancy' | 'wos' | 'service' | 'moa_mou' | 'employment' | 'amendment' | 'grant' | 'subgrant' | 'lease' | 'donation';

export interface Folder {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  contractCount?: number; // Optional for UI display purposes
}

// Define type-specific fields for each contract type based on contract_types file
export interface ConsultancyFields {
  consultantName?: string; // Name of Consultant
  positionTitle?: string; // Position Title
  // Name of Project is already in the main Contract interface as projectName
  // Contract start date is already in the main Contract interface as startDate
  // Contract end date is already in the main Contract interface as endDate
  grossProfessionalFee?: number; // Gross Professional Fee
  paymentSchedules?: string; // Payment Schedules
  costCenter?: string; // Cost Center/Charging
  termsOfReferenceLink?: string; // Terms of Reference (attachable as PDF link)
}

export interface WOSFields {
  serviceProviderName?: string; // Name of Service Provider
  positionTitle?: string; // Position Title
  // Name of Project is already in the main Contract interface as projectName
  // Contract start date is already in the main Contract interface as startDate
  // Contract end date is already in the main Contract interface as endDate
  grossTechnicalServiceFee?: number; // Gross Technical Service Fee
  paymentSchedules?: string; // Payment Schedules
  costCenter?: string; // Cost Center/Charging
  scopeOfWorkLink?: string; // Scope of Work and Output (attachable as PDF link)
}

export interface ServiceAgreementFields {
  serviceProviderName?: string; // Name of Service Provider
  positionTitle?: string; // Position Title
  // Name of Project is already in the main Contract interface as projectName
  // Contract start date is already in the main Contract interface as startDate
  // Contract end date is already in the main Contract interface as endDate
  grossTechnicalServiceFee?: number; // Gross Technical Service Fee
  paymentSchedules?: string; // Payment Schedules
  costCenter?: string; // Cost Center/Charging
  scopeOfWorkLink?: string; // Scope of Work and Output (attachable as PDF link)
}

export interface MOAMOUFields {
  contractingPartyName?: string; // Name of Contracting Party
  registeredAddress?: string; // Registered Business/Office Address
  authorizedRepresentative?: string; // Name of Authorized Representative/Signatory
  authorizedRepresentativeDesignation?: string; // Designation of Authorized Representative
  recitals?: string; // Recitals or Whereas Clauses
  purpose?: string; // Purpose of the agreement
  kkpfiRoles?: string; // Roles of KKPFI
  contractingPartyRoles?: string; // Roles of the contracting party
  mutualObligations?: string; // Mutual obligations (if any)
  // Contract start date is already in the main Contract interface as startDate
  // Contract end date is already in the main Contract interface as endDate
}

export interface EmploymentFields {
  positionTitle?: string; // Position Title
  // Project Name is already in the main Contract interface as projectName
  costCenter?: string; // Cost Center/Charging
  numberOfStaff?: number; // Number of staff needed
  salaryRate?: number; // Salary Rate
  communicationAllowance?: number; // Communication Allowance
  requisitionReason?: 'new_position' | 'additional' | 'replacement'; // Reason for Requisition
  replacementReason?: string; // Specify reason if replacement
  employmentClassification?: 'core' | 'project'; // Classification of employment
  projectDurationMonths?: number; // Number of months if project
}

export interface AmendmentFields {
  originalContractType?: ContractType; // Contract type
  durationAmendment?: string; // Duration
  deliverablesAmendment?: string; // Deliverables
  paymentAmendment?: string; // Payment
  paymentSchedulesAmendment?: string; // Schedules of Payment
}

export interface GrantAgreementFields {
  donorName?: string; // Name of Donor
  donorAddress?: string; // Registered Address of Donor
  // Project Name is already in the main Contract interface as projectName
  projectLocation?: string; // Project Location
  // Contract start date is already in the main Contract interface as startDate
  // Contract end date is already in the main Contract interface as endDate
  primaryDonor?: string; // Primary Donor
  primaryDonorFundingSourceAgreementNumber?: string; // Primary Donor Funding Source Agreement Number
  contractAmount?: number; // Contract Amount
  bankAccountInformation?: string; // Bank Account Information
  paymentSchedules?: string; // Payment Schedules
  donorContacts?: string; // Donor contacts
  kkpfiContacts?: string; // KKPFI contacts
  deliverables?: string; // Deliverables and dates of submission
  authorizedSignatoryName?: string; // Name of Authorized Signatory
  authorizedSignatoryDesignation?: string; // Designation of Authorized Signatory
}

export interface SubgrantFields {
  recipientOrganizationName?: string; // Name of Recipient Organization
  recipientOrganizationAddress?: string; // Registered Address of Recipient Organization
  recipientOrganizationContact?: string; // Contact Details of Recipient Organization
  // Project Name is already in the main Contract interface as projectName
  projectLocation?: string; // Project Location
  // Contract start date is already in the main Contract interface as startDate
  // Contract end date is already in the main Contract interface as endDate
  primaryDonor?: string; // Primary Donor
  primaryDonorFundingSourceAgreementNumber?: string; // Primary Donor Funding Source Agreement Number
  contractAmount?: number; // Contract Amount
  bankAccountInformation?: string; // Bank Account Information
  paymentSchedules?: string; // Payment Schedules
  recipientOrganizationContacts?: string; // Recipient Organization contacts
  kkpfiContacts?: string; // KKPFI contacts
  deliverables?: string; // Deliverables and dates of submission
  authorizedSignatoryName?: string; // Name of Authorized Signatory
  authorizedSignatoryDesignation?: string; // Designation of Authorized Signatory
}

export interface LeaseFields {
  lessorName?: string; // Name of Lessor
  lessorAddress?: string; // Registered Address of Lessor
  propertyDescription?: string; // Description of Property to be Leased
  propertyAddress?: string; // Complete Address of Property
  leasePurpose?: string; // Purpose of Lease
  // Contract start date is already in the main Contract interface as startDate
  // Contract end date is already in the main Contract interface as endDate
  monthlyRentalFee?: number; // Amount of Monthly Rental Fee
  paymentDueDate?: string; // Due Date of Payment
  costCenter?: string; // Cost Center/Charging
}

export interface DonationFields {
  // Name of Project is already in the main Contract interface as projectName
  recipientOrganizationName?: string; // Name of Recipient Organization/Donee
  authorizedRepresentative?: string; // Name of Authorized Representative of Donee
  recipientAddress?: string; // Address of Donee
  // Email Address of Donee is already in the main Contract interface as recipientEmail
  transferPurpose?: string; // Purpose for the transfer of item/equipment
  donatedItems?: string; // List of materials to be donated
  doneeObligations?: string; // Specific Donee Obligations
}

// Union type for all possible type-specific fields
export type ContractTypeFields =
  ConsultancyFields |
  WOSFields |
  ServiceAgreementFields |
  MOAMOUFields |
  EmploymentFields |
  AmendmentFields |
  GrantAgreementFields |
  SubgrantFields |
  LeaseFields |
  DonationFields;

export interface Contract {
  id: string;
  title: string;
  projectName: string;
  type: ContractType;
  status: ContractStatus;
  owner: string;
  recipientEmail?: string; // Email of the recipient for notifications
  folderId?: string; // Optional reference to the folder ID
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
  archived?: boolean; // Flag to indicate if contract is archived
  archivedAt?: string; // When the contract was archived
  archivedBy?: string; // Who archived the contract
  lastActivityAt?: string; // Timestamp of the last activity on the contract
  inactivityNotificationDays?: number; // Number of days of inactivity before sending a notification
  // Amendment tracking
  isAmended?: boolean; // Flag to indicate if contract has been amended
  amendmentStage?: 'amendment' | 'legal' | 'wwf' | 'counterparty'; // Current stage in the amendment process
  // Type-specific fields
  typeSpecificFields?: ContractTypeFields;
  // Timeline and comments
  timeline?: {
    timestamp: string;
    action: string;
    userEmail: string;
    userName?: string; // Added optional user name for display
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
    }; // Support both array and single object for backward compatibility
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
    }; // Support both array and single object for backward compatibility
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
  userName?: string; // Display name for the comment
  timestamp: string;
  replies?: Comment[];
}

// ShareInvite interface removed

export const statusColors: Record<ContractStatus, { bg: string; text: string; border: string }> = {
  requested: {
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200'
  },
  draft: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200'
  },
  legal_review: {
    bg: 'bg-purple-50',
    text: 'text-purple-800',
    border: 'border-purple-200'
  },
  management_review: {
    bg: 'bg-orange-50',
    text: 'text-orange-800',
    border: 'border-orange-200'
  },
  wwf_signing: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-800',
    border: 'border-indigo-200'
  },
  counterparty_signing: {
    bg: 'bg-pink-50',
    text: 'text-pink-800',
    border: 'border-pink-200'
  },
  implementation: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-800',
    border: 'border-cyan-200'
  },
  amendment: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200'
  },
  contract_end: {
    bg: 'bg-slate-50',
    text: 'text-slate-800',
    border: 'border-slate-200'
  },
  legal_send_back: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200'
  },
  management_send_back: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200'
  },
  // Keep the old status names for backward compatibility
  // Deprecated status names (kept for backward compatibility)
  legal_declined: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200'
  },
  management_declined: {
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200'
  },
  approval: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-800',
    border: 'border-yellow-200'
  },
  finished: {
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-200'
  }
};

export const contractTypeLabels: Record<ContractType, string> = {
  consultancy: 'Consultancy',
  wos: 'Work Order for Services (WOS)',
  service: 'Service Agreement',
  moa_mou: 'Memorandum of Agreement/Understanding (MOA/MOU)',
  employment: 'Employment Contract',
  amendment: 'Request for Amendment',
  grant: 'Grant Agreement',
  subgrant: 'Subgrant Agreement',
  lease: 'Lease Contract',
  donation: 'Deed of Donation'
};

export const getContracts = async (includeArchived: boolean = false): Promise<Contract[]> => {
  // The where('archived', '!=', true) query doesn't work as expected
  // because it only returns documents where the field exists and is not true
  // It doesn't return documents where the field doesn't exist

  // Instead, we'll get all contracts and filter them in memory
  const contractsCollection = collection(db, 'contracts');

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
        documentLink: data.documentLink,
      } as Contract;
    });

    // Filter out archived contracts if needed
    if (!includeArchived) {
      contracts = contracts.filter(contract => !contract.archived);
    }

    return contracts;
  } catch (error) {
    throw error;
  }
};

export const getArchivedContracts = async (): Promise<Contract[]> => {
  const contractsCollection = collection(db, 'contracts');

  try {
    // Use query to get only archived contracts
    const contractsQuery = query(
      contractsCollection,
      where('archived', '==', true)
    );

    const contractsSnapshot = await getDocs(contractsQuery);

    if (contractsSnapshot.empty) {
      // Double-check with a full query to see if there are any archived contracts at all
      const allContractsSnapshot = await getDocs(contractsCollection);
      const allContractsWithArchived = allContractsSnapshot.docs.filter(doc =>
        doc.data().archived === true
      );

      if (allContractsWithArchived.length > 0) {
        // Return manually filtered documents if the query isn't working
        return allContractsWithArchived.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
            updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt) : null,
            archivedAt: data.archivedAt ? (data.archivedAt.toDate ? data.archivedAt.toDate().toISOString() : data.archivedAt) : null,
            startDate: data.startDate,
            endDate: data.endDate,
            documentLink: data.documentLink,
          } as Contract;
        });
      }

      return [];
    }

    const contracts = contractsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
        updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt) : null,
        archivedAt: data.archivedAt ? (data.archivedAt.toDate ? data.archivedAt.toDate().toISOString() : data.archivedAt) : null,
        startDate: data.startDate,
        endDate: data.endDate,
        documentLink: data.documentLink,
      } as Contract;
    });

    return contracts;
  } catch (error) {
    throw error;
  }
};

export const getContract = async (id: string): Promise<Contract | null> => {
  try {
    const contractDoc = doc(db, 'contracts', id);
    const contractSnapshot = await getDoc(contractDoc);

    if (!contractSnapshot.exists()) {
      return null;
    }

    const data = contractSnapshot.data();

    // Convert Firestore timestamps to ISO strings
    const formattedContract = {
      id: contractSnapshot.id,
      ...data,
      createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
      updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt) : null,
      archivedAt: data.archivedAt ? (data.archivedAt.toDate ? data.archivedAt.toDate().toISOString() : data.archivedAt) : null,
      startDate: data.startDate,
      endDate: data.endDate,
      documentLink: data.documentLink,
      // Ensure timeline is properly formatted
      timeline: data.timeline ? data.timeline.map((item: any) => ({
        ...item,
        timestamp: item.timestamp && item.timestamp.toDate ? item.timestamp.toDate().toISOString() : item.timestamp
      })) : [],
      // Ensure comments are properly formatted
      comments: data.comments || []
    } as Contract;

    return formattedContract;
  } catch (error) {
    console.error('Error fetching contract:', error);
    throw error;
  }
};

// Define a custom interface for contract updates that includes _customTimelineEntry
interface ContractUpdateWithCustomTimeline extends Partial<Omit<Contract, 'id' | 'createdAt'>> {
  _customTimelineEntry?: {
    action: string;
    details?: string;
    userEmail?: string;
    userName?: string;
  };
}

export const createContract = async (
  contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>,
  creator: { email: string; displayName?: string | null }
): Promise<string> => {
  const now = Timestamp.now();
  const initialStatus = contract.status || 'requested';

  // Create the initial timeline entry
  const initialTimelineEntry = {
    timestamp: now.toDate().toISOString(),
    action: 'Contract Created with Requested Status',
    userEmail: creator.email,
    userName: creator.displayName || creator.email.split('@')[0] || 'User', // Use email username or 'User' as fallback
    details: 'Contract was initially created'
  };

  // Create a clean contract object without any undefined values
  const cleanContract = JSON.parse(JSON.stringify(contract));

  // Ensure owner is set and not undefined
  if (!cleanContract.owner || cleanContract.owner === 'undefined') {
    cleanContract.owner = creator.email || 'Unassigned';
  }

  // Ensure parties have names
  if (cleanContract.parties && Array.isArray(cleanContract.parties)) {
    cleanContract.parties = cleanContract.parties.map(party => ({
      ...party,
      name: party.name || party.email?.split('@')[0] || 'User'
    }));
  }

  const newContract = {
    ...cleanContract,
    status: initialStatus,
    owner: cleanContract.owner, // Use the cleaned owner value
    createdAt: now.toDate().toISOString(),
    updatedAt: now.toDate().toISOString(),
    lastActivityAt: now.toDate().toISOString(), // Initialize the last activity timestamp
    archived: false,
    timeline: [initialTimelineEntry]
  };

  // Initialize approvers with empty objects if not present
  if (!newContract.approvers) {
    newContract.approvers = {};
  }

  // Set default approver limits if not present
  if (!newContract.approverLimits) {
    newContract.approverLimits = {
      legal: 2,
      management: 5,
      approver: 1
    };
  }

  const docRef = await addDoc(collection(db, 'contracts'), newContract);
  return docRef.id;
};

export const updateContract = async (
  id: string,
  contractUpdates: ContractUpdateWithCustomTimeline,
  editor: { email: string; displayName?: string | null }
): Promise<void> => {
  const contractDoc = doc(db, 'contracts', id);
  const now = Timestamp.now();

  // Fetch the current contract data to compare changes
  const currentContractSnap = await getDoc(contractDoc);
  if (!currentContractSnap.exists()) {
    throw new Error('Contract not found');
  }
  const currentContractData = currentContractSnap.data() as Contract;

  // Create a clean contract updates object without any undefined values
  const cleanContractUpdates = JSON.parse(JSON.stringify(contractUpdates));

  // Prepare the update data
  const updateData: Record<string, any> = {
    ...cleanContractUpdates,
    updatedAt: now.toDate().toISOString(),
    lastActivityAt: now.toDate().toISOString(), // Update the last activity timestamp
  };

  // Prepare timeline entries based on changes
  const newTimelineEntries: any[] = [];

  // Check for changes in specific fields and create timeline entries
  if (contractUpdates.title && contractUpdates.title !== currentContractData.title) {
    newTimelineEntries.push({
      timestamp: now.toDate().toISOString(),
      action: 'Title Updated',
      userEmail: editor.email,
      userName: editor.displayName || editor.email.split('@')[0] || 'User', // Use email username or 'User' as fallback
      details: `Changed from "${currentContractData.title}" to "${contractUpdates.title}"`
    });
  }
  if (contractUpdates.projectName && contractUpdates.projectName !== currentContractData.projectName) {
    newTimelineEntries.push({
      timestamp: now.toDate().toISOString(),
      action: 'Project Name Updated',
      userEmail: editor.email,
      userName: editor.displayName || editor.email.split('@')[0] || 'User', // Use email username or 'User' as fallback
      details: `Changed from "${currentContractData.projectName}" to "${contractUpdates.projectName}"`
    });
  }
  if (contractUpdates.description && contractUpdates.description !== currentContractData.description) {
    newTimelineEntries.push({
      timestamp: now.toDate().toISOString(),
      action: 'Description Updated',
      userEmail: editor.email,
      userName: editor.displayName || editor.email.split('@')[0] || 'User' // Use email username or 'User' as fallback
      // Details might be too long for description, omit for brevity or consider summarizing
    });
  }
  if (contractUpdates.type && contractUpdates.type !== currentContractData.type) {
    newTimelineEntries.push({
      timestamp: now.toDate().toISOString(),
      action: 'Type Updated',
      userEmail: editor.email,
      userName: editor.displayName || editor.email.split('@')[0] || 'User', // Use email username or 'User' as fallback
      details: `Changed from ${contractTypeLabels[currentContractData.type]} to ${contractTypeLabels[contractUpdates.type]}`
    });
  }
  if (contractUpdates.status && contractUpdates.status !== currentContractData.status) {
    const formattedStatus = contractUpdates.status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    const timelineEntry = {
      timestamp: now.toDate().toISOString(),
      action: `Status Changed to ${formattedStatus}`,
      userEmail: editor.email,
      userName: editor.displayName || editor.email.split('@')[0] || 'User', // Use email username or 'User' as fallback
      // Details are implicit in the action
    };

    newTimelineEntries.push(timelineEntry);
  }
  if (contractUpdates.startDate && contractUpdates.startDate !== currentContractData.startDate) {
    newTimelineEntries.push({
      timestamp: now.toDate().toISOString(),
      action: 'Start Date Updated',
      userEmail: editor.email,
      userName: editor.displayName || editor.email.split('@')[0] || 'User', // Use email username or 'User' as fallback
      details: `Changed from ${currentContractData.startDate} to ${contractUpdates.startDate}`
    });
  }
  if (contractUpdates.endDate !== undefined && contractUpdates.endDate !== currentContractData.endDate) {
    newTimelineEntries.push({
      timestamp: now.toDate().toISOString(),
      action: 'End Date Updated',
      userEmail: editor.email,
      userName: editor.displayName || editor.email.split('@')[0] || 'User', // Use email username or 'User' as fallback
      details: `Changed from ${currentContractData.endDate || 'Ongoing'} to ${contractUpdates.endDate || 'Ongoing'}`
    });
  }
  if (contractUpdates.value !== undefined && contractUpdates.value !== currentContractData.value) {
    newTimelineEntries.push({
      timestamp: now.toDate().toISOString(),
      action: 'Value Updated',
      userEmail: editor.email,
      userName: editor.displayName || editor.email.split('@')[0] || 'User', // Use email username or 'User' as fallback
      details: `Changed from ${currentContractData.value?.toLocaleString() || 'N/A'} to ${contractUpdates.value?.toLocaleString() || 'N/A'}`
    });
  }
  if (contractUpdates.parties && arePartiesDifferent(contractUpdates.parties, currentContractData.parties)) {
    newTimelineEntries.push({
      timestamp: now.toDate().toISOString(),
      action: 'Parties Updated',
      userEmail: editor.email,
      userName: editor.displayName || editor.email.split('@')[0] || 'User' // Use email username or 'User' as fallback
      // Details could list added/removed parties if needed, complex logic omitted
    });
  }
  if (contractUpdates.documentLink !== undefined && contractUpdates.documentLink !== currentContractData.documentLink) {
    newTimelineEntries.push({
      timestamp: now.toDate().toISOString(),
      action: 'Document Link Updated',
      userEmail: editor.email,
      userName: editor.displayName || editor.email.split('@')[0] || 'User' // Use email username or 'User' as fallback
    });
  }
  // Check if we have a custom timeline entry
  if (contractUpdates._customTimelineEntry) {
    // Use the custom timeline entry
    const customEntry = contractUpdates._customTimelineEntry;
    newTimelineEntries.push({
      timestamp: now.toDate().toISOString(),
      action: customEntry.action,
      userEmail: editor.email,
      userName: editor.displayName || editor.email.split('@')[0] || 'User', // Use email username or 'User' as fallback
      details: customEntry.details || ''
    });

    // Remove the custom timeline entry from the updates
    delete contractUpdates._customTimelineEntry;
  }
  // Logic for approvers update might need specific handling if approvers can be updated directly here
  else if (contractUpdates.approvers) {
    // Determine changes in approvers (complex logic potentially needed)
    // For simplicity, just log that approvers were updated
    newTimelineEntries.push({
      timestamp: now.toDate().toISOString(),
      action: 'Approvers Updated',
      userEmail: editor.email,
      userName: editor.displayName || editor.email.split('@')[0] || 'User' // Use email username or 'User' as fallback
      // Add details about which approvers changed if necessary
    });
  }

  // Add new timeline entries to the existing timeline array
  if (newTimelineEntries.length > 0) {
    updateData.timeline = [
      ...(currentContractData.timeline || []),
      ...newTimelineEntries,
    ];
  }

  try {
    await updateDoc(contractDoc, updateData);
  } catch (error) {
    console.error('Error updating contract:', error);
    throw error;
  }
};

// Helper function to compare parties arrays (simple comparison based on stringify)
const arePartiesDifferent = (newParties: any[], oldParties: any[]): boolean => {
  // Ensure stable order for comparison
  const sortParties = (p: any[]) => [...p].sort((a, b) =>
    (a.email || '').localeCompare(b.email || '') || (a.name || '').localeCompare(b.name || ''));

  if (!newParties && !oldParties) return false; // Both are null/undefined
  if (!newParties || !oldParties) return true; // One is null/undefined, the other isn't
  if (newParties.length !== oldParties.length) return true; // Different lengths

  try {
    return JSON.stringify(sortParties(newParties)) !== JSON.stringify(sortParties(oldParties));
  } catch (e) {
    return true; // Assume different if error occurs
  }
};

export const deleteContract = async (id: string): Promise<void> => {
  const contractDoc = doc(db, 'contracts', id);
  await deleteDoc(contractDoc);
};

export const archiveContract = async (
  id: string,
  archiver: { email: string; displayName?: string | null }
): Promise<void> => {
  const contractDoc = doc(db, 'contracts', id);
  const now = Timestamp.now();

  try {
    // Fetch current timeline
    const currentContractSnap = await getDoc(contractDoc);
    const currentTimeline = currentContractSnap.data()?.timeline || [];

    // Create archive timeline entry
    const archiveTimelineEntry = {
      timestamp: now.toDate().toISOString(),
      action: 'Contract Archived',
      userEmail: archiver.email,
      userName: archiver.displayName || '' // Use empty string instead of undefined
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
    console.error('Error archiving contract:', error);
    throw error;
  }
};

export const unarchiveContract = async (
  id: string,
  restorer: { email: string; displayName?: string | null }
): Promise<void> => {
  const contractDoc = doc(db, 'contracts', id);
  const now = Timestamp.now();

  try {
    // Fetch current timeline
    const currentContractSnap = await getDoc(contractDoc);
    const currentTimeline = currentContractSnap.data()?.timeline || [];

    // Create unarchive timeline entry
    const unarchiveTimelineEntry = {
      timestamp: now.toDate().toISOString(),
      action: 'Contract Restored',
      userEmail: restorer.email,
      userName: restorer.displayName || '' // Use empty string instead of undefined
    };

    await updateDoc(contractDoc, {
      archived: false,
      archivedAt: null,
      archivedBy: null,
      updatedAt: now.toDate().toISOString(),
      timeline: [...currentTimeline, unarchiveTimelineEntry]
    });
  } catch (error) {
    console.error('Error unarchiving contract:', error);
    throw error;
  }
};

import { sendNotificationEmail } from './brevoService';

// createShareInvite function removed

// Check if a user is allowed to access the application
export const isUserAllowed = async (email: string): Promise<boolean> => {
  if (!email) return false;

  // First check if the user is in the deleted_users collection
  const deletedUsersRef = collection(db, 'deleted_users');
  const deletedUserQuery = query(deletedUsersRef, where('email', '==', email.toLowerCase()));
  const deletedUserSnapshot = await getDocs(deletedUserQuery);

  if (!deletedUserSnapshot.empty) {
    return false; // User has been deleted and is not allowed to access the application
  }

  // Check admin collection first
  const adminRef = collection(db, 'admin');
  const adminQuery = query(adminRef, where('email', '==', email.toLowerCase()));
  const adminSnapshot = await getDocs(adminQuery);

  if (!adminSnapshot.empty) {
    return true; // User is an admin
  }

  // Check if user is in users collection (newly registered users)
  const usersRef = collection(db, 'users');
  const userQuery = query(usersRef, where('email', '==', email.toLowerCase()));
  const userSnapshot = await getDocs(userQuery);

  if (!userSnapshot.empty) {
    return true; // User exists in users collection
  }

  // No need to check shareInvites collection anymore as we're using users collection with pending status
  return false; // User is not allowed
};

// Check if a user is an admin
export const isUserAdmin = async (email: string): Promise<boolean> => {
  if (!email) return false;

  const roleStartTime = performance.now();

  try {
    // Try to get the consolidated roles first
    const roles = await getUserRoles(email);
    if (roles !== null) {
      const roleEndTime = performance.now();
      return roles.isAdmin;
    }

    // Fallback to original function if consolidated approach fails
    return await isUserAdminOriginal(email);
  } catch (error) {
    // Fallback to original function if consolidated approach fails
    return await isUserAdminOriginal(email);
  }
};

// Add an admin user (for testing)
export const addAdminUser = async (email: string, currentUserEmail?: string, displayName: string = ''): Promise<void> => {
  // First check if the requester is an admin
  if (currentUserEmail) {
    const isAdmin = await isUserAdmin(currentUserEmail);
    if (!isAdmin) {
      throw new Error('Unauthorized: Only administrators can add admin users');
    }
  }

  const normalizedEmail = email.toLowerCase();
  console.log(`[Admin] ${new Date().toISOString()} - Adding admin user: ${normalizedEmail}`);

  // Check if the user is already in the legal team
  const isLegal = await isUserLegalTeam(normalizedEmail);
  if (isLegal) {
    console.log(`[Admin] ${new Date().toISOString()} - User is already in legal team: ${normalizedEmail}`);
    throw new Error('User is already a legal team member. A user cannot have multiple roles.');
  }

  // Check if the user is already in the management team
  const isManagement = await isUserManagementTeam(normalizedEmail);
  if (isManagement) {
    console.log(`[Admin] ${new Date().toISOString()} - User is already in management team: ${normalizedEmail}`);
    throw new Error('User is already a management team member. A user cannot have multiple roles.');
  }

  // Check if the user is already an approver
  const isApprover = await isUserApprover(normalizedEmail);
  if (isApprover) {
    console.log(`[Admin] ${new Date().toISOString()} - User is already an approver: ${normalizedEmail}`);
    throw new Error('User is already an approver. A user cannot have multiple roles.');
  }

  const adminRef = collection(db, 'admin');
  const adminQuery = query(adminRef, where('email', '==', normalizedEmail));
  const adminSnapshot = await getDocs(adminQuery);

  if (adminSnapshot.empty) {
    await addDoc(adminRef, {
      email: normalizedEmail,
      displayName: displayName,
      createdAt: new Date().toISOString()
    });
    console.log(`[Admin] ${new Date().toISOString()} - Added user to admin collection: ${normalizedEmail}`);
  } else {
    console.log(`[Admin] ${new Date().toISOString()} - User already exists in admin collection: ${normalizedEmail}`);
  }

  // Update userRoles document to set isAdmin to true
  try {
    const now = new Date().toISOString();
    const userRolesRef = doc(db, 'userRoles', normalizedEmail);

    // Check if userRoles document already exists
    const userRoleDoc = await getDoc(userRolesRef);

    if (!userRoleDoc.exists()) {
      // Create a new userRoles document with isAdmin set to true and others to false
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
      console.log(`[Admin] ${new Date().toISOString()} - Created userRoles document for admin: ${normalizedEmail}`);
    } else {
      // Update the existing document to set isAdmin to true
      await updateDoc(userRolesRef, {
        isAdmin: true,
        updatedAt: now
      });
      console.log(`[Admin] ${new Date().toISOString()} - Updated userRoles document for admin: ${normalizedEmail}`);
    }
  } catch (error) {
    console.error(`[Admin] ${new Date().toISOString()} - Error updating userRoles document:`, error);
    // Continue even if updating userRoles fails - the user is still added to the admin collection
  }
};

// Remove an admin user
export const removeAdminUser = async (id: string, currentUserEmail?: string): Promise<void> => {
  // First check if the requester is an admin
  if (currentUserEmail) {
    const isAdmin = await isUserAdmin(currentUserEmail);
    if (!isAdmin) {
      throw new Error('Unauthorized: Only administrators can remove admin users');
    }
  }

  // Get the admin document to retrieve the email
  const adminRef = doc(db, 'admin', id);
  const adminDoc = await getDoc(adminRef);

  if (!adminDoc.exists()) {
    throw new Error('Admin user not found');
  }

  const adminData = adminDoc.data();
  const email = adminData.email?.toLowerCase();

  if (!email) {
    throw new Error('Admin email not found in document');
  }

  // Delete from admin collection
  await deleteDoc(adminRef);

  // Update userRoles to set isAdmin to false
  try {
    const userRolesRef = doc(db, 'userRoles', email);
    const userRoleDoc = await getDoc(userRolesRef);

    if (userRoleDoc.exists()) {
      await updateDoc(userRolesRef, {
        isAdmin: false,
        updatedAt: new Date().toISOString()
      });
      console.log(`[Admin] ${new Date().toISOString()} - Updated userRoles document for removed admin: ${email}`);
    }
  } catch (error) {
    console.error(`[Admin] ${new Date().toISOString()} - Error updating userRoles document for removed admin:`, error);
    // Continue even if updating userRoles fails - the user is still removed from the admin collection
  }
};

// updateInviteStatus and getSharedContracts functions removed

export const filterByStatus = (contracts: Contract[], status?: ContractStatus | 'all'): Contract[] => {
  if (!status || status === 'all') return contracts;
  return contracts.filter(contract => contract.status === status);
};

export const filterByType = (contracts: Contract[], type?: ContractType | 'all'): Contract[] => {
  if (!type || type === 'all') return contracts;
  return contracts.filter(contract => contract.type === type);
};

export const filterByProject = (contracts: Contract[], project?: string): Contract[] => {
  if (!project) return contracts;
  return contracts.filter(contract =>
    contract.projectName.toLowerCase().includes(project.toLowerCase())
  );
};

export const filterByOwner = (contracts: Contract[], owner?: string): Contract[] => {
  if (!owner) return contracts;
  return contracts.filter(contract =>
    contract.parties.some(party =>
      (party.name.toLowerCase().includes(owner.toLowerCase()) ||
       party.email.toLowerCase().includes(owner.toLowerCase())) &&
      party.role.toLowerCase() === 'owner'
    )
  );
};

export const filterByParty = (contracts: Contract[], party?: string): Contract[] => {
  if (!party) return contracts;
  return contracts.filter(contract =>
    contract.parties.some(p =>
      p.name.toLowerCase().includes(party.toLowerCase()) ||
      p.email.toLowerCase().includes(party.toLowerCase())
    )
  );
};

export const filterByDateRange = (
  contracts: Contract[],
  startDate?: string | null,
  endDate?: string | null
): Contract[] => {
  if (!startDate && !endDate) return contracts;

  return contracts.filter(contract => {
    try {
      if (startDate && contract.startDate) {
        try {
          // Create date objects and normalize them for comparison
          const contractStartDate = new Date(contract.startDate);
          const filterStartDate = new Date(startDate);

          // Compare dates by converting to simple date strings (YYYY-MM-DD)
          const contractDateStr = contractStartDate.toISOString().split('T')[0];
          const filterDateStr = filterStartDate.toISOString().split('T')[0];

          if (contractDateStr < filterDateStr) {
            return false;
          }
        } catch (e) {
          console.error('Error comparing start dates:', e);
          // Continue with other filters if date comparison fails
        }
      }

      if (endDate && contract.endDate) {
        try {
          // Create date objects and normalize them for comparison
          const contractEndDate = new Date(contract.endDate);
          const filterEndDate = new Date(endDate);

          // Compare dates by converting to simple date strings (YYYY-MM-DD)
          const contractDateStr = contractEndDate.toISOString().split('T')[0];
          const filterDateStr = filterEndDate.toISOString().split('T')[0];

          if (contractDateStr > filterDateStr) {
            return false;
          }
        } catch (e) {
          console.error('Error comparing end dates:', e);
          // Continue with other filters if date comparison fails
        }
      }

      return true;
    } catch (error) {
      console.error('Error in filterByDateRange:', error, {
        contractId: contract.id,
        startDate: contract.startDate,
        endDate: contract.endDate
      });
      return true; // Include the contract if there's an error
    }
  });
};

export const getContractStats = async (): Promise<ContractStats> => {
  try {
    const contracts = await getContracts();

    const now = new Date();
    const currentYear = now.getFullYear();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    // Calculate total contracts (excluding archived ones)
    const totalContracts = contracts.length;

    // Calculate finished contracts
    const finishedContracts = contracts.filter(c => c.status === 'finished').length;

    // Calculate contracts pending approval
    const pendingApprovalContracts = contracts.filter(c => c.status === 'approval').length;

    // Calculate contracts expiring in the next 30 days (only active contracts)
    const expiringContracts = contracts.filter(c => {
      // Skip contracts without end date or finished contracts
      if (!c.endDate || c.status === 'finished') {
        return false;
      }

      try {
        const endDate = new Date(c.endDate);

        if (isNaN(endDate.getTime())) {
          return false;
        }

        // Check if contract expires within the next 30 days
        const isExpiringSoon = endDate <= thirtyDaysFromNow && endDate >= now;
        return isExpiringSoon;
      } catch (error) {
        return false;
      }
    }).length;

    const totalValue = contracts.reduce((sum, contract) => {
      return sum + (contract.value || 0);
    }, 0);

    // Calculate contracts expiring this year (only active contracts)
    const expiringThisYear = contracts.filter(c => {
      // Skip contracts without end date or finished contracts
      if (!c.endDate || c.status === 'finished') {
        return false;
      }

      try {
        const endDate = new Date(c.endDate);

        if (isNaN(endDate.getTime())) {
          return false;
        }

        // Check if contract expires this year
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

// Add a function to register users in the database
export const registerUser = async (
  userId: string,
  email: string,
  firstName: string = '',
  lastName: string = '',
  displayName: string = ''
): Promise<void> => {
  const usersRef = collection(db, 'users');

  // Check if user already exists
  const userQuery = query(usersRef, where('email', '==', email.toLowerCase()));
  const userSnapshot = await getDocs(userQuery);

  // Ensure displayName is set properly
  const finalDisplayName = displayName || `${firstName} ${lastName}`.trim();

  if (userSnapshot.empty) {
    // Create a new user document
    await addDoc(usersRef, {
      userId,
      email: email.toLowerCase(),
      firstName,
      lastName,
      displayName: finalDisplayName,
      role: 'user', // Default role
      createdAt: new Date().toISOString(),
    });

    // If the user was invited (has a pending status), update their status
    // No need to remove from shareInvites collection anymore
  } else {
    // Update existing user document with the display name
    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();

    // Always update with the latest display name
    await updateDoc(doc(db, 'users', userDoc.id), {
      displayName: finalDisplayName || userData.displayName,
      firstName: firstName || userData.firstName || '',
      lastName: lastName || userData.lastName || '',
      updatedAt: new Date().toISOString()
    });
  }
};

// Folder Management Functions
export const getFolders = async (userEmail?: string): Promise<Folder[]> => {
  const foldersCollection = collection(db, 'folders');

  // If userEmail is provided, only get folders created by that user
  let foldersSnapshot;
  if (userEmail) {
    const foldersQuery = query(foldersCollection, where('createdBy', '==', userEmail.toLowerCase()));
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
      updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt) : null,
    } as Folder;
  });

  // For each folder, count how many contracts are assigned to it
  const contracts = await getContracts();
  return folders.map(folder => ({
    ...folder,
    contractCount: contracts.filter(contract => contract.folderId === folder.id).length
  }));
};

export const createFolder = async (
  folder: Omit<Folder, 'id' | 'createdAt' | 'updatedAt' | 'contractCount'>,
): Promise<string> => {
  const now = Timestamp.now();
  const folderToCreate = {
    ...folder,
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await addDoc(collection(db, 'folders'), folderToCreate);
  return docRef.id;
};

export const deleteFolder = async (id: string): Promise<void> => {
  // First, update all contracts in this folder to remove the folder reference
  const contracts = await getContracts();
  const contractsInFolder = contracts.filter(contract => contract.folderId === id);

  for (const contract of contractsInFolder) {
    await updateContract(contract.id, { folderId: null }, { email: 'system@internal', displayName: 'System' });
  }

  // Then delete the folder
  const folderRef = doc(db, 'folders', id);
  await deleteDoc(folderRef);
};

export const assignContractToFolder = async (
  contractId: string,
  folderId: string | null,
  user: { email: string; displayName?: string | null }
): Promise<void> => {
  const contractDoc = doc(db, 'contracts', contractId);
  const now = Timestamp.now();

  // Fetch current contract data to get timeline and folderId
  const currentContractSnap = await getDoc(contractDoc);
  if (!currentContractSnap.exists()) {
    throw new Error('Contract not found');
  }
  const currentData = currentContractSnap.data();
  const currentTimeline = currentData?.timeline || [];
  const currentFolderId = currentData?.folderId;

  if (currentFolderId === folderId) {
    // No change needed
    return;
  }

  // If assigning to a folder (not removing), verify the folder exists
  let folderName = 'Unassigned';

  if (folderId) {
    const folderDoc = doc(db, 'folders', folderId);
    const folderSnap = await getDoc(folderDoc);

    if (!folderSnap.exists()) {
      throw new Error('Folder not found');
    }

    const folderData = folderSnap.data() as Record<string, any>;

    // Set folder name for timeline entry
    folderName = folderData.name || folderId;
  }

  // Create timeline entry for folder change
  const folderTimelineEntry = {
    timestamp: now.toDate().toISOString(),
    action: folderId ? `Moved to Folder: ${folderName}` : 'Removed from Folder',
    userEmail: user.email,
    // Ensure userName is never undefined - use empty string instead
    userName: user.displayName || '',
    details: folderId ? `Assigned to folder ID: ${folderId}` : 'Unassigned from any folder'
  };

  await updateDoc(contractDoc, {
    folderId: folderId,
    updatedAt: now.toDate().toISOString(),
    timeline: [...currentTimeline, folderTimelineEntry]
  });
};

// Filter contracts by folder
export const filterByFolder = (contracts: Contract[], folderId?: string | 'all'): Contract[] => {
  if (!folderId || folderId === 'all') return contracts;

  return contracts.filter(contract => contract.folderId === folderId);
};

export const renameFolder = async (
  id: string,
  updates: { name?: string; description?: string }
): Promise<void> => {
  const folderRef = doc(db, 'folders', id);
  const now = Timestamp.now();

  await updateDoc(folderRef, {
    ...updates,
    updatedAt: now
  });
};

// Add a comment to a contract
export const addComment = async (
  contractId: string,
  text: string,
  userEmail: string,
  userName?: string
): Promise<string> => {
  const contractRef = doc(db, 'contracts', contractId);
  const contract = await getContract(contractId);

  if (!contract) {
    throw new Error('Contract not found');
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

  // Also add an entry to the timeline for the comment
  const existingTimeline = contract.timeline || [];
  const updatedTimeline = [...existingTimeline, {
    timestamp: now.toDate().toISOString(),
    action: 'Comment Added',
    userEmail,
    details: text.length > 50 ? `${text.substring(0, 50)}...` : text
  }];

  await updateDoc(contractRef, {
    timeline: updatedTimeline
  });

  return commentId;
};

// Add a reply to a comment
export const addReply = async (
  contractId: string,
  parentCommentId: string,
  text: string,
  userEmail: string,
  userName?: string
): Promise<string> => {
  const contractRef = doc(db, 'contracts', contractId);
  const contract = await getContract(contractId);

  if (!contract) {
    throw new Error('Contract not found');
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

  // Find the parent comment and add the reply
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

// Delete a comment
export const deleteComment = async (
  contractId: string,
  commentId: string,
  parentCommentId?: string
): Promise<void> => {
  const contractRef = doc(db, 'contracts', contractId);
  const contract = await getContract(contractId);

  if (!contract) {
    throw new Error('Contract not found');
  }

  const existingComments = contract.comments || [];
  let updatedComments: Comment[] = [];

  if (parentCommentId) {
    // It's a reply - find the parent and remove the reply
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
    // It's a top-level comment - remove it completely
    updatedComments = existingComments.filter(comment => comment.id !== commentId);
  }

  await updateDoc(contractRef, {
    comments: updatedComments,
    updatedAt: Timestamp.now()
  });
};

// Add a user to the legal team
export const addLegalTeamMember = async (
  email: string,
  displayName: string = ''
): Promise<void> => {
  const normalizedEmail = email.toLowerCase();
  console.log(`[Legal] ${new Date().toISOString()} - Adding legal team member: ${normalizedEmail}`);

  // Check if the user is already an admin
  const isAdmin = await isUserAdmin(normalizedEmail);
  if (isAdmin) {
    console.log(`[Legal] ${new Date().toISOString()} - User is already an admin: ${normalizedEmail}`);
    throw new Error('User is already an admin. A user cannot have multiple roles.');
  }

  // Check if the user is already in the management team
  const isManagement = await isUserManagementTeam(normalizedEmail);
  if (isManagement) {
    console.log(`[Legal] ${new Date().toISOString()} - User is already in management team: ${normalizedEmail}`);
    throw new Error('User is already a management team member. A user cannot have multiple roles.');
  }

  // Check if the user is already an approver
  const isApprover = await isUserApprover(normalizedEmail);
  if (isApprover) {
    console.log(`[Legal] ${new Date().toISOString()} - User is already an approver: ${normalizedEmail}`);
    throw new Error('User is already an approver. A user cannot have multiple roles.');
  }

  const legalTeamRef = collection(db, 'legalTeam');
  const legalTeamQuery = query(legalTeamRef, where('email', '==', normalizedEmail));
  const legalTeamSnapshot = await getDocs(legalTeamQuery);

  if (legalTeamSnapshot.empty) {
    await addDoc(legalTeamRef, {
      email: normalizedEmail,
      displayName,
      createdAt: new Date().toISOString()
    });
    console.log(`[Legal] ${new Date().toISOString()} - Added user to legal team collection: ${normalizedEmail}`);
  } else {
    console.log(`[Legal] ${new Date().toISOString()} - User already exists in legal team collection: ${normalizedEmail}`);
  }

  // Update userRoles document to set isLegalTeam to true
  try {
    const now = new Date().toISOString();
    const userRolesRef = doc(db, 'userRoles', normalizedEmail);

    // Check if userRoles document already exists
    const userRoleDoc = await getDoc(userRolesRef);

    if (!userRoleDoc.exists()) {
      // Create a new userRoles document with isLegalTeam set to true and others to false
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
      console.log(`[Legal] ${new Date().toISOString()} - Created userRoles document for legal team member: ${normalizedEmail}`);
    } else {
      // Update the existing document to set isLegalTeam to true
      await updateDoc(userRolesRef, {
        isLegalTeam: true,
        updatedAt: now
      });
      console.log(`[Legal] ${new Date().toISOString()} - Updated userRoles document for legal team member: ${normalizedEmail}`);
    }
  } catch (error) {
    console.error(`[Legal] ${new Date().toISOString()} - Error updating userRoles document:`, error);
    // Continue even if updating userRoles fails - the user is still added to the legal team collection
  }
};

// Get all legal team members
export const getLegalTeamMembers = async (): Promise<any[]> => {
  const legalTeamRef = collection(db, 'legalTeam');
  const legalTeamSnapshot = await getDocs(legalTeamRef);

  return legalTeamSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Remove a legal team member
export const removeLegalTeamMember = async (id: string): Promise<void> => {
  // Get the legal team member document to retrieve the email
  const legalTeamRef = doc(db, 'legalTeam', id);
  const legalTeamDoc = await getDoc(legalTeamRef);

  if (!legalTeamDoc.exists()) {
    throw new Error('Legal team member not found');
  }

  const legalTeamData = legalTeamDoc.data();
  const email = legalTeamData.email?.toLowerCase();

  if (!email) {
    throw new Error('Legal team member email not found in document');
  }

  // Delete from legal team collection
  await deleteDoc(legalTeamRef);

  // Update userRoles to set isLegalTeam to false
  try {
    const userRolesRef = doc(db, 'userRoles', email);
    const userRoleDoc = await getDoc(userRolesRef);

    if (userRoleDoc.exists()) {
      await updateDoc(userRolesRef, {
        isLegalTeam: false,
        updatedAt: new Date().toISOString()
      });
      console.log(`[Legal] ${new Date().toISOString()} - Updated userRoles document for removed legal team member: ${email}`);
    }
  } catch (error) {
    console.error(`[Legal] ${new Date().toISOString()} - Error updating userRoles document for removed legal team member:`, error);
    // Continue even if updating userRoles fails - the user is still removed from the legal team collection
  }
};

// Add a user to the management team
export const addManagementTeamMember = async (
  email: string,
  displayName: string = ''
): Promise<void> => {
  const normalizedEmail = email.toLowerCase();
  console.log(`[Management] ${new Date().toISOString()} - Adding management team member: ${normalizedEmail}`);

  // Check if the user is already an admin
  const isAdmin = await isUserAdmin(normalizedEmail);
  if (isAdmin) {
    console.log(`[Management] ${new Date().toISOString()} - User is already an admin: ${normalizedEmail}`);
    throw new Error('User is already an admin. A user cannot have multiple roles.');
  }

  // Check if the user is already in the legal team
  const isLegal = await isUserLegalTeam(normalizedEmail);
  if (isLegal) {
    console.log(`[Management] ${new Date().toISOString()} - User is already in legal team: ${normalizedEmail}`);
    throw new Error('User is already a legal team member. A user cannot have multiple roles.');
  }

  // Check if the user is already an approver
  const isApprover = await isUserApprover(normalizedEmail);
  if (isApprover) {
    console.log(`[Management] ${new Date().toISOString()} - User is already an approver: ${normalizedEmail}`);
    throw new Error('User is already an approver. A user cannot have multiple roles.');
  }

  const managementTeamRef = collection(db, 'managementTeam');
  const managementTeamQuery = query(managementTeamRef, where('email', '==', normalizedEmail));
  const managementTeamSnapshot = await getDocs(managementTeamQuery);

  if (managementTeamSnapshot.empty) {
    await addDoc(managementTeamRef, {
      email: normalizedEmail,
      displayName,
      createdAt: new Date().toISOString()
    });
    console.log(`[Management] ${new Date().toISOString()} - Added user to management team collection: ${normalizedEmail}`);
  } else {
    console.log(`[Management] ${new Date().toISOString()} - User already exists in management team collection: ${normalizedEmail}`);
  }

  // Update userRoles document to set isManagementTeam to true
  try {
    const now = new Date().toISOString();
    const userRolesRef = doc(db, 'userRoles', normalizedEmail);

    // Check if userRoles document already exists
    const userRoleDoc = await getDoc(userRolesRef);

    if (!userRoleDoc.exists()) {
      // Create a new userRoles document with isManagementTeam set to true and others to false
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
      console.log(`[Management] ${new Date().toISOString()} - Created userRoles document for management team member: ${normalizedEmail}`);
    } else {
      // Update the existing document to set isManagementTeam to true
      await updateDoc(userRolesRef, {
        isManagementTeam: true,
        updatedAt: now
      });
      console.log(`[Management] ${new Date().toISOString()} - Updated userRoles document for management team member: ${normalizedEmail}`);
    }
  } catch (error) {
    console.error(`[Management] ${new Date().toISOString()} - Error updating userRoles document:`, error);
    // Continue even if updating userRoles fails - the user is still added to the management team collection
  }
};

// Get all management team members
export const getManagementTeamMembers = async (): Promise<any[]> => {
  const managementTeamRef = collection(db, 'managementTeam');
  const managementTeamSnapshot = await getDocs(managementTeamRef);

  return managementTeamSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Remove a management team member
export const removeManagementTeamMember = async (id: string): Promise<void> => {
  // Get the management team member document to retrieve the email
  const managementTeamRef = doc(db, 'managementTeam', id);
  const managementTeamDoc = await getDoc(managementTeamRef);

  if (!managementTeamDoc.exists()) {
    throw new Error('Management team member not found');
  }

  const managementTeamData = managementTeamDoc.data();
  const email = managementTeamData.email?.toLowerCase();

  if (!email) {
    throw new Error('Management team member email not found in document');
  }

  // Delete from management team collection
  await deleteDoc(managementTeamRef);

  // Update userRoles to set isManagementTeam to false
  try {
    const userRolesRef = doc(db, 'userRoles', email);
    const userRoleDoc = await getDoc(userRolesRef);

    if (userRoleDoc.exists()) {
      await updateDoc(userRolesRef, {
        isManagementTeam: false,
        updatedAt: new Date().toISOString()
      });
      console.log(`[Management] ${new Date().toISOString()} - Updated userRoles document for removed management team member: ${email}`);
    }
  } catch (error) {
    console.error(`[Management] ${new Date().toISOString()} - Error updating userRoles document for removed management team member:`, error);
    // Continue even if updating userRoles fails - the user is still removed from the management team collection
  }
};

// Create a user account using the REST API
// This avoids the issue of logging out the current user
export const createUserRecord = async (email: string): Promise<string> => {
  try {
    // Default password for new accounts
    const defaultPassword = '12345678';

    // Create the user account in Firebase Auth using the REST API
    // This won't affect the current user's session
    const success = await createUserAccountViaAPI(email, defaultPassword);

    if (!success) {
      console.warn('Failed to create Firebase Auth account via API, but will continue with Firestore record');
    }

    return defaultPassword;
  } catch (error) {
    console.error('Error creating user record:', error);
    // Return default password anyway so the email can be sent
    return '12345678';
  }
};

// Create a user account directly without invitation process
export const inviteUser = async (
  email: string,
  role: string = 'user',
  invitedBy: string
): Promise<void> => {
  const normalizedEmail = email.toLowerCase();
  console.log(`[User] ${new Date().toISOString()} - Inviting user: ${normalizedEmail} with role: ${role}`);

  // Check if user already exists
  const userQuery = query(collection(db, 'users'), where('email', '==', normalizedEmail));
  const userSnapshot = await getDocs(userQuery);

  if (!userSnapshot.empty) {
    console.log(`[User] ${new Date().toISOString()} - User already exists: ${normalizedEmail}`);
    return; // User already exists, no need to create a new account
  }

  // Create user data
  const userData = {
    email: normalizedEmail,
    role,
    invitedBy,
    createdAt: new Date().toISOString(),
    displayName: email.split('@')[0], // Default display name from email
    status: 'active' // Mark as active user, not pending
  };

  // Add to users collection as an active user
  await addDoc(collection(db, 'users'), userData);
  console.log(`[User] ${new Date().toISOString()} - Added user to users collection: ${normalizedEmail}`);

  // Create userRoles document with all boolean fields set to false
  try {
    const now = new Date().toISOString();
    const userRolesRef = doc(db, 'userRoles', normalizedEmail);

    // Check if userRoles document already exists
    const userRoleDoc = await getDoc(userRolesRef);

    if (!userRoleDoc.exists()) {
      // Create a new userRoles document with all roles set to false
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
      console.log(`[User] ${new Date().toISOString()} - Created userRoles document for: ${normalizedEmail}`);
    } else {
      console.log(`[User] ${new Date().toISOString()} - userRoles document already exists for: ${normalizedEmail}`);
    }
  } catch (error) {
    console.error(`[User] ${new Date().toISOString()} - Error creating userRoles document:`, error);
    // Continue even if creating userRoles fails - the user is still added to the database
  }

  // Get default password without creating Firebase Auth account
  // This prevents logging out the current user
  let defaultPassword = '12345678';
  try {
    defaultPassword = await createUserRecord(normalizedEmail);
  } catch (error) {
    console.error(`[User] ${new Date().toISOString()} - Error creating user record:`, error);
    // Continue with default password even if there's an error
  }

  // Send account creation email with credentials
  try {
    const appUrl = import.meta.env.VITE_APP_URL || 'https://contract-management-system-omega.vercel.app';

    // Construct HTML content
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

    // Construct plain text content
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
      'Your Contract Management System Account',
      htmlContent,
      textContent // Pass the text content
    );
    console.log(`[User] ${new Date().toISOString()} - Sent invitation email to: ${normalizedEmail}`);
  } catch (error) {
    console.error(`[User] ${new Date().toISOString()} - Error sending account creation email:`, error);
    // Continue even if email fails - the user is still added to the database
  }
};

// Check if a user is a legal team member
export const isUserLegalTeam = async (email: string): Promise<boolean> => {
  if (!email) return false;

  const roleStartTime = performance.now();

  try {
    // Try to get the consolidated roles first
    const roles = await getUserRoles(email);
    if (roles !== null) {
      const roleEndTime = performance.now();
      return roles.isLegalTeam;
    }

    // Fallback to original function if consolidated approach fails
    return await isUserLegalTeamOriginal(email);
  } catch (error) {
    // Fallback to original function if consolidated approach fails
    return await isUserLegalTeamOriginal(email);
  }
};

// Get the legal team role
export const getLegalTeamMemberRole = async (email: string): Promise<string | null> => {
  if (!email) return null;

  const legalTeamRef = collection(db, 'legalTeam');
  const legalTeamQuery = query(legalTeamRef, where('email', '==', email.toLowerCase()));
  const legalTeamSnapshot = await getDocs(legalTeamQuery);

  if (legalTeamSnapshot.empty) {
    return null;
  }

  // Return a fixed role
  return 'Legal Team';
};

// Check if a user is a management team member
export const isUserManagementTeam = async (email: string): Promise<boolean> => {
  if (!email) return false;

  const roleStartTime = performance.now();

  try {
    // Try to get the consolidated roles first
    const roles = await getUserRoles(email);
    if (roles !== null) {
      const roleEndTime = performance.now();
      return roles.isManagementTeam;
    }

    // Fallback to original function if consolidated approach fails
    return await isUserManagementTeamOriginal(email);
  } catch (error) {
    // Fallback to original function if consolidated approach fails
    return await isUserManagementTeamOriginal(email);
  }
};

// Get the management team role
export const getManagementTeamMemberRole = async (email: string): Promise<string | null> => {
  if (!email) return null;

  const managementTeamRef = collection(db, 'managementTeam');
  const managementTeamQuery = query(managementTeamRef, where('email', '==', email.toLowerCase()));
  const managementTeamSnapshot = await getDocs(managementTeamQuery);

  if (managementTeamSnapshot.empty) {
    return null;
  }

  // Return a fixed role
  return 'Management Team';
};

// Check if a user is an approver
export const isUserApprover = async (email: string): Promise<boolean> => {
  if (!email) return false;

  const roleStartTime = performance.now();

  try {
    // Try to get the consolidated roles first
    const roles = await getUserRoles(email);
    if (roles !== null) {
      const roleEndTime = performance.now();
      return roles.isApprover;
    }

    // Fallback to original function if consolidated approach fails
    return await isUserApproverOriginal(email);
  } catch (error) {
    // Fallback to original function if consolidated approach fails
    return await isUserApproverOriginal(email);
  }
};

// Add a user to the approvers
export const addApprover = async (
  email: string,
  displayName: string = ''
): Promise<void> => {
  const normalizedEmail = email.toLowerCase();
  console.log(`[Approver] ${new Date().toISOString()} - Adding approver: ${normalizedEmail}`);

  // Check if the user is already an admin
  const isAdmin = await isUserAdmin(normalizedEmail);
  if (isAdmin) {
    console.log(`[Approver] ${new Date().toISOString()} - User is already an admin: ${normalizedEmail}`);
    throw new Error('User is already an admin. A user cannot have multiple roles.');
  }

  // Check if the user is already in the legal team
  const isLegal = await isUserLegalTeam(normalizedEmail);
  if (isLegal) {
    console.log(`[Approver] ${new Date().toISOString()} - User is already in legal team: ${normalizedEmail}`);
    throw new Error('User is already a legal team member. A user cannot have multiple roles.');
  }

  // Check if the user is already in the management team
  const isManagement = await isUserManagementTeam(normalizedEmail);
  if (isManagement) {
    console.log(`[Approver] ${new Date().toISOString()} - User is already in management team: ${normalizedEmail}`);
    throw new Error('User is already a management team member. A user cannot have multiple roles.');
  }

  const approversRef = collection(db, 'approvers');
  const approverQuery = query(approversRef, where('email', '==', normalizedEmail));
  const approverSnapshot = await getDocs(approverQuery);

  if (approverSnapshot.empty) {
    await addDoc(approversRef, {
      email: normalizedEmail,
      displayName,
      createdAt: new Date().toISOString()
    });
    console.log(`[Approver] ${new Date().toISOString()} - Added user to approvers collection: ${normalizedEmail}`);
  } else {
    console.log(`[Approver] ${new Date().toISOString()} - User already exists in approvers collection: ${normalizedEmail}`);
  }

  // Update userRoles document to set isApprover to true
  try {
    const now = new Date().toISOString();
    const userRolesRef = doc(db, 'userRoles', normalizedEmail);

    // Check if userRoles document already exists
    const userRoleDoc = await getDoc(userRolesRef);

    if (!userRoleDoc.exists()) {
      // Create a new userRoles document with isApprover set to true and others to false
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
      console.log(`[Approver] ${new Date().toISOString()} - Created userRoles document for approver: ${normalizedEmail}`);
    } else {
      // Update the existing document to set isApprover to true
      await updateDoc(userRolesRef, {
        isApprover: true,
        updatedAt: now
      });
      console.log(`[Approver] ${new Date().toISOString()} - Updated userRoles document for approver: ${normalizedEmail}`);
    }
  } catch (error) {
    console.error(`[Approver] ${new Date().toISOString()} - Error updating userRoles document:`, error);
    // Continue even if updating userRoles fails - the user is still added to the approvers collection
  }
};

// Get all approvers
export const getApprovers = async (): Promise<any[]> => {
  const approversRef = collection(db, 'approvers');
  const approversSnapshot = await getDocs(approversRef);

  return approversSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Remove an approver
export const removeApprover = async (id: string): Promise<void> => {
  // Get the approver document to retrieve the email
  const approverRef = doc(db, 'approvers', id);
  const approverDoc = await getDoc(approverRef);

  if (!approverDoc.exists()) {
    throw new Error('Approver not found');
  }

  const approverData = approverDoc.data();
  const email = approverData.email?.toLowerCase();

  if (!email) {
    throw new Error('Approver email not found in document');
  }

  // Delete from approvers collection
  await deleteDoc(approverRef);

  // Update userRoles to set isApprover to false
  try {
    const userRolesRef = doc(db, 'userRoles', email);
    const userRoleDoc = await getDoc(userRolesRef);

    if (userRoleDoc.exists()) {
      await updateDoc(userRolesRef, {
        isApprover: false,
        updatedAt: new Date().toISOString()
      });
      console.log(`[Approver] ${new Date().toISOString()} - Updated userRoles document for removed approver: ${email}`);
    }
  } catch (error) {
    console.error(`[Approver] ${new Date().toISOString()} - Error updating userRoles document for removed approver:`, error);
    // Continue even if updating userRoles fails - the user is still removed from the approvers collection
  }
};

// Get the approver role
export const getApproverRole = async (email: string): Promise<string | null> => {
  if (!email) return null;

  const approversRef = collection(db, 'approvers');
  const approverQuery = query(approversRef, where('email', '==', email.toLowerCase()));
  const approverSnapshot = await getDocs(approverQuery);

  if (approverSnapshot.empty) {
    return null;
  }

  // Return a fixed role
  return 'Approver';
};

// Helper function to normalize approvers structure
// This converts the old single-approver format to the new multi-approver format
export const normalizeApprovers = (contract: Contract): Contract => {
  if (!contract.approvers) {
    // Initialize with default limits if no approvers exist
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
    legal: Array<{email: string; name: string; approved: boolean; declined?: boolean; approvedAt?: string; declinedAt?: string;}>,
    management: Array<{email: string; name: string; approved: boolean; declined?: boolean; approvedAt?: string; declinedAt?: string;}>,
    approver: Array<{email: string; name: string; approved: boolean; declined?: boolean; approvedAt?: string; declinedAt?: string;}>
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

  // Handle legal team approvers
  if (contract.approvers.legal) {
    if (!Array.isArray(contract.approvers.legal)) {
      // Convert single object to array
      normalizedApprovers.legal = [contract.approvers.legal];
    } else {
      normalizedApprovers.legal = contract.approvers.legal;
    }
  }

  // Handle management team approvers
  if (contract.approvers.management) {
    if (!Array.isArray(contract.approvers.management)) {
      // Convert single object to array
      normalizedApprovers.management = [contract.approvers.management];
    } else {
      normalizedApprovers.management = contract.approvers.management;
    }
  }

  // Handle approvers
  if (contract.approvers.approver) {
    if (!Array.isArray(contract.approvers.approver)) {
      // Convert single object to array if needed
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

// Remove a user from the system
export const removeUser = async (id: string, adminEmail: string = ''): Promise<void> => {
  // First get the user details to know their email and userId
  const userRef = doc(db, 'users', id);
  const userSnapshot = await getDoc(userRef);

  if (userSnapshot.exists()) {
    const userData = userSnapshot.data();
    const email = userData.email?.toLowerCase();
    const userId = userData.userId; // Firebase Auth UID

    // Delete the user from users collection
    await deleteDoc(userRef);

    // Attempt to delete the user from Firebase Authentication
    try {
      const { deleteAuthUser } = await import('./delete-auth-user');
      await deleteAuthUser(email);

      // Add a log entry in the deleted_users collection for audit
      const deletedUsersRef = collection(db, 'deleted_users');
      await addDoc(deletedUsersRef, {
        email,
        userId,
        deletedAt: new Date().toISOString(),
        deletedBy: adminEmail,
        firestore_deleted: true,
        auth_deleted_manually: false, // This will need to be manually updated by admin
      });

    } catch (error) {
      console.error('Error in Firebase Auth deletion process:', error);
      // Continue even if this fails, as the user data has been removed from Firestore

      // Still create a deletion record for audit
      const deletedUsersRef = collection(db, 'deleted_users');
      await addDoc(deletedUsersRef, {
        email,
        userId,
        deletedAt: new Date().toISOString(),
        deletedBy: adminEmail,
        firestore_deleted: true,
        auth_deleted_manually: false,
        deletion_error: (error as Error).message,
      });
    }
  } else {
    // If user doesn't exist, just exit
    return;
  }
};

// Update user profile
export const updateUserProfile = async (
  userId: string,
  firstName: string = '',
  lastName: string = '',
  displayName: string = ''
): Promise<void> => {
  try {
    // Update Firebase Auth profile
    const auth = getAuth();
    const user = auth.currentUser;

    if (user && user.uid === userId) {
      await updateProfile(user, {
        displayName: displayName
      });
    }

    // Update Firestore user document
    const usersRef = collection(db, 'users');
    const userQuery = query(usersRef, where('userId', '==', userId));
    const userSnapshot = await getDocs(userQuery);

    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0];
      await updateDoc(doc(db, 'users', userDoc.id), {
        firstName,
        lastName,
        displayName
      });
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Update user password
export const updateUserPassword = async (
  newPassword: string
): Promise<void> => {
  // Note: Password update is handled directly in the Profile component
  // using Firebase Auth methods. This function is a placeholder for any
  // additional logic that might be needed in the future.
  return Promise.resolve();
};

// Check if a user exists in the system (for password reset)
export const doesUserExist = async (email: string): Promise<boolean> => {
  if (!email) return false;

  // First check if the user is in the deleted_users collection
  const deletedUsersRef = collection(db, 'deleted_users');
  const deletedUserQuery = query(deletedUsersRef, where('email', '==', email.toLowerCase()));
  const deletedUserSnapshot = await getDocs(deletedUserQuery);

  if (!deletedUserSnapshot.empty) {
    return false; // User has been deleted and should not be able to reset password
  }

  // Check admin collection
  const adminRef = collection(db, 'admin');
  const adminQuery = query(adminRef, where('email', '==', email.toLowerCase()));
  const adminSnapshot = await getDocs(adminQuery);

  if (!adminSnapshot.empty) {
    return true; // User is an admin
  }

  // Check users collection
  const usersRef = collection(db, 'users');
  const userQuery = query(usersRef, where('email', '==', email.toLowerCase()));
  const userSnapshot = await getDocs(userQuery);

  return !userSnapshot.empty; // User exists if the snapshot is not empty
};

// Function to get contracts for a regular user - only returns contracts where the user
// is either the owner or mentioned in the parties list or shared with list
export const getUserContracts = async (userEmail: string, includeArchived: boolean = false): Promise<Contract[]> => {
  if (!userEmail) return [];

  const lowercaseEmail = userEmail.toLowerCase();

  // Get all contracts (with or without archived based on parameter)
  const contracts = await getContracts(includeArchived);

  // Filter contracts to only include those where the user is involved
  return contracts.filter(contract => {
    // Check if user is the owner
    if (contract.owner.toLowerCase() === lowercaseEmail) return true;

    // Check if user is in the parties list
    const parties = contract.parties || [];
    const isParty = parties.some(party =>
      party.email.toLowerCase() === lowercaseEmail
    );
    if (isParty) return true;

    // Check if user is an approver (legal, management, or approver)
    // First normalize the approvers structure
    const normalizedContract = normalizeApprovers(contract);

    // For legal approvers
    if (normalizedContract.approvers?.legal) {
      const legalApprovers = Array.isArray(normalizedContract.approvers.legal)
        ? normalizedContract.approvers.legal
        : [normalizedContract.approvers.legal];

      const userLegalApprover = legalApprovers.find(
        approver => approver.email.toLowerCase() === lowercaseEmail
      );
      // If they are assigned as an approver, always show the contract
      if (userLegalApprover) {
        return true;
      }
    }

    // For management approvers
    if (normalizedContract.approvers?.management) {
      const managementApprovers = Array.isArray(normalizedContract.approvers.management)
        ? normalizedContract.approvers.management
        : [normalizedContract.approvers.management];

      const userManagementApprover = managementApprovers.find(
        approver => approver.email.toLowerCase() === lowercaseEmail
      );
      // If they are assigned as an approver, always show the contract
      if (userManagementApprover) {
        return true;
      }
    }

    // For regular approvers
    if (normalizedContract.approvers?.approver) {
      const userApprover = normalizedContract.approvers.approver.find(
        approver => approver.email.toLowerCase() === lowercaseEmail
      );
      // If they are assigned as an approver, always show the contract
      if (userApprover) {
        return true;
      }
    }

    // User is not involved with this contract
    return false;
  });
};

// Function to get archived contracts for a user
export const getUserArchivedContracts = async (userEmail: string): Promise<Contract[]> => {
  if (!userEmail) return [];

  // Check if user is admin
  const isAdmin = await isUserAdmin(userEmail);
  if (isAdmin) {
    // Admins can see all archived contracts
    return getArchivedContracts();
  }

  // For regular users, filter to only show their contracts
  const lowercaseEmail = userEmail.toLowerCase();

  // Get all archived contracts
  const archivedContracts = await getArchivedContracts();

  // Filter contracts to only include those where the user is involved
  const userArchivedContracts = archivedContracts.filter(contract => {
    // Check if user is the owner
    if (contract.owner.toLowerCase() === lowercaseEmail) {
      return true;
    }

    // Check if user is in the parties list
    const isParty = contract.parties.some(party =>
      party.email.toLowerCase() === lowercaseEmail
    );
    if (isParty) {
      return true;
    }

    // Check if user is an approver (legal, management, or approver)
    // First normalize the approvers structure
    const normalizedContract = normalizeApprovers(contract);

    // Check if user is a legal approver
    if (normalizedContract.approvers?.legal) {
      const legalApprovers = Array.isArray(normalizedContract.approvers.legal)
        ? normalizedContract.approvers.legal
        : [normalizedContract.approvers.legal];

      const userLegalApprover = legalApprovers.find(
        approver => approver.email.toLowerCase() === lowercaseEmail
      );

      if (userLegalApprover) {
        return true;
      }
    }

    // Check if user is a management approver
    if (normalizedContract.approvers?.management) {
      const managementApprovers = Array.isArray(normalizedContract.approvers.management)
        ? normalizedContract.approvers.management
        : [normalizedContract.approvers.management];

      const userManagementApprover = managementApprovers.find(
        approver => approver.email.toLowerCase() === lowercaseEmail
      );

      if (userManagementApprover) {
        return true;
      }
    }

    // Check if user is an approver
    if (normalizedContract.approvers?.approver) {
      const userApprover = normalizedContract.approvers.approver.find(
        approver => approver.email.toLowerCase() === lowercaseEmail
      );

      if (userApprover) {
        return true;
      }
    }

    // User is not involved with this contract
    return false;
  });

  return userArchivedContracts;
};

// Function to get contract statistics for a regular user
export const getUserContractStats = async (userEmail: string): Promise<ContractStats> => {
  try {
    // Get only the user's contracts
    const contracts = await getUserContracts(userEmail);

    const now = new Date();
    const currentYear = now.getFullYear();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    // Calculate total contracts (excluding archived ones)
    const totalContracts = contracts.length;

    // Calculate finished contracts
    const finishedContracts = contracts.filter(c => c.status === 'finished').length;

    // Calculate contracts pending approval
    const pendingApprovalContracts = contracts.filter(c => c.status === 'approval').length;

    // Calculate contracts expiring in the next 30 days (only active contracts)
    const expiringContracts = contracts.filter(c => {
      // Skip contracts without end date or finished contracts
      if (!c.endDate || c.status === 'finished') {
        return false;
      }

      try {
        const endDate = new Date(c.endDate);

        if (isNaN(endDate.getTime())) {
          return false;
        }

        // Check if contract expires within the next 30 days
        const isExpiringSoon = endDate <= thirtyDaysFromNow && endDate >= now;

        return isExpiringSoon;
      } catch (error) {
        return false;
      }
    }).length;

    const totalValue = contracts.reduce((sum, contract) => {
      return sum + (contract.value || 0);
    }, 0);

    // Calculate contracts expiring this year (only active contracts)
    const expiringThisYear = contracts.filter(c => {
      // Skip contracts without end date or finished contracts
      if (!c.endDate || c.status === 'finished') {
        return false;
      }

      try {
        const endDate = new Date(c.endDate);

        if (isNaN(endDate.getTime())) {
          return false;
        }

        // Check if contract expires this year
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

// Add a new getUserRoles function that gets all roles in a single query
export const getUserRoles = async (email: string): Promise<{
  isAdmin: boolean;
  isLegalTeam: boolean;
  isManagementTeam: boolean;
  isApprover: boolean;
} | null> => {
  if (!email) return null;

  try {
    // Start timing the query
    const startTime = performance.now();

    // IMPORTANT: Direct document retrieval by ID (email) instead of querying
    const userRolesRef = doc(db, 'userRoles', email.toLowerCase());
    const userRoleDoc = await getDoc(userRolesRef);

    const endTime = performance.now();

    if (!userRoleDoc.exists()) {
      // If no consolidated roles exist, try to migrate from old role system
      const migratedRoles = await migrateUserRoles(email);
      return migratedRoles;
    }

    // Extract role data from the document
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

// Function to update a user's roles in the consolidated userRoles collection
export const updateUserRoles = async (
  email: string,
  roles: {
    isAdmin?: boolean;
    isLegalTeam?: boolean;
    isManagementTeam?: boolean;
    isApprover?: boolean;
  }
): Promise<void> => {
  if (!email) return;

  try {
    const normalizedEmail = email.toLowerCase();
    const userRolesRef = doc(db, 'userRoles', normalizedEmail);
    const userRoleDoc = await getDoc(userRolesRef);

    const now = new Date().toISOString();
    const userData = {
      email: normalizedEmail,
      ...roles,
      updatedAt: now
    };

    if (!userRoleDoc.exists()) {
      // Create a new document with email as the document ID
      await setDoc(userRolesRef, {
        ...userData,
        createdAt: now
      });
    } else {
      // Update the existing document
      await updateDoc(userRolesRef, userData);
    }
  } catch (error) {
    console.error("Error updating user roles:", error);
    throw error;
  }
};

// Function to migrate a user's roles from separate collections to the consolidated format
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

  // Check old roles using the original functions
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

  // Save these roles to the new collection
  try {
    await updateUserRoles(email, roles);
  } catch (error) {
    // Continue even if saving fails - we still want to return the roles we found
  }

  const migrationEndTime = performance.now();

  return roles;
};

// Rename the original functions to avoid recursion when we redefine them
export const isUserAdminOriginal = isUserAdmin;
export const isUserLegalTeamOriginal = isUserLegalTeam;
export const isUserManagementTeamOriginal = isUserManagementTeam;
export const isUserApproverOriginal = isUserApprover;

// Add this function after the migrateUserRoles function
export const initializeUserRolesCollection = async (currentUserEmail?: string): Promise<void> => {
  try {
    // First check if the requester is an admin
    if (currentUserEmail) {
      const isAdmin = await isUserAdmin(currentUserEmail);
      if (!isAdmin) {
        throw new Error('Unauthorized: Only administrators can initialize user roles');
      }
    }

    // Check if the collection already exists and has documents
    const userRolesRef = collection(db, 'userRoles');
    const userRolesSnapshot = await getDocs(userRolesRef);

    if (!userRolesSnapshot.empty) {
      // Delete existing documents
      const batch = writeBatch(db);
      userRolesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    // Get all users from each role collection
    const adminRef = collection(db, 'admin');
    const legalTeamRef = collection(db, 'legalTeam');
    const managementTeamRef = collection(db, 'managementTeam');
    const approversRef = collection(db, 'approvers');

    // Fetch all documents from each collection
    const adminSnapshot = await getDocs(adminRef);
    const legalTeamSnapshot = await getDocs(legalTeamRef);
    const managementTeamSnapshot = await getDocs(managementTeamRef);
    const approversSnapshot = await getDocs(approversRef);

    // Create a map of email to roles
    const userRolesMap = new Map<string, {
      isAdmin: boolean;
      isLegalTeam: boolean;
      isManagementTeam: boolean;
      isApprover: boolean;
      email: string;
    }>();

    // Process admin users
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

    // Process legal team users
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

    // Process management team users
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

    // Process approvers
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

    // Batch write all user roles to the new collection
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    userRolesMap.forEach((roles) => {
      // Use email as document ID
      const userRoleDocRef = doc(db, 'userRoles', roles.email);
      batch.set(userRoleDocRef, {
        ...roles,
        createdAt: now,
        updatedAt: now
      });
    });

    // Commit the batch
    await batch.commit();
  } catch (error) {
    throw error;
  }
};

// Mark a user as manually deleted in Firebase Auth
export const markUserDeletedInAuth = async (email: string, adminEmail: string = ''): Promise<void> => {
  try {
    // Find the user in the deleted_users collection
    const deletedUsersRef = collection(db, 'deleted_users');
    const q = query(deletedUsersRef, where('email', '==', email.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.warn(`User with email ${email} not found in deleted_users collection`);
      return;
    }

    // Update the document to mark auth as manually deleted
    const userDoc = querySnapshot.docs[0];
    await updateDoc(doc(db, 'deleted_users', userDoc.id), {
      auth_deleted_manually: true,
      auth_deleted_at: new Date().toISOString(),
      auth_deleted_by: adminEmail
    });

    console.log(`User ${email} marked as deleted in Firebase Auth`);
  } catch (error) {
    console.error('Error marking user as deleted in Firebase Auth:', error);
    throw error;
  }
};

// System Settings
export interface SystemSettings {
  archiveRetentionDays: number; // Number of days to keep archived contracts before deletion
  autoDeleteEnabled: boolean;   // Whether automatic deletion is enabled
  lastUpdated?: string;        // Timestamp of last update
  updatedBy?: string;          // Email of user who last updated settings
}

// Default system settings
export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  archiveRetentionDays: 30,
  autoDeleteEnabled: true
};

// Get system settings
export const getSystemSettings = async (): Promise<SystemSettings> => {
  const settingsDoc = doc(db, 'systemSettings', 'general');

  try {
    const settingsSnapshot = await getDoc(settingsDoc);

    if (!settingsSnapshot.exists()) {
      // If settings don't exist, create them with defaults
      await setDoc(settingsDoc, DEFAULT_SYSTEM_SETTINGS);
      return DEFAULT_SYSTEM_SETTINGS;
    }

    return settingsSnapshot.data() as SystemSettings;
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return DEFAULT_SYSTEM_SETTINGS;
  }
};

// Update system settings
export const updateSystemSettings = async (
  settings: Partial<SystemSettings>,
  updater: { email: string; displayName?: string | null }
): Promise<void> => {
  // First check if the updater is an admin
  const isAdmin = await isUserAdmin(updater.email);
  if (!isAdmin) {
    throw new Error('Unauthorized: Only administrators can update system settings');
  }

  const settingsDoc = doc(db, 'systemSettings', 'general');
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
    console.error('Error updating system settings:', error);
    throw error;
  }
};

// Function to process automatic deletion of archived contracts
export const processAutomaticContractDeletion = async (
  forceDeleteAll: boolean = false
): Promise<number> => {
  try {
    // Get system settings
    const settings = await getSystemSettings();
    console.log("Current retention settings:", settings);

    // If auto-delete is disabled and we're not force deleting, do nothing
    if (!settings.autoDeleteEnabled && !forceDeleteAll) {
      console.log("Auto-delete is disabled in settings");
      return 0;
    }

    // Get all archived contracts
    const archivedContracts = await getArchivedContracts();
    console.log(`Found ${archivedContracts.length} archived contracts`);

    const now = new Date();
    let deletedCount = 0;

    // Process each archived contract
    for (const contract of archivedContracts) {
      if (!contract.archivedAt) {
        console.log(`Contract ${contract.id} (${contract.title}) has no archivedAt date`);
        continue;
      }

      const archivedDate = new Date(contract.archivedAt);
      const daysSinceArchived = Math.floor((now.getTime() - archivedDate.getTime()) / (1000 * 60 * 60 * 24));

      console.log(`Contract ${contract.id} (${contract.title}) was archived on ${archivedDate.toISOString()}, ${daysSinceArchived} days ago`);
      console.log(`Retention period: ${settings.archiveRetentionDays} days`);

      // Delete if force is enabled or the retention period has been met
      if (forceDeleteAll || daysSinceArchived >= settings.archiveRetentionDays) {
        if (forceDeleteAll) {
          console.log(`Force deleting contract ${contract.id} (${contract.title})`);
        } else {
          console.log(`Deleting contract ${contract.id} (${contract.title}) - archived ${daysSinceArchived} days ago`);
        }
        await deleteContract(contract.id);
        deletedCount++;
      } else {
        console.log(`Contract ${contract.id} retention period not met: ${daysSinceArchived}/${settings.archiveRetentionDays} days`);
      }
    }

    return deletedCount;
  } catch (error) {
    console.error('Error processing automatic contract deletion:', error);
    return 0;
  }
};
