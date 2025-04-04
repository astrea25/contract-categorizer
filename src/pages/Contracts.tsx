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

  const [searchParams] = useSearchParams();
  const status = searchParams.get('status');
  const filter = searchParams.get('filter');

  useEffect(() => {
    const fetchContracts = async () => {
      
      try {
        setLoading(true);
        const contractsList = await getContracts();
        setContracts(contractsList);
      } catch (error) {

        toast.error("Failed to load contracts");
      } finally {
        setLoading(false);
        
      }
    };

    fetchContracts();
  }, []);

  useEffect(() => {
    const fetchAndFilterContracts = async () => {
      const allContracts = await getContracts();
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
  }, [status, filter]);

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
        documentLink: newContract.documentLink || '',
      } as Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>;

      await createContract(contractToAdd);
      
      const updatedContracts = await getContracts();
      setContracts(updatedContracts);

      uiToast({
        title: 'Contract created',
        description: 'Your new contract has been created successfully.',
      });
    } catch (error) {

      toast.error("Failed to create contract");
    }
  };

  const filteredContracts = useMemo(() => {
    let result = [...contracts];

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
    return result;
  }, [contracts, filters]);

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
    </>
  );
};

export default Contracts;
