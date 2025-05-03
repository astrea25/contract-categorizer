import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AuthNavbar from '@/components/layout/AuthNavbar';
import ContractStatusBadge from '@/components/contracts/ContractStatusBadge';
import ContractForm from '@/components/contracts/ContractForm';
import ContractProgressBar from '@/components/contracts/ContractProgressBar';
import StatusSelectCard from '@/components/contracts/StatusSelectCard';
import AmendmentStatusCard from '@/components/contracts/AmendmentStatusCard';
import CommentSection from '@/components/contracts/CommentSection';
import ApprovalBoard from '@/components/contracts/ApprovalBoard';
import ConfirmationDialog from '@/components/contracts/ConfirmationDialog';
import TypeSpecificDetailsCard from '@/components/contracts/TypeSpecificDetailsCard';
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
import { ArrowLeft, CalendarClock, Edit, FileText, Wallet, ShieldAlert, Archive, Trash2, ArchiveRestore, RefreshCw, FilePenLine, Mail } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { toast } from 'sonner';
import PageTransition from '@/components/layout/PageTransition';
import { useAuth } from '@/contexts/AuthContext';
import { manuallyTriggerInactivityNotification } from '@/lib/inactivity-notification';

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
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAmendDialog, setShowAmendDialog] = useState(false);
  const [showAllTimelineEntries, setShowAllTimelineEntries] = useState(false);
  const DEFAULT_TIMELINE_ENTRIES = 3;
  const [isRefreshing, setIsRefreshing] = useState(false);

  const lastUpdatedTimestamp = useRef<number>(Date.now());
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const POLL_INTERVAL_MS = 10000;

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

  const fetchContractData = async () => {
    if (!id || !currentUser?.email || !isAuthorized) return;

    try {
      setIsRefreshing(true);
      const contractData = await getContract(id);
      if (contractData) {
        if (JSON.stringify(contractData) !== JSON.stringify(contract)) {
          setContract(contractData);
          lastUpdatedTimestamp.current = Date.now();
          toast.info('Contract data was refreshed with the latest changes', {
            duration: 2000,
            position: 'bottom-right'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching contract updates:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (contract && isAuthorized && !loading) {
      pollingIntervalRef.current = setInterval(fetchContractData, POLL_INTERVAL_MS);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [contract, isAuthorized, loading, id]);

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
      // Ensure displayName is never undefined
      const user = {
        email: currentUser.email,
        displayName: currentUser.displayName || ''
      };

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
    } catch (error: any) { // Explicitly type error as any to access message property
      console.error('Error archiving/unarchiving contract:', error);
      toast.error(`${contract.archived ? 'Failed to restore contract' : 'Failed to archive contract'}: ${error.message || 'Unknown error'}`);
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

  // Function to handle sending an inactivity notification
  const handleSendInactivityNotification = async () => {
    if (!contract || !id || !currentUser?.email || !isAdmin) return;

    try {
      setIsSendingNotification(true);

      // Send the notification
      await manuallyTriggerInactivityNotification(id);

      toast.success('Inactivity notification sent successfully');
    } catch (error) {
      console.error('Error sending inactivity notification:', error);
      toast.error('Failed to send inactivity notification');
    } finally {
      setIsSendingNotification(false);
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

  const handleStatusChange = async (newStatus: ContractStatus, additionalData?: Partial<Contract>): Promise<void> => {
    if (!contract || !id || !currentUser?.email || !isAuthorized) return;

    try {
      setUpdatingStatus(true);

      // Check if all supporting documents are checked when moving from requested to draft
      if (contract.status === 'requested' && newStatus === 'draft') {
        console.log('Supporting documents check triggered in ContractDetail');
        console.log('Contract ID:', contract.id);
        console.log('Contract Type:', contract.type);
        console.log('Supporting documents:', JSON.stringify(contract.supportingDocuments));

        // Ensure we have the latest contract data
        const latestContract = await getContract(id);
        if (!latestContract) {
          toast.error('Failed to fetch latest contract data');
          setUpdatingStatus(false);
          return;
        }

        // Use the latest contract data for validation
        if (latestContract.supportingDocuments && latestContract.supportingDocuments.length > 0) {
          console.log('Latest supporting documents:', JSON.stringify(latestContract.supportingDocuments));

          const allDocumentsChecked = latestContract.supportingDocuments.every(doc => doc.checked);
          console.log('All documents checked?', allDocumentsChecked);
          console.log('Documents status:', latestContract.supportingDocuments.map(doc => `${doc.name}: ${doc.checked}`).join(', '));

          if (!allDocumentsChecked) {
            toast.error('All supporting documents must be checked before moving to Draft status.');
            setUpdatingStatus(false);
            return;
          }
        } else {
          console.log('No supporting documents found or empty array');
        }
      }

      // Check if we need to reset approvals when changing to draft status
      if (newStatus === 'draft' &&
          (contract.status === 'wwf_signing' ||
           contract.status === 'legal_review' ||
           contract.status === 'management_review' ||
           contract.status === 'legal_send_back' ||
           contract.status === 'management_send_back' ||
           contract.status === 'legal_declined' || // deprecated status
           contract.status === 'management_declined')) { // deprecated status

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
            declined: false, // declined means sent back
            approvedAt: null,
            declinedAt: null
          }));
        }

        // Reset management approvals
        if (approvers.management && approvers.management.length > 0) {
          approvers.management = approvers.management.map((approver: any) => ({
            ...approver,
            approved: false,
            declined: false, // declined means sent back
            approvedAt: null,
            declinedAt: null
          }));
        }

        // Reset approver approvals
        if (approvers.approver && approvers.approver.length > 0) {
          approvers.approver = approvers.approver.map((approver: any) => ({
            ...approver,
            approved: false,
            declined: false, // declined means sent back
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
        // Prepare update data
        const updateData: Partial<Contract> = {
          status: newStatus,
          ...additionalData
        };

        // Update the contract with the new status and any additional data
        await updateContract(id, updateData, {
          email: currentUser.email,
          displayName: currentUser.displayName
        });
      }

      const updatedContract = await getContract(id);
      if (updatedContract) {
        setContract(updatedContract);

        // Show a specific toast message when approvals have been reset
        if (newStatus === 'draft' &&
            (contract.status === 'wwf_signing' ||
             contract.status === 'legal_review' ||
             contract.status === 'management_review' ||
             contract.status === 'legal_declined' || // deprecated status
             contract.status === 'management_declined')) { // deprecated status
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

    console.log('ContractDetail - handleUpdateApprovers - Received data:', JSON.stringify(approversData, null, 2));

    try {
      const updateStartTime = performance.now();

      // Check if we have a custom timeline entry
      const customTimelineEntry = approversData._customTimelineEntry;

      // Get approvers, removing _customTimelineEntry if present
      const { _customTimelineEntry, ...cleanApproversData } = approversData;
      const approvers = cleanApproversData.approvers || cleanApproversData;

      console.log('ContractDetail - handleUpdateApprovers - Status update requested:', cleanApproversData.status);
      console.log('ContractDetail - handleUpdateApprovers - cleanApproversData:', JSON.stringify(cleanApproversData, null, 2));

      // Get the current contract to access its current approvers and timeline
      const fetchStartTime = performance.now();

      // Fetch the latest contract data to ensure we're working with the most up-to-date version
      const currentContract = await getContract(id);

      const fetchEndTime = performance.now();

      if (!currentContract) {
        throw new Error('Could not fetch current contract');
      }

      // Check if the contract has been updated by someone else since we loaded it
      if (currentContract.updatedAt !== contract.updatedAt) {
        // The contract was updated since we loaded it - let's refresh our local state
        setContract(currentContract);
        lastUpdatedTimestamp.current = Date.now();

        // Still proceed with the update, but notify the user of potential changes
        toast.info('Contract was updated by another user. Your changes will still be applied.');
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

      // Check if we have a status update
      if (cleanApproversData.status) {
        updateObject.status = cleanApproversData.status;
        console.log('ContractDetail - handleUpdateApprovers - Setting status to:', updateObject.status);
      }

      // Check if we have an amendment stage update
      if (cleanApproversData.amendmentStage) {
        updateObject.amendmentStage = cleanApproversData.amendmentStage;
        console.log('ContractDetail - handleUpdateApprovers - Setting amendment stage to:', updateObject.amendmentStage);
      }

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
      console.log('ContractDetail - handleUpdateApprovers - Sending update object:', JSON.stringify(updateObject, null, 2));

      await updateContract(id, updateObject, {
        email: currentUser.email,
        displayName: currentUser.displayName
      });

      const dbUpdateEndTime = performance.now();
      console.log('ContractDetail - handleUpdateApprovers - Update sent successfully');

      // Fetch the updated contract to refresh UI
      const refetchStartTime = performance.now();

      const updatedContract = await getContract(id);

      const refetchEndTime = performance.now();

      if (updatedContract) {
        console.log('ContractDetail - handleUpdateApprovers - Updated contract retrieved, new status:', updatedContract.status);
        console.log('ContractDetail - handleUpdateApprovers - Amendment stage:', updatedContract.amendmentStage);
        console.log('ContractDetail - handleUpdateApprovers - Full contract:', JSON.stringify(updatedContract, null, 2));
        setContract(updatedContract);
        lastUpdatedTimestamp.current = Date.now(); // Update the timestamp
        toast.success('Approvers updated successfully');
      }

      const updateEndTime = performance.now();
      const totalUpdateTime = updateEndTime - updateStartTime;

      return Promise.resolve();
    } catch (error) {
      console.error('ContractDetail - handleUpdateApprovers - Error:', error);
      toast.error('Failed to update approvers');
      return Promise.reject(error);
    }
  };

  // Helper function to determine if a contract is editable based on its status
  // Only admin users can edit contracts
  const isContractEditable = (contract: Contract): boolean => {
    // Only admin users can edit contracts
    if (!isAdmin) {
      return false;
    }

    // Contract can be edited if it's in one of these statuses
    const editableStatuses: ContractStatus[] = ['requested', 'draft', 'legal_review', 'management_review', 'legal_send_back', 'management_send_back'];

    // Also allow editing if the contract is in amendment status
    if (contract.status === 'amendment') {
      return true;
    }

    // Don't allow editing if the contract is in contract_end status
    if (contract.status === 'contract_end') {
      return false;
    }

    return editableStatuses.includes(contract.status);
  };

  // Helper function to determine if a contract can be amended
  // Only admin users can amend contracts
  const canContractBeAmended = (contract: Contract): boolean => {
    // Only admin users can amend contracts
    if (!isAdmin) {
      return false;
    }

    // Contracts can be amended if they are in implementation, wwf_signing, or counterparty_signing status
    const amendableStatuses: ContractStatus[] = ['implementation', 'wwf_signing', 'counterparty_signing'];

    // Don't allow amending if the contract is already in amendment status
    if (contract.status === 'amendment') {
      return false;
    }

    // Don't allow amending if the contract is in contract_end status
    if (contract.status === 'contract_end') {
      return false;
    }

    // Don't allow amending if the contract is in early stages
    if (['requested', 'draft', 'legal_review', 'management_review', 'legal_send_back', 'management_send_back'].includes(contract.status)) {
      return false;
    }

    return amendableStatuses.includes(contract.status);
  };

  // Function to open the amend dialog
  const openAmendDialog = () => {
    setShowAmendDialog(true);
  };

  // Function to handle amending a contract
  const handleAmendContract = async () => {
    if (!contract || !id || !currentUser?.email || !isAuthorized) return;

    try {
      setUpdatingStatus(true);

      // Store the original status before moving to amendment
      const originalStatus = contract.status;

      // Normalize the contract to ensure consistent approvers structure
      const normalizedContract = normalizeApprovers(contract);

      // Create a deep copy of the approvers
      const approvers = JSON.parse(JSON.stringify(normalizedContract.approvers || {}));

      // Reset legal approvals
      if (approvers.legal && approvers.legal.length > 0) {
        approvers.legal = approvers.legal.map((approver: any) => ({
          ...approver,
          approved: false,
          declined: false, // declined means sent back
          approvedAt: null,
          declinedAt: null
        }));
      }

      // Reset management approvals
      if (approvers.management && approvers.management.length > 0) {
        approvers.management = approvers.management.map((approver: any) => ({
          ...approver,
          approved: false,
          declined: false, // declined means sent back
          approvedAt: null,
          declinedAt: null
        }));
      }

      // Reset approver approvals
      if (approvers.approver && approvers.approver.length > 0) {
        approvers.approver = approvers.approver.map((approver: any) => ({
          ...approver,
          approved: false,
          declined: false, // declined means sent back
          approvedAt: null,
          declinedAt: null
        }));
      }

      // Update the contract status to amendment and set amendment flags
      await updateContract(id, {
        status: 'amendment',
        isAmended: true,
        amendmentStage: 'amendment',
        originalStatus: originalStatus, // Store the original status
        approvers, // Include the reset approvers
        _customTimelineEntry: {
          action: 'Contract Amendment Started',
          details: `Contract moved to amendment status (original status: ${originalStatus.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}) - All approvals reset`
        }
      }, {
        email: currentUser.email,
        displayName: currentUser.displayName
      });

      // Refresh the contract data
      const updatedContract = await getContract(id);
      if (updatedContract) {
        setContract(updatedContract);
        toast.success('Contract amendment process started - All approvals have been reset');
      }

      // Close the dialog
      setShowAmendDialog(false);
    } catch (error) {
      toast.error('Failed to start contract amendment');
    } finally {
      setUpdatingStatus(false);
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
              {isRefreshing && (
                <div className="flex items-center text-sm text-muted-foreground mr-2">
                  <RefreshCw size={14} className="animate-spin mr-1" />
                  <span>Refreshing...</span>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchContractData}
                className="mr-2"
                disabled={isRefreshing}
              >
                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                <span className="ml-1">Refresh</span>
              </Button>

              {/* Admin-only inactivity notification button */}
              {isAdmin && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSendInactivityNotification}
                        disabled={isSendingNotification}
                        className="mr-2"
                      >
                        <Mail size={14} className={isSendingNotification ? "animate-spin" : ""} />
                        <span className="ml-1">{isSendingNotification ? 'Sending...' : 'Send Notification'}</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Manually send an inactivity notification email to the contract owner and recipient</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

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

                  {isContractEditable(contract) && isAdmin && (
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
                  )}

                  {canContractBeAmended(contract) && isAdmin && (
                    <Button
                      variant="outline"
                      className="gap-1"
                      onClick={openAmendDialog}
                      disabled={updatingStatus}
                    >
                      <FilePenLine size={16} />
                      Amend Contract
                    </Button>
                  )}
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
          {/* Always show the original status card */}
          <StatusSelectCard
            status={contract.status}
            onStatusChange={handleStatusChange}
            isUpdating={updatingStatus}
            contract={contract}
          />

          {/* Show amendment status card only when in amendment mode */}
          {contract.isAmended && contract.status === 'amendment' && (
            <AmendmentStatusCard
              contract={contract}
              onStatusChange={handleStatusChange}
              isUpdating={updatingStatus}
            />
          )}

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
              <CardTitle className="text-sm font-medium">Contract Type</CardTitle>
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

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Card className="overflow-hidden transition-all duration-300 hover:shadow-md cursor-help">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Inactivity Notification</CardTitle>
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      <div className="font-medium">
                        {contract.inactivityNotificationDays || 30} days
                      </div>
                      <p className="text-muted-foreground mt-1">
                        {contract.lastActivityAt
                          ? `Last activity: ${new Date(contract.lastActivityAt).toLocaleDateString()}`
                          : 'No activity recorded yet'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Creator: {contract.owner ? contract.owner.split('@')[0] : 'Unknown'}
                        {currentUser?.email === contract.owner && (
                          <span className="ml-1 text-green-600">(you)</span>
                        )}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent>
                <p>Notifications will be sent to the contract owner and recipient after {contract.inactivityNotificationDays || 30} days of inactivity</p>
                <p className="text-xs mt-1 text-amber-600">Only the contract creator can modify this setting</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Type-specific details - Moved to a more prominent position */}
        {contract.typeSpecificFields && Object.keys(contract.typeSpecificFields).length > 0 && (
          <div className="mb-8">
            <TypeSpecificDetailsCard contract={contract} />
          </div>
        )}

        {contract.description && (
          <Card className="mb-8 overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">
                {contract.description}
              </p>
            </CardContent>
          </Card>
        )}

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
            <ContractProgressBar currentStatus={contract.status} contract={contract} />
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
                        else if (statusText === 'WWF Signing') statusKey = 'wwf_signing';
                        else if (statusText === 'Counterparty Signing') statusKey = 'counterparty_signing';
                        else if (statusText === 'Implementation') statusKey = 'implementation';
                        else if (statusText === 'Amendment') statusKey = 'amendment';
                        else if (statusText === 'Contract End') statusKey = 'contract_end';
                        else if (statusText === 'Legal Send Back') statusKey = 'legal_send_back';
                        else if (statusText === 'Management Send Back') statusKey = 'management_send_back';
                        // Handle legacy status names
                        else if (statusText === 'Legal Declined') statusKey = 'legal_send_back';
                        else if (statusText === 'Management Declined') statusKey = 'management_send_back';
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
                              statusKey === 'wwf_signing' ? 'bg-indigo-800' :
                              statusKey === 'counterparty_signing' ? 'bg-pink-800' :
                              statusKey === 'implementation' ? 'bg-cyan-800' :
                              statusKey === 'amendment' ? 'bg-amber-800' :
                              statusKey === 'contract_end' ? 'bg-slate-800' :
                              statusKey === 'legal_send_back' ? 'bg-red-800' :
                              statusKey === 'management_send_back' ? 'bg-red-800' :
                              statusKey === 'legal_declined' ? 'bg-red-800' : // For backward compatibility
                              statusKey === 'management_declined' ? 'bg-red-800' : // For backward compatibility
                              statusKey === 'approval' ? 'bg-yellow-800' :
                              statusKey === 'finished' ? 'bg-green-800' : 'bg-primary'
                              : 'bg-primary'}`}></div>
                            {index < displayedTimeline.length - 1 && (
                              <div className={`w-0.5 h-full ${isStatusChange && statusKey && statusColors[statusKey] ? statusColors[statusKey].bg : 'bg-border'}`}></div>
                            )}
                          </div>
                          <div className="pt-0">
                            <div className={`font-medium ${isStatusChange && statusKey && statusColors[statusKey] ? statusColors[statusKey].text : ''}`}>
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

      {/* Amendment Confirmation Dialog */}
      <ConfirmationDialog
        open={showAmendDialog}
        onOpenChange={setShowAmendDialog}
        title="Amend Contract"
        description="Are you sure you want to amend this contract? This will start the amendment process, which will require approvals from legal and management teams again."
        confirmText="Start Amendment"
        onConfirm={handleAmendContract}
        isLoading={updatingStatus}
        confirmVariant="outline"
      />
    </PageTransition>
  );
};

export default ContractDetail;
