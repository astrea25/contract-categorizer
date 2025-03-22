
import { useState, useEffect, useMemo } from 'react';
import { PlusCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthNavbar from '@/components/layout/AuthNavbar';
import FilterBar from '@/components/contracts/FilterBar';
import ContractCard from '@/components/contracts/ContractCard';
import ContractForm from '@/components/contracts/ContractForm';
import { 
  Contract, 
  ContractStatus, 
  ContractType, 
  getContracts,
  createContract,
  filterByProject, 
  filterByStatus, 
  filterByType,
  filterByOwner,
  filterByParty,
  filterByDateRange
} from '@/lib/data';
import { useToast } from '@/components/ui/use-toast';
import PageTransition from '@/components/layout/PageTransition';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const Contracts = () => {
  const { toast: uiToast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setLoading(true);
        const contractsList = await getContracts();
        setContracts(contractsList);
      } catch (error) {
        console.error("Error fetching contracts:", error);
        toast.error("Failed to load contracts");
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

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
    try {
      const contractToAdd = {
        title: newContract.title || 'Untitled Contract',
        projectName: newContract.projectName || 'Unassigned',
        type: newContract.type || 'service',
        status: newContract.status || 'draft',
        owner: newContract.owner || 'Unassigned',
        parties: newContract.parties || [],
        startDate: newContract.startDate || new Date().toISOString().split('T')[0],
        endDate: newContract.endDate || null,
        value: newContract.value || null,
        description: newContract.description || '',
      } as Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>;
      
      await createContract(contractToAdd);
      
      // Refresh the contracts list
      const updatedContracts = await getContracts();
      setContracts(updatedContracts);
      
      uiToast({
        title: 'Contract created',
        description: 'Your new contract has been created successfully.',
      });
    } catch (error) {
      console.error("Error creating contract:", error);
      toast.error("Failed to create contract");
    }
  };

  const filteredContracts = useMemo(() => {
    let result = [...contracts];
    
    // Filter by status
    result = filterByStatus(result, filters.status);
    
    // Filter by type
    result = filterByType(result, filters.type);
    
    // Filter by project
    result = filterByProject(result, filters.project);
    
    // Filter by owner
    result = filterByOwner(result, filters.owner);
    
    // Filter by party
    result = filterByParty(result, filters.party);
    
    // Filter by date range
    if (filters.dateRange.from || filters.dateRange.to) {
      const fromStr = filters.dateRange.from ? filters.dateRange.from.toISOString().split('T')[0] : null;
      const toStr = filters.dateRange.to ? filters.dateRange.to.toISOString().split('T')[0] : null;
      result = filterByDateRange(result, fromStr, toStr);
    }
    
    // Filter by search term (title or description)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        contract =>
          contract.title.toLowerCase().includes(searchLower) ||
          contract.description.toLowerCase().includes(searchLower)
      );
    }
    
    return result;
  }, [contracts, filters]);

  // Check if any filters are active
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
    <PageTransition>
      <AuthNavbar />
      <div className="container mx-auto p-4 sm:p-6">
        <header className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Contracts</h1>
              <p className="text-muted-foreground">
                Manage and track all your contracts in one place
              </p>
            </div>
            <ContractForm 
              onSave={handleSaveContract}
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
              
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="ml-auto"
                >
                  Clear all
                </Button>
              )}
            </div>
          )}
        </header>
        
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : filteredContracts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredContracts.map(contract => (
              <ContractCard 
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
                : "There are no contracts matching your current filters."
              }
            </p>
            {contracts.length === 0 ? (
              <ContractForm 
                onSave={handleSaveContract}
                trigger={
                  <Button>
                    Create Your First Contract
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
    </PageTransition>
  );
};

export default Contracts;
