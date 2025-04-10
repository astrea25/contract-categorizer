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
  setDoc
} from 'firebase/firestore';
import { getAuth, deleteUser, updateProfile } from "firebase/auth";
import { auth as firebaseAuth } from "./firebase";
import { createUserAccountViaAPI } from "./auth-api";

export interface ContractStats {
  totalContracts: number;
  finishedContracts: number;
  pendingApprovalContracts: number;
  expiringContracts: number;
  totalValue: number;
  expiringThisYear: number;
}

export type ContractStatus = 'requested' | 'draft' | 'legal_review' | 'management_review' | 'approval' | 'finished';
export type ContractType = 'service' | 'employment' | 'licensing' | 'nda' | 'partnership';

export interface Folder {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  contractCount?: number; // Optional for UI display purposes
}

export interface Contract {
  id: string;
  title: string;
  projectName: string;
  type: ContractType;
  status: ContractStatus;
  owner: string;
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
  // sharedWith property removed
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
  service: 'Service Agreement',
  employment: 'Employment Contract',
  licensing: 'Licensing Agreement',
  nda: 'Non-Disclosure Agreement',
  partnership: 'Partnership Agreement'
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
  const contractsQuery = query(
    contractsCollection,
    where('archived', '==', true)
  );

  const contractsSnapshot = await getDocs(contractsQuery);
  return contractsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
      updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.createdAt) : null,
      archivedAt: data.archivedAt ? (data.archivedAt.toDate ? data.archivedAt.toDate().toISOString() : data.archivedAt) : null,
      startDate: data.startDate,
      endDate: data.endDate,
      documentLink: data.documentLink,
    } as Contract;
  });
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

