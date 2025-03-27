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
  Timestamp 
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
  id: string;
  contractId: string;
  email: string;
  role: 'viewer' | 'editor';
  status: 'pending' | 'accepted';
  invitedBy: string;
  createdAt: string;
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

export const createShareInvite = async (contractId: string, email: string, role: 'viewer' | 'editor', invitedBy: string): Promise<string> => {
  console.log('Creating share invite in Firestore:', { contractId, email, role, invitedBy });
  
  try {
    const now = Timestamp.now();
    const invite: Omit<ShareInvite, 'id'> = {
      contractId,
      email,
      role,
      status: 'pending',
      invitedBy,
      createdAt: now.toDate().toISOString()
    };

    // Create invite document
    console.log('Adding invite document to shareInvites collection');
    const inviteRef = await addDoc(collection(db, 'shareInvites'), invite);
    console.log('Invite document created with ID:', inviteRef.id);

    // Get current contract data
    console.log('Fetching current contract data');
    const contract = await getContract(contractId);
    console.log('Current contract sharedWith:', contract?.sharedWith);

    // Update contract's sharedWith array
    console.log('Updating contract sharedWith array');
    const contractRef = doc(db, 'contracts', contractId);
    await updateDoc(contractRef, {
      sharedWith: [...(contract?.sharedWith || []), {
        email,
        role,
        inviteStatus: 'pending'
      }]
    });
    console.log('Contract sharedWith array updated successfully');

    return inviteRef.id;
  } catch (error) {
    console.error('Error in createShareInvite:', error);
    throw error;
  }
};

export const updateInviteStatus = async (inviteId: string, status: 'accepted'): Promise<void> => {
  const inviteRef = doc(db, 'shareInvites', inviteId);
  const inviteSnap = await getDoc(inviteRef);
  
  if (!inviteSnap.exists()) {
    throw new Error('Invite not found');
  }

  const invite = inviteSnap.data() as ShareInvite;
  
  // Update invite status
  await updateDoc(inviteRef, { status });

  // Update contract's sharedWith array
  const contractRef = doc(db, 'contracts', invite.contractId);
  const contract = await getContract(invite.contractId);
  
  if (contract) {
    const updatedSharedWith = contract.sharedWith.map(share =>
      share.email === invite.email ? { ...share, inviteStatus: status } : share
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
