import { useState, useEffect } from 'react';
import { differenceInDays, parseISO, format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  getContractStats,
  getContracts,
  Contract,
  getUserContractStats,
  getUserContracts,
  normalizeApprovers
} from '@/lib/data';
import { getContractsForApproval, getRespondedContracts } from '@/lib/approval-utils';
import { fixInconsistentApprovalStates } from '@/lib/fix-approvals';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { ArrowRight, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import AuthNavbar from '@/components/layout/AuthNavbar';
import ContractCard from '@/components/contracts/ContractCard';
import PageTransition from '@/components/layout/PageTransition';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';

const Index = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalContracts: 0,
    finishedContracts: 0,
    pendingApprovalContracts: 0,
    expiringContracts: 0,
    totalValue: 0,
    expiringThisYear: 0
  });
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [approvedContracts, setApprovedContracts] = useState<Contract[]>([]);
  const [rejectedContracts, setRejectedContracts] = useState<Contract[]>([]);
  const [allContracts, setAllContracts] = useState<Contract[]>([]);
  const [expiringContractsList, setExpiringContractsList] = useState<Contract[]>([]); // State for the list
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isFixingApprovals, setIsFixingApprovals] = useState(false);
  const { currentUser, isAdmin, isLegalTeam, isManagementTeam, isApprover } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fix any inconsistent approval states
        try {
          await fixInconsistentApprovalStates();
        } catch (error) {
          // Silent catch
        }

        // Use different statistics fetching based on user role
        if (isAdmin) {
          // Admins can see all contract stats
          const contractStats = await getContractStats();
          setStats(contractStats);

          // Get all contracts for the dashboard and chart data
          const fetchedContracts = await getContracts();
          setAllContracts(fetchedContracts);

          // Sort by last updated and take the 5 most recent for display
          const recentContracts = [...fetchedContracts]
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 5);
          setContracts(recentContracts);
        } else if (isLegalTeam || isManagementTeam || isApprover) {
          // Legal, management team, and approver members see only their assigned contracts
          const contractStats = await getUserContractStats(currentUser?.email || '');

          // Get all contracts assigned to this user
          const userContracts = await getUserContracts(currentUser?.email || '');
          // Normalize contracts to handle the new approvers structure
          const normalizedContracts = userContracts.map(contract => normalizeApprovers(contract));

          // Get approved and rejected contracts by this user
          const approved = normalizedContracts.filter(c => {
            const userEmail = currentUser?.email || '';

            // Check if the user is a legal team approver who approved this contract
            if (isLegalTeam && c.approvers?.legal) {
              const legalApprovers = Array.isArray(c.approvers.legal) ? c.approvers.legal : [c.approvers.legal];
              const userApprover = legalApprovers.find(a => a.email === userEmail);
              return userApprover?.approved === true;
            }

            // Check if the user is a management team approver who approved this contract
            if (isManagementTeam && c.approvers?.management) {
              const managementApprovers = Array.isArray(c.approvers.management) ? c.approvers.management : [c.approvers.management];
              const userApprover = managementApprovers.find(a => a.email === userEmail);
              return userApprover?.approved === true;
            }

            // Check if the user is an approver who approved this contract
            if (isApprover && c.approvers?.approver) {
              const approvers = c.approvers.approver;
              const userApprover = approvers.find(a => a.email === userEmail);
              return userApprover?.approved === true;
            }

            return false;
          });
          setApprovedContracts(approved);

          const rejected = normalizedContracts.filter(c => {
            const userEmail = currentUser?.email || '';

            // Check if the user is a legal team approver who declined this contract
            if (isLegalTeam && c.approvers?.legal) {
              const legalApprovers = Array.isArray(c.approvers.legal) ? c.approvers.legal : [c.approvers.legal];
              const userApprover = legalApprovers.find(a => a.email === userEmail);
              return userApprover?.declined === true;
            }

            // Check if the user is a management team approver who declined this contract
            if (isManagementTeam && c.approvers?.management) {
              const managementApprovers = Array.isArray(c.approvers.management) ? c.approvers.management : [c.approvers.management];
              const userApprover = managementApprovers.find(a => a.email === userEmail);
              return userApprover?.declined === true;
            }

            // Check if the user is an approver who declined this contract
            if (isApprover && c.approvers?.approver) {
              const approvers = c.approvers.approver;
              const userApprover = approvers.find(a => a.email === userEmail);
              return userApprover?.declined === true;
            }

            return false;
          });
          setRejectedContracts(rejected);

          // Get contracts requiring approval from this user
          const contractsForApproval = await getContractsForApproval(
            currentUser?.email || '',
            isLegalTeam,
            isManagementTeam
          );

          // Get contracts that the user has already responded to
          const respondedContracts = await getRespondedContracts(
            currentUser?.email || '',
            isLegalTeam,
            isManagementTeam
          );


          // Update stats with contracts requiring approval
          setStats({
            ...contractStats,
            pendingApprovalContracts: contractsForApproval.length,
            // Log the stats for debugging
            totalContracts: contractStats.totalContracts
          });


          // Get only contracts assigned to this user for the dashboard and chart data
          const fetchedContracts = await getUserContracts(currentUser?.email || '');
          setAllContracts(fetchedContracts);

          // Sort by last updated and take the 5 most recent for display
          const recentContracts = [...fetchedContracts]
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 5);
          setContracts(recentContracts);
        } else if (currentUser?.email) {
          // Regular users can only see their own contract stats
          const contractStats = await getUserContractStats(currentUser.email);
          setStats(contractStats);

          // Get user's contracts for the dashboard
          const userContracts = await getUserContracts(currentUser.email);
          setAllContracts(userContracts);

          // Sort by last updated and take the 5 most recent
          const recentContracts = [...userContracts]
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 5);
          setContracts(recentContracts);
        }

        // Filter for expiring contracts (e.g., within 30 days) after allContracts is set
        // Ensure allContracts is updated before filtering
        setAllContracts(prevAllContracts => {
          const today = new Date();
          const thirtyDaysFromNow = new Date(today);
          thirtyDaysFromNow.setDate(today.getDate() + 30);

          const expiringSoon = prevAllContracts.filter(contract => {
            if (!contract.endDate) return false;
            // Ensure endDate is treated as a string before parsing
            const endDateStr = typeof contract.endDate === 'string' ? contract.endDate : (contract.endDate as any)?.toDate?.().toISOString();
            if (!endDateStr) return false;
            try {
              const endDate = parseISO(endDateStr);
              return endDate >= today && endDate <= thirtyDaysFromNow;
            } catch (e) {
              console.error("Error parsing endDate:", endDateStr, e);
              return false; // Ignore invalid dates
            }
          });
          setExpiringContractsList(expiringSoon);
          return prevAllContracts; // Return the original state for setAllContracts
        });


      } catch (error) {
         // Silent catch
         console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, isAdmin, isLegalTeam, isManagementTeam]);

  // Define colors for each status
  const COLORS = {
    requested: '#3b82f6', // blue
    draft: '#6b7280', // gray
    legal_review: '#8b5cf6', // purple
    management_review: '#f97316', // orange
    approval: '#eab308', // yellow
    finished: '#22c55e', // green
  };

  // Create chart data with counts
  const chartData = [
    { name: 'Requested', value: allContracts.filter(c => c.status === 'requested').length, color: COLORS.requested },
    { name: 'Draft', value: allContracts.filter(c => c.status === 'draft').length, color: COLORS.draft },
    { name: 'Legal Review', value: allContracts.filter(c => c.status === 'legal_review').length, color: COLORS.legal_review },
    { name: 'Management Review', value: allContracts.filter(c => c.status === 'management_review').length, color: COLORS.management_review },
    { name: 'Approval', value: allContracts.filter(c => c.status === 'approval').length, color: COLORS.approval },
    { name: 'Finished', value: allContracts.filter(c => c.status === 'finished').length, color: COLORS.finished },
  ];

  // Filter out statuses with zero contracts for a cleaner pie chart
  const filteredChartData = chartData.filter(item => item.value > 0);

  // Map display names to status values for filtering
  const statusMap: Record<string, string> = {
    'Requested': 'requested',
    'Draft': 'draft',
    'Legal Review': 'legal_review',
    'Management Review': 'management_review',
    'Approval': 'approval',
    'Finished': 'finished'
  };

  // Handle click on pie chart slice or legend item
  const handlePieClick = (data: any) => {
    // Navigate to contracts page with status filter
    const status = statusMap[data.name];
    if (status) {
      navigate(`/contracts?status=${status}`);
    }
  };

  // Function to fix inconsistent approval states
  const handleFixApprovals = async () => {
    if (!isAdmin) return;

    try {
      setIsFixingApprovals(true);
      await fixInconsistentApprovalStates();
      toast({
        title: "Approval States Fixed",
        description: "Any inconsistent approval states have been fixed. Please refresh the page to see the changes.",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred while fixing approval states.",
        variant: "destructive"
      });
    } finally {
      setIsFixingApprovals(false);
    }
  };

  // Handle click on legend item
  const handleLegendClick = (data: any) => {
    handlePieClick(data);
  };

  // Handle mouse enter on pie slice
  const handlePieEnter = (data: any, index: number) => {
    // Only set active index if we have valid data and it's a valid slice
    if (data && typeof index === 'number' && filteredChartData[index]) {
      setActiveIndex(index);
    }
  };

  // Handle mouse leave on pie slice
  const handlePieLeave = () => {
    setActiveIndex(null);
  };

  // Helper function to get days since last edit with actual date
  const getDaysSinceLastEdit = (updatedAt: string | null): string => {
    if (!updatedAt) return 'N/A';
    try {
      const lastEditDate = parseISO(updatedAt);
      const days = differenceInDays(new Date(), lastEditDate);
      if (days === 0) return 'today';
      if (days === 1) return 'yesterday';
      return `${days} days ago`;
    } catch (e) {
      console.error("Error parsing updatedAt:", updatedAt, e);
      return 'N/A'; // Return N/A if date parsing fails
    }
  };

  // Helper to get the display name or email of the last editor
  const getLastEditorDisplay = (contract: Contract): string => {
    if (!contract.timeline || contract.timeline.length === 0) {
      // Fallback to owner if no timeline
      return contract.owner; // Consider fetching owner's name here if needed
    }

    // Sort timeline to get the latest entry
    const latestEntry = [...contract.timeline].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];

    // Return userName if available, otherwise userEmail
    return latestEntry.userName || latestEntry.userEmail || 'Unknown User';
  };

  // Helper function to format status strings
  const formatStatus = (status: string): string => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

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
                {isLegalTeam || isManagementTeam ? 'Awaiting Your Response' : 'Total Contracts'}
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {isLegalTeam || isManagementTeam ? (
                      <>
                        {stats.pendingApprovalContracts}
                      </>
                    ) : stats.totalContracts}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isLegalTeam || isManagementTeam ? 'Contracts waiting for your approval/decline' : 'Across all projects and types'}
                  </p>
                  <Link
                    to={isLegalTeam || isManagementTeam ? "/contracts?status=awaiting_response" : "/contracts"}
                    className="text-xs text-primary hover:underline inline-flex items-center mt-2"
                  >
                    {isLegalTeam || isManagementTeam ? 'View contracts needing response' : 'View all contracts'}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {isLegalTeam || isManagementTeam ? 'Total Contracts' : 'Finished Contracts'}
              </CardTitle>
              <FileText className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {isLegalTeam || isManagementTeam ? (
                      <>
                        {stats.totalContracts}
                      </>
                    ) : stats.finishedContracts}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isLegalTeam || isManagementTeam ? 'All contracts assigned to you' : 'Completed contracts'}
                  </p>
                  <Link
                    to={isLegalTeam || isManagementTeam ? "/contracts" : "/contracts?status=finished"}
                    className="text-xs text-primary hover:underline inline-flex items-center mt-2"
                  >
                    {isLegalTeam || isManagementTeam ? 'View all your contracts' : 'View finished contracts'}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {isLegalTeam || isManagementTeam ? 'Approved' : 'Expiring Soon'}
              </CardTitle>
              {isLegalTeam || isManagementTeam ? (
                <Calendar className="h-4 w-4 text-green-500" />
              ) : (
                <Calendar className="h-4 w-4 text-yellow-500" />
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {isLegalTeam || isManagementTeam ? (
                      approvedContracts.length
                    ) : (
                      stats.expiringContracts
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isLegalTeam || isManagementTeam ? 'Contracts you have approved' : 'Within the next 30 days'}
                  </p>
                  <Link
                    to={isLegalTeam || isManagementTeam ?
                       "/contracts?filter=my_approved" :
                       "/contracts?filter=expiringSoon"}
                    className="text-xs text-primary hover:underline inline-flex items-center mt-2"
                  >
                    {isLegalTeam || isManagementTeam ? 'View approved contracts' : 'View expiring soon'}
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {isLegalTeam || isManagementTeam ? 'Rejected' : 'Expiring This Year'}
              </CardTitle>
              {isLegalTeam || isManagementTeam ? (
                <Calendar className="h-4 w-4 text-red-500" />
              ) : (
                <Calendar className="h-4 w-4 text-green-500" />
              )}
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {isLegalTeam || isManagementTeam ? (
                      rejectedContracts.length
                    ) : (
                      stats.expiringThisYear
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isLegalTeam || isManagementTeam ? 'Contracts you have rejected' : `Contracts expiring in ${new Date().getFullYear()}`}
                  </p>
                  <Link
                    to={isLegalTeam || isManagementTeam ?
                       "/contracts?filter=my_rejected" :
                       "/contracts?filter=expiringThisYear"}
                    className="text-xs text-primary hover:underline inline-flex items-center mt-2"
                  >
                    {isLegalTeam || isManagementTeam ? 'View rejected contracts' : 'View all expiring this year'}
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
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={filteredChartData.length > 0 ? filteredChartData : [{ name: 'No Data', value: 1, color: '#e5e7eb' }]}
                        cx="50%"
                        cy="45%"
                        labelLine={false}
                        innerRadius={0} // Set to 0 for solid pie chart
                        outerRadius={90}
                        paddingAngle={1}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        onClick={handlePieClick}
                        onMouseEnter={handlePieEnter}
                        onMouseLeave={handlePieLeave}
                        style={{ cursor: 'pointer' }}
                        // Remove the built-in label to implement our own custom labels
                        label={null}
                      >
                        {filteredChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            // Apply animation and scaling effect when hovered
                            style={{
                              filter: activeIndex === index ? 'drop-shadow(0 0 8px rgba(0, 0, 0, 0.3))' : 'none',
                              transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                              transformOrigin: 'center',
                              transition: 'transform 1s ease, filter 1s ease, opacity 1s ease',
                              opacity: activeIndex === null || activeIndex === index ? 1 : 0.7,
                            }}
                          />
                        ))}
                      </Pie>
                      <Legend
                        layout="vertical"
                        verticalAlign="middle"
                        align="right"
                        wrapperStyle={{ paddingLeft: 20 }}
                        iconSize={10}
                        onClick={handleLegendClick}
                        formatter={(value, _entry, index) => {
                          // Handle the case when there's no data
                          if (filteredChartData.length === 0 || value === 'No Data') {
                            return <span className="text-sm">No contracts</span>;
                          }

                          const item = filteredChartData[index];
                          const isActive = activeIndex === index;
                          return (
                            <div
                              className={`flex items-center gap-2 cursor-pointer ${isActive ? 'scale-105' : 'hover:opacity-80'}`}
                              style={{
                                transition: 'all 1s ease',
                                transform: isActive ? 'translateX(4px)' : 'none',
                              }}
                            >
                              <span className="text-sm">{value}</span>
                              <span
                                className="font-bold text-xs px-2 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: item.color + (isActive ? '40' : '20'), // More opacity when active
                                  color: item.color,
                                  border: `1px solid ${item.color}${isActive ? '80' : '40'}`,
                                  boxShadow: isActive ? `0 0 8px ${item.color}40` : 'none',
                                  transition: 'all 1s ease'
                                }}
                              >
                                {item.value}
                              </span>
                            </div>
                          );
                        }}
                      />
                      {/* Tooltip removed as per user request */}

                      {/* Custom tooltip for hover - positioned outside the pie to avoid interfering with hover animations */}
                      {activeIndex !== null && filteredChartData[activeIndex] && (
                        <foreignObject
                          x="0"
                          y="0"
                          width="100%"
                          height="100%"
                          style={{ overflow: 'visible', pointerEvents: 'none' }}
                        >
                          <div
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              transform: 'translate(-50%, -50%)',
                              backgroundColor: filteredChartData[activeIndex].color,
                              color: 'white',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                              fontWeight: 'bold',
                              fontSize: '16px',
                              zIndex: 10,
                              transition: 'all 0.2s ease',
                              opacity: 0.95,
                              border: '2px solid white',
                              pointerEvents: 'none' // Ensures the div doesn't interfere with mouse events
                            }}
                          >
                            {filteredChartData[activeIndex].name}: {filteredChartData[activeIndex].value}
                          </div>
                        </foreignObject>
                      )}
                    </PieChart>
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
                  {expiringContractsList.length > 0 ? (
                    expiringContractsList.map(contract => (
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
            <div className="flex gap-2">
              {isAdmin && (
                <Button
                  variant="outline"
                  onClick={handleFixApprovals}
                  disabled={isFixingApprovals}
                >
                  {isFixingApprovals ? 'Fixing...' : 'Fix Approval States'}
                </Button>
              )}
              <Button asChild>
                <Link to="/contracts">View All Contracts</Link>
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                 <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
             contracts.length > 0 ? (
              <Card>
                <CardContent className="p-0"> {/* Remove padding if table handles it */}
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contract</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Updated</TableHead>
                        <TableHead>Editor</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contracts.map(contract => (
                        <TableRow key={contract.id}>
                          <TableCell>
                            <Link
                              to={`/contracts/${contract.id}`}
                              className="font-medium hover:underline text-primary"
                            >
                              {contract.title}
                            </Link>
                            <p className="text-xs text-muted-foreground">
                              {contract.projectName}
                            </p>
                          </TableCell>
                          <TableCell>
                             <Badge variant="secondary">
                               {formatStatus(contract.status)}
                             </Badge>
                          </TableCell>
                          <TableCell>
                             {getDaysSinceLastEdit(contract.updatedAt)}
                          </TableCell>
                          <TableCell>
                            {getLastEditorDisplay(contract)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              asChild
                            >
                              <Link to={`/contract/${contract.id}`}>View</Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No recent contract activity.
              </p>
            )
          )}
        </div>
      </div>
    </PageTransition>
  );
};

export default Index;