export const createContract = async (
  contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>,
  creator: { email: string; displayName?: string | null }
): Promise<string> => {
  const now = Timestamp.now();
  const initialStatus = contract.status || 'draft';

  // Create the initial timeline entry
  const initialTimelineEntry = {
    timestamp: now.toDate().toISOString(),
    action: 'Contract Created with Draft Status',
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
  contractUpdates: Partial<Omit<Contract, 'id' | 'createdAt'>>,
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
  // Logic for approvers update might need specific handling if approvers can be updated directly here
  if (contractUpdates.approvers) {
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
    console.error("Error comparing parties:", e);
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

  // Fetch current timeline
  const currentContractSnap = await getDoc(contractDoc);
  const currentTimeline = currentContractSnap.data()?.timeline || [];

  // Create archive timeline entry
  const archiveTimelineEntry = {
    timestamp: now.toDate().toISOString(),
    action: 'Contract Archived',
    userEmail: archiver.email,
    userName: archiver.displayName || undefined
  };

  await updateDoc(contractDoc, {
    archived: true,
    archivedAt: now.toDate().toISOString(),
    archivedBy: archiver.email,
    updatedAt: now.toDate().toISOString(),
    timeline: [...currentTimeline, archiveTimelineEntry]
  });
};

export const unarchiveContract = async (
  id: string,
  restorer: { email: string; displayName?: string | null }
): Promise<void> => {
  const contractDoc = doc(db, 'contracts', id);
  const now = Timestamp.now();

  // Fetch current timeline
  const currentContractSnap = await getDoc(contractDoc);
  const currentTimeline = currentContractSnap.data()?.timeline || [];

  // Create unarchive timeline entry
  const unarchiveTimelineEntry = {
    timestamp: now.toDate().toISOString(),
    action: 'Contract Restored',
    userEmail: restorer.email,
    userName: restorer.displayName || undefined
  };

  await updateDoc(contractDoc, {
    archived: false,
    archivedAt: null,
    archivedBy: null,
    updatedAt: now.toDate().toISOString(),
    timeline: [...currentTimeline, unarchiveTimelineEntry]
  });
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

  const adminRef = collection(db, 'admin');
  const adminQuery = query(adminRef, where('email', '==', email.toLowerCase()));
  const adminSnapshot = await getDocs(adminQuery);

  return !adminSnapshot.empty;
};

// Add an admin user (for testing)
export const addAdminUser = async (email: string): Promise<void> => {
  const adminRef = collection(db, 'admin');
  const adminQuery = query(adminRef, where('email', '==', email.toLowerCase()));
  const adminSnapshot = await getDocs(adminQuery);

  if (adminSnapshot.empty) {
    await addDoc(adminRef, {
      email: email.toLowerCase(),
      createdAt: new Date().toISOString()
    });
  }
};

// Remove an admin user
export const removeAdminUser = async (id: string): Promise<void> => {
  const adminRef = doc(db, 'admin', id);
  await deleteDoc(adminRef);
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
    if (startDate && contract.startDate) {
      // Create date objects and normalize them for comparison
      const contractStartDate = new Date(contract.startDate);
      const filterStartDate = new Date(startDate);

      // Compare dates by converting to simple date strings (YYYY-MM-DD)
      const contractDateStr = contractStartDate.toISOString().split('T')[0];
      const filterDateStr = filterStartDate.toISOString().split('T')[0];

      if (contractDateStr < filterDateStr) {
        return false;
      }
    }

    if (endDate && contract.endDate) {
      // Create date objects and normalize them for comparison
      const contractEndDate = new Date(contract.endDate);
      const filterEndDate = new Date(endDate);

      // Compare dates by converting to simple date strings (YYYY-MM-DD)
      const contractDateStr = contractEndDate.toISOString().split('T')[0];
      const filterDateStr = filterEndDate.toISOString().split('T')[0];

      if (contractDateStr > filterDateStr) {
        return false;
      }
    }

    return true;
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
export const getFolders = async (): Promise<Folder[]> => {
  const foldersCollection = collection(db, 'folders');
  const foldersSnapshot = await getDocs(foldersCollection);

  const folders = foldersSnapshot.docs.map(doc => {
    const data = doc.data();
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

  let folderName = 'Unassigned';
  if (folderId) {
    const folderDoc = doc(db, 'folders', folderId);
    const folderSnap = await getDoc(folderDoc);
    if (folderSnap.exists()) {
      folderName = folderSnap.data()?.name || folderId;
    }
  }

  // Create timeline entry for folder change
  const folderTimelineEntry = {
    timestamp: now.toDate().toISOString(),
    action: folderId ? `Moved to Folder: ${folderName}` : 'Removed from Folder',
    userEmail: user.email,
    userName: user.displayName || undefined,
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
  let updatedComments;

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
  // First check if the user is already in the management team
  const isManagement = await isUserManagementTeam(email);

  if (isManagement) {
    throw new Error('User is already a management team member. A user cannot be in both legal and management teams.');
  }

  const legalTeamRef = collection(db, 'legalTeam');
  const legalTeamQuery = query(legalTeamRef, where('email', '==', email.toLowerCase()));
  const legalTeamSnapshot = await getDocs(legalTeamQuery);

  if (legalTeamSnapshot.empty) {
    await addDoc(legalTeamRef, {
      email: email.toLowerCase(),
      displayName,
      createdAt: new Date().toISOString()
    });
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
  const legalTeamRef = doc(db, 'legalTeam', id);
  await deleteDoc(legalTeamRef);
};

// Add a user to the management team
export const addManagementTeamMember = async (
  email: string,
  displayName: string = ''
): Promise<void> => {
  // First check if the user is already in the legal team
  const isLegal = await isUserLegalTeam(email);

  if (isLegal) {
    throw new Error('User is already a legal team member. A user cannot be in both legal and management teams.');
  }

  const managementTeamRef = collection(db, 'managementTeam');
  const managementTeamQuery = query(managementTeamRef, where('email', '==', email.toLowerCase()));
  const managementTeamSnapshot = await getDocs(managementTeamQuery);

  if (managementTeamSnapshot.empty) {
    await addDoc(managementTeamRef, {
      email: email.toLowerCase(),
      displayName,
      createdAt: new Date().toISOString()
    });
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
  const managementTeamRef = doc(db, 'managementTeam', id);
  await deleteDoc(managementTeamRef);
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
  // Check if user already exists
  const userQuery = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
  const userSnapshot = await getDocs(userQuery);

  if (!userSnapshot.empty) {
    return; // User already exists, no need to create a new account
  }

  // Create user data
  const userData = {
    email: email.toLowerCase(),
    role,
    invitedBy,
    createdAt: new Date().toISOString(),
    displayName: email.split('@')[0], // Default display name from email
    status: 'active' // Mark as active user, not pending
  };

  // Add to users collection as an active user
  await addDoc(collection(db, 'users'), userData);

  // Get default password without creating Firebase Auth account
  // This prevents logging out the current user
  let defaultPassword = '12345678';
  try {
    defaultPassword = await createUserRecord(email.toLowerCase());
  } catch (error) {
    console.error('Error creating user record:', error);
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
        <p><strong>Login email:</strong> ${email.toLowerCase()}</p>
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

Login email: ${email.toLowerCase()}
Temporary access code: ${defaultPassword}

(This is a temporary credential for your first login. For your security, please change it immediately after accessing the system.)

You can access the system here:
${appUrl}

---
Sent by Contract Management System – WWF Contracts
    `;

    await sendNotificationEmail(
      email.toLowerCase(),
      'Your Contract Management System Account',
      htmlContent,
      textContent // Pass the text content
    );
  } catch (error) {
    console.error('Error sending account creation email:', error);
    // Continue even if email fails - the user is still added to the database
  }
};

// Check if a user is a legal team member
export const isUserLegalTeam = async (email: string): Promise<boolean> => {
  if (!email) return false;

  const legalTeamRef = collection(db, 'legalTeam');
  const legalTeamQuery = query(legalTeamRef, where('email', '==', email.toLowerCase()));
  const legalTeamSnapshot = await getDocs(legalTeamQuery);

  return !legalTeamSnapshot.empty;
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

  const managementTeamRef = collection(db, 'managementTeam');
  const managementTeamQuery = query(managementTeamRef, where('email', '==', email.toLowerCase()));
  const managementTeamSnapshot = await getDocs(managementTeamQuery);

  return !managementTeamSnapshot.empty;
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

  const approversRef = collection(db, 'approvers');
  const approverQuery = query(approversRef, where('email', '==', email.toLowerCase()));
  const approverSnapshot = await getDocs(approverQuery);

  return !approverSnapshot.empty;
};

// Add a user to the approvers
export const addApprover = async (
  email: string,
  displayName: string = ''
): Promise<void> => {
  const approversRef = collection(db, 'approvers');
  const approverQuery = query(approversRef, where('email', '==', email.toLowerCase()));
  const approverSnapshot = await getDocs(approverQuery);

  if (approverSnapshot.empty) {
    await addDoc(approversRef, {
      email: email.toLowerCase(),
      displayName,
      createdAt: new Date().toISOString()
    });
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
  const approverRef = doc(db, 'approvers', id);
  await deleteDoc(approverRef);
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

    // Delete the user from Firebase Authentication
    // WARNING: This will log out the current user
    try {
      const { deleteAuthUser } = await import('./delete-auth-user');
      await deleteAuthUser(email);
    } catch (error) {
      console.error('Error deleting user from Firebase Authentication:', error);
      // Continue even if this fails, as the user data has been removed from Firestore
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
      // Only return true if this contract is assigned to them specifically
      if (userLegalApprover) {
        // Only show if the contract is in legal_review status or if they've already approved/declined
        if (contract.status === 'legal_review' || userLegalApprover.approved || userLegalApprover.declined) {
          return true;
        }
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
      // Only return true if this contract is assigned to them specifically
      if (userManagementApprover) {
        // Only show if the contract is in management_review status or if they've already approved/declined
        if (contract.status === 'management_review' || userManagementApprover.approved || userManagementApprover.declined) {
          return true;
        }
      }
    }

    // For regular approvers
    if (normalizedContract.approvers?.approver) {
      const userApprover = normalizedContract.approvers.approver.find(
        approver => approver.email.toLowerCase() === lowercaseEmail
      );
      // Only return true if this contract is assigned to them specifically
      if (userApprover) {
        // Only show if the contract is in approval status or if they've already approved/declined
        if (contract.status === 'approval' || userApprover.approved || userApprover.declined) {
          return true;
        }
      }
    }

    // User is not involved with this contract
    return false;
  });
};

// Function to get archived contracts for a user
export const getUserArchivedContracts = async (userEmail: string): Promise<Contract[]> => {
  if (!userEmail) return [];

  const lowercaseEmail = userEmail.toLowerCase();

  // Get all archived contracts
  const archivedContracts = await getArchivedContracts();

  // Filter contracts to only include those where the user is involved
  return archivedContracts.filter(contract => {
    // Check if user is the owner
    if (contract.owner.toLowerCase() === lowercaseEmail) return true;

    // Check if user is in the parties list
    const isParty = contract.parties.some(party =>
      party.email.toLowerCase() === lowercaseEmail
    );
    if (isParty) return true;

    // Check if user is an approver (legal, management, or approver)
    // First normalize the approvers structure
    const normalizedContract = normalizeApprovers(contract);

    // Check if user is a legal approver
    const isLegalApprover = Array.isArray(normalizedContract.approvers?.legal) &&
      normalizedContract.approvers.legal.some(
        approver => approver.email.toLowerCase() === lowercaseEmail
      );

    // Check if user is a management approver
    const isManagementApprover = Array.isArray(normalizedContract.approvers?.management) &&
      normalizedContract.approvers.management.some(
        approver => approver.email.toLowerCase() === lowercaseEmail
      );

    // Check if user is an approver
    const isApprover = Array.isArray(normalizedContract.approvers?.approver) &&
      normalizedContract.approvers.approver.some(
        approver => approver.email.toLowerCase() === lowercaseEmail
      );

    if (isLegalApprover || isManagementApprover || isApprover) return true;

    // sharedWith check removed

    // User is not involved with this contract
    return false;
  });
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
