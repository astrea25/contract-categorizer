
export type ContractStatus = 'draft' | 'pending' | 'active' | 'expired' | 'terminated';
export type ContractType = 'service' | 'employment' | 'licensing' | 'nda' | 'partnership';

export interface Contract {
  id: string;
  title: string;
  projectName: string;
  type: ContractType;
  status: ContractStatus;
  parties: {
    name: string;
    role: string;
  }[];
  startDate: string;
  endDate: string | null;
  value: number | null;
  description: string;
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

// Mock data
export const contracts: Contract[] = [
  {
    id: '1',
    title: 'Software Development Agreement',
    projectName: 'Website Redesign',
    type: 'service',
    status: 'active',
    parties: [
      { name: 'Acme Corp', role: 'Client' },
      { name: 'TechSolutions Inc', role: 'Provider' }
    ],
    startDate: '2023-01-15',
    endDate: '2023-12-31',
    value: 75000,
    description: 'Agreement for redesigning the company website and implementing new features.',
    createdAt: '2023-01-10T09:00:00Z',
    updatedAt: '2023-01-15T14:30:00Z'
  },
  {
    id: '2',
    title: 'Product Manager Employment Contract',
    projectName: 'HR Department',
    type: 'employment',
    status: 'active',
    parties: [
      { name: 'Acme Corp', role: 'Employer' },
      { name: 'Jane Smith', role: 'Employee' }
    ],
    startDate: '2023-02-01',
    endDate: null,
    value: 120000,
    description: 'Full-time employment contract for the Product Manager position.',
    createdAt: '2023-01-20T11:15:00Z',
    updatedAt: '2023-01-25T16:45:00Z'
  },
  {
    id: '3',
    title: 'Software Licensing Agreement',
    projectName: 'CRM Implementation',
    type: 'licensing',
    status: 'pending',
    parties: [
      { name: 'Acme Corp', role: 'Licensee' },
      { name: 'SaaS Solutions', role: 'Licensor' }
    ],
    startDate: '2023-03-01',
    endDate: '2026-02-28',
    value: 45000,
    description: 'License for the use of CRM software and related services.',
    createdAt: '2023-02-15T10:30:00Z',
    updatedAt: '2023-02-18T09:20:00Z'
  },
  {
    id: '4',
    title: 'Marketing Agency NDA',
    projectName: 'Product Launch Campaign',
    type: 'nda',
    status: 'active',
    parties: [
      { name: 'Acme Corp', role: 'Disclosing Party' },
      { name: 'CreativeMinds Agency', role: 'Receiving Party' }
    ],
    startDate: '2023-03-15',
    endDate: '2026-03-14',
    value: null,
    description: 'Confidentiality agreement regarding upcoming product launch details.',
    createdAt: '2023-03-10T14:00:00Z',
    updatedAt: '2023-03-14T11:30:00Z'
  },
  {
    id: '5',
    title: 'Distribution Partnership',
    projectName: 'International Expansion',
    type: 'partnership',
    status: 'draft',
    parties: [
      { name: 'Acme Corp', role: 'Manufacturer' },
      { name: 'Global Distributors Ltd', role: 'Distributor' }
    ],
    startDate: '2023-06-01',
    endDate: '2028-05-31',
    value: 500000,
    description: 'Partnership agreement for product distribution in European markets.',
    createdAt: '2023-04-05T09:45:00Z',
    updatedAt: '2023-04-05T09:45:00Z'
  },
  {
    id: '6',
    title: 'IT Support Services',
    projectName: 'Infrastructure Maintenance',
    type: 'service',
    status: 'expired',
    parties: [
      { name: 'Acme Corp', role: 'Client' },
      { name: 'IT Experts LLC', role: 'Provider' }
    ],
    startDate: '2022-01-01',
    endDate: '2022-12-31',
    value: 36000,
    description: 'Annual IT infrastructure support and maintenance services.',
    createdAt: '2021-12-10T13:20:00Z',
    updatedAt: '2022-12-31T23:59:59Z'
  },
  {
    id: '7',
    title: 'Senior Developer Contract',
    projectName: 'Mobile App Development',
    type: 'employment',
    status: 'terminated',
    parties: [
      { name: 'Acme Corp', role: 'Employer' },
      { name: 'John Doe', role: 'Contractor' }
    ],
    startDate: '2022-06-01',
    endDate: '2022-09-15',
    value: 48000,
    description: 'Contract for senior developer role on the mobile app project.',
    createdAt: '2022-05-20T10:00:00Z',
    updatedAt: '2022-09-15T17:30:00Z'
  },
  {
    id: '8',
    title: 'Office Lease Agreement',
    projectName: 'Facilities',
    type: 'service',
    status: 'active',
    parties: [
      { name: 'Acme Corp', role: 'Tenant' },
      { name: 'Downtown Properties', role: 'Landlord' }
    ],
    startDate: '2023-01-01',
    endDate: '2027-12-31',
    value: 240000,
    description: 'Five-year lease agreement for main office space.',
    createdAt: '2022-11-05T11:40:00Z',
    updatedAt: '2022-12-20T15:15:00Z'
  }
];

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

// Summary statistics
export const getContractStats = (contracts: Contract[]) => {
  const totalContracts = contracts.length;
  const activeContracts = contracts.filter(c => c.status === 'active').length;
  const pendingContracts = contracts.filter(c => c.status === 'pending').length;
  const expiringContracts = contracts.filter(c => {
    if (c.status === 'active' && c.endDate) {
      const endDate = new Date(c.endDate);
      const now = new Date();
      const diffTime = endDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }
    return false;
  }).length;
  
  // Calculate total contract value
  const totalValue = contracts.reduce((sum, contract) => {
    return sum + (contract.value || 0);
  }, 0);
  
  return {
    totalContracts,
    activeContracts,
    pendingContracts,
    expiringContracts,
    totalValue
  };
};
