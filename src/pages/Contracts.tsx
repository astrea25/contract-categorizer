import { useState, useEffect, useMemo } from 'react';
import { PlusCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthNavbar from '@/components/layout/AuthNavbar';
import FilterBar from '@/components/contracts/FilterBar';
import DraggableContractCard from '@/components/contracts/DraggableContractCard';
import FolderList from '@/components/contracts/FolderList';
import ContractForm from '@/components/contracts/ContractForm';
import SortDropdown, { SortOption, SortField } from '@/components/contracts/SortDropdown';
import {
  Contract,
  ContractStatus,
  ContractType,
  getContracts,
  getArchivedContracts,
  getUserArchivedContracts,
  createContract,
  filterByProject,
  filterByStatus,
  filterByType,
  filterByOwner,
  filterByParty,
  filterByDateRange,
  deleteFolder,
  assignContractToFolder,
  filterByFolder,
  getFolders,
  Folder,
  getUserContracts,
  isUserAdmin,
  isUserLegalTeam
} from '@/lib/data';
import { getContractsForApproval, getApprovedContracts } from '@/lib/approval-utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tooltip } from '@/components/ui/tooltip';
import { ResponsiveContainer, BarChart, Bar, XAxis } from 'recharts';
import PageTransition from '@/components/layout/PageTransition';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const Contracts = () => {
  const { toast: uiToast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string | 'all' | 'archive' | 'approval'>('all');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [sort, setSort] = useState<SortOption>({
    field: 'updatedAt',
    direction: 'desc'
  });
  const [filters, setFilters] = useState({
    search: '',
    status: 'all' as ContractStatus | 'all',
    type: 'all' as ContractType | 'all',
    project: '',
    owner: '',
    party: '',
    dateRange: {
      from: null as Date | null,
      to: null as Date | null,
    },
  });

  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const filter = searchParams.get('filter');

  const { currentUser, isAdmin, isLegalTeam, isManagementTeam } = useAuth();

  // Load folders when component mounts
  useEffect(() => {
    const loadFolders = async () => {
      try {
        const foldersList = await getFolders();
        setFolders(foldersList);
      } catch (error) {
        console.error('Failed to load folders', error);
      }
    };

    loadFolders();
  }, []);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setLoading(true);
        // Use different contract fetching functions based on user role
        if (isAdmin || isLegalTeam) {
          // Admins and legal team can see all contracts
          const contractsList = await getContracts();
          setContracts(contractsList);
        } else if (currentUser?.email) {
          // Regular users can only see contracts they are involved with
          const contractsList = await getUserContracts(currentUser.email);
          setContracts(contractsList);
        }
      } catch (error) {
        toast.error("Failed to load contracts");
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, [currentUser, isAdmin, isLegalTeam]);

  useEffect(() => {
    const fetchAndFilterContracts = async () => {
      // Use different contract fetching functions based on user role and selected folder
      let allContracts;

      if (selectedFolder === 'archive') {
        // Get archived contracts
        if (isAdmin || isLegalTeam) {
          allContracts = await getArchivedContracts();
        } else if (currentUser?.email) {
          allContracts = await getUserArchivedContracts(currentUser.email);
        } else {
          allContracts = [];
        }
      } else if (selectedFolder === 'approval' && currentUser?.email) {
        // Get contracts that need approval from the current user
        if ((isLegalTeam || isManagementTeam) && currentUser?.email) {
          allContracts = await getContractsForApproval(currentUser.email, isLegalTeam, isManagementTeam);
        } else {
          allContracts = [];
        }
      } else {
        // Get regular contracts
        if (isAdmin) {
          // Admins can see all contracts, including archived ones
          allContracts = await getContracts(true);
          // Filter out archived contracts for the main view
          allContracts = allContracts.filter(contract => !contract.archived);
        } else if (isLegalTeam || isManagementTeam) {
          // Legal and management team can see all non-archived contracts
          allContracts = await getContracts();
        } else if (currentUser?.email) {
          // Regular users can only see contracts they are involved with
          allContracts = await getUserContracts(currentUser.email);
        } else {
          allContracts = [];
        }
      }

      let filteredContracts = [...allContracts];

      if (status) {
        filteredContracts = filteredContracts.filter(contract => contract.status === status);
      }

      if (filter) {
        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + (30 * 24 * 60 * 60 * 1000));
        const currentYear = now.getFullYear();

        switch (filter) {
          case 'expiringSoon':
            filteredContracts = filteredContracts.filter(contract => {
              if (!contract.endDate) return false;
              const endDate = new Date(contract.endDate);
              return endDate <= thirtyDaysFromNow && endDate >= now;
            });
            break;
          case 'expiringThisYear':
            filteredContracts = filteredContracts.filter(contract => {
              if (!contract.endDate) return false;
              const endDate = new Date(contract.endDate);
              return endDate.getFullYear() === currentYear;
            });
            break;
        }
      }
      setContracts(filteredContracts);
    };

    fetchAndFilterContracts();
  }, [status, filter, currentUser, isAdmin, isLegalTeam, selectedFolder]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      type: 'all',
      project: '',
      owner: '',
      party: '',
      dateRange: {
        from: null,
        to: null,
      },
    });
  };

  const handleSaveContract = async (newContract: Partial<Contract>) => {
    if (!currentUser?.email) return;

    try {
      const contractToAdd = {
        title: newContract.title || 'Untitled Contract',
        projectName: newContract.projectName || 'Unassigned',
        type: newContract.type || 'service',
        status: newContract.status || 'draft',
        owner: newContract.owner || currentUser?.email || 'Unassigned',
        parties: newContract.parties || [],
        startDate: newContract.startDate || new Date().toISOString().split('T')[0],
        endDate: newContract.endDate || null,
        value: newContract.value || null,
        description: newContract.description || '',
        documentLink: newContract.documentLink || '',
        folderId: newContract.folderId === null || newContract.folderId === "none" ? null : (newContract.folderId || (selectedFolder !== 'all' && selectedFolder !== 'archive' ? selectedFolder : null))
      } as Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>;

      try {
        await createContract(contractToAdd, currentUser.email);

        const updatedContracts = await getContracts();
        setContracts(updatedContracts);

        uiToast({
          title: 'Contract created',
          description: 'Your new contract has been created successfully.',
        });
      } catch (createError) {
        console.error('Error in createContract function:', createError);
        toast.error(`Failed to create contract: ${createError.message}`);
      }
    } catch (error) {
      console.error('Error preparing contract data:', error);
      toast.error(`Failed to create contract: ${error.message}`);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await deleteFolder(folderId);

      // If the deleted folder was selected, reset to 'all'
      if (selectedFolder === folderId) {
        setSelectedFolder('all');
      }

      // Refresh contracts to update folder assignments
      const updatedContracts = await getContracts();
      setContracts(updatedContracts);

      toast.success('Folder deleted successfully');
    } catch (error) {
      toast.error('Failed to delete folder');
    }
  };

  const handleDropContract = async (contractId: string, folderId: string | null) => {
    if (!currentUser?.email) return;

    try {
      await assignContractToFolder(contractId, folderId, currentUser.email);

      // Refresh contracts to update folder assignments
      const updatedContracts = await getContracts();
      setContracts(updatedContracts);

      toast.success(
        folderId
          ? 'Contract moved to folder'
          : 'Contract removed from folder'
      );
    } catch (error) {
      toast.error('Failed to move contract');
    }
  };

  // Sort contracts based on sort field and direction
  const sortContracts = (contractsToSort: Contract[], sortOption: SortOption) => {
    const { field, direction } = sortOption;
    const multiplier = direction === 'asc' ? 1 : -1;

    return [...contractsToSort].sort((a, b) => {
      switch (field) {
        case 'title':
          return multiplier * a.title.localeCompare(b.title);

        case 'updatedAt':
          // Handle potentially missing updatedAt values
          if (!a.updatedAt && !b.updatedAt) return 0;
          if (!a.updatedAt) return multiplier * 1;
          if (!b.updatedAt) return multiplier * -1;

          try {
            return multiplier * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
          } catch (error) {
            console.error('Error sorting by updatedAt:', error);
            return 0;
          }

        case 'createdAt':
          // Handle potentially missing createdAt values
          if (!a.createdAt && !b.createdAt) return 0;
          if (!a.createdAt) return multiplier * 1;
          if (!b.createdAt) return multiplier * -1;

          try {
            return multiplier * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          } catch (error) {
            console.error('Error sorting by createdAt:', error);
            return 0;
          }

        case 'startDate':
          // Handle potentially missing startDate values
          if (!a.startDate && !b.startDate) return 0;
          if (!a.startDate) return multiplier * 1;
          if (!b.startDate) return multiplier * -1;

          try {
            return multiplier * (new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
          } catch (error) {
            console.error('Error sorting by startDate:', error);
            return 0;
          }

        case 'endDate':
          // Handle null endDates (ongoing contracts)
          if (!a.endDate && !b.endDate) return 0;
          if (!a.endDate) return multiplier * 1;
          if (!b.endDate) return multiplier * -1;

          try {
            return multiplier * (new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
          } catch (error) {
            console.error('Error sorting by endDate:', error);
            return 0;
          }

        case 'value':
          // Handle null values
          if (a.value === null && b.value === null) return 0;
          if (a.value === null) return multiplier * 1;
          if (b.value === null) return multiplier * -1;
          return multiplier * (a.value - b.value);

        default:
          return 0;
      }
    });
  };

  // Apply filters and sorting
  const filteredAndSortedContracts = useMemo(() => {
    let result = [...contracts];

    // Filter by folder first
    if (selectedFolder !== 'all' && selectedFolder !== 'archive') {
      // When viewing a specific folder, admins should see all contracts in that folder
      // including archived ones
      result = filterByFolder(result, selectedFolder);
    }

    // Then apply other filters
    result = filterByStatus(result, filters.status);
    result = filterByType(result, filters.type);
    result = filterByProject(result, filters.project);
    result = filterByOwner(result, filters.owner);
    result = filterByParty(result, filters.party);

    if (filters.dateRange.from || filters.dateRange.to) {
      const fromStr = filters.dateRange.from ? filters.dateRange.from.toISOString().split('T')[0] : null;
      const toStr = filters.dateRange.to ? filters.dateRange.to.toISOString().split('T')[0] : null;
      result = filterByDateRange(result, fromStr, toStr);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        contract =>
          contract.title.toLowerCase().includes(searchLower) ||
          contract.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    return sortContracts(result, sort);
  }, [contracts, filters, selectedFolder, sort]);

  // Get name of selected folder for display
  const selectedFolderName = useMemo(() => {
    if (selectedFolder === 'all') return 'All Contracts';
    if (selectedFolder === 'archive') return 'Archive';
    const folder = folders.find(f => f.id === selectedFolder);
    return folder ? folder.name : '';
  }, [selectedFolder, folders]);

  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== 'all' ||
    filters.type !== 'all' ||
    filters.project !== '' ||
    filters.owner !== '' ||
    filters.party !== '' ||
    filters.dateRange.from !== null ||
    filters.dateRange.to !== null;

  return (
    <>
      <AuthNavbar />
      <div className="container mx-auto p-4 sm:p-6">
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">
                {selectedFolder !== 'all' && (
                  <>
                    <span className="text-muted-foreground mr-2">Folder:</span>
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-md">
                      {selectedFolderName}
                    </span>
                  </>
                )}
                {selectedFolder === 'all' && 'All Contracts'}
              </h1>
              <p className="text-muted-foreground">
                {selectedFolder !== 'all'
                  ? `Viewing contracts in the "${selectedFolderName}" folder`
                  : 'Manage and track all your contracts in one place'}
              </p>
            </div>
            <ContractForm
              onSave={handleSaveContract}
              initialFolder={selectedFolder !== 'all' ? selectedFolder : undefined}
              foldersList={folders}
              trigger={
                <Button className="gap-1">
                  <PlusCircle size={16} />
                  <span>New Contract</span>
                </Button>
              }
            />
          </div>
          <FilterBar
            onFilterChange={handleFilterChange}
            currentSort={sort}
            onSortChange={setSort}
            className="glass p-4 rounded-lg"
          />

          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap gap-2 items-center">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {filters.status !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Status: {filters.status}
                  <X size={14} className="cursor-pointer" onClick={() => setFilters({...filters, status: 'all'})} />
                </Badge>
              )}
              {filters.type !== 'all' && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Type: {filters.type}
                  <X size={14} className="cursor-pointer" onClick={() => setFilters({...filters, type: 'all'})} />
                </Badge>
              )}
              {filters.project && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Project: {filters.project}
                  <X size={14} className="cursor-pointer" onClick={() => setFilters({...filters, project: ''})} />
                </Badge>
              )}
              {filters.owner && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Owner: {filters.owner}
                  <X size={14} className="cursor-pointer" onClick={() => setFilters({...filters, owner: ''})} />
                </Badge>
              )}
              {filters.party && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Party: {filters.party}
                  <X size={14} className="cursor-pointer" onClick={() => setFilters({...filters, party: ''})} />
                </Badge>
              )}
              {(filters.dateRange.from || filters.dateRange.to) && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  Dates: {filters.dateRange.from ? format(filters.dateRange.from, 'PP') : 'Any'} -
                  {filters.dateRange.to ? format(filters.dateRange.to, 'PP') : 'Any'}
                  <X
                    size={14}
                    className="cursor-pointer"
                    onClick={() => setFilters({
                      ...filters,
                      dateRange: {from: null, to: null}
                    })}
                  />
                </Badge>
              )}
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <FolderList
              selectedFolder={selectedFolder}
              onFolderSelect={setSelectedFolder}
              onDeleteFolder={handleDeleteFolder}
              onDropContract={handleDropContract}
            />
          </div>

          <div className="md:col-span-3">
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-48 w-full" />
                ))}
              </div>
            ) : filteredAndSortedContracts.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredAndSortedContracts.map(contract => (
                  <DraggableContractCard
                    key={contract.id}
                    contract={contract}
                    className="animate-slide-in"
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border rounded-lg bg-secondary/30">
                <h3 className="font-medium text-lg mb-2">No contracts found</h3>
                <p className="text-muted-foreground mb-6">
                  {contracts.length === 0
                    ? "You haven't created any contracts yet."
                    : selectedFolder !== 'all'
                      ? "This folder doesn't have any contracts yet."
                      : "There are no contracts matching your current filters."
                  }
                </p>
                {contracts.length === 0 || selectedFolder !== 'all' ? (
                  <ContractForm
                    onSave={handleSaveContract}
                    initialFolder={selectedFolder !== 'all' ? selectedFolder : undefined}
                    foldersList={folders}
                    trigger={
                      <Button>
                        Create {selectedFolder !== 'all' ? 'First Contract in this Folder' : 'Your First Contract'}
                      </Button>
                    }
                  />
                ) : (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                  >
                    Reset Filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Contracts;
