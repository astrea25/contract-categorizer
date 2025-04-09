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
  deleteContract
} from '@/lib/data';
import { ArrowLeft, CalendarClock, Edit, FileText, Users, Wallet, ShieldAlert, Archive, Trash2, ArchiveRestore } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { toast } from 'sonner';
import PageTransition from '@/components/layout/PageTransition';
import { useAuth } from '@/contexts/AuthContext';

const ContractDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser, isAdmin, isLegalTeam } = useAuth();
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

  useEffect(() => {
    const checkUserAndFetchContract = async () => {
      if (!id || !currentUser?.email) {
        setLoading(false);
        setError('Missing contract ID or user not logged in');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch the contract data
        const contractData = await getContract(id);

        if (contractData) {
          setContract(contractData);
          setError(null);

          // If admin or legal team, authorize immediately
          if (isAdmin || isLegalTeam) {
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
            // sharedWith check removed
            // Otherwise, user is not authorized
            else {
              setIsAuthorized(false);
              setError('You are not authorized to view this contract');
            }
          }
        } else {
          setError('Contract not found');
        }
      } catch (error) {
        setError('Failed to load contract details');
      } finally {
        setLoading(false);
      }
    };

    checkUserAndFetchContract();
  }, [id, currentUser]);

  const handleSaveContract = async (updatedData: Partial<Contract>) => {
    if (!contract || !id || !currentUser?.email || !isAuthorized) return;

    try {
      await updateContract(id, updatedData, currentUser.email);

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

      if (contract.archived) {
        // Unarchive the contract
        await unarchiveContract(id, currentUser.email);
        toast.success('Contract restored from archive');
      } else {
        // Archive the contract
        await archiveContract(id, currentUser.email);
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
    setShowDeleteDialog(true);
  };

  const handleStatusChange = async (newStatus: ContractStatus) => {
    if (!contract || !id || !currentUser?.email || !isAuthorized) return;

    try {
      setUpdatingStatus(true);
      await updateContract(id, { status: newStatus }, currentUser.email);

      const updatedContract = await getContract(id);
      if (updatedContract) {
        setContract(updatedContract);
        toast.success(`Status updated to ${newStatus.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`);
      }
    } catch (error) {
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleUpdateApprovers = async (approvers: Contract['approvers']) => {
    if (!contract || !id || !currentUser?.email || !isAuthorized) return;

    try {
      await updateContract(id, { approvers }, currentUser.email);

      const updatedContract = await getContract(id);
      if (updatedContract) {
        setContract(updatedContract);
        toast.success('Approvers updated successfully');
      }
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
                    .map((event, index, displayedTimeline) => {
                      // Check if this is a status change event
                      const isStatusChange = event.action.startsWith('Status Changed to');

                      // Extract status from the action text if it's a status change
                      let statusKey: ContractStatus | null = null;
                      if (isStatusChange) {
                        const statusText = event.action.replace('Status Changed to ', '');
                        // Convert the formatted status back to the status key
                        if (statusText === 'Legal Review') statusKey = 'legal_review';
                        else if (statusText === 'Management Review') statusKey = 'management_review';
                        else statusKey = statusText.toLowerCase() as ContractStatus;
                      }

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
                              {event.action}{event.details ? formatTimelineDetails(event.details, isStatusChange) : ''}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {new Date(event.timestamp).toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              By: {event.userEmail}
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
                        By: {contract.owner || 'System'}
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
                        By: {contract.owner || 'System'}
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
                        By: {contract.owner || 'System'}
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
                          By: {contract.owner || 'System'}
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
        title={contract.archived ? "Permanently Delete Contract" : "Delete Contract"}
        description={contract.archived
          ? "Are you sure you want to permanently delete this archived contract? This action cannot be undone and all contract data will be permanently lost."
          : "Are you sure you want to delete this contract? This action cannot be undone and all contract data will be permanently lost."}
        confirmText={contract.archived ? "Permanently Delete" : "Delete"}
        onConfirm={handleDeleteContract}
        isLoading={isDeleting}
        confirmVariant="destructive"
      />
    </PageTransition>
  );
};

export default ContractDetail;
