import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import AuthNavbar from '@/components/layout/AuthNavbar';
import ContractStatusBadge from '@/components/contracts/ContractStatusBadge';
import ContractForm from '@/components/contracts/ContractForm';
import ContractProgressBar from '@/components/contracts/ContractProgressBar';
import StatusSelectCard from '@/components/contracts/StatusSelectCard';
import CommentSection from '@/components/contracts/CommentSection';
import ApprovalBoard from '@/components/contracts/ApprovalBoard';
import ConfirmationDialog from '@/components/contracts/ConfirmationDialog';
import {
  Contract,
  ContractStatus,
  ContractType,
  getContract,
  updateContract,
  contractTypeLabels,
  statusColors,
  archiveContract,
  unarchiveContract,
  deleteContract,
  normalizeApprovers
} from '@/lib/data';
import { ArrowLeft, CalendarClock, Edit, FileText, Users, Wallet, ShieldAlert, Archive, Trash2, ArchiveRestore } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { toast } from 'sonner';
import PageTransition from '@/components/layout/PageTransition';
import { useAuth } from '@/contexts/AuthContext';

const ContractDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser, isAdmin, isLegalTeam, isManagementTeam } = useAuth();
  const navigate = useNavigate();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAllTimelineEntries, setShowAllTimelineEntries] = useState(false);
  const DEFAULT_TIMELINE_ENTRIES = 3;

  // Helper function to check if a user is an approver for a contract
  const isUserApprover = (contractData: Contract, userEmail: string): boolean => {
    if (!contractData.approvers || !userEmail) return false;
    
    const normalizedEmail = userEmail.toLowerCase();
    
    // Check legal approvers (can be array or object)
    if (contractData.approvers.legal) {
      if (Array.isArray(contractData.approvers.legal)) {
        if (contractData.approvers.legal.some(a => a.email.toLowerCase() === normalizedEmail)) {
          return true;
        }
      } else if (contractData.approvers.legal.email.toLowerCase() === normalizedEmail) {
        return true;
      }
    }
    
    // Check management approvers (can be array or object)
    if (contractData.approvers.management) {
      if (Array.isArray(contractData.approvers.management)) {
        if (contractData.approvers.management.some(a => a.email.toLowerCase() === normalizedEmail)) {
          return true;
        }
      } else if (contractData.approvers.management.email.toLowerCase() === normalizedEmail) {
        return true;
      }
    }
    
    // Check other approvers (always array)
    if (contractData.approvers.approver && Array.isArray(contractData.approvers.approver)) {
      if (contractData.approvers.approver.some(a => a.email.toLowerCase() === normalizedEmail)) {
        return true;
      }
    }
    
    return false;
  };

  useEffect(() => {
    const checkUserAndFetchContract = async () => {
      if (!id || !currentUser?.email) {
        setLoading(false);
        setError('Missing contract ID or user not logged in');
        return;
      }

      const authStartTime = performance.now();
      
      setLoading(true);
      setError(null);

      try {
        // Fetch the contract data
        const contractFetchStartTime = performance.now();
        
        const contractData = await getContract(id);
        
        const contractFetchEndTime = performance.now();

        if (contractData) {
          setContract(contractData);
          setError(null);

          // Start tracking role assignment time
          const roleAssignmentStartTime = performance.now();

          // If admin, legal team, or management team, authorize immediately
          if (isAdmin || isLegalTeam || isManagementTeam) {
            setIsAuthorized(true);
          } else {
            // Check other authorization criteria
            const userEmail = currentUser.email.toLowerCase();

            // Check if user is the owner of the contract
            if (contractData.owner.toLowerCase() === userEmail) {
              setIsAuthorized(true);
            }
            // Check if user is in the parties list
            else if (contractData.parties.some(party =>
              party.email.toLowerCase() === userEmail
            )) {
              setIsAuthorized(true);
            }
            // Check if user is an approver using our helper function
            else if (isUserApprover(contractData, userEmail)) {
              setIsAuthorized(true);
            }
            // Otherwise, user is not authorized
            else {
              setIsAuthorized(false);
              setError('You are not authorized to view this contract');
            }
          }
          
          const roleAssignmentEndTime = performance.now();
          const roleAssignmentDuration = roleAssignmentEndTime - roleAssignmentStartTime;
        } else {
          setError('Contract not found');
        }
      } catch (error) {
        setError('Failed to load contract details');
      } finally {
        setLoading(false);
        const authEndTime = performance.now();
        const totalAuthTime = authEndTime - authStartTime;
      }
    };

    checkUserAndFetchContract();
  }, [id, currentUser]);

  const handleSaveContract = async (updatedData: Partial<Contract>) => {
    if (!contract || !id || !currentUser?.email || !isAuthorized) return;

    try {
      await updateContract(id, updatedData, {
        email: currentUser.email,
        displayName: currentUser.displayName
      });

      const updatedContract = await getContract(id);
      if (updatedContract) {
        setContract(updatedContract);
        toast.success('Contract updated successfully');
      }
    } catch (error) {
      toast.error('Failed to update contract');
    }
  };

  const handleArchiveContract = async () => {
    if (!contract || !id || !currentUser?.email || !isAuthorized) return;

    try {
      setIsArchiving(true);
      const user = { email: currentUser.email, displayName: currentUser.displayName };

      if (contract.archived) {
        // Unarchive the contract
        await unarchiveContract(id, user);
        toast.success('Contract restored from archive');
      } else {
        // Archive the contract
        await archiveContract(id, user);
        toast.success('Contract archived successfully');
      }

      // Refresh the contract data
      const updatedContract = await getContract(id);
      if (updatedContract) {
        setContract(updatedContract);
      }

      // Close the dialog
      setShowArchiveDialog(false);
    } catch (error) {
      toast.error(contract.archived ? 'Failed to restore contract' : 'Failed to archive contract');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDeleteContract = async () => {
    if (!contract || !id || !currentUser?.email || !isAuthorized) return;

    // Prevent deletion of non-archived contracts
    if (!contract.archived) {
      toast.error('Contract must be archived before deletion');
      return;
    }

    try {
      setIsDeleting(true);

      // Delete the contract
      await deleteContract(id);

      toast.success('Contract deleted successfully');

      // Navigate back to contracts page
      navigate('/contracts');
    } catch (error) {
      toast.error('Failed to delete contract');
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const openArchiveDialog = () => {
    setShowArchiveDialog(true);
  };

  const openDeleteDialog = () => {
    // Only allow opening delete dialog for archived contracts
    if (contract?.archived) {
      setShowDeleteDialog(true);
    } else {
      toast.error('Contract must be archived before deletion');
    }
  };

  const handleStatusChange = async (newStatus: ContractStatus): Promise<void> => {
    if (!contract || !id || !currentUser?.email || !isAuthorized) return;

    try {
      setUpdatingStatus(true);
      
      // Check if we need to reset approvals when changing to draft status
      if (newStatus === 'draft' && 
          (contract.status === 'approval' || contract.status === 'legal_review' || contract.status === 'management_review')) {
        
        // Import the normalizeApprovers function to properly handle approver structure
        const { normalizeApprovers } = await import('@/lib/data');
        
        // Normalize the contract to ensure consistent approvers structure
        const normalizedContract = normalizeApprovers(contract);
        
        // Create a deep copy of the approvers
        const approvers = JSON.parse(JSON.stringify(normalizedContract.approvers || {}));
        
        // Reset legal approvals
        if (approvers.legal && approvers.legal.length > 0) {
          approvers.legal = approvers.legal.map((approver: any) => ({
            ...approver,
            approved: false,
            declined: false,
            approvedAt: null,
            declinedAt: null
          }));
        }
        
        // Reset management approvals
        if (approvers.management && approvers.management.length > 0) {
          approvers.management = approvers.management.map((approver: any) => ({
            ...approver,
            approved: false,
            declined: false,
            approvedAt: null,
            declinedAt: null
          }));
        }
        
        // Reset approver approvals
        if (approvers.approver && approvers.approver.length > 0) {
          approvers.approver = approvers.approver.map((approver: any) => ({
            ...approver,
            approved: false,
            declined: false,
            approvedAt: null,
            declinedAt: null
          }));
        }
        
        // Update contract with reset approvals and new status
        await updateContract(id, { 
          status: newStatus,
          approvers,
          _customTimelineEntry: {
            action: 'Approvals Reset',
            details: 'All approvals reset due to status change to Draft'
          }
        }, {
          email: currentUser.email,
          displayName: currentUser.displayName
        });
      } else {
        // Just update the status without resetting approvals
        await updateContract(id, { status: newStatus }, {
          email: currentUser.email,
          displayName: currentUser.displayName
        });
      }

      const updatedContract = await getContract(id);
      if (updatedContract) {
        setContract(updatedContract);
        
        // Show a specific toast message when approvals have been reset
        if (newStatus === 'draft' && 
            (contract.status === 'approval' || contract.status === 'legal_review' || contract.status === 'management_review')) {
          toast.success(`Status updated to Draft and all approvals have been reset`);
        } else {
          toast.success(`Status updated to ${newStatus.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`);
        }
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdateApprovers = async (approversData: any) => {
    if (!contract || !id || !currentUser?.email || !isAuthorized) return;

    try {
      const updateStartTime = performance.now();
      
      // Check if we have a custom timeline entry
      const customTimelineEntry = approversData._customTimelineEntry;
      
      // Get approvers, removing _customTimelineEntry if present
      const { _customTimelineEntry, ...cleanApproversData } = approversData;
      const approvers = cleanApproversData.approvers || cleanApproversData;
      
      // Get the current contract to access its current approvers and timeline
      
      const fetchStartTime = performance.now();
      
      const currentContract = await getContract(id);
      
      const fetchEndTime = performance.now();
      
      if (!currentContract) {
        throw new Error('Could not fetch current contract');
      }
      
      // Normalize approvers structure - ensure arrays for multi-approver support
      
      const normalizeStartTime = performance.now();
      
      const normalizedApprovers: Contract['approvers'] = { 
        ...(currentContract.approvers || {}), 
        ...approvers 
      };
      
      // Ensure legal approvers are in array format
      if (normalizedApprovers.legal && !Array.isArray(normalizedApprovers.legal)) {
        normalizedApprovers.legal = [normalizedApprovers.legal];
      }
      
      // Ensure management approvers are in array format
      if (normalizedApprovers.management && !Array.isArray(normalizedApprovers.management)) {
        normalizedApprovers.management = [normalizedApprovers.management];
      }
      
      // Ensure approver is always an array (it should be already, but just in case)
      if (normalizedApprovers.approver && !Array.isArray(normalizedApprovers.approver)) {
        normalizedApprovers.approver = [normalizedApprovers.approver];
      }
      
      const normalizeEndTime = performance.now();
      
      // Create update object
      const updateObject: any = {
        approvers: normalizedApprovers
      };
      
      // If we have a custom timeline entry, prepare a new timeline
      if (customTimelineEntry && currentContract.timeline) {
        // Create a new timeline entry
        const newTimelineEntry = {
          timestamp: new Date().toISOString(),
          action: customTimelineEntry.action,
          userEmail: currentUser.email,
          userName: currentUser.displayName || currentUser.email.split('@')[0] || 'User',
          details: customTimelineEntry.details || ''
        };
        
        // Add the new timeline entry to the existing timeline
        updateObject.timeline = [...currentContract.timeline, newTimelineEntry];
      }
      
      // Update the contract with normalized approvers and possibly new timeline entry
      
      const dbUpdateStartTime = performance.now();
      
      await updateContract(id, updateObject, {
        email: currentUser.email,
        displayName: currentUser.displayName
      });
      
      const dbUpdateEndTime = performance.now();

      // Fetch the updated contract to refresh UI
      
      const refetchStartTime = performance.now();
      
      const updatedContract = await getContract(id);
      
      const refetchEndTime = performance.now();
      
      if (updatedContract) {
        setContract(updatedContract);
        toast.success('Approvers updated successfully');
      }
      
      const updateEndTime = performance.now();
      const totalUpdateTime = updateEndTime - updateStartTime;
      
      return Promise.resolve();
    } catch (error) {
      toast.error('Failed to update approvers');
      return Promise.reject(error);
    }
  };

  // Format timeline details by removing "Changed: " prefix and capitalizing each word
  const formatTimelineDetails = (details: string, isStatusChange: boolean): string => {
    // For status changes, don't add any details (they're redundant)
    if (isStatusChange) return '';

    if (!details) return '';

    // If the details start with "Changed: ", remove it
    const cleanDetails = details.startsWith('Changed: ')
      ? details.substring('Changed: '.length)
      : details;

    // Split by commas and capitalize each item
    return ': ' + cleanDetails
      .split(', ')
      .map(item => item.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
      )
      .join(', ');
  };

  if (loading) {
    return (
      <>
        <AuthNavbar />
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

  if (error || !isAuthorized) {
    return (
      <>
        <AuthNavbar />
        <div className="container mx-auto p-4 sm:p-6">
          <Alert variant="destructive" className="mb-4">
            <div className="flex gap-2 items-center">
              <ShieldAlert className="h-5 w-5" />
              <AlertDescription>{error || "You don't have access to this contract"}</AlertDescription>
            </div>
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
      <AuthNavbar />
      <div className="container mx-auto p-4 sm:p-6">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <Button asChild variant="ghost" className="self-start">
              <Link to="/contracts" className="flex items-center gap-2">
                <ArrowLeft size={16} />
                Back to contracts
              </Link>
            </Button>

            <div className="flex gap-2 self-end">
              {contract.archived ? (
                // Show restore and permanent delete options for archived contracts
                <>
                  <Button
                    variant="outline"
                    className="gap-1"
                    onClick={openArchiveDialog}
                    disabled={isArchiving}
                  >
                    <ArchiveRestore size={16} />
                    Restore
                  </Button>

                  <Button
                    variant="destructive"
                    className="gap-1"
                    onClick={openDeleteDialog}
                    disabled={isDeleting}
                  >
                    <Trash2 size={16} />
                    Permanently Delete
                  </Button>
                </>
              ) : (
                // Show archive and edit options for non-archived contracts
                <>
                  <Button
                    variant="outline"
                    className="gap-1"
                    onClick={openArchiveDialog}
                    disabled={isArchiving}
                  >
                    <Archive size={16} />
                    Archive
                  </Button>

                  <ContractForm
                    initialData={contract}
                    onSave={handleSaveContract}
                    trigger={
                      <Button variant="outline" className="gap-1">
                        <Edit size={16} />
                        Edit Contract
                      </Button>
                    }
                  />
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="px-2 py-1 bg-secondary text-xs rounded-md font-medium text-secondary-foreground">
                {contractTypeLabels[contract.type as ContractType]}
              </span>
              <ContractStatusBadge status={contract.status} />
              {contract.archived && (
                <span className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-md font-medium flex items-center gap-1">
                  <Archive className="h-3 w-3" />
                  Archived
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold tracking-tight">{contract.title}</h1>
            <p className="text-lg text-muted-foreground">
              {contract.projectName}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <StatusSelectCard
            status={contract.status}
            onStatusChange={handleStatusChange}
            isUpdating={updatingStatus}
            contract={contract}
          />

          {contract.value !== null && (
          <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Contract Value</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                <div className="font-medium">
                  ₱{contract.value.toLocaleString()}
                </div>
                <p className="text-muted-foreground mt-1">
                  Last updated {new Date(contract.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
          )}

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
                    <p className="text-sm text-muted-foreground ml-6">
                      {party.email}
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

        {contract.documentLink && (
          <Card className="mb-8 overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle>Document Link</CardTitle>
            </CardHeader>
            <CardContent>
              <a href={contract.documentLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                View Document
              </a>
            </CardContent>
          </Card>
        )}

        {/* Contract Progress Bar */}
        <Card className="mb-8 overflow-hidden transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle>Contract Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ContractProgressBar currentStatus={contract.status} />
          </CardContent>
        </Card>

        {/* Approval Board */}
        <ApprovalBoard
          contract={contract}
          onUpdateApprovers={handleUpdateApprovers}
          isRequired={contract.status !== 'requested'}
        />

        {/* Timeline */}
        <Card className="mb-8 overflow-hidden transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Contract timeline events */}
              {contract.timeline && contract.timeline.length > 0 ? (
                <>
                  {/* Sort timeline entries by timestamp (newest first) and show either all or just the most recent */}
                  {(showAllTimelineEntries
                    ? [...contract.timeline].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    : [...contract.timeline].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, DEFAULT_TIMELINE_ENTRIES))
                    .map((entry, index, displayedTimeline) => {
                      // Check if this is a status change event
                      const isStatusChange = entry.action.startsWith('Status Changed to');

                      // Extract status from the action text if it's a status change
                      let statusKey: ContractStatus | null = null;
                      if (isStatusChange) {
                        const statusText = entry.action.replace('Status Changed to ', '');
                        // Convert the formatted status back to the status key
                        if (statusText === 'Legal Review') statusKey = 'legal_review';
                        else if (statusText === 'Management Review') statusKey = 'management_review';
                        else statusKey = statusText.toLowerCase() as ContractStatus;
                      }

                      // Use userName if available, otherwise use email username or full email
                      const userIdentifier = entry.userName || (entry.userEmail ? entry.userEmail.split('@')[0] : entry.userEmail);

                      return (
                        <div key={index} className="flex items-start">
                          <div className="flex flex-col items-center mr-4">
                            <div className={`w-3 h-3 rounded-full mt-2 ${isStatusChange && statusKey ?
                              statusKey === 'requested' ? 'bg-blue-800' :
                              statusKey === 'draft' ? 'bg-gray-800' :
                              statusKey === 'legal_review' ? 'bg-purple-800' :
                              statusKey === 'management_review' ? 'bg-orange-800' :
                              statusKey === 'approval' ? 'bg-yellow-800' :
                              statusKey === 'finished' ? 'bg-green-800' : 'bg-primary'
                              : 'bg-primary'}`}></div>
                            {index < displayedTimeline.length - 1 && (
                              <div className={`w-0.5 h-full ${isStatusChange && statusKey ? statusColors[statusKey].bg : 'bg-border'}`}></div>
                            )}
                          </div>
                          <div className="pt-0">
                            <div className={`font-medium ${isStatusChange && statusKey ? statusColors[statusKey].text : ''}`}>
                              {entry.action}{entry.details ? formatTimelineDetails(entry.details, isStatusChange) : ''}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(entry.timestamp).toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              By: {userIdentifier}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {/* Show More/Hide button if there are more than DEFAULT_TIMELINE_ENTRIES entries */}
                  {contract.timeline.length > DEFAULT_TIMELINE_ENTRIES && (
                    <div className="flex justify-center mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAllTimelineEntries(!showAllTimelineEntries)}
                      >
                        {showAllTimelineEntries ? 'Hide' : `Show More (${contract.timeline.length - DEFAULT_TIMELINE_ENTRIES} more)`}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Legacy timeline events if no timeline array exists */}
                  <div className="flex items-start">
                    <div className="flex flex-col items-center mr-4">
                      <div className="w-3 h-3 rounded-full mt-1.5 bg-primary"></div>
                      <div className="w-0.5 h-full bg-border"></div>
                    </div>
                    <div className="pt-0">
                      <div className="font-medium">Contract Created</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(contract.createdAt).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        By: {typeof contract.owner === 'string' && contract.owner.includes('@') ? contract.owner.split('@')[0] : (contract.owner || 'System')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex flex-col items-center mr-4">
                      <div className="w-3 h-3 rounded-full mt-1.5 bg-primary"></div>
                      <div className="w-0.5 h-full bg-border"></div>
                    </div>
                    <div className="pt-0">
                      <div className="font-medium">Contract Started</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(contract.startDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        By: {typeof contract.owner === 'string' && contract.owner.includes('@') ? contract.owner.split('@')[0] : (contract.owner || 'System')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex flex-col items-center mr-4">
                      <div className="w-3 h-3 rounded-full mt-1.5 bg-primary"></div>
                      {contract.endDate && <div className="w-0.5 h-full bg-border"></div>}
                    </div>
                    <div className="pt-0">
                      <div className="font-medium">Last Updated</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(contract.updatedAt).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        By: {typeof contract.owner === 'string' && contract.owner.includes('@') ? contract.owner.split('@')[0] : (contract.owner || 'System')}
                      </div>
                    </div>
                  </div>

                  {contract.endDate && (
                    <div className="flex items-start">
                      <div className="flex flex-col items-center mr-4">
                        <div className="w-3 h-3 rounded-full mt-0.5 bg-muted-foreground"></div>
                      </div>
                      <div className="pt-0">
                        <div className="font-medium">Contract End Date</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(contract.endDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          By: {typeof contract.owner === 'string' && contract.owner.includes('@') ? contract.owner.split('@')[0] : (contract.owner || 'System')}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <Separator className="my-6" />
          </CardContent>
        </Card>

        {/* Add the comment section */}
        {currentUser && contract && (
          <CommentSection
            contractId={id!}
            comments={contract.comments || []}
            userEmail={currentUser.email!}
            onCommentsChange={() => {
              // Fetch the latest contract data
              const fetchLatestContract = async () => {
                if (!id) return;

                try {
                  const contractData = await getContract(id);
                  if (contractData) {
                    setContract(contractData);
                  }
                } catch (error) {
                  console.error('Error fetching updated contract:', error);
                }
              };

              fetchLatestContract();
            }}
          />
        )}
      </div>

      {/* Archive/Unarchive Confirmation Dialog */}
      <ConfirmationDialog
        open={showArchiveDialog}
        onOpenChange={setShowArchiveDialog}
        title={contract.archived ? "Restore Contract" : "Archive Contract"}
        description={contract.archived
          ? "Are you sure you want to restore this contract from the archive? It will be visible in the main contracts list again."
          : "Are you sure you want to archive this contract? It will be moved to the archive and removed from the main contracts list."}
        confirmText={contract.archived ? "Restore" : "Archive"}
        onConfirm={handleArchiveContract}
        isLoading={isArchiving}
        confirmVariant="outline"
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Permanently Delete Contract"
        description="Are you sure you want to permanently delete this archived contract? This action cannot be undone and all contract data will be permanently lost."
        confirmText="Permanently Delete"
        onConfirm={handleDeleteContract}
        isLoading={isDeleting}
        confirmVariant="destructive"
      />
    </PageTransition>
  );
};

export default ContractDetail;
