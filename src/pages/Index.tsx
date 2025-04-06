import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getContractStats, getContracts, Contract } from '@/lib/data';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { ArrowRight, Calendar, FileText, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import AuthNavbar from '@/components/layout/AuthNavbar';
import ContractCard from '@/components/contracts/ContractCard';
import PageTransition from '@/components/layout/PageTransition';
import { Skeleton } from '@/components/ui/skeleton';

const Index = () => {
  const [stats, setStats] = useState({
    totalContracts: 0,
    finishedContracts: 0,
    pendingApprovalContracts: 0,
    expiringContracts: 0,
    totalValue: 0,
    expiringThisYear: 0
  });
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const contractStats = await getContractStats();
        setStats(contractStats);

        const contractsList = await getContracts();
        setContracts(contractsList);
      } catch (error) {
  
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  const chartData = [
    { name: 'Requested', value: contracts.filter(c => c.status === 'requested').length },
    { name: 'Draft', value: contracts.filter(c => c.status === 'draft').length },
    { name: 'Legal Review', value: contracts.filter(c => c.status === 'legal_review').length },
    { name: 'Management Review', value: contracts.filter(c => c.status === 'management_review').length },
    { name: 'Approval', value: contracts.filter(c => c.status === 'approval').length },
    { name: 'Finished', value: contracts.filter(c => c.status === 'finished').length },
  ];
  
  const activeContracts = contracts
    .filter(c => c.status === 'finished')
    .sort((a, b) => {
      if (!a.endDate) return 1;
      if (!b.endDate) return -1;
      return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    })
    .slice(0, 3);
    
  return (
    <PageTransition>
      <AuthNavbar />
      <div className="container mx-auto p-4 sm:p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Contract Management Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your contract portfolio and key metrics
          </p>
        </header>
        
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Total Contracts
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.totalContracts}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Across all projects and types
                  </p>
                  <Link 
                    to="/contracts"
                    className="text-xs text-primary hover:underline inline-flex items-center mt-2"
                  >
                    View all contracts
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Active Contracts
              </CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.finishedContracts}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Currently finished
                  </p>
                  <Link 
                    to="/contracts?status=finished"
                    className="text-xs text-primary hover:underline inline-flex items-center mt-2"
                  >
                    View finished contracts
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Expiring Soon
              </CardTitle>
              <Calendar className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.expiringContracts}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Within the next 30 days
                  </p>
                  <Link 
                    to="/contracts?filter=expiringSoon"
                    className="text-xs text-primary hover:underline inline-flex items-center mt-2"
                  >
                    View expiring soon
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Expiring This Year
              </CardTitle>
              <Calendar className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.expiringThisYear}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Contracts expiring in {new Date().getFullYear()}
                  </p>
                  <Link 
                    to="/contracts?filter=expiringThisYear"
                    className="text-xs text-primary hover:underline inline-flex items-center mt-2"
                  >
                    View all expiring this year
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle>Contract Status Overview</CardTitle>
              <CardDescription>
                Distribution of contracts by status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-[200px] flex items-center justify-center">
                  <Skeleton className="h-full w-full" />
                </div>
              ) : (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                        cursor={{fill: 'rgba(0, 0, 0, 0.05)'}} 
                        contentStyle={{
                          background: 'rgba(255, 255, 255, 0.8)',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                        className="animate-slide-in"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Upcoming Expirations</CardTitle>
                <CardDescription>
                  Active contracts expiring soon
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/contracts" className="flex items-center gap-1">
                  <span>View all</span>
                  <ArrowRight size={14} />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex justify-between items-center border-b pb-3 last:border-0">
                      <Skeleton className="h-14 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {activeContracts.length > 0 ? (
                    activeContracts.map(contract => (
                      <div key={contract.id} className="flex justify-between items-center border-b pb-3 last:border-0">
                        <div>
                          <h4 className="font-medium">{contract.title}</h4>
                          <p className="text-sm text-muted-foreground">{contract.projectName}</p>
                        </div>
                        <div className="text-right">
                          {contract.endDate ? (
                            <p className="text-sm font-medium">
                              Expires: {new Date(contract.endDate).toLocaleDateString()}
                            </p>
                          ) : (
                            <p className="text-sm font-medium">Ongoing</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-4">
                      No upcoming expirations
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold tracking-tight">Recent Contracts</h2>
            <Button asChild>
              <Link to="/contracts">View All Contracts</Link>
            </Button>
          </div>
          
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {contracts.slice(0, 3).map(contract => (
                <ContractCard key={contract.id} contract={contract} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Index;
