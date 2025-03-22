
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/layout/Navbar';
import ContractStatusBadge from '@/components/contracts/ContractStatusBadge';
import ContractForm from '@/components/contracts/ContractForm';
import { Contract, ContractType, contracts, contractTypeLabels } from '@/lib/data';
import { ArrowLeft, CalendarClock, Edit, FileText, Users, Wallet } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { toast } from 'sonner';
import PageTransition from '@/components/layout/PageTransition';

const ContractDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, this would be an API call
    const fetchContract = () => {
      setLoading(true);
      setTimeout(() => {
        const foundContract = contracts.find(c => c.id === id);
        if (foundContract) {
          setContract(foundContract);
          setError(null);
        } else {
          setError('Contract not found');
        }
        setLoading(false);
      }, 500); // Simulate API delay
    };

    fetchContract();
  }, [id]);

  const handleSaveContract = (updatedData: Partial<Contract>) => {
    if (!contract) return;
    
    // In a real app, this would update the data in the backend
    const updatedContract: Contract = {
      ...contract,
      ...updatedData,
      updatedAt: new Date().toISOString(),
    };
    
    setContract(updatedContract);
    toast.success('Contract updated successfully');
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto p-4 sm:p-6 flex justify-center items-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-pulse h-12 w-48 bg-muted rounded-lg mb-4 mx-auto"></div>
            <div className="animate-pulse h-4 w-64 bg-muted rounded-full mb-8 mx-auto"></div>
            <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse h-24 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto p-4 sm:p-6">
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button asChild variant="outline">
            <Link to="/contracts" className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to contracts
            </Link>
          </Button>
        </div>
      </>
    );
  }

  if (!contract) return null;

  const daysRemaining = contract.endDate
    ? formatDistance(new Date(contract.endDate), new Date(), { addSuffix: true })
    : 'Ongoing';

  return (
    <PageTransition>
      <Navbar />
      <div className="container mx-auto p-4 sm:p-6">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <Button asChild variant="ghost" className="self-start">
              <Link to="/contracts" className="flex items-center gap-2">
                <ArrowLeft size={16} />
                Back to contracts
              </Link>
            </Button>
            
            <ContractForm
              initialData={contract}
              onSave={handleSaveContract}
              trigger={
                <Button variant="outline" className="gap-1 self-end">
                  <Edit size={16} />
                  Edit Contract
                </Button>
              }
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="px-2 py-1 bg-secondary text-xs rounded-md font-medium text-secondary-foreground">
                {contractTypeLabels[contract.type as ContractType]}
              </span>
              <ContractStatusBadge status={contract.status} />
            </div>
            
            <h1 className="text-3xl font-bold tracking-tight">{contract.title}</h1>
            <p className="text-lg text-muted-foreground">
              {contract.projectName}
            </p>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Duration</CardTitle>
              <CalendarClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <div className="font-medium">{new Date(contract.startDate).toLocaleDateString()} - {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : 'Ongoing'}</div>
                {contract.endDate && (
                  <p className="text-muted-foreground mt-1">
                    Expires {daysRemaining}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Contract Value</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <div className="font-medium">
                  {contract.value ? `$${contract.value.toLocaleString()}` : 'No value specified'}
                </div>
                <p className="text-muted-foreground mt-1">
                  Last updated {new Date(contract.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Type</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <div className="font-medium">
                  {contractTypeLabels[contract.type as ContractType]}
                </div>
                <p className="text-muted-foreground mt-1">
                  ID: {contract.id}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="md:col-span-2 overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">
                {contract.description || 'No description provided.'}
              </p>
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle>Parties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {contract.parties.map((party, index) => (
                  <div key={index}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{party.name}</span>
                    </div>
                    <p className="text-sm text-muted-foreground ml-6">
                      {party.role}
                    </p>
                    {index < contract.parties.length - 1 && (
                      <Separator className="my-2" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card className="mb-8 overflow-hidden transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <div className="w-0.5 h-full bg-border"></div>
                </div>
                <div>
                  <div className="font-medium">Contract Created</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(contract.createdAt).toLocaleString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <div className="w-0.5 h-full bg-border"></div>
                </div>
                <div>
                  <div className="font-medium">Contract Started</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(contract.startDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex flex-col items-center mr-4">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <div className="w-0.5 h-full bg-border"></div>
                </div>
                <div>
                  <div className="font-medium">Last Updated</div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(contract.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>
              
              {contract.endDate && (
                <div className="flex items-start">
                  <div className="flex flex-col items-center mr-4">
                    <div className="w-3 h-3 rounded-full bg-muted-foreground"></div>
                  </div>
                  <div>
                    <div className="font-medium">Contract End Date</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(contract.endDate).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default ContractDetail;
