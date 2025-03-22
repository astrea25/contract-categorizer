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

// Firestore functions
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

// First fix createContract function
export const createContract = async (
  contract: Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const now = Timestamp.now();
  const contractToCreate = {
    ...contract,
    createdAt: now,
    updatedAt: now,
  };
  console.log('createContract - Contract Data:', contractToCreate);
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

// Filter functions
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
    // Filter by start date
    if (startDate && contract.startDate) {
      if (new Date(contract.startDate) < new Date(startDate)) {
        return false;
      }
    }
    
    // Filter by end date
    if (endDate && contract.endDate) {
      if (new Date(contract.endDate) > new Date(endDate)) {
        return false;
      }
    }
    
    return true;
  });
};

// Summary statistics
// Update getContractStats with improved date handling and logging
export const getContractStats = async (): Promise<ContractStats> => {
  console.log("getContractStats called");
  try {
    const contracts = await getContracts();
    console.log("Raw contracts data:", contracts);

    const now = new Date();
    const currentYear = now.getFullYear();
    const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));

    // Debug each contract's data
    contracts.forEach(c => {
      console.log(`Contract ${c.id}:`, {
        status: c.status,
        endDate: c.endDate,
        parsedEndDate: c.endDate ? new Date(c.endDate) : null,
        value: c.value
      });
    });

    const totalContracts = contracts.length;
    const activeContracts = contracts.filter(c => c.status === 'active').length;
    const pendingContracts = contracts.filter(c => c.status === 'pending').length;

    // Modified expiring contracts calculation
    const expiringContracts = contracts.filter(c => {
      if (!c.endDate) {
        console.log(`Contract ${c.id}: No end date`);
        return false;
      }

      try {
        const endDate = new Date(c.endDate);
        
        if (isNaN(endDate.getTime())) {
          console.log(`Contract ${c.id}: Invalid end date format`);
          return false;
        }

        const isExpiringSoon = endDate <= thirtyDaysFromNow && endDate >= now;
        console.log(`Contract ${c.id}: Expiring soon: ${isExpiringSoon}, EndDate: ${endDate.toISOString()}`);
        return isExpiringSoon;
      } catch (error) {
        console.log(`Contract ${c.id}: Error processing date`, error);
        return false;
      }
    }).length;

    const totalValue = contracts.reduce((sum, contract) => {
      return sum + (contract.value || 0);
    }, 0);

    // Modified expiring this year calculation
    const expiringThisYear = contracts.filter(c => {
      if (!c.endDate) {
        console.log(`Contract ${c.id}: No end date for yearly check`);
        return false;
      }

      try {
        const endDate = new Date(c.endDate);
        
        if (isNaN(endDate.getTime())) {
          console.log(`Contract ${c.id}: Invalid end date format for yearly check`);
          return false;
        }

        const isExpiringThisYear = endDate.getFullYear() === currentYear;
        console.log(`Contract ${c.id}: Expiring this year: ${isExpiringThisYear}, EndDate: ${endDate.toISOString()}`);
        return isExpiringThisYear;
      } catch (error) {
        console.log(`Contract ${c.id}: Error processing date for yearly check`, error);
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

    console.log("Final calculated stats:", stats);
    return stats;
  } catch (error) {
    console.error("Error in getContractStats:", error);
    throw error;
  }
};
