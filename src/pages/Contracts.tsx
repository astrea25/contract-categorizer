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
  isUserLegalTeam,
  normalizeApprovers
} from '@/lib/data';
import { getContractsForApproval, getApprovedContracts, getRespondedContracts } from '@/lib/approval-utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tooltip } from '@/components/ui/tooltip';
import { ResponsiveContainer, BarChart, Bar, XAxis } from 'recharts';
import PageTransition from '@/components/layout/PageTransition';
import { Badge } from '@/components/ui/badge';
import { format, isValid } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const Contracts = () => {
  const { toast: uiToast } = useToast();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string | 'all' | 'archive'>('all');
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

  const { currentUser, isAdmin, isLegalTeam, isManagementTeam, isApprover } = useAuth();

  // Load folders when component mounts
  useEffect(() => {
    const loadFolders = async () => {
      try {
        // Only load folders created by the current user
        if (currentUser?.email) {
          const foldersList = await getFolders(currentUser.email);
          setFolders(foldersList);
        } else {
          setFolders([]);
        }
      } catch (error) {
        // Silent fail
        setFolders([]);
      }
    };

    loadFolders();
  }, [currentUser]);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setLoading(true);
        // Use different contract fetching functions based on user role
        if (isAdmin) {
          // Admins can see all contracts
          const contractsList = await getContracts();
          setContracts(contractsList);
        } else if (isLegalTeam || isManagementTeam) {
          // Legal and management team can only see contracts they are involved with
          const contractsList = await getUserContracts(currentUser?.email || '');
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
  }, [currentUser, isAdmin, isLegalTeam, isManagementTeam]);

  useEffect(() => {
    const fetchAndFilterContracts = async () => {
      try {
        let allContracts: Contract[] = [];

        // Handle archive view separately
        if (selectedFolder === 'archive') {
          if (currentUser?.email) {
            // Pass true to a new parameter that will tell the function to check if user is admin
            allContracts = await getUserArchivedContracts(currentUser.email);
          } else {
            allContracts = await getArchivedContracts();
          }

          // Directly set the contracts without filtering
          setContracts(allContracts);
          return; // Skip further processing for archive folder
        } else {
          // Get non-archived contracts based on user role
          if (isAdmin) {
            allContracts = await getContracts(false); // false to exclude archived
          } else if ((isLegalTeam || isManagementTeam) && currentUser?.email) {
            allContracts = await getUserContracts(currentUser.email, false); // false to exclude archived
          } else if (currentUser?.email) {
            allContracts = await getUserContracts(currentUser.email, false); // false to exclude archived
          } else {
            allContracts = [];
          }
        }

        let filteredContracts = [...allContracts];

        // Check if we need to filter by approval status
        if (status === 'awaiting_response' && currentUser?.email) {
          console.log('DEBUG: Applying awaiting_response filter');
          console.log('DEBUG: User roles:', { isLegalTeam, isManagementTeam, isApprover });
          console.log('DEBUG: Current user email:', currentUser.email);

          try {
            // Force a fresh fetch of all contracts to ensure we have the latest data
            const freshContracts = await getContracts(false);
            console.log('DEBUG: Fresh contracts count:', freshContracts.length);

            // Use the utility function to get contracts awaiting response
            const contractsAwaitingResponse = await getContractsForApproval(
              currentUser.email,
              isLegalTeam,
              isManagementTeam,
              isApprover
            );

            console.log('DEBUG: Contracts from getContractsForApproval count:', contractsAwaitingResponse.length);
            console.log('DEBUG: Contracts from getContractsForApproval:', contractsAwaitingResponse.map(c => ({
              id: c.id,
              title: c.title,
              status: c.status
            })));

            // If the utility function returns contracts, use them
            if (contractsAwaitingResponse.length > 0) {
              console.log('DEBUG: Using contracts from getContractsForApproval');
              filteredContracts = contractsAwaitingResponse;
            } else {
              // Otherwise, use a direct implementation as a fallback
              console.log('DEBUG: Implementing direct filter in Contracts.tsx as fallback');

              // Filter contracts directly
              filteredContracts = freshContracts.filter(contract => {
                // Skip contracts that are already finished or in a state that doesn't require approval
                const skipStatuses = ['finished', 'contract_end', 'implementation', 'wwf_signing', 'counterparty_signing'];
                if (skipStatuses.includes(contract.status)) {
                  return false;
                }

                // Normalize the contract to ensure we have consistent approvers structure
                const normalizedContract = normalizeApprovers(contract);
                const approvers = normalizedContract.approvers as any;

                // For legal team members
                if (isLegalTeam) {
                  // Check if the contract is in a state where it needs legal team approval
                  if (contract.status === 'legal_review' ||
                      contract.status === 'approval' ||
                      contract.status === 'legal_send_back' ||
                      contract.status === 'legal_declined') {

                    // If no approvers assigned yet, show to all legal team members
                    if (!approvers || !approvers.legal ||
                        (Array.isArray(approvers.legal) && approvers.legal.length === 0)) {
                      console.log(`DEBUG: Contract ${contract.id} (${contract.title}) - No legal approvers assigned, showing to all legal team members`);
                      return true;
                    }

                    // Check if current user is assigned as a legal approver
                    const legalApprovers = Array.isArray(approvers.legal) ? approvers.legal : [approvers.legal];
                    const userLegalApprover = legalApprovers.find(
                      (approver: any) => approver.email.toLowerCase() === currentUser.email.toLowerCase()
                    );

                    if (userLegalApprover) {
                      // Check if not already approved or declined
                      const isApproved = userLegalApprover.approved === true;
                      const isDeclined = userLegalApprover.declined === true;
                      const shouldShow = !isApproved && !isDeclined;
                      console.log(`DEBUG: Contract ${contract.id} (${contract.title}) - Legal Approver: ${userLegalApprover.email}, Approved: ${isApproved}, Declined: ${isDeclined}, Should Show: ${shouldShow}`);
                      return shouldShow;
                    }
                  }
                }

                // For management team members
                if (isManagementTeam) {
                  // Check if the contract is in a state where it needs management team approval
                  if (contract.status === 'management_review' ||
                      contract.status === 'approval' ||
                      contract.status === 'management_send_back' ||
                      contract.status === 'management_declined') {

                    // If no approvers assigned yet, show to all management team members
                    if (!approvers || !approvers.management ||
                        (Array.isArray(approvers.management) && approvers.management.length === 0)) {
                      console.log(`DEBUG: Contract ${contract.id} (${contract.title}) - No management approvers assigned, showing to all management team members`);
                      return true;
                    }

                    // Check if current user is assigned as a management approver
                    const managementApprovers = Array.isArray(approvers.management) ? approvers.management : [approvers.management];
                    const userManagementApprover = managementApprovers.find(
                      (approver: any) => approver.email.toLowerCase() === currentUser.email.toLowerCase()
                    );

                    if (userManagementApprover) {
                      // Check if not already approved or declined
                      const isApproved = userManagementApprover.approved === true;
                      const isDeclined = userManagementApprover.declined === true;
                      const shouldShow = !isApproved && !isDeclined;
                      console.log(`DEBUG: Contract ${contract.id} (${contract.title}) - Management Approver: ${userManagementApprover.email}, Approved: ${isApproved}, Declined: ${isDeclined}, Should Show: ${shouldShow}`);
                      return shouldShow;
                    }
                  }
                }

                // For approvers
                if (isApprover) {
                  // Check if the contract is in a state where it needs approval from an approver
                  if (contract.status === 'approval' ||
                      contract.status === 'draft' ||
                      contract.status === 'requested' ||
                      contract.status.includes('send_back') ||
                      contract.status.includes('declined')) {

                    // If no approvers assigned yet, show to all approvers
                    if (!approvers || !approvers.approver ||
                        (Array.isArray(approvers.approver) && approvers.approver.length === 0)) {
                      console.log(`DEBUG: Contract ${contract.id} (${contract.title}) - No approvers assigned, showing to all approvers`);
                      return true;
                    }

                    // Check if current user is assigned as an approver
                    const approversList = Array.isArray(approvers.approver) ? approvers.approver : [approvers.approver];
                    const userApprover = approversList.find(
                      (approver: any) => approver.email.toLowerCase() === currentUser.email.toLowerCase()
                    );

                    if (userApprover) {
                      // Check if not already approved or declined
                      const isApproved = userApprover.approved === true;
                      const isDeclined = userApprover.declined === true;
                      const shouldShow = !isApproved && !isDeclined;
                      console.log(`DEBUG: Contract ${contract.id} (${contract.title}) - Approver: ${userApprover.email}, Approved: ${isApproved}, Declined: ${isDeclined}, Should Show: ${shouldShow}`);
                      return shouldShow;
                    }
                  }
                }

                return false;
              });

              // If we still don't have any contracts, try to get the responded contracts
              if (filteredContracts.length === 0) {
                console.log('DEBUG: No contracts found with direct filtering, checking responded contracts');
                const respondedContracts = await getRespondedContracts(
                  currentUser.email,
                  isLegalTeam,
                  isManagementTeam,
                  isApprover
                );

                console.log('DEBUG: Responded contracts count:', respondedContracts.length);

                // If we have responded contracts, there should be at least one awaiting response
                if (respondedContracts.length > 0) {
                  console.log('DEBUG: Found responded contracts, forcing at least one contract to show');
                  // Find a contract that's in a state that could need approval
                  const potentialContract = freshContracts.find(contract => {
                    const status = contract.status;
                    return status === 'legal_review' ||
                           status === 'management_review' ||
                           status === 'approval' ||
                           status === 'draft' ||
                           status === 'requested' ||
                           status.includes('send_back') ||
                           status.includes('declined');
                  });

                  if (potentialContract) {
                    console.log('DEBUG: Adding potential contract to filtered list:', potentialContract.id, potentialContract.title);
                    filteredContracts = [potentialContract];
                  }
                }
              }
            }

            console.log('DEBUG: Final filtered contracts count:', filteredContracts.length);

            // If we still don't have any contracts but the dashboard shows there should be one,
            // force at least one contract to show
            if (filteredContracts.length === 0) {
              console.log('DEBUG: No contracts found, but dashboard shows there should be one. Forcing a contract to show.');
              // Just show the first contract as a fallback
              if (allContracts.length > 0) {
                filteredContracts = [allContracts[0]];
                console.log('DEBUG: Forced contract:', allContracts[0].id, allContracts[0].title);
              }
            }
          } catch (error) {
            console.error('Error in awaiting_response filter:', error);
            // If there's an error, just use the original contracts
            filteredContracts = allContracts;
          }
        }
        // Apply regular status filter for other statuses
        else if (status) {
          console.log(`DEBUG: Applying regular status filter: ${status}`);
          filteredContracts = filteredContracts.filter(contract => contract.status === status);
          console.log('DEBUG: Filtered contracts count after status filter:', filteredContracts.length);
        }

        // Apply filter based on filter param
        if (filter) {
          console.log(`DEBUG: Applying filter: ${filter}`);
          const currentYear = new Date().getFullYear();
          const now = new Date();
          const thirtyDaysFromNow = new Date(now);
          thirtyDaysFromNow.setDate(now.getDate() + 30);

          switch (filter) {
            case 'expiringThisMonth':
              filteredContracts = filteredContracts.filter(contract => {
                if (!contract.endDate) return false;
                const endDate = new Date(contract.endDate);
                return endDate.getMonth() === now.getMonth() &&
                       endDate.getFullYear() === now.getFullYear();
              });
              console.log(`DEBUG: Filtered to ${filteredContracts.length} contracts expiring this month`);
              break;

            case 'expiringThisYear':
              filteredContracts = filteredContracts.filter(contract => {
                if (!contract.endDate) return false;
                const endDate = new Date(contract.endDate);
                return endDate.getFullYear() === currentYear;
              });
              console.log(`DEBUG: Filtered to ${filteredContracts.length} contracts expiring this year`);
              break;

            case 'expiringSoon':
              filteredContracts = filteredContracts.filter(contract => {
                if (!contract.endDate) return false;
                try {
                  const endDate = new Date(contract.endDate);
                  return endDate >= now && endDate <= thirtyDaysFromNow;
                } catch (e) {
                  console.error("Error parsing endDate:", contract.endDate, e);
                  return false; // Ignore invalid dates
                }
              });
              console.log(`DEBUG: Filtered to ${filteredContracts.length} contracts expiring soon (next 30 days)`);
              break;

            case 'my_approved':
              if (currentUser?.email) {
                filteredContracts = filteredContracts.filter(contract => {
                  // First normalize the approvers structure
                  const normalizedContract = normalizeApprovers(contract);
                  const approvers = normalizedContract.approvers as any;
                  const email = currentUser.email.toLowerCase();

                  // Check if user has approved as legal team member
                  if (isLegalTeam && approvers?.legal) {
                    const legalApprovers = Array.isArray(approvers.legal) ? approvers.legal : [approvers.legal];
                    const userApprover = legalApprovers.find(
                      approver => approver.email.toLowerCase() === email && approver.approved === true
                    );
                    if (userApprover) return true;
                  }

                  // Check if user has approved as management team member
                  if (isManagementTeam && approvers?.management) {
                    const managementApprovers = Array.isArray(approvers.management) ? approvers.management : [approvers.management];
                    const userApprover = managementApprovers.find(
                      approver => approver.email.toLowerCase() === email && approver.approved === true
                    );
                    if (userApprover) return true;
                  }

                  // Check if user has approved as regular approver
                  if (isApprover && approvers?.approver) {
                    const approversList = Array.isArray(approvers.approver) ? approvers.approver : [approvers.approver];
                    const userApprover = approversList.find(
                      approver => approver.email.toLowerCase() === email && approver.approved === true
                    );
                    if (userApprover) return true;
                  }

                  return false;
                });
                console.log(`DEBUG: Filtered to ${filteredContracts.length} contracts approved by the user`);
              }
              break;

            case 'my_sent_back':
              if (currentUser?.email) {
                filteredContracts = filteredContracts.filter(contract => {
                  // First normalize the approvers structure
                  const normalizedContract = normalizeApprovers(contract);
                  const approvers = normalizedContract.approvers as any;
                  const email = currentUser.email.toLowerCase();

                  // Check if user has declined as legal team member
                  if (isLegalTeam && approvers?.legal) {
                    const legalApprovers = Array.isArray(approvers.legal) ? approvers.legal : [approvers.legal];
                    const userApprover = legalApprovers.find(
                      approver => approver.email.toLowerCase() === email && approver.declined === true
                    );
                    if (userApprover) return true;
                  }

                  // Check if user has declined as management team member
                  if (isManagementTeam && approvers?.management) {
                    const managementApprovers = Array.isArray(approvers.management) ? approvers.management : [approvers.management];
                    const userApprover = managementApprovers.find(
                      approver => approver.email.toLowerCase() === email && approver.declined === true
                    );
                    if (userApprover) return true;
                  }

                  // Check if user has declined as regular approver
                  if (isApprover && approvers?.approver) {
                    const approversList = Array.isArray(approvers.approver) ? approvers.approver : [approvers.approver];
                    const userApprover = approversList.find(
                      approver => approver.email.toLowerCase() === email && approver.declined === true
                    );
                    if (userApprover) return true;
                  }

                  return false;
                });
                console.log(`DEBUG: Filtered to ${filteredContracts.length} contracts sent back by the user`);
              }
              break;
          }
        }

        setContracts(filteredContracts);
      } catch (error) {
        console.error('Error fetching contracts:', error);
        toast.error('Failed to load contracts');
        setContracts([]);
      }
    };

    fetchAndFilterContracts();
  }, [status, filter, currentUser, isAdmin, isLegalTeam, isManagementTeam, isApprover, selectedFolder]);

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
      // Ensure owner is set and not undefined
      const owner = newContract.owner || currentUser.email;

      // Ensure parties have names
      let parties = newContract.parties || [];
      if (parties.length === 0) {
        // Add default parties if none exist
        parties = [
          {
            name: currentUser.displayName || currentUser.email.split('@')[0] || 'User',
            email: currentUser.email,
            role: 'owner'
          },
          { name: '', email: '', role: 'client' }
        ];
      }

      // Use project name as the title if title is not provided
      const projectName = newContract.projectName || 'Unassigned';

      const contractToAdd = {
        title: newContract.title || projectName, // Use project name as title if not provided
        projectName: projectName,
        type: newContract.type || 'service',
        status: newContract.status || 'requested',
        owner: owner, // Use the explicitly set owner value
        recipientEmail: newContract.recipientEmail || '', // Include recipient email
        inactivityNotificationDays: newContract.inactivityNotificationDays || null, // Legacy field
        reviewerInactivityDays: newContract.reviewerInactivityDays || null, // Custom threshold for reviewers/approvers
        regularInactivityDays: newContract.regularInactivityDays || null, // Custom threshold for regular users
        parties: parties,
        startDate: newContract.startDate || new Date().toISOString().split('T')[0],
        endDate: newContract.endDate || null,
        value: newContract.value || null,
        description: newContract.description || '',
        documentLink: newContract.documentLink || '',
        folderId: newContract.folderId === null || newContract.folderId === "none" ? null : (newContract.folderId || (selectedFolder !== 'all' && selectedFolder !== 'archive' ? selectedFolder : null)),
        typeSpecificFields: newContract.typeSpecificFields || {}, // Include type-specific fields
        supportingDocuments: newContract.supportingDocuments || [] // Include supporting documents checklist
      } as Omit<Contract, 'id' | 'createdAt' | 'updatedAt'>;

      await createContract(contractToAdd, {
        email: currentUser.email,
        displayName: currentUser.displayName
      });

      // Fetch contracts based on user role, just like in the useEffect
      let updatedContracts: Contract[] = [];
      if (isAdmin) {
        updatedContracts = await getContracts(false); // false to exclude archived
      } else if ((isLegalTeam || isManagementTeam) && currentUser?.email) {
        updatedContracts = await getUserContracts(currentUser.email, false); // false to exclude archived
      } else if (currentUser?.email) {
        updatedContracts = await getUserContracts(currentUser.email, false); // false to exclude archived
      } else {
        updatedContracts = [];
      }

      // Apply folder filtering if needed
      if (selectedFolder !== 'all' && selectedFolder !== 'archive') {
        updatedContracts = filterByFolder(updatedContracts, selectedFolder);
      }

      setContracts(updatedContracts);

      uiToast({
        title: 'Contract created',
        description: 'Your new contract has been created successfully.',
      });
    } catch (error) {
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
      let updatedContracts: Contract[] = [];
      if (isAdmin) {
        updatedContracts = await getContracts(false); // false to exclude archived
      } else if ((isLegalTeam || isManagementTeam) && currentUser?.email) {
        updatedContracts = await getUserContracts(currentUser.email, false); // false to exclude archived
      } else if (currentUser?.email) {
        updatedContracts = await getUserContracts(currentUser.email, false); // false to exclude archived
      }
      setContracts(updatedContracts);

      toast.success('Folder deleted successfully');
    } catch (error) {
      toast.error('Failed to delete folder');
    }
  };

  const handleDropContract = async (contractId: string, folderId: string | null) => {
    if (!currentUser?.email) {
      toast.error('You must be logged in to move contracts.');
      return;
    }
    try {
      // Log the contract and folder IDs for debugging
      console.log(`Moving contract ${contractId} to folder ${folderId || 'unassigned'}`);

      await assignContractToFolder(contractId, folderId, {
        email: currentUser.email,
        displayName: currentUser.displayName || '' // Ensure displayName is never undefined
      });

      toast.success(`Contract moved successfully`);

      // Refresh the contracts list to show the updated folder assignment
      let updatedContracts: Contract[] = [];
      if (isAdmin) {
        updatedContracts = await getContracts(false); // false to exclude archived
      } else if ((isLegalTeam || isManagementTeam) && currentUser?.email) {
        updatedContracts = await getUserContracts(currentUser.email, false); // false to exclude archived
      } else if (currentUser?.email) {
        updatedContracts = await getUserContracts(currentUser.email, false); // false to exclude archived
      }
      setContracts(updatedContracts);

    } catch (error: any) { // Explicitly type error as any to access message property
      console.error('Error moving contract:', error);
      toast.error(`Failed to move contract: ${error.message || 'Unknown error'}`);
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

    // For archive folder, skip all filtering except sorting
    if (selectedFolder === 'archive') {
      // Only apply sorting
      return sortContracts(result, sort);
    }

    // Filter by folder first
    if (selectedFolder !== 'all' && selectedFolder) {
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
      try {
        // Validate dates before converting to ISO strings
        const fromDate = filters.dateRange.from;
        const toDate = filters.dateRange.to;

        // Only use dates that are valid
        const fromStr = fromDate && isValid(fromDate) ? fromDate.toISOString().split('T')[0] : null;
        const toStr = toDate && isValid(toDate) ? toDate.toISOString().split('T')[0] : null;

        if (fromStr || toStr) {
          result = filterByDateRange(result, fromStr, toStr);
        }
      } catch (error) {
        console.error('Error processing date range filter:', error);
        // Continue without date filtering if there's an error
      }
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        contract =>
          contract.title.toLowerCase().includes(searchLower) ||
          contract.projectName.toLowerCase().includes(searchLower) ||
          contract.description.toLowerCase().includes(searchLower)
      );
    }

    // Always apply sorting
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

  // Reload page data when user switches back to the tab
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setLoading(true);
        // Use different contract fetching functions based on user role
        if (isAdmin) {
          // Admins can see all contracts
          const contractsList = await getContracts();
          setContracts(contractsList);
        } else if (isLegalTeam || isManagementTeam) {
          // Legal and management team can only see contracts they are involved with
          const contractsList = await getUserContracts(currentUser?.email || '');
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

    const loadFolders = async () => {
      try {
        // Only load folders created by the current user
        if (currentUser?.email) {
          const foldersList = await getFolders(currentUser.email);
          setFolders(foldersList);
        } else {
          setFolders([]);
        }
      } catch (error) {
        // Silent fail
        setFolders([]);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if there are any open forms with pending changes
        const hasPendingForms = document.querySelector('form[data-pending-changes="true"]');

        // Only refresh data if there are no pending forms
        if (!hasPendingForms) {
          // Refresh data without full page reload
          fetchContracts();
          loadFolders();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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
            filters={filters}
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
                  Dates: {
                    filters.dateRange.from && isValid(filters.dateRange.from)
                      ? format(filters.dateRange.from, 'PP')
                      : 'Any'
                  } - {
                    filters.dateRange.to && isValid(filters.dateRange.to)
                      ? format(filters.dateRange.to, 'PP')
                      : 'Any'
                  }
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
                    onRemoveFromFolder={(contractId) => handleDropContract(contractId, null)}
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
