import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Search, UserPlus, X, ThumbsDown } from 'lucide-react';
import { Contract, ContractStatus, getLegalTeamMembers, getManagementTeamMembers, getApprovers, normalizeApprovers, updateContract } from '@/lib/data';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

interface TeamMember {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

// Add type definitions for approvers
interface Approver {
  email: string;
  name: string;
  approved: boolean;
  declined?: boolean;
  approvedAt?: string | null;
  declinedAt?: string | null;
}

// Fix the type for the Contract interface to properly support arrays of approvers
type ApproverArray = Approver[];
type ApproverOrArray = Approver | ApproverArray;

// Create a type-safe wrapper for the approvers object
interface TypedApprovers {
  legal?: ApproverArray;
  management?: ApproverArray;
  approver?: ApproverArray;
}

// Define a type for the data that can be passed to onUpdateApprovers
interface ApproversUpdateData {
  approvers?: Contract['approvers'] | {
    legal?: Approver[] | undefined;
    management?: Approver[] | undefined;
    approver?: Approver[] | undefined;
  };
  status?: ContractStatus;
  _customTimelineEntry?: {
    action: string;
    details: string;
  };
}

interface ApprovalBoardProps {
  contract: Contract;
  onUpdateApprovers: (updateData: any) => Promise<void>;
  isRequired: boolean;
}

const ApprovalBoard = ({
  contract,
  onUpdateApprovers,
  isRequired
}: ApprovalBoardProps) => {
  const { isAdmin, isLegalTeam, isManagementTeam, isApprover, currentUser } = useAuth();
  const [legalTeamMembers, setLegalTeamMembers] = useState<TeamMember[]>([]);
  const [managementTeamMembers, setManagementTeamMembers] = useState<TeamMember[]>([]);
  const [approverMembers, setApproverMembers] = useState<TeamMember[]>([]);
  const [legalSearch, setLegalSearch] = useState('');
  const [managementSearch, setManagementSearch] = useState('');
  const [approverSearch, setApproverSearch] = useState('');
  const [filteredLegalMembers, setFilteredLegalMembers] = useState<TeamMember[]>([]);
  const [filteredManagementMembers, setFilteredManagementMembers] = useState<TeamMember[]>([]);
  const [filteredApproverMembers, setFilteredApproverMembers] = useState<TeamMember[]>([]);
  const [showLegalDropdown, setShowLegalDropdown] = useState(false);
  const [showManagementDropdown, setShowManagementDropdown] = useState(false);
  const [showApproverDropdown, setShowApproverDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  // Normalize contract approvers
  const normalizedContract = normalizeApprovers(contract);

  // Get approver limits
  const approverLimits = normalizedContract.approverLimits || {
    legal: 2,
    management: 5,
    approver: 1  // Changed from 5 back to 1 for Approver Team
  };

  // Fetch team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoading(true);
        const legalMembers = await getLegalTeamMembers() as TeamMember[];
        const managementMembers = await getManagementTeamMembers() as TeamMember[];
        const approvers = await getApprovers() as TeamMember[];
        setLegalTeamMembers(legalMembers);
        setManagementTeamMembers(managementMembers);
        setApproverMembers(approvers);
      } catch (error) {
        console.error('Error fetching team members:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTeamMembers();
  }, []);

  // Filter legal team members based on search
  useEffect(() => {
    if (legalSearch.trim() === '') {
      setFilteredLegalMembers(legalTeamMembers);
    } else {
      const filtered = legalTeamMembers.filter(
        member =>
          member.email.toLowerCase().includes(legalSearch.toLowerCase()) ||
          (member.displayName && member.displayName.toLowerCase().includes(legalSearch.toLowerCase()))
      );
      setFilteredLegalMembers(filtered);
    }
  }, [legalSearch, legalTeamMembers]);

  // Filter management team members based on search
  useEffect(() => {
    if (managementSearch.trim() === '') {
      setFilteredManagementMembers(managementTeamMembers);
    } else {
      const filtered = managementTeamMembers.filter(
        member =>
          member.email.toLowerCase().includes(managementSearch.toLowerCase()) ||
          (member.displayName && member.displayName.toLowerCase().includes(managementSearch.toLowerCase()))
      );
      setFilteredManagementMembers(filtered);
    }
  }, [managementSearch, managementTeamMembers]);

  // Filter approver members based on search
  useEffect(() => {
    if (approverSearch.trim() === '') {
      setFilteredApproverMembers(approverMembers);
    } else {
      const filtered = approverMembers.filter(
        member =>
          member.email.toLowerCase().includes(approverSearch.toLowerCase()) ||
          (member.displayName && member.displayName.toLowerCase().includes(approverSearch.toLowerCase()))
      );
      setFilteredApproverMembers(filtered);
    }
  }, [approverSearch, approverMembers]);

  // Handle selecting a legal team member
  const handleSelectLegalMember = (member: TeamMember) => {
    // Get the current legal approvers
    const normalizedContract = normalizeApprovers(contract);
    const currentLegalApprovers = Array.isArray(normalizedContract.approvers?.legal)
      ? normalizedContract.approvers.legal
      : normalizedContract.approvers?.legal ? [normalizedContract.approvers.legal] : [];

    // Check if we've reached the limit
    if (currentLegalApprovers.length >= approverLimits.legal) {
      toast({
        title: 'Limit Reached',
        description: `You can only add up to ${approverLimits.legal} legal team approver(s)`,
        variant: 'destructive'
      });
      return;
    }

    // Add the new legal approver
    onUpdateApprovers({
      ...normalizedContract.approvers,
      legal: [
        ...currentLegalApprovers,
        {
          email: member.email,
          name: member.displayName || member.email,
          approved: false,
          declined: false,
          approvedAt: null,
          declinedAt: null,
        } as Approver
      ]
    });
    setShowLegalDropdown(false);
    setLegalSearch('');
  };

  // Handle selecting a management team member
  const handleSelectManagementMember = (member: TeamMember) => {
    // Get the current management approvers
    const normalizedContract = normalizeApprovers(contract);
    const currentManagementApprovers = getManagementApprovers();

    // Check if we've reached the limit
    if (currentManagementApprovers.length >= approverLimits.management) {
      toast({
        title: 'Limit Reached',
        description: `You can only add up to ${approverLimits.management} management team approver(s)`,
        variant: 'destructive'
      });
      return;
    }

    // Add the new management approver
    onUpdateApprovers({
      ...normalizedContract.approvers,
      management: [
        ...currentManagementApprovers,
        {
          email: member.email,
          name: member.displayName || member.email,
          approved: false,
          declined: false,
          approvedAt: null,
          declinedAt: null,
        } as Approver
      ]
    });
    setShowManagementDropdown(false);
    setManagementSearch('');
  };

  // Handle removing a legal team approver
  const handleRemoveLegalApprover = (email: string) => {
    const normalizedContract = normalizeApprovers(contract);
    const currentLegalApprovers = getLegalApprovers();

    // Filter out the approver to remove
    const updatedLegalApprovers = currentLegalApprovers.filter(approver => approver.email !== email);
    // Update the approvers
    onUpdateApprovers({
      ...normalizedContract.approvers,
      legal: updatedLegalApprovers.length > 0 ? updatedLegalApprovers : undefined
    });
  };

  // Handle removing a management team approver
  const handleRemoveManagementApprover = (email: string) => {
    const normalizedContract = normalizeApprovers(contract);
    const currentManagementApprovers = getManagementApprovers();

    // Filter out the approver to remove
    const updatedManagementApprovers = currentManagementApprovers.filter(approver => approver.email !== email);
    // Update the approvers
    onUpdateApprovers({
      ...normalizedContract.approvers,
      management: updatedManagementApprovers.length > 0 ? updatedManagementApprovers : undefined
    });
  };

  // Handle selecting an approver
  const handleSelectApprover = (member: TeamMember) => {
    // Get the current approvers
    const normalizedContract = normalizeApprovers(contract);
    const currentApprovers = normalizedContract.approvers?.approver || [];

    // Check if we've reached the limit
    if (currentApprovers.length >= approverLimits.approver) {
      toast({
        title: 'Limit Reached',
        description: `You can only add 1 Approver Team member, who must approve for contract completion`,
        variant: 'destructive'
      });
      return;
    }

    // Add the new approver
    onUpdateApprovers({
      ...normalizedContract.approvers,
      approver: [
        ...currentApprovers,
        {
          email: member.email,
          name: member.displayName || member.email,
          approved: false,
          declined: false,
          approvedAt: null,
          declinedAt: null,
        }
      ]
    });
    setShowApproverDropdown(false);
    setApproverSearch('');
  };

  // Handle removing an approver
  const handleRemoveApprover = (email: string) => {
    const normalizedContract = normalizeApprovers(contract);
    const currentApprovers = normalizedContract.approvers?.approver || [];
    // Filter out the approver to remove
    const updatedApprovers = currentApprovers.filter(approver => approver.email !== email);
    // Update the approvers
    onUpdateApprovers({
      ...normalizedContract.approvers,
      approver: updatedApprovers.length > 0 ? updatedApprovers : undefined
    });
  };

  // Handle approving as an approver
  const handleApproverApprove = async (email: string) => {
    if (!isApprover || !currentUser?.email) return;

    // Only allow if the current user is the assigned approver
    const normalizedContract = normalizeApprovers(contract);
    const currentApprovers = normalizedContract.approvers?.approver || [];
    const userApprover = currentApprovers.find(approver => approver.email.toLowerCase() === currentUser.email.toLowerCase());
    if (!userApprover) return;

    // Update the specific approver's status
    const updatedApprovers = currentApprovers.map(approver => {
      if (approver.email.toLowerCase() === currentUser.email.toLowerCase()) {
        return {
          ...approver,
          approved: true,
          declined: false,
          declinedAt: null,
          approvedAt: new Date().toISOString()
        };
      }
      return approver;
    });

    // Update approvers
    await onUpdateApprovers({
      ...normalizedContract.approvers,
      approver: updatedApprovers
    });

    toast({
      title: 'Contract Approved',
      description: 'You have approved this contract',
      variant: 'default'
    });
  };

  // Handle declining as an approver
  const handleApproverDecline = async (email: string) => {
    if (!isApprover || !currentUser?.email) return;

    // Only allow if the current user is the assigned approver
    const normalizedContract = normalizeApprovers(contract);
    const currentApprovers = normalizedContract.approvers?.approver || [];
    const userApprover = currentApprovers.find(approver => approver.email.toLowerCase() === currentUser.email.toLowerCase());
    if (!userApprover) return;

    // Update the specific approver's status
    const updatedApprovers = currentApprovers.map(approver => {
      if (approver.email.toLowerCase() === currentUser.email.toLowerCase()) {
        return {
          ...approver,
          approved: false,
          declined: true,
          approvedAt: null,
          declinedAt: new Date().toISOString()
        };
      }
      return approver;
    });

    // Update approvers
    await onUpdateApprovers({
      ...normalizedContract.approvers,
      approver: updatedApprovers
    });

    toast({
      title: 'Contract Declined',
      description: 'You have declined this contract',
      variant: 'destructive'
    });
  };

  // Handle withdrawing approver approval
  const handleApproverWithdraw = async (email: string) => {
    if (!isApprover || !currentUser?.email) return;

    // Only allow if the current user is the assigned approver
    const normalizedContract = normalizeApprovers(contract);
    const currentApprovers = normalizedContract.approvers?.approver || [];
    const userApprover = currentApprovers.find(approver => approver.email.toLowerCase() === currentUser.email.toLowerCase());
    if (!userApprover) return;

    // Update the specific approver's status
    const updatedApprovers = currentApprovers.map(approver => {
      if (approver.email.toLowerCase() === currentUser.email.toLowerCase()) {
        return {
          ...approver,
          approved: false,
          declined: false,
          approvedAt: null,
          declinedAt: null
        };
      }
      return approver;
    });

    // Update approvers
    await onUpdateApprovers({
      ...normalizedContract.approvers,
      approver: updatedApprovers
    });

    toast({
      title: 'Approval Withdrawn',
      description: 'You have withdrawn your approval',
      variant: 'default'
    });
  };

  // Handle legal approval
  const handleLegalApprove = async () => {
    if (!isLegalTeam || !currentUser?.email) return;

    console.log('Legal approval - Current contract status:', contract.status);

    // Only allow if the current user is an assigned legal approver
    const normalizedContract = normalizeApprovers(contract);
    const currentLegalApprovers = getLegalApprovers();

    const userApprover = currentLegalApprovers.find(approver =>
      approver.email.toLowerCase() === currentUser.email.toLowerCase()
    );
    if (!userApprover) return;

    // Update the specific approver's status
    const updatedLegalApprovers = currentLegalApprovers.map(approver => {
      if (approver.email.toLowerCase() === currentUser.email.toLowerCase()) {
        return {
          ...approver,
          approved: true,
          declined: false,
          declinedAt: null,
          approvedAt: new Date().toISOString()
        };
      }
      return approver;
    });

    // Check if management has already approved
    const managementApprovers = getManagementApprovers();
    const isManagementApproved = managementApprovers.length > 0 && 
      managementApprovers.every(approver => approver.approved);
    
    console.log('Legal approval - Management approvers:', managementApprovers);
    console.log('Legal approval - Is management approved:', isManagementApproved);
    
    // Build the request data for the API
    const updateData: any = {};
    
    // Add approvers update
    updateData.approvers = {
      ...normalizedContract.approvers,
      legal: updatedLegalApprovers
    };
    
    // Add custom timeline entry
    updateData._customTimelineEntry = {
      action: `Legal Approval: ${userApprover.name || currentUser.displayName || currentUser.email.split('@')[0]}`,
      details: 'Approved as legal team member'
    };

    // Implement Scenario 1: If current status is draft, move to legal_review
    if (contract.status === 'draft') {
      updateData.status = 'legal_review';
      updateData._customTimelineEntry.details += ' - Status changed to Legal Review';
      console.log('Legal approval - Setting status to legal_review');
    }
    
    // If both legal and management have approved, move to fully approved status
    if (isManagementApproved && contract.status === 'management_review') {
      updateData.status = 'approval';
      updateData._customTimelineEntry.details += ' - Status changed to Fully Approved (both Legal and Management have approved)';
      console.log('Legal approval - Setting status to approval (fully approved)');
    }

    console.log('Legal approval - Final updateData:', JSON.stringify(updateData, null, 2));

    // Update approvers with custom timeline entry and possibly status change
    try {
      await onUpdateApprovers(updateData);
      console.log('Legal approval - onUpdateApprovers called successfully');
    } catch (error) {
      console.error('Legal approval - Error in onUpdateApprovers:', error);
    }

    toast({
      title: 'Contract Approved',
      description: 'You have approved this contract as a legal team member',
      variant: 'default'
    });
  };

  // Handle legal decline
  const handleLegalDecline = async () => {
    if (!isLegalTeam || !currentUser?.email) return;

    // Only allow if the current user is an assigned legal approver
    const normalizedContract = normalizeApprovers(contract);
    const currentLegalApprovers = getLegalApprovers();

    const userApprover = currentLegalApprovers.find(approver =>
      approver.email.toLowerCase() === currentUser.email.toLowerCase()
    );
    if (!userApprover) return;

    // Update the specific approver's status
    const updatedLegalApprovers = currentLegalApprovers.map(approver => {
      if (approver.email.toLowerCase() === currentUser.email.toLowerCase()) {
        return {
          ...approver,
          approved: false,
          declined: true,
          approvedAt: null,
          declinedAt: new Date().toISOString()
        };
      }
      return approver;
    });

    // Update approvers
    await onUpdateApprovers({
      ...normalizedContract.approvers,
      legal: updatedLegalApprovers
    });

    toast({
      title: 'Contract Declined',
      description: 'You have declined this contract as a legal team member',
      variant: 'destructive'
    });
  };

  // Handle withdrawing legal approval
  const handleLegalWithdraw = async () => {
    if (!isLegalTeam || !currentUser?.email) return;

    // Only allow if the current user is an assigned legal approver
    const normalizedContract = normalizeApprovers(contract);
    const currentLegalApprovers = getLegalApprovers();

    const userApprover = currentLegalApprovers.find(approver =>
      approver.email.toLowerCase() === currentUser.email.toLowerCase()
    );
    if (!userApprover) return;

    // Update the specific approver's status
    const updatedLegalApprovers = currentLegalApprovers.map(approver => {
      if (approver.email.toLowerCase() === currentUser.email.toLowerCase()) {
        return {
          ...approver,
          approved: false,
          declined: false,
          approvedAt: null,
          declinedAt: null
        };
      }
      return approver;
    });

    // Check if management has approved
    const managementApprovers = getManagementApprovers();
    const isManagementApproved = managementApprovers.length > 0 && 
      managementApprovers.every(approver => approver.approved);

    // Create a custom timeline entry for legal approval withdrawal
    const updateData: any = {
      approvers: {
        ...normalizedContract.approvers,
        legal: updatedLegalApprovers
      },
      _customTimelineEntry: {
        action: `Legal Approval Withdrawn: ${userApprover.name || currentUser.displayName || currentUser.email.split('@')[0]}`,
        details: 'Withdrawn as legal team member'
      }
    };

    // Update contract status based on withdrawal
    // If we're in approval status, means both legal and management had approved
    if (contract.status === 'approval') {
      // If management is still approved, go back to management_review status
      if (isManagementApproved) {
        updateData.status = 'management_review';
        updateData._customTimelineEntry.details += ' - Status changed to Management Review';
        console.log('Legal withdrawal - Setting status back to management_review');
      } else {
        // If neither is approved, go back to draft
        updateData.status = 'draft';
        updateData._customTimelineEntry.details += ' - Status changed to Draft';
        console.log('Legal withdrawal - Setting status back to draft');
      }
    } 
    // If we're in legal_review status, go back to draft
    else if (contract.status === 'legal_review') {
      updateData.status = 'draft';
      updateData._customTimelineEntry.details += ' - Status changed to Draft';
      console.log('Legal withdrawal - Setting status back to draft');
    }

    // Update approvers with custom timeline entry
    await onUpdateApprovers(updateData);

    toast({
      title: 'Approval Withdrawn',
      description: 'You have withdrawn your approval as a legal team member',
      variant: 'default'
    });
  };

  // Function to get an array of legal approvers accounting for type differences
  const getLegalApprovers = (): Approver[] => {
    return Array.isArray(normalizedContract.approvers?.legal)
      ? normalizedContract.approvers.legal as Approver[]
      : normalizedContract.approvers?.legal ? [normalizedContract.approvers.legal as Approver] : [];
  };

  // Function to get an array of management approvers accounting for type differences
  const getManagementApprovers = (): Approver[] => {
    return Array.isArray(normalizedContract.approvers?.management)
      ? normalizedContract.approvers.management as Approver[]
      : normalizedContract.approvers?.management ? [normalizedContract.approvers.management as Approver] : [];
  };

  // Handle management approval
  const handleManagementApprove = async () => {
    if (!isManagementTeam || !currentUser?.email) return;

    console.log('Management approval - Current contract status:', contract.status);

    // Only allow if the current user is an assigned management approver
    const normalizedContract = normalizeApprovers(contract);
    const currentManagementApprovers = getManagementApprovers();

    const userApprover = currentManagementApprovers.find(approver =>
      approver.email.toLowerCase() === currentUser.email.toLowerCase()
    );
    if (!userApprover) return;

    // Update the specific approver's status
    const updatedManagementApprovers = currentManagementApprovers.map(approver => {
      if (approver.email.toLowerCase() === currentUser.email.toLowerCase()) {
        return {
          ...approver,
          approved: true,
          declined: false,
          declinedAt: null,
          approvedAt: new Date().toISOString()
        };
      }
      return approver;
    });

    // Check if legal has already approved
    const legalApprovers = getLegalApprovers();
    const isLegalApproved = legalApprovers.length > 0 && 
      legalApprovers.every(approver => approver.approved);
    
    console.log('Management approval - Legal approvers:', legalApprovers);
    console.log('Management approval - Is legal approved:', isLegalApproved);
    
    // Build the request data for the API
    const updateData: any = {};
    
    // Add approvers update
    updateData.approvers = {
      ...normalizedContract.approvers,
      management: updatedManagementApprovers
    };
    
    // Add custom timeline entry
    updateData._customTimelineEntry = {
      action: `Management Approval: ${userApprover.name || currentUser.displayName || currentUser.email.split('@')[0]}`,
      details: 'Approved as management team member'
    };

    // Implement Scenario 2: If current status is draft, move to management_review
    if (contract.status === 'draft') {
      updateData.status = 'management_review';
      updateData._customTimelineEntry.details += ' - Status changed to Management Review';
      console.log('Management approval - Setting status to management_review');
    }
    
    // If both legal and management have approved, move to fully approved status
    if (isLegalApproved && contract.status === 'legal_review') {
      updateData.status = 'approval';
      updateData._customTimelineEntry.details += ' - Status changed to Fully Approved (both Legal and Management have approved)';
      console.log('Management approval - Setting status to approval (fully approved)');
    }

    console.log('Management approval - Final updateData:', JSON.stringify(updateData, null, 2));

    // Update approvers with custom timeline entry and possibly status change
    try {
      await onUpdateApprovers(updateData);
      console.log('Management approval - onUpdateApprovers called successfully');
    } catch (error) {
      console.error('Management approval - Error in onUpdateApprovers:', error);
    }

    toast({
      title: 'Contract Approved',
      description: 'You have approved this contract as a management team member',
      variant: 'default'
    });
  };

  // Handle management decline
  const handleManagementDecline = async () => {
    if (!isManagementTeam || !currentUser?.email) return;

    // Only allow if the current user is an assigned management approver
    const normalizedContract = normalizeApprovers(contract);
    const currentManagementApprovers = getManagementApprovers();

    const userApprover = currentManagementApprovers.find(approver =>
      approver.email.toLowerCase() === currentUser.email.toLowerCase()
    );
    if (!userApprover) return;

    // Update the specific approver's status
    const updatedManagementApprovers = currentManagementApprovers.map(approver => {
      if (approver.email.toLowerCase() === currentUser.email.toLowerCase()) {
        return {
          ...approver,
          approved: false,
          declined: true,
          approvedAt: null,
          declinedAt: new Date().toISOString()
        };
      }
      return approver;
    });

    // Create a custom timeline entry for management decline
    const updateData: any = {
      approvers: {
        ...normalizedContract.approvers,
        management: updatedManagementApprovers
      },
      _customTimelineEntry: {
        action: `Management Approval Declined: ${userApprover.name || currentUser.displayName || currentUser.email.split('@')[0]}`,
        details: 'Declined as management team member'
      }
    };

    // Update approvers with custom timeline entry
    await onUpdateApprovers(updateData);

    toast({
      title: 'Contract Declined',
      description: 'You have declined this contract as a management team member',
      variant: 'destructive'
    });
  };

  // Handle management withdraw
  const handleManagementWithdraw = async () => {
    if (!isManagementTeam || !currentUser?.email) return;

    // Only allow if the current user is an assigned management approver
    const normalizedContract = normalizeApprovers(contract);
    const currentManagementApprovers = getManagementApprovers();

    const userApprover = currentManagementApprovers.find(approver =>
      approver.email.toLowerCase() === currentUser.email.toLowerCase()
    );
    if (!userApprover) return;

    // Update the specific approver's status
    const updatedManagementApprovers = currentManagementApprovers.map(approver => {
      if (approver.email.toLowerCase() === currentUser.email.toLowerCase()) {
        return {
          ...approver,
          approved: false,
          declined: false,
          approvedAt: null,
          declinedAt: null
        };
      }
      return approver;
    });

    // Check if legal has approved
    const legalApprovers = getLegalApprovers();
    const isLegalApproved = legalApprovers.length > 0 && 
      legalApprovers.every(approver => approver.approved);

    // Create update data
    const updateData: any = {
      approvers: {
        ...normalizedContract.approvers,
        management: updatedManagementApprovers
      },
      _customTimelineEntry: {
        action: `Management Approval Withdrawn: ${userApprover.name || currentUser.displayName || currentUser.email.split('@')[0]}`,
        details: 'Withdrawn as management team member'
      }
    };

    // Update contract status based on withdrawal
    // If we're in approval status, means both legal and management had approved
    if (contract.status === 'approval') {
      // If legal is still approved, go back to legal_review status
      if (isLegalApproved) {
        updateData.status = 'legal_review';
        updateData._customTimelineEntry.details += ' - Status changed to Legal Review';
        console.log('Management withdrawal - Setting status back to legal_review');
      } else {
        // If neither is approved, go back to draft
        updateData.status = 'draft';
        updateData._customTimelineEntry.details += ' - Status changed to Draft';
        console.log('Management withdrawal - Setting status back to draft');
      }
    } 
    // If we're in management_review status, go back to draft
    else if (contract.status === 'management_review') {
      updateData.status = 'draft';
      updateData._customTimelineEntry.details += ' - Status changed to Draft';
      console.log('Management withdrawal - Setting status back to draft');
    }

    // Update approvers
    await onUpdateApprovers(updateData);

    toast({
      title: 'Approval Withdrawn',
      description: 'You have withdrawn your approval as a management team member',
      variant: 'default'
    });
  };

  // Normalize contract approvers for checking
  const normalizedContractForChecks = normalizeApprovers(contract);

  // Check if current user is a legal approver
  const isCurrentUserLegalApprover = currentUser?.email &&
    getLegalApprovers().some(approver =>
      approver.email.toLowerCase() === currentUser.email.toLowerCase()
    );

  // Check if current user is a management approver
  const isCurrentUserManagementApprover = currentUser?.email &&
    getManagementApprovers().some(approver =>
      approver.email.toLowerCase() === currentUser.email.toLowerCase()
    );

  // Check if current user is an approver
  const isCurrentUserApprover = currentUser?.email &&
    normalizedContractForChecks.approvers?.approver &&
    normalizedContractForChecks.approvers.approver.some(approver =>
      approver.email.toLowerCase() === currentUser.email.toLowerCase());

  // Fix for email property access on single legal approver UI
  const getSingleLegalApproverEmail = () => {
    if (!normalizedContract.approvers?.legal) return '';
    return Array.isArray(normalizedContract.approvers.legal)
      ? (normalizedContract.approvers.legal[0]?.email || '')
      : normalizedContract.approvers.legal.email;
  };

  // Fix for email property access on single management approver UI
  const getSingleManagementApproverEmail = () => {
    if (!normalizedContract.approvers?.management) return '';
    return Array.isArray(normalizedContract.approvers.management)
      ? (normalizedContract.approvers.management[0]?.email || '')
      : normalizedContract.approvers.management.email;
  };

  // Determine if the user can edit approvers
  const canEditApprovers = isAdmin || contract.status === 'requested' || contract.status === 'draft';

  return (
    <div className="mb-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Approval Board</span>
            {isRequired && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                Required
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading team members...</p>
          ) : (
            <div className="space-y-6">
              {/* Legal Team Approvers */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Legal Team Approvers ({getLegalApprovers().length}/{approverLimits.legal})</Label>
                  {canEditApprovers && (
                    ((!normalizedContract.approvers?.legal || getLegalApprovers().length < approverLimits.legal)) ? (
                      <div className="relative">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowLegalDropdown(!showLegalDropdown)}
                          className="gap-1"
                          disabled={legalTeamMembers.length === 0}
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>Assign</span>
                        </Button>
                        {showLegalDropdown && (
                          <div className="absolute right-0 mt-1 w-64 bg-card border rounded-md shadow-lg z-50">
                            <div className="p-2">
                              <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Search legal team..."
                                  className="pl-8"
                                  value={legalSearch}
                                  onChange={(e) => setLegalSearch(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              {filteredLegalMembers.length > 0 ? (
                                filteredLegalMembers.map((member) => (
                                  <div
                                    key={member.id}
                                    className="px-3 py-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                                    onClick={() => handleSelectLegalMember(member)}
                                  >
                                    <div>
                                      <div className="font-medium text-sm">
                                        {member.displayName || 'No name'}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {member.email}
                                      </div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                      <Check className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                  No legal team members found
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null
                  )}
                </div>
                {normalizedContract.approvers?.legal ? (
                  Array.isArray(normalizedContract.approvers.legal) ? (
                    // Multiple legal approvers
                    <div className="space-y-2">
                      {getLegalApprovers().map((approver) => (
                        <div key={approver.email} className="flex items-center justify-between p-3 border rounded-md bg-card/50">
                          <div>
                            <div className="font-medium">{approver.name}</div>
                            <div className="text-sm text-muted-foreground">{approver.email}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {approver.approved ? (
                              <div className="flex items-center gap-2">
                                <Badge className="bg-green-50 text-green-800 border-green-200">
                                  Approved
                                </Badge>
                                {currentUser?.email?.toLowerCase() === approver.email.toLowerCase() && (
                                  <Button
                                    size="sm"
                                    onClick={handleLegalWithdraw}
                                    variant="outline"
                                    className="text-amber-600 border-amber-200 hover:bg-amber-50"
                                  >
                                    Withdraw Approval
                                  </Button>
                                )}
                              </div>
                            ) : approver.declined ? (
                              <div className="flex items-center gap-2">
                                <Badge className="bg-red-50 text-red-800 border-red-200">
                                  Declined
                                </Badge>
                                {currentUser?.email?.toLowerCase() === approver.email.toLowerCase() && (
                                  <Button
                                    size="sm"
                                    onClick={handleLegalApprove}
                                    className="bg-blue-500 hover:bg-blue-600"
                                  >
                                    <Check className="h-3.5 w-3.5 mr-1" />
                                    Approve Instead
                                  </Button>
                                )}
                              </div>
                            ) : currentUser?.email?.toLowerCase() === approver.email.toLowerCase() ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={handleLegalApprove}
                                  className="bg-blue-500 hover:bg-blue-600"
                                >
                                  <Check className="h-3.5 w-3.5 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleLegalDecline}
                                  variant="destructive"
                                >
                                  <ThumbsDown className="h-3.5 w-3.5 mr-1" />
                                  Decline
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2 items-center">
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                                  Pending
                                </Badge>
                                {canEditApprovers && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemoveLegalApprover(getSingleLegalApproverEmail())}
                                    className="h-8 w-8 p-0 text-destructive ml-2"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Single legal approver (legacy format)
                    <div className="flex items-center justify-between p-3 border rounded-md bg-card/50">
                      <div>
                        <div className="font-medium">{normalizedContract.approvers.legal.name}</div>
                        <div className="text-sm text-muted-foreground">{getSingleLegalApproverEmail()}</div>
                      </div>
                      <div>
                        {isCurrentUserLegalApprover && getLegalApprovers().some(a => a.approved) ? (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-50 text-green-800 border-green-200">
                              Approved
                            </Badge>{isCurrentUserLegalApprover && (
                              <Button
                                size="sm"
                                onClick={handleLegalWithdraw}
                                variant="outline"
                                className="text-amber-600 border-amber-200 hover:bg-amber-50"
                              >
                                Withdraw Approval
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-red-50 text-red-800 border-red-200">
                              Declined
                            </Badge>
                            {isCurrentUserLegalApprover && (
                              <Button
                                size="sm"
                                onClick={handleLegalApprove}
                                className="bg-blue-500 hover:bg-blue-600"
                              >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Approve Instead
                              </Button>
                            )}
                          </div>
                        )}
                        {canEditApprovers && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveLegalApprover(getSingleLegalApproverEmail())}
                            className="h-8 w-8 p-0 text-destructive ml-2"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    {isRequired ? "Required - Please assign a legal team approver" : "No legal approver assigned"}
                  </div>
                )}
              </div>
              {/* Management Team Approvers */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Management Team Approvers ({getManagementApprovers().length}/{approverLimits.management})</Label>
                  {canEditApprovers && (
                    ((!normalizedContract.approvers?.management || getManagementApprovers().length < approverLimits.management)) ? (
                      <div className="relative">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowManagementDropdown(!showManagementDropdown)}
                          className="gap-1"
                          disabled={managementTeamMembers.length === 0}
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>Assign</span>
                        </Button>
                        {showManagementDropdown && (
                          <div className="absolute right-0 mt-1 w-64 bg-card border rounded-md shadow-lg z-50">
                            <div className="p-2">
                              <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Search management team..."
                                  className="pl-8"
                                  value={managementSearch}
                                  onChange={(e) => setManagementSearch(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              {filteredManagementMembers.length > 0 ? (
                                filteredManagementMembers.map((member) => (
                                  <div
                                    key={member.id}
                                    className="px-3 py-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                                    onClick={() => handleSelectManagementMember(member)}
                                  >
                                    <div>
                                      <div className="font-medium text-sm">
                                        {member.displayName || 'No name'}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {member.email}
                                      </div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                      <Check className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                  No management team members found
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null
                  )}
                </div>
                {normalizedContract.approvers?.management ? (
                  Array.isArray(normalizedContract.approvers.management) ? (
                    // Multiple management approvers
                    <div className="space-y-2">
                      {getManagementApprovers().map((approver) => (
                        <div key={approver.email} className="flex items-center justify-between p-3 border rounded-md bg-card/50">
                          <div>
                            <div className="font-medium">{approver.name}</div>
                            <div className="text-sm text-muted-foreground">{approver.email}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            {approver.approved ? (
                              <div className="flex items-center gap-2">
                                <Badge className="bg-green-50 text-green-800 border-green-200">
                                  Approved
                                </Badge>
                                {currentUser?.email?.toLowerCase() === approver.email.toLowerCase() && (
                                  <Button
                                    size="sm"
                                    onClick={handleManagementWithdraw}
                                    variant="outline"
                                    className="text-amber-600 border-amber-200 hover:bg-amber-50"
                                  >
                                    Withdraw Approval
                                  </Button>
                                )}
                              </div>
                            ) : approver.declined ? (
                              <div className="flex items-center gap-2">
                                <Badge className="bg-red-50 text-red-800 border-red-200">
                                  Declined
                                </Badge>
                                {currentUser?.email?.toLowerCase() === approver.email.toLowerCase() && (
                                  <Button
                                    size="sm"
                                    onClick={handleManagementApprove}
                                    className="bg-blue-500 hover:bg-blue-600"
                                  >
                                    <Check className="h-3.5 w-3.5 mr-1" />
                                    Approve Instead
                                  </Button>
                                )}
                              </div>
                            ) : currentUser?.email?.toLowerCase() === approver.email.toLowerCase() ? (
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={handleManagementApprove}
                                  className="bg-blue-500 hover:bg-blue-600"
                                >
                                  <Check className="h-3.5 w-3.5 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleManagementDecline}
                                  variant="destructive"
                                >
                                  <ThumbsDown className="h-3.5 w-3.5 mr-1" />
                                  Decline
                                </Button>
                              </div>
                            ) : (
                              <div className="flex gap-2 items-center">
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                                  Pending
                                </Badge>
                                {canEditApprovers && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemoveManagementApprover(getSingleManagementApproverEmail())}
                                    className="h-8 w-8 p-0 text-destructive ml-2"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    // Single management approver (legacy format)
                    <div className="flex items-center justify-between p-3 border rounded-md bg-card/50">
                      <div>
                        <div className="font-medium">{normalizedContract.approvers.management.name}</div>
                        <div className="text-sm text-muted-foreground">{getSingleManagementApproverEmail()}</div>
                      </div>
                      <div>
                        {isCurrentUserManagementApprover && getManagementApprovers().some(a => a.approved) ? (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-50 text-green-800 border-green-200">
                              Approved
                            </Badge>
                            {isCurrentUserManagementApprover && (
                              <Button
                                size="sm"
                                onClick={handleManagementWithdraw}
                                variant="outline"
                                className="text-amber-600 border-amber-200 hover:bg-amber-50"
                              >
                                Withdraw Approval
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-red-50 text-red-800 border-red-200">
                              Declined
                            </Badge>
                            {isCurrentUserManagementApprover && (
                              <Button
                                size="sm"
                                onClick={handleManagementApprove}
                                className="bg-blue-500 hover:bg-blue-600"
                              >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Approve Instead
                              </Button>
                            )}
                          </div>
                        )}
                        {canEditApprovers && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoveManagementApprover(getSingleManagementApproverEmail())}
                            className="h-8 w-8 p-0 text-destructive ml-2"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    {isRequired ? "Required - Please assign a management team approver" : "No management approver assigned"}
                  </div>
                )}
              </div>
              {/* Approver Team */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Approver Team ({normalizedContract.approvers?.approver?.length || 0}/{approverLimits.approver})</Label>
                  {canEditApprovers && (
                    ((!normalizedContract.approvers?.approver || normalizedContract.approvers?.approver?.length < approverLimits.approver)) ? (
                      <div className="relative">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowApproverDropdown(!showApproverDropdown)}
                          className="gap-1"
                          disabled={approverMembers.length === 0}
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>Assign</span>
                        </Button>
                        {showApproverDropdown && (
                          <div className="absolute right-0 mt-1 w-64 bg-card border rounded-md shadow-lg z-50">
                            <div className="p-2">
                              <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Search approvers..."
                                  className="pl-8"
                                  value={approverSearch}
                                  onChange={(e) => setApproverSearch(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              {filteredApproverMembers.length > 0 ? (
                                filteredApproverMembers.map((member) => (
                                  <div
                                    key={member.id}
                                    className="px-3 py-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                                    onClick={() => handleSelectApprover(member)}
                                  >
                                    <div>
                                      <div className="font-medium text-sm">
                                        {member.displayName || 'No name'}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {member.email}
                                      </div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                      <Check className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                  No approvers found
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : null
                  )}
                </div>
                {normalizedContract.approvers?.approver?.length > 0 ? (
                  normalizedContract.approvers.approver.map((approver) => (
                    <div key={approver.email} className="flex items-center justify-between p-3 border rounded-md bg-card/50">
                      <div>
                        <div className="font-medium">{approver.name}</div>
                        <div className="text-sm text-muted-foreground">{approver.email}</div>
                      </div>
                      <div>
                        {approver.approved ? (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-green-50 text-green-800 border-green-200">
                              Approved
                            </Badge>
                            {currentUser?.email?.toLowerCase() === approver.email.toLowerCase() && (
                              <Button
                                size="sm"
                                onClick={() => handleApproverWithdraw(approver.email)}
                                variant="outline"
                                className="text-amber-600 border-amber-200 hover:bg-amber-50"
                              >
                                Withdraw Approval
                              </Button>
                            )}
                          </div>
                        ) : approver.declined ? (
                          <div className="flex items-center gap-2">
                            <Badge className="bg-red-50 text-red-800 border-red-200">
                              Declined
                            </Badge>
                            {currentUser?.email?.toLowerCase() === approver.email.toLowerCase() && (
                              <Button
                                size="sm"
                                onClick={() => handleApproverApprove(approver.email)}
                                className="bg-blue-500 hover:bg-blue-600"
                              >
                                <Check className="h-3.5 w-3.5 mr-1" />
                                Approve Instead
                              </Button>
                            )}
                          </div>
                        ) : currentUser?.email?.toLowerCase() === approver.email.toLowerCase() ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleApproverApprove(approver.email)}
                              className="bg-blue-500 hover:bg-blue-600"
                            >
                              <Check className="h-3.5 w-3.5 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleApproverDecline(approver.email)}
                              variant="destructive"
                            >
                              <ThumbsDown className="h-3.5 w-3.5 mr-1" />
                              Decline
                            </Button>
                          </div>
                        ) : (
                          <div className="flex gap-2 items-center">
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                              Pending
                            </Badge>
                            {canEditApprovers && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveApprover(approver.email)}
                                className="h-8 w-8 p-0 text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    No approver team member assigned - required for contract completion
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApprovalBoard;
