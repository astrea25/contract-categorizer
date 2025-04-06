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

export interface ContractStats {
  totalContracts: number;
  activeContracts: number;
  pendingContracts: number;
  expiringContracts: number;
  totalValue: number;
  expiringThisYear: number;
}

export type ContractStatus = 'draft' | 'pending' | 'active' | 'expired' | 'terminated';
export type ContractType = 'service' | 'employment' | 'licensing' | 'nda' | 'partnership';

export interface Contract {
  id: string;
  title: string;
  projectName: string;
  type: ContractType;
  status: ContractStatus;
  owner: string;
  parties: {
    name: string;
    role: string;
  }[];
  startDate: string;
  endDate: string | null;
  value: number | null;
  description: string;
  documentLink?: string;
  createdAt: string;
  updatedAt: string;
  sharedWith: {
    email: string;
    role: 'viewer' | 'editor';
    inviteStatus: 'pending' | 'accepted';
  }[];
}

export interface ShareInvite {
  contractId: string;
  email: string;
}

export const statusColors: Record<ContractStatus, { bg: string; text: string; border: string }> = {
  draft: { 
    bg: 'bg-gray-100', 
    text: 'text-gray-800', 
    border: 'border-gray-200' 
  },
  pending: { 
    bg: 'bg-yellow-50', 
    text: 'text-yellow-800', 
    border: 'border-yellow-200' 
  },
  active: { 
    bg: 'bg-green-50', 
    text: 'text-green-800', 
    border: 'border-green-200' 
  },
  expired: { 
    bg: 'bg-red-50', 
    text: 'text-red-800', 
    border: 'border-red-200' 
  },
  terminated: { 
    bg: 'bg-purple-50', 
    text: 'text-purple-800', 
    border: 'border-purple-200' 
  }
};

export const contractTypeLabels: Record<ContractType, string> = {
  service: 'Service Agreement',
  employment: 'Employment Contract',
  licensing: 'Licensing Agreement',
  nda: 'Non-Disclosure Agreement',
  partnership: 'Partnership Agreement'
};

export const getContracts = async (): Promise<Contract[]> => {
  const contractsCollection = collection(db, 'contracts');
  const contractsSnapshot = await getDocs(contractsCollection);
  return contractsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
      updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.createdAt) : null,
      startDate: data.startDate,
      endDate: data.endDate,
      documentLink: data.documentLink,
    } as Contract;
  });
};

export const getContract = async (id: string): Promise<Contract | null> => {
  const contractDoc = doc(db, 'contracts', id);
  const contractSnapshot = await getDoc(contractDoc);
  
  if (!contractSnapshot.exists()) {
    return null;
  }
  
  const data = contractSnapshot.data();
  return {
    id: contractSnapshot.id,
    ...data,
    createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null,
    updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate().toISOString() : data.createdAt) : null,
    startDate: data.startDate,
    endDate: data.endDate,
    documentLink: data.documentLink,
  } as Contract;
};

export const createContract = async (
  contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const now = Timestamp.now();
  const contractToCreate = {
    ...contract,
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await addDoc(collection(db, 'contracts'), contractToCreate);
  return docRef.id;
};

export const updateContract = async (id: string, contract: Partial<Omit<Contract, 'id' | 'createdAt'>>): Promise<void> => {
  const contractRef = doc(db, 'contracts', id);
  await updateDoc(contractRef, {
    ...contract,
    updatedAt: Timestamp.now()
  });
};

export const deleteContract = async (id: string): Promise<void> => {
  const contractRef = doc(db, 'contracts', id);
  await deleteDoc(contractRef);
};

export const createShareInvite = async (contractId: string, email: string): Promise<void> => {
  const invitesRef = collection(db, 'shareInvites');
  await addDoc(invitesRef, {
    contractId,
    email: email.toLowerCase()
  });

  // Update contract's sharedWith array
  const contractRef = doc(db, 'contracts', contractId);
  const contract = await getContract(contractId);
  
  if (contract) {
    const updatedSharedWith = [...(contract.sharedWith || []), {
      email: email.toLowerCase(),
      role: 'viewer',
      inviteStatus: 'pending'
    }];
    await updateDoc(contractRef, { sharedWith: updatedSharedWith });
  }
};

// Check if a user is allowed to access the application
export const isUserAllowed = async (email: string): Promise<boolean> => {
  if (!email) return false;

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

  // If not an admin or registered user, check shareInvites collection
  const shareInvitesRef = collection(db, 'shareInvites');
  const shareQuery = query(shareInvitesRef, where('email', '==', email.toLowerCase()));
  const shareSnapshot = await getDocs(shareQuery);
  
  return !shareSnapshot.empty; // User is either invited or not
};

export const updateInviteStatus = async (inviteId: string, status: 'accepted'): Promise<void> => {
  const contractRef = doc(db, 'contracts', inviteId);
  const contract = await getContract(inviteId);
  
  if (contract) {
    const updatedSharedWith = contract.sharedWith.map(share =>
      share.inviteStatus === 'pending' ? { ...share, inviteStatus: status } : share
    );
    await updateDoc(contractRef, { sharedWith: updatedSharedWith });
  }
};

export const getSharedContracts = async (userEmail: string): Promise<Contract[]> => {
  const contracts = await getContracts();
  return contracts.filter(contract =>
    contract.sharedWith?.some(share =>
      share.email === userEmail && share.inviteStatus === 'accepted'
    )
  );
};

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
      party.name.toLowerCase().includes(owner.toLowerCase()) &&
      party.role.toLowerCase() === 'owner'
    )
  );
};

export const filterByParty = (contracts: Contract[], party?: string): Contract[] => {
  if (!party) return contracts;
  return contracts.filter(contract => 
    contract.parties.some(p => p.name.toLowerCase().includes(party.toLowerCase()))
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
      if (new Date(contract.startDate) < new Date(startDate)) {
        return false;
      }
    }
    
    if (endDate && contract.endDate) {
      if (new Date(contract.endDate) > new Date(endDate)) {
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

    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(c => c.status === 'active').length;
    const pendingContracts = contracts.filter(c => c.status === 'pending').length;
    
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
      activeContracts,
      pendingContracts,
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
export const registerUser = async (userId: string, email: string, displayName?: string): Promise<void> => {
  const usersRef = collection(db, 'users');
  
  // Check if user already exists
  const userQuery = query(usersRef, where('email', '==', email.toLowerCase()));
  const userSnapshot = await getDocs(userQuery);
  
  if (userSnapshot.empty) {
    // Create a new user document
    await addDoc(usersRef, {
      userId,
      email: email.toLowerCase(),
      displayName: displayName || '',
      role: 'user', // Default role
      createdAt: new Date().toISOString(),
    });
  }
};
