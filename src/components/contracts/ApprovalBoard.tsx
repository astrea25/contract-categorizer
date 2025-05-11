// Add type definitions for approvers
// Fix the type for the Contract interface to properly support arrays of approvers
// Create a type-safe wrapper for the approvers object
// Define a type for the data that can be passed to onUpdateApprovers
// Normalize contract approvers
// Get approver limits
// Changed from 5 back to 1 for Approver Team
// Fetch team members
// Filter legal team members based on search
// Filter management team members based on search
// Filter approver members based on search
// Handle selecting a legal team member
// Get the current legal approvers
// Check if we've reached the limit
// Add the new legal approver
// Handle selecting a management team member
// Get the current management approvers
// Check if we've reached the limit
// Add the new management approver
// Handle removing a legal team approver
// Filter out the approver to remove
// Update the approvers
// Handle removing a management team approver
// Filter out the approver to remove
// Update the approvers
// Handle selecting an approver
// Get the current approvers
// Check if we've reached the limit
// Add the new approver
// Handle removing an approver
// Filter out the approver to remove
// Update the approvers
// Handle approving as an approver
// For amendment mode, check if management team has approved
// For regular contracts, check if management team has approved first
// Only allow if the current user is the assigned approver
// Update the specific approver's status
// Create update data with the approvers
// Handle differently for amendment mode
// If we're in amendment or management stage, move to WWF stage
// Add custom timeline entry for amendment approval
// Special case: Changing from declined to approved
// Standard approval
// If we're in WWF stage, move to counterparty stage
// Add custom timeline entry for amendment approval
// Special case: Changing from declined to approved
// Standard approval
// If we're in counterparty stage, just record the approval without changing stage
// Regular contract flow - Automatically progress to WWF signing stage
// Add custom timeline entry
// Special case: Changing from declined to approved
// Standard approval
// Update approvers with custom timeline entry
// Handle sending back as an approver
// For amendment mode, check if management team has approved
// For regular contracts, check if management team has approved first
// Only allow if the current user is the assigned approver
// Update the specific approver's status
// Create update data with custom timeline entry
// Handle differently for amendment mode
// Only reset to management stage if we're in WWF or counterparty stage
// Add custom timeline entry for amendment send back
// If we're not in WWF or counterparty stage, just record the send back without changing stage
// Regular contract flow
// Update approvers with custom timeline entry
// Notify admin of contract being sent back
// Don't block the flow if notification fails
// Handle withdrawing approver approval or rejection
// Only allow if the current user is the assigned approver
// Was it a decline or approval that's being withdrawn?
// Update the specific approver's status
// Create custom timeline entry
// Handle differently for amendment mode
// Add custom timeline entry for amendment withdrawal
// If withdrawing approval, update the amendment stage based on the current stage
// If we're in counterparty stage, move back to WWF stage
// If we're in WWF stage, move back to management stage
// If withdrawing a send back, no need to change the stage
// Regular contract flow
// Update approvers with timeline entry
// Handle legal approval
// Only allow if the current user is an assigned legal approver
// Update the specific approver's status
// Check if management has already approved
// Build the request data for the API
// Add approvers update
// Handle amendment approval differently
// Add custom timeline entry for amendment approval
// If we're in the initial amendment stage, move to management stage
// Regular contract approval flow
// Add custom timeline entry
// Handle case where we're changing from send back to approved
// Change status back to legal_review
// If management is already approved, move to management_review status
// Standard approval flow
// If current status is draft, move to legal_review
// If both legal and management have approved, move to management_review status
// Update approvers with custom timeline entry and possibly status change
// Handle legal send back
// Only allow if the current user is an assigned legal approver
// Update the specific approver's status
// Check if management has already approved (not relevant for decline, but we track it)
// Create update data with custom timeline entry
// Handle amendment send back differently
// Always reset to the initial amendment stage regardless of current stage
// Regular contract send back flow
// Always change contract status to legal_send_back
// This follows the same progression logic as approval
// Update approvers with custom timeline entry and status change
// Notify admin of contract being sent back
// Don't block the flow if notification fails
// Handle withdrawing legal approval or rejection
// Only allow if the current user is an assigned legal approver
// Was it a send back or approval that's being withdrawn?
// Update the specific approver's status
// Check if management has approved
// Create update data
// Handle differently for amendment mode
// Create a custom timeline entry for amendment management approval/rejection withdrawal
// If withdrawing approval, update the amendment stage based on the current stage
// If we're in WWF or counterparty stage, move back to management stage
// If we're in management stage, move back to amendment stage
// If withdrawing a send back, no need to change the stage
// Regular contract flow
// Create a custom timeline entry for legal approval/rejection withdrawal
// Update contract status based on withdrawal (only for non-amendment mode)
// If we're withdrawing a send back, go back to draft
// Reset all approvals when going back to draft from sent back
// Reset legal approvals
// Reset management approvals
// Reset approver approvals
// Handle non-amendment mode status changes
// If we're in WWF Signing status, means both legal and management had approved
// If management is still approved, go back to legal_review status
// If neither is approved, go back to draft
// If we're in legal_review status, go back to draft
// For all cases, update the legal approvers' status
// Update approvers with custom timeline entry
// Function to get an array of legal approvers accounting for type differences
// Function to get an array of management approvers accounting for type differences
// Helper function to check if legal team has fully approved
// Helper function to check if management team has fully approved
// Handle management approval
// Check if legal team has approved first (only for non-amendment mode)
// Only allow if the current user is an assigned management approver
// Update the specific approver's status
// Check if legal has already approved
// Build the request data for the API
// Add approvers update
// Add custom timeline entry
// Handle case where we're changing from sent back to approved
// Change status back to management_review
// If legal is already approved, move to management_review status
// Standard approval flow
// If legal has approved, move to management_review status
// Update approvers with custom timeline entry and possibly status change
// Handle management send back
// Check if legal team has approved first (only for non-amendment mode)
// Only allow if the current user is an assigned management approver
// Update the specific approver's status
// Check if legal has already approved (not relevant for decline, but we track it)
// Create a custom timeline entry for management decline
// Always change contract status to management_send_back
// This follows the same progression logic as approval
// Update approvers with custom timeline entry
// Notify admin of contract being sent back
// Don't block the flow if notification fails
// Handle management withdraw approval or rejection
// Only allow if the current user is an assigned management approver
// Was it a send back or approval that's being withdrawn?
// Update the specific approver's status
// Check if legal has approved
// Create update data
// Add custom timeline entry
// Update contract status based on withdrawal
// If we're withdrawing a send back, go back to draft
// Reset all approvals when going back to draft from sent back
// Reset legal approvals
// Reset management approvals
// Reset approver approvals
// If we're in WWF Signing status, means both legal and management had approved
// If legal is still approved, go back to legal_review status
// If neither is approved, go back to draft
// Update only the management approvers' status
// If we're in management_review status, go back to draft
// Update only the management approvers' status
// For other cases, just update the management approvers
// Update approvers with custom timeline entry
// Normalize contract approvers for checking
// Check if current user is a legal approver
// Check if current user is a management approver
// Check if current user is an approver
// Fix for email property access on single legal approver UI
// Fix for email property access on single management approver UI
// Check if the contract is in amendment mode
// Check if the amendment is in management review stage
// Determine if the user can edit approvers - only admin can assign requestors/approvers
/* Legal Team Approvers (or Management Team Approvers in amendment mode) */
// Multiple legal approvers
// Single legal approver (legacy format)
/* Management Team Approvers - Hide during amendment mode */
// Multiple management approvers
// Single management approver (legacy format)
/* Approver Team */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Search, UserPlus, X, ThumbsDown } from "lucide-react";

import {
    Contract,
    ContractStatus,
    getLegalTeamMembers,
    getManagementTeamMembers,
    getApprovers,
    normalizeApprovers,
    updateContract,
} from "@/lib/data";

import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/use-toast";
import { notifyAdminOfSentBack } from "@/lib/approval-notifications";

interface TeamMember {
    id: string;
    email: string;
    displayName: string;
    createdAt: string;
}

interface Approver {
    email: string;
    name: string;
    approved: boolean;
    declined?: boolean;
    approvedAt?: string | null;
    declinedAt?: string | null;
}

type ApproverArray = Approver[];
type ApproverOrArray = Approver | ApproverArray;

interface TypedApprovers {
    legal?: ApproverArray;
    management?: ApproverArray;
    approver?: ApproverArray;
}

interface ApproversUpdateData {
    approvers?: Contract["approvers"] | {
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

const ApprovalBoard = (
    {
        contract,
        onUpdateApprovers,
        isRequired
    }: ApprovalBoardProps
) => {
    const {
        isAdmin,
        isLegalTeam,
        isManagementTeam,
        isApprover,
        currentUser
    } = useAuth();

    const [legalTeamMembers, setLegalTeamMembers] = useState<TeamMember[]>([]);
    const [managementTeamMembers, setManagementTeamMembers] = useState<TeamMember[]>([]);
    const [approverMembers, setApproverMembers] = useState<TeamMember[]>([]);
    const [legalSearch, setLegalSearch] = useState("");
    const [managementSearch, setManagementSearch] = useState("");
    const [approverSearch, setApproverSearch] = useState("");
    const [filteredLegalMembers, setFilteredLegalMembers] = useState<TeamMember[]>([]);
    const [filteredManagementMembers, setFilteredManagementMembers] = useState<TeamMember[]>([]);
    const [filteredApproverMembers, setFilteredApproverMembers] = useState<TeamMember[]>([]);
    const [showLegalDropdown, setShowLegalDropdown] = useState(false);
    const [showManagementDropdown, setShowManagementDropdown] = useState(false);
    const [showApproverDropdown, setShowApproverDropdown] = useState(false);
    const [loading, setLoading] = useState(true);
    const normalizedContract = normalizeApprovers(contract);

    const approverLimits = normalizedContract.approverLimits || {
        legal: 2,
        management: 5,
        approver: 1
    };

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
            } catch (error) {} finally {
                setLoading(false);
            }
        };

        fetchTeamMembers();
    }, []);

    useEffect(() => {
        if (legalSearch.trim() === "") {
            setFilteredLegalMembers(legalTeamMembers);
        } else {
            const filtered = legalTeamMembers.filter(
                member => member.email.toLowerCase().includes(legalSearch.toLowerCase()) || (member.displayName && member.displayName.toLowerCase().includes(legalSearch.toLowerCase()))
            );

            setFilteredLegalMembers(filtered);
        }
    }, [legalSearch, legalTeamMembers]);

    useEffect(() => {
        if (managementSearch.trim() === "") {
            setFilteredManagementMembers(managementTeamMembers);
        } else {
            const filtered = managementTeamMembers.filter(
                member => member.email.toLowerCase().includes(managementSearch.toLowerCase()) || (member.displayName && member.displayName.toLowerCase().includes(managementSearch.toLowerCase()))
            );

            setFilteredManagementMembers(filtered);
        }
    }, [managementSearch, managementTeamMembers]);

    useEffect(() => {
        if (approverSearch.trim() === "") {
            setFilteredApproverMembers(approverMembers);
        } else {
            const filtered = approverMembers.filter(
                member => member.email.toLowerCase().includes(approverSearch.toLowerCase()) || (member.displayName && member.displayName.toLowerCase().includes(approverSearch.toLowerCase()))
            );

            setFilteredApproverMembers(filtered);
        }
    }, [approverSearch, approverMembers]);

    const handleSelectLegalMember = (member: TeamMember) => {
        const normalizedContract = normalizeApprovers(contract);
        const currentLegalApprovers = Array.isArray(normalizedContract.approvers?.legal) ? normalizedContract.approvers.legal : normalizedContract.approvers?.legal ? [normalizedContract.approvers.legal] : [];

        if (currentLegalApprovers.length >= approverLimits.legal) {
            toast({
                title: "Limit Reached",
                description: `You can only add up to ${approverLimits.legal} legal team approver(s)`,
                variant: "destructive"
            });

            return;
        }

        onUpdateApprovers({
            ...normalizedContract.approvers,

            legal: [...currentLegalApprovers, {
                email: member.email,
                name: member.displayName || member.email,
                approved: false,
                declined: false,
                approvedAt: null,
                declinedAt: null
            } as Approver]
        });

        setShowLegalDropdown(false);
        setLegalSearch("");
    };

    const handleSelectManagementMember = (member: TeamMember) => {
        const normalizedContract = normalizeApprovers(contract);
        const currentManagementApprovers = getManagementApprovers();

        if (currentManagementApprovers.length >= approverLimits.management) {
            toast({
                title: "Limit Reached",
                description: `You can only add up to ${approverLimits.management} management team approver(s)`,
                variant: "destructive"
            });

            return;
        }

        onUpdateApprovers({
            ...normalizedContract.approvers,

            management: [...currentManagementApprovers, {
                email: member.email,
                name: member.displayName || member.email,
                approved: false,
                declined: false,
                approvedAt: null,
                declinedAt: null
            } as Approver]
        });

        setShowManagementDropdown(false);
        setManagementSearch("");
    };

    const handleRemoveLegalApprover = (email: string) => {
        const normalizedContract = normalizeApprovers(contract);
        const currentLegalApprovers = getLegalApprovers();
        const updatedLegalApprovers = currentLegalApprovers.filter(approver => approver.email !== email);

        onUpdateApprovers({
            ...normalizedContract.approvers,
            legal: updatedLegalApprovers.length > 0 ? updatedLegalApprovers : undefined
        });
    };

    const handleRemoveManagementApprover = (email: string) => {
        const normalizedContract = normalizeApprovers(contract);
        const currentManagementApprovers = getManagementApprovers();
        const updatedManagementApprovers = currentManagementApprovers.filter(approver => approver.email !== email);

        onUpdateApprovers({
            ...normalizedContract.approvers,
            management: updatedManagementApprovers.length > 0 ? updatedManagementApprovers : undefined
        });
    };

    const handleSelectApprover = (member: TeamMember) => {
        const normalizedContract = normalizeApprovers(contract);
        const currentApprovers = normalizedContract.approvers?.approver || [];

        if (currentApprovers.length >= approverLimits.approver) {
            toast({
                title: "Limit Reached",
                description: `You can only add 1 Approver Team member, who must approve for contract completion`,
                variant: "destructive"
            });

            return;
        }

        onUpdateApprovers({
            ...normalizedContract.approvers,

            approver: [...currentApprovers, {
                email: member.email,
                name: member.displayName || member.email,
                approved: false,
                declined: false,
                approvedAt: null,
                declinedAt: null
            }]
        });

        setShowApproverDropdown(false);
        setApproverSearch("");
    };

    const handleRemoveApprover = (email: string) => {
        const normalizedContract = normalizeApprovers(contract);
        const currentApprovers = normalizedContract.approvers?.approver || [];
        const updatedApprovers = currentApprovers.filter(approver => approver.email !== email);

        onUpdateApprovers({
            ...normalizedContract.approvers,
            approver: updatedApprovers.length > 0 ? updatedApprovers : undefined
        });
    };

    const handleApproverApprove = async (email: string) => {
        if (!isApprover || !currentUser?.email)
            return;

        if (isInAmendmentMode) {
            if (!isManagementTeamFullyApproved()) {
                toast({
                    title: "Management Approval Required",
                    description: "The management team must approve this amendment before final approval.",
                    variant: "destructive"
                });

                return;
            }
        } else if (!isManagementTeamFullyApproved()) {
            toast({
                title: "Management Approval Required",
                description: "The management team must approve this contract before final approval.",
                variant: "destructive"
            });

            return;
        }

        const normalizedContract = normalizeApprovers(contract);
        const currentApprovers = normalizedContract.approvers?.approver || [];

        const userApprover = currentApprovers.find(
            approver => approver.email.toLowerCase() === currentUser.email.toLowerCase()
        );

        if (!userApprover)
            return;

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

        const updateData: any = {
            approvers: {
                ...normalizedContract.approvers,
                approver: updatedApprovers
            }
        };

        if (isInAmendmentMode) {
            if (contract.amendmentStage === "amendment" || contract.amendmentStage === "management") {
                updateData.amendmentStage = "wwf";

                if (userApprover.declined) {
                    updateData._customTimelineEntry = {
                        action: `Amendment Approver: Changed from Declined to Approved`,
                        details: `${userApprover.name || currentUser.displayName || currentUser.email.split("@")[0]} changed approval from declined to approved - Amendment moved to WWF stage`
                    };
                } else {
                    updateData._customTimelineEntry = {
                        action: `Amendment Approver: ${userApprover.name || currentUser.displayName || currentUser.email.split("@")[0]}`,
                        details: "Approved as amendment approver - Amendment moved to WWF stage"
                    };
                }
            } else if (contract.amendmentStage === "wwf") {
                updateData.amendmentStage = "counterparty";

                if (userApprover.declined) {
                    updateData._customTimelineEntry = {
                        action: `Amendment Final Approver: Changed from Declined to Approved`,
                        details: `${userApprover.name || currentUser.displayName || currentUser.email.split("@")[0]} changed approval from declined to approved - Amendment moved to Counterparty stage`
                    };
                } else {
                    updateData._customTimelineEntry = {
                        action: `Amendment Final Approver: ${userApprover.name || currentUser.displayName || currentUser.email.split("@")[0]}`,
                        details: "Approved as final amendment approver - Amendment moved to Counterparty stage"
                    };
                }
            } else {
                updateData._customTimelineEntry = {
                    action: `Amendment Approver: ${userApprover.name || currentUser.displayName || currentUser.email.split("@")[0]}`,
                    details: "Approved as amendment approver"
                };
            }
        } else {
            updateData.status = "wwf_signing";

            if (userApprover.declined) {
                updateData._customTimelineEntry = {
                    action: `Final Approver: Changed from Declined to Approved`,
                    details: `${userApprover.name || currentUser.displayName || currentUser.email.split("@")[0]} changed approval from declined to approved - Status changed to WWF Signing`
                };
            } else {
                updateData._customTimelineEntry = {
                    action: `Final Approver: ${userApprover.name || currentUser.displayName || currentUser.email.split("@")[0]}`,
                    details: "Approved as final approver - Status changed to WWF Signing"
                };
            }
        }

        await onUpdateApprovers(updateData);
        let toastTitle = "Contract Approved";
        let toastDescription = "You have approved this contract and it has progressed to WWF Signing stage";

        if (isInAmendmentMode) {
            toastTitle = "Amendment Approved";

            if (contract.amendmentStage === "amendment" || contract.amendmentStage === "management") {
                toastDescription = "You have approved this amendment and it has progressed to WWF stage";
            } else if (contract.amendmentStage === "wwf") {
                toastDescription = "You have approved this amendment and it has progressed to Counterparty stage";
            } else {
                toastDescription = "You have approved this amendment";
            }
        }

        toast({
            title: toastTitle,
            description: toastDescription,
            variant: "default"
        });
    };

    const handleApproverSendBack = async (email: string) => {
        if (!isApprover || !currentUser?.email)
            return;

        if (isInAmendmentMode) {
            if (!isManagementTeamFullyApproved()) {
                toast({
                    title: "Management Approval Required",
                    description: "The management team must approve this amendment before you can send it back.",
                    variant: "destructive"
                });

                return;
            }
        } else if (!isManagementTeamFullyApproved()) {
            toast({
                title: "Management Approval Required",
                description: "The management team must approve this contract before you can send it back.",
                variant: "destructive"
            });

            return;
        }

        const normalizedContract = normalizeApprovers(contract);
        const currentApprovers = normalizedContract.approvers?.approver || [];

        const userApprover = currentApprovers.find(
            approver => approver.email.toLowerCase() === currentUser.email.toLowerCase()
        );

        if (!userApprover)
            return;

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

        const updateData: any = {
            approvers: {
                ...normalizedContract.approvers,
                approver: updatedApprovers
            }
        };

        if (isInAmendmentMode) {
            if (contract.amendmentStage === "wwf" || contract.amendmentStage === "counterparty") {
                updateData.amendmentStage = "management";

                updateData._customTimelineEntry = {
                    action: `Amendment Final Approver Sent Back: ${userApprover.name || currentUser.displayName || currentUser.email.split("@")[0]}`,
                    details: "Sent back as final amendment approver - Amendment reset to Management stage"
                };

                toast({
                    title: "Amendment Sent Back",
                    description: "You have sent back this amendment to the Management stage",
                    variant: "destructive"
                });
            } else {
                updateData._customTimelineEntry = {
                    action: `Amendment Approver Sent Back: ${userApprover.name || currentUser.displayName || currentUser.email.split("@")[0]}`,
                    details: "Sent back as amendment approver"
                };

                toast({
                    title: "Amendment Sent Back",
                    description: "You have sent back this amendment",
                    variant: "destructive"
                });
            }
        } else {
            updateData._customTimelineEntry = {
                action: `Final Approver Sent Back: ${userApprover.name || currentUser.displayName || currentUser.email.split("@")[0]}`,
                details: "Sent back as final approver"
            };

            toast({
                title: "Contract Sent Back",
                description: "You have sent back this contract",
                variant: "destructive"
            });
        }

        await onUpdateApprovers(updateData);

        try {
            await notifyAdminOfSentBack(normalizedContract);
        } catch (error) {}
    };

    const handleApproverWithdraw = async (email: string) => {
        if (!isApprover || !currentUser?.email)
            return;

        const normalizedContract = normalizeApprovers(contract);
        const currentApprovers = normalizedContract.approvers?.approver || [];

        const userApprover = currentApprovers.find(
            approver => approver.email.toLowerCase() === currentUser.email.toLowerCase()
        );

        if (!userApprover)
            return;

        const wasDeclined = userApprover.declined;
        const wasApproved = userApprover.approved;

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

        const updateData: any = {
            approvers: {
                ...normalizedContract.approvers,
                approver: updatedApprovers
            }
        };

        if (isInAmendmentMode) {
            updateData._customTimelineEntry = {
                action: wasDeclined ? `Amendment Final Approver Rejection Withdrawn: ${userApprover.name || currentUser.displayName || currentUser.email.split("@")[0]}` : `Amendment Final Approver Approval Withdrawn: ${userApprover.name || currentUser.displayName || currentUser.email.split("@")[0]}`,
                details: wasDeclined ? "Withdrawn final amendment approver rejection" : "Withdrawn final amendment approver approval"
            };

            if (wasApproved) {
                if (contract.amendmentStage === "counterparty") {
                    updateData.amendmentStage = "wwf";
                    updateData._customTimelineEntry.details += " - Amendment moved back to WWF stage";
                } else if (contract.amendmentStage === "wwf") {
                    updateData.amendmentStage = "management";
                    updateData._customTimelineEntry.details += " - Amendment moved back to Management stage";
                }
            } else if (wasDeclined) {
                updateData._customTimelineEntry.details += " - Amendment stage unchanged";
            }

            toast({
                title: wasDeclined ? "Amendment Rejection Withdrawn" : "Amendment Approval Withdrawn",
                description: wasDeclined ? "You have withdrawn your rejection of the amendment" : "You have withdrawn your approval of the amendment",
                variant: "default"
            });
        } else {
            updateData._customTimelineEntry = {
                action: wasDeclined ? `Final Approver Rejection Withdrawn: ${userApprover.name || currentUser.displayName || currentUser.email.split("@")[0]}` : `Final Approver Approval Withdrawn: ${userApprover.name || currentUser.displayName || currentUser.email.split("@")[0]}`,
                details: wasDeclined ? "Withdrawn final approver rejection" : "Withdrawn final approver approval"
            };

            toast({
                title: wasDeclined ? "Rejection Withdrawn" : "Approval Withdrawn",
                description: wasDeclined ? "You have withdrawn your rejection" : "You have withdrawn your approval",
                variant: "default"
            });
        }

        await onUpdateApprovers(updateData);
    };

    const handleLegalApprove = async () => {
        if (!isLegalTeam || !currentUser?.email)
            return;

        const normalizedContract = normalizeApprovers(contract);
        const currentLegalApprovers = getLegalApprovers();

        const userApprover = currentLegalApprovers.find(
            approver => approver.email.toLowerCase() === currentUser.email.toLowerCase()
        );

        if (!userApprover)
            return;

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

        const managementApprovers = getManagementApprovers();
        const isManagementApproved = managementApprovers.length > 0 && managementApprovers.every(approver => approver.approved);
        const updateData: any = {};

        updateData.approvers = {
            ...normalizedContract.approvers,
            legal: updatedLegalApprovers
        };

        if (isInAmendmentMode) {
            updateData._customTimelineEntry = {
                action: `Amendment Management Approval: ${userApprover.name || currentUser.displayName || currentUser.email.split("@")[0]}`,
                details: "Approved amendment as management team member"
            };

            if (contract.amendmentStage === "amendment") {
                updateData.amendmentStage = "management";
                updateData._customTimelineEntry.details += " - Amendment moved to Management stage";
            } else if (contract.amendmentStage === "management") {
                updateData.amendmentStage = "wwf";
                updateData._customTimelineEntry.details += " - Amendment moved to WWF stage";
            }
        } else {
            updateData._customTimelineEntry = {
                action: `Legal Approval: ${userApprover.name || currentUser.displayName || currentUser.email.split("@")[0]}`,
                details: "Approved as legal team member"
            };

            if (contract.status === "legal_send_back" || contract.status === "legal_declined" || userApprover.declined) {
                updateData._customTimelineEntry.action = `Legal Approval: Changed from Send Back to Approved`;
                updateData._customTimelineEntry.details = "Changed status from send back to approved";
                updateData.status = "legal_review";
                updateData._customTimelineEntry.details += " - Status changed to Legal Review";

                if (isManagementApproved) {
                    updateData.status = "management_review";
                    updateData._customTimelineEntry.details += " - Status changed to Management Review (both Legal and Management have approved)";
                }
            } else {
                if (contract.status === "draft") {
                    updateData.status = "legal_review";
                    updateData._customTimelineEntry.details += " - Status changed to Legal Review";
                }

                if (isManagementApproved && (contract.status === "management_review" || contract.status === "management_declined")) {
                    updateData.status = "management_review";
                    updateData._customTimelineEntry.details += " - Status changed to Management Review (both Legal and Management have approved)";
                }
            }
        }

        try {
            await onUpdateApprovers(updateData);
        } catch (error) {}

        if (isInAmendmentMode) {
            toast({
                title: "Amendment Approved",
                description: "You have approved this amendment as a management team member",
                variant: "default"
            });
        } else {
            toast({
                title: "Contract Approved",
                description: "You have approved this contract as a legal team member",
                variant: "default"
            });
        }
    };

    const handleLegalSendBack = async () => {
        if (!isLegalTeam || !currentUser?.email)
            return;

        const normalizedContract = normalizeApprovers(contract);
        const currentLegalApprovers = getLegalApprovers();

        const userApprover = currentLegalApprovers.find(
            approver => approver.email.toLowerCase() === currentUser.email.toLowerCase()
        );

        if (!userApprover)
            return;

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

        const managementApprovers = getManagementApprovers();
        const isManagementApproved = managementApprovers.length > 0 && managementApprovers.every(approver => approver.approved);

        const updateData: any = {
            approvers: {
                ...normalizedContract.approvers,
                legal: updatedLegalApprovers
            }
        };

        if (isInAmendmentMode) {
            updateData._customTimelineEntry = {
                action: `Amendment Management Send Back: ${userApprover.name || currentUser.displayName || currentUser.email.split("@")[0]}`,
                details: "Sent back amendment as management team member"
            };

            updateData.amendmentStage = "amendment";
            updateData._customTimelineEntry.details += " - Amendment reset to initial stage";
        } else {
            updateData._customTimelineEntry = {
                action: `Legal Approval Sent Back: ${userApprover.name || currentUser.displayName || currentUser.email.split("@")[0]}`,
                details: "Sent back as legal team member"
            };

            updateData.status = "legal_send_back";
            updateData._customTimelineEntry.details += " - Status changed to Legal Send Back";
        }

        await onUpdateApprovers(updateData);

        try {
            await notifyAdminOfSentBack(normalizedContract);
        } catch (error) {}

        if (isInAmendmentMode) {
            toast({
                title: "Amendment Sent Back",
                description: "You have sent back this amendment as a management team member",
                variant: "destructive"
            });
        } else {
            toast({
                title: "Contract Sent Back",
                description: "You have sent back this contract as a legal team member",
                variant: "destructive"
            });
        }
    };

    const handleLegalWithdraw = async () => {
        if (!isLegalTeam || !currentUser?.email)
            return;

        const normalizedContract = normalizeApprovers(contract);
        const currentLegalApprovers = getLegalApprovers();

        const userApprover = currentLegalApprovers.find(
            approver => approver.email.toLowerCase() === currentUser.email.toLowerCase()
        );

        if (!userApprover)
            return;

        const wasDeclined = userApprover.declined;
        const wasApproved = userApprover.approved;

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

        const managementApprovers = getManagementApprovers();
        const isManagementApproved = managementApprovers.length > 0 && managementApprovers.every(approver => approver.approved);
        const updateData: any = {};

        if (isInAmendmentMode) {
            updateData._customTimelineEntry = {
                action: wasDeclined ? `Amendment Management Send Back Withdrawn: ${userApprover.name || currentUser.displayName || currentUser.email.split("@")[0]}` : `Amendment Management Approval Withdrawn: ${userApprover.name || currentUser.displayName || currentUser.email.split("@")[0]}`,
                details: wasDeclined ? "Withdrawn management team send back for amendment" : "Withdrawn management team approval for amendment"
            };

            if (wasApproved) {
                if (contract.amendmentStage === "wwf" || contract.amendmentStage === "counterparty") {
                    updateData.amendmentStage = "management";
                    updateData._customTimelineEntry.details += " - Amendment moved back to Management stage";
                } else if (contract.amendmentStage === "management") {
                    updateData.amendmentStage = "amendment";
                    updateData._customTimelineEntry.details += " - Amendment moved back to initial stage";
                }
            } else if (wasDeclined) {
                updateData._customTimelineEntry.details += " - Amendment stage unchanged";
            }
        } else {
            updateData._customTimelineEntry = {
                action: wasDeclined ? `Legal Send Back Withdrawn: ${userApprover.name || currentUser.displayName || currentUser.email.split("@")[0]}` : `Legal Approval Withdrawn: ${userApprover.name || currentUser.displayName || currentUser.email.split("@")[0]}`,
                details: wasDeclined ? "Withdrawn legal team send back" : "Withdrawn as legal team member"
            };
        }

        if (!isInAmendmentMode && wasDeclined && (contract.status === "legal_send_back" || contract.status === "legal_declined")) {
            updateData.status = "draft";
            updateData._customTimelineEntry.details += " - Status changed to Draft";
            const allApprovers = JSON.parse(JSON.stringify(normalizedContract.approvers || {}));

            if (allApprovers.legal && allApprovers.legal.length > 0) {
                allApprovers.legal = allApprovers.legal.map((approver: any) => ({
                    ...approver,
                    approved: false,
                    declined: false,
                    approvedAt: null,
                    declinedAt: null
                }));
            }

            if (allApprovers.management && allApprovers.management.length > 0) {
                allApprovers.management = allApprovers.management.map((approver: any) => ({
                    ...approver,
                    approved: false,
                    declined: false,
                    approvedAt: null,
                    declinedAt: null
                }));
            }

            if (allApprovers.approver && allApprovers.approver.length > 0) {
                allApprovers.approver = allApprovers.approver.map((approver: any) => ({
                    ...approver,
                    approved: false,
                    declined: false,
                    approvedAt: null,
                    declinedAt: null
                }));
            }

            updateData.approvers = allApprovers;
            updateData._customTimelineEntry.details += " - All approvals reset";
        } else if (!isInAmendmentMode) {
            if (wasApproved && contract.status === "wwf_signing") {
                if (isManagementApproved) {
                    updateData.status = "legal_review";
                    updateData._customTimelineEntry.details += " - Status changed to Legal Review";
                } else {
                    updateData.status = "draft";
                    updateData._customTimelineEntry.details += " - Status changed to Draft";
                }
            } else if (wasApproved && contract.status === "legal_review") {
                updateData.status = "draft";
                updateData._customTimelineEntry.details += " - Status changed to Draft";
            }
        }

        updateData.approvers = {
            ...normalizedContract.approvers,
            legal: updatedLegalApprovers
        };

        await onUpdateApprovers(updateData);

        if (isInAmendmentMode) {
            toast({
                title: wasDeclined ? "Amendment Rejection Withdrawn" : "Amendment Approval Withdrawn",
                description: wasDeclined ? "You have withdrawn your rejection of the amendment as a management team member" : "You have withdrawn your approval of the amendment as a management team member",
                variant: "default"
            });
        } else {
            toast({
                title: wasDeclined ? "Rejection Withdrawn" : "Approval Withdrawn",
                description: wasDeclined ? "You have withdrawn your rejection as a legal team member" : "You have withdrawn your approval as a legal team member",
                variant: "default"
            });
        }
    };

    const getLegalApprovers = (): Approver[] => {
        return Array.isArray(normalizedContract.approvers?.legal) ? normalizedContract.approvers.legal as Approver[] : normalizedContract.approvers?.legal ? [normalizedContract.approvers.legal as Approver] : [];
    };

    const getManagementApprovers = (): Approver[] => {
        return Array.isArray(normalizedContract.approvers?.management) ? normalizedContract.approvers.management as Approver[] : normalizedContract.approvers?.management ? [normalizedContract.approvers.management as Approver] : [];
    };

    const isLegalTeamFullyApproved = () => {
        const legalApprovers = getLegalApprovers();
        return legalApprovers.length > 0 && legalApprovers.every(approver => approver.approved);
    };

    const isManagementTeamFullyApproved = () => {
        const managementApprovers = getManagementApprovers();
        return managementApprovers.length > 0 && managementApprovers.every(approver => approver.approved);
    };

    const handleManagementApprove = async () => {
        if (!isManagementTeam || !currentUser?.email)
            return;

        if (!isInAmendmentMode && !isLegalTeamFullyApproved()) {
            toast({
                title: "Legal Approval Required",
                description: "The legal team must approve this contract before management can approve.",
                variant: "destructive"
            });

            return;
        }

        const normalizedContract = normalizeApprovers(contract);
        const currentManagementApprovers = getManagementApprovers();

        const userApprover = currentManagementApprovers.find(
            approver => approver.email.toLowerCase() === currentUser.email.toLowerCase()
        );

        if (!userApprover)
            return;

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

        const legalApprovers = getLegalApprovers();
        const isLegalApproved = legalApprovers.length > 0 && legalApprovers.every(approver => approver.approved);
        const updateData: any = {};

        updateData.approvers = {
            ...normalizedContract.approvers,
            management: updatedManagementApprovers
        };

        updateData._customTimelineEntry = {
            action: `Management Approval: ${userApprover.name || currentUser.displayName || currentUser.email.split("@")[0]}`,
            details: "Approved as management team member"
        };

        if (contract.status === "management_declined" || userApprover.declined) {
            updateData._customTimelineEntry.action = `Management Approval: Changed from Sent Back to Approved`;
            updateData._customTimelineEntry.details = "Changed status from sent back to approved";
            updateData.status = "management_review";
            updateData._customTimelineEntry.details += " - Status changed to Management Review";

            if (isLegalApproved) {
                updateData.status = "management_review";
                updateData._customTimelineEntry.details += " - Status changed to Management Review (Legal has approved)";
            }
        } else {
            if (isLegalApproved && (contract.status === "legal_review" || contract.status === "legal_declined")) {
                updateData.status = "management_review";
                updateData._customTimelineEntry.details += " - Status changed to Management Review (Legal has approved)";
            }
        }

        try {
            await onUpdateApprovers(updateData);

            toast({
                title: "Contract Approved",
                description: "You have approved this contract as a management team member",
                variant: "default"
            });
        } catch (error) {}
    };

    const handleManagementSendBack = async () => {
        if (!isManagementTeam || !currentUser?.email)
            return;

        if (!isInAmendmentMode && !isLegalTeamFullyApproved()) {
            toast({
                title: "Legal Approval Required",
                description: "The legal team must approve this contract before management can send it back.",
                variant: "destructive"
            });

            return;
        }

        const normalizedContract = normalizeApprovers(contract);
        const currentManagementApprovers = getManagementApprovers();

        const userApprover = currentManagementApprovers.find(
            approver => approver.email.toLowerCase() === currentUser.email.toLowerCase()
        );

        if (!userApprover)
            return;

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

        const legalApprovers = getLegalApprovers();
        const isLegalApproved = legalApprovers.length > 0 && legalApprovers.every(approver => approver.approved);

        const updateData: any = {
            approvers: {
                ...normalizedContract.approvers,
                management: updatedManagementApprovers
            },

            _customTimelineEntry: {
                action: `Management Approval Sent Back: ${userApprover.name || currentUser.displayName || currentUser.email.split("@")[0]}`,
                details: "Sent back as management team member"
            }
        };

        updateData.status = "management_send_back";
        updateData._customTimelineEntry.details += " - Status changed to Management Send Back";
        await onUpdateApprovers(updateData);

        try {
            await notifyAdminOfSentBack(normalizedContract);
        } catch (error) {}

        toast({
            title: "Contract Sent Back",
            description: "You have sent back this contract as a management team member",
            variant: "destructive"
        });
    };

    const handleManagementWithdraw = async () => {
        if (!isManagementTeam || !currentUser?.email)
            return;

        const normalizedContract = normalizeApprovers(contract);
        const currentManagementApprovers = getManagementApprovers();

        const userApprover = currentManagementApprovers.find(
            approver => approver.email.toLowerCase() === currentUser.email.toLowerCase()
        );

        if (!userApprover)
            return;

        const wasDeclined = userApprover.declined;
        const wasApproved = userApprover.approved;

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

        const legalApprovers = getLegalApprovers();
        const isLegalApproved = legalApprovers.length > 0 && legalApprovers.every(approver => approver.approved);
        const updateData: any = {};

        updateData._customTimelineEntry = {
            action: wasDeclined ? `Management Send Back Withdrawn: ${userApprover.name || currentUser.displayName || currentUser.email.split("@")[0]}` : `Management Approval Withdrawn: ${userApprover.name || currentUser.displayName || currentUser.email.split("@")[0]}`,
            details: wasDeclined ? "Withdrawn management team send back" : "Withdrawn as management team member"
        };

        if (wasDeclined && (contract.status === "management_send_back" || contract.status === "management_declined")) {
            updateData.status = "draft";
            updateData._customTimelineEntry.details += " - Status changed to Draft";
            const allApprovers = JSON.parse(JSON.stringify(normalizedContract.approvers || {}));

            if (allApprovers.legal && allApprovers.legal.length > 0) {
                allApprovers.legal = allApprovers.legal.map((approver: any) => ({
                    ...approver,
                    approved: false,
                    declined: false,
                    approvedAt: null,
                    declinedAt: null
                }));
            }

            if (allApprovers.management && allApprovers.management.length > 0) {
                allApprovers.management = allApprovers.management.map((approver: any) => ({
                    ...approver,
                    approved: false,
                    declined: false,
                    approvedAt: null,
                    declinedAt: null
                }));
            }

            if (allApprovers.approver && allApprovers.approver.length > 0) {
                allApprovers.approver = allApprovers.approver.map((approver: any) => ({
                    ...approver,
                    approved: false,
                    declined: false,
                    approvedAt: null,
                    declinedAt: null
                }));
            }

            updateData.approvers = allApprovers;
            updateData._customTimelineEntry.details += " - All approvals reset";
        } else if (wasApproved && contract.status === "wwf_signing") {
            if (isLegalApproved) {
                updateData.status = "legal_review";
                updateData._customTimelineEntry.details += " - Status changed to Legal Review";
            } else {
                updateData.status = "draft";
                updateData._customTimelineEntry.details += " - Status changed to Draft";
            }

            updateData.approvers = {
                ...normalizedContract.approvers,
                management: updatedManagementApprovers
            };
        } else if (wasApproved && contract.status === "management_review") {
            updateData.status = "draft";
            updateData._customTimelineEntry.details += " - Status changed to Draft";

            updateData.approvers = {
                ...normalizedContract.approvers,
                management: updatedManagementApprovers
            };
        } else {
            updateData.approvers = {
                ...normalizedContract.approvers,
                management: updatedManagementApprovers
            };
        }

        await onUpdateApprovers(updateData);

        toast({
            title: wasDeclined ? "Rejection Withdrawn" : "Approval Withdrawn",
            description: wasDeclined ? "You have withdrawn your rejection as a management team member" : "You have withdrawn your approval as a management team member",
            variant: "default"
        });
    };

    const normalizedContractForChecks = normalizeApprovers(contract);

    const isCurrentUserLegalApprover = currentUser?.email && getLegalApprovers().some(
        approver => approver.email.toLowerCase() === currentUser.email.toLowerCase()
    );

    const isCurrentUserManagementApprover = currentUser?.email && getManagementApprovers().some(
        approver => approver.email.toLowerCase() === currentUser.email.toLowerCase()
    );

    const isCurrentUserApprover = currentUser?.email && normalizedContractForChecks.approvers?.approver && normalizedContractForChecks.approvers.approver.some(
        approver => approver.email.toLowerCase() === currentUser.email.toLowerCase()
    );

    const getSingleLegalApproverEmail = () => {
        if (!normalizedContract.approvers?.legal)
            return "";

        return Array.isArray(normalizedContract.approvers.legal) ? (normalizedContract.approvers.legal[0]?.email || "") : normalizedContract.approvers.legal.email;
    };

    const getSingleManagementApproverEmail = () => {
        if (!normalizedContract.approvers?.management)
            return "";

        return Array.isArray(normalizedContract.approvers.management) ? (normalizedContract.approvers.management[0]?.email || "") : normalizedContract.approvers.management.email;
    };

    const isInAmendmentMode = contract.isAmended && contract.status === "amendment";
    const isAmendmentInManagementStage = isInAmendmentMode && contract.amendmentStage === "management";
    const canEditApprovers = isAdmin;

    return (
        <div className="mb-8">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span>{isInAmendmentMode ? "Amendment Approval Board" : "Approval Board"}</span>
                        {isRequired && (<Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-800 border-yellow-200">Required
                                          </Badge>)}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (<p>Loading team members...</p>) : (<div className="space-y-6">
                        {}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label className="text-sm font-medium">
                                    {isInAmendmentMode ? "Management Team Approvers" : "Legal Team Approvers"}({getLegalApprovers().length}/{approverLimits.legal})
                                                      </Label>
                                {canEditApprovers && ((!normalizedContract.approvers?.legal || getLegalApprovers().length < approverLimits.legal) ? (<div className="relative">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowLegalDropdown(!showLegalDropdown)}
                                        className="gap-1"
                                        disabled={legalTeamMembers.length === 0}>
                                        <UserPlus className="h-3.5 w-3.5" />
                                        <span>Assign</span>
                                    </Button>
                                    {showLegalDropdown && (<div
                                        className="absolute right-0 mt-1 w-64 bg-card border rounded-md shadow-lg z-50">
                                        <div className="p-2">
                                            <div className="relative">
                                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder={isInAmendmentMode ? "Search management team..." : "Search legal team..."}
                                                    className="pl-8"
                                                    value={legalSearch}
                                                    onChange={e => setLegalSearch(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto">
                                            {filteredLegalMembers.length > 0 ? (filteredLegalMembers.map(member => (<div
                                                key={member.id}
                                                className="px-3 py-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                                                onClick={() => handleSelectLegalMember(member)}>
                                                <div>
                                                    <div className="font-medium text-sm">
                                                        {member.displayName || "No name"}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {member.email}
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                                    <Check className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>))) : (<div className="px-3 py-2 text-sm text-muted-foreground">
                                                {isInAmendmentMode ? "No management team members found" : "No legal team members found"}
                                            </div>)}
                                        </div>
                                    </div>)}
                                </div>) : null)}
                            </div>
                            {normalizedContract.approvers?.legal ? (Array.isArray(normalizedContract.approvers.legal) ? (<div className="space-y-2">
                                {getLegalApprovers().map(approver => (<div
                                    key={approver.email}
                                    className="flex items-center justify-between p-3 border rounded-md bg-card/50">
                                    <div>
                                        <div className="font-medium">{approver.name}</div>
                                        <div className="text-sm text-muted-foreground">{approver.email}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {approver.approved ? (<div className="flex items-center gap-2">
                                            <Badge className="bg-green-50 text-green-800 border-green-200">Approved
                                                                                </Badge>
                                            {currentUser?.email?.toLowerCase() === approver.email.toLowerCase() && (<Button
                                                size="sm"
                                                onClick={handleLegalWithdraw}
                                                variant="outline"
                                                className="text-amber-600 border-amber-200 hover:bg-amber-50">Undo
                                                                                  </Button>)}
                                        </div>) : approver.declined ? (<div className="flex items-center gap-2">
                                            <Badge className="bg-red-50 text-red-800 border-red-200">Sent Back
                                                                                </Badge>
                                            {currentUser?.email?.toLowerCase() === approver.email.toLowerCase() && (<Button
                                                size="sm"
                                                onClick={handleLegalWithdraw}
                                                variant="outline"
                                                className="text-amber-600 border-amber-200 hover:bg-amber-50">Undo
                                                                                  </Button>)}
                                        </div>) : currentUser?.email?.toLowerCase() === approver.email.toLowerCase() ? (<div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={handleLegalApprove}
                                                className="bg-blue-500 hover:bg-blue-600">
                                                <Check className="h-3.5 w-3.5 mr-1" />Approve
                                                                                </Button>
                                            <Button size="sm" onClick={handleLegalSendBack} variant="destructive">
                                                <ThumbsDown className="h-3.5 w-3.5 mr-1" />Send Back
                                                                                </Button>
                                        </div>) : (<div className="flex gap-2 items-center">
                                            <Badge
                                                variant="outline"
                                                className="bg-yellow-50 text-yellow-800 border-yellow-200">Pending
                                                                                </Badge>
                                            {canEditApprovers && (<Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRemoveLegalApprover(getSingleLegalApproverEmail())}
                                                className="h-8 w-8 p-0 text-destructive ml-2">
                                                <X className="h-4 w-4" />
                                            </Button>)}
                                        </div>)}
                                    </div>
                                </div>))}
                            </div>) : (<div
                                className="flex items-center justify-between p-3 border rounded-md bg-card/50">
                                <div>
                                    <div className="font-medium">{normalizedContract.approvers.legal.name}</div>
                                    <div className="text-sm text-muted-foreground">{getSingleLegalApproverEmail()}</div>
                                </div>
                                <div>
                                    {isCurrentUserLegalApprover && getLegalApprovers().some(a => a.approved) ? (<div className="flex items-center gap-2">
                                        <Badge className="bg-green-50 text-green-800 border-green-200">Approved
                                                                        </Badge>{isCurrentUserLegalApprover && (<Button
                                            size="sm"
                                            onClick={handleLegalWithdraw}
                                            variant="outline"
                                            className="text-amber-600 border-amber-200 hover:bg-amber-50">Undo
                                                                          </Button>)}
                                    </div>) : (<div className="flex items-center gap-2">
                                        <Badge className="bg-red-50 text-red-800 border-red-200">Sent Back
                                                                        </Badge>
                                        {isCurrentUserLegalApprover && (<Button
                                            size="sm"
                                            onClick={handleLegalWithdraw}
                                            variant="outline"
                                            className="text-amber-600 border-amber-200 hover:bg-amber-50">Undo
                                                                          </Button>)}
                                    </div>)}
                                    {canEditApprovers && (<Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRemoveLegalApprover(getSingleLegalApproverEmail())}
                                        className="h-8 w-8 p-0 text-destructive ml-2">
                                        <X className="h-4 w-4" />
                                    </Button>)}
                                </div>
                            </div>)) : (<div className="text-sm text-muted-foreground italic">
                                {isRequired ? isInAmendmentMode ? "Required - Please assign a management team approver" : "Required - Please assign a legal team approver" : isInAmendmentMode ? "No management approver assigned" : "No legal approver assigned"}
                            </div>)}
                        </div>
                        {}
                        {!isInAmendmentMode && <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <div>
                                    <Label className="text-sm font-medium">Management Team Approvers ({getManagementApprovers().length}/{approverLimits.management})</Label>
                                    {!isLegalTeamFullyApproved() && getManagementApprovers().length > 0 && (<div className="text-xs text-amber-600 mt-1">Waiting for legal team approval before management can approve
                                                              </div>)}
                                </div>
                                {canEditApprovers && ((!normalizedContract.approvers?.management || getManagementApprovers().length < approverLimits.management) ? (<div className="relative">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowManagementDropdown(!showManagementDropdown)}
                                        className="gap-1"
                                        disabled={managementTeamMembers.length === 0}>
                                        <UserPlus className="h-3.5 w-3.5" />
                                        <span>Assign</span>
                                    </Button>
                                    {showManagementDropdown && (<div
                                        className="absolute right-0 mt-1 w-64 bg-card border rounded-md shadow-lg z-50">
                                        <div className="p-2">
                                            <div className="relative">
                                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search management team..."
                                                    className="pl-8"
                                                    value={managementSearch}
                                                    onChange={e => setManagementSearch(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto">
                                            {filteredManagementMembers.length > 0 ? (filteredManagementMembers.map(member => (<div
                                                key={member.id}
                                                className="px-3 py-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                                                onClick={() => handleSelectManagementMember(member)}>
                                                <div>
                                                    <div className="font-medium text-sm">
                                                        {member.displayName || "No name"}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {member.email}
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                                    <Check className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>))) : (<div className="px-3 py-2 text-sm text-muted-foreground">No management team members found
                                                                                </div>)}
                                        </div>
                                    </div>)}
                                </div>) : null)}
                            </div>
                            {normalizedContract.approvers?.management ? (Array.isArray(normalizedContract.approvers.management) ? (<div className="space-y-2">
                                {getManagementApprovers().map(approver => (<div
                                    key={approver.email}
                                    className="flex items-center justify-between p-3 border rounded-md bg-card/50">
                                    <div>
                                        <div className="font-medium">{approver.name}</div>
                                        <div className="text-sm text-muted-foreground">{approver.email}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {approver.approved ? (<div className="flex items-center gap-2">
                                            <Badge className="bg-green-50 text-green-800 border-green-200">Approved
                                                                                </Badge>
                                            {currentUser?.email?.toLowerCase() === approver.email.toLowerCase() && (<Button
                                                size="sm"
                                                onClick={handleManagementWithdraw}
                                                variant="outline"
                                                className="text-amber-600 border-amber-200 hover:bg-amber-50">Undo
                                                                                  </Button>)}
                                        </div>) : approver.declined ? (<div className="flex items-center gap-2">
                                            <Badge className="bg-red-50 text-red-800 border-red-200">Sent Back
                                                                                </Badge>
                                            {currentUser?.email?.toLowerCase() === approver.email.toLowerCase() && (<Button
                                                size="sm"
                                                onClick={handleManagementWithdraw}
                                                variant="outline"
                                                className="text-amber-600 border-amber-200 hover:bg-amber-50">Undo
                                                                                  </Button>)}
                                        </div>) : currentUser?.email?.toLowerCase() === approver.email.toLowerCase() ? (<div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={handleManagementApprove}
                                                className="bg-blue-500 hover:bg-blue-600"
                                                disabled={!isLegalTeamFullyApproved()}
                                                title={!isLegalTeamFullyApproved() ? "Legal team must approve first" : ""}>
                                                <Check className="h-3.5 w-3.5 mr-1" />Approve
                                                                                </Button>
                                            <Button
                                                size="sm"
                                                onClick={handleManagementSendBack}
                                                variant="destructive"
                                                disabled={!isLegalTeamFullyApproved()}
                                                title={!isLegalTeamFullyApproved() ? "Legal team must approve first" : ""}>
                                                <ThumbsDown className="h-3.5 w-3.5 mr-1" />Send Back
                                                                                </Button>
                                        </div>) : (<div className="flex gap-2 items-center">
                                            <Badge
                                                variant="outline"
                                                className="bg-yellow-50 text-yellow-800 border-yellow-200">Pending
                                                                                </Badge>
                                            {canEditApprovers && (<Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRemoveManagementApprover(getSingleManagementApproverEmail())}
                                                className="h-8 w-8 p-0 text-destructive ml-2">
                                                <X className="h-4 w-4" />
                                            </Button>)}
                                        </div>)}
                                    </div>
                                </div>))}
                            </div>) : (<div
                                className="flex items-center justify-between p-3 border rounded-md bg-card/50">
                                <div>
                                    <div className="font-medium">{normalizedContract.approvers.management.name}</div>
                                    <div className="text-sm text-muted-foreground">{getSingleManagementApproverEmail()}</div>
                                </div>
                                <div>
                                    {isCurrentUserManagementApprover && getManagementApprovers().some(a => a.approved) ? (<div className="flex items-center gap-2">
                                        <Badge className="bg-green-50 text-green-800 border-green-200">Approved
                                                                        </Badge>
                                        {isCurrentUserManagementApprover && (<Button
                                            size="sm"
                                            onClick={handleManagementWithdraw}
                                            variant="outline"
                                            className="text-amber-600 border-amber-200 hover:bg-amber-50">Undo
                                                                          </Button>)}
                                    </div>) : (<div className="flex items-center gap-2">
                                        {isCurrentUserManagementApprover && !getManagementApprovers().some(a => a.declined) ? (<>
                                            <Button
                                                size="sm"
                                                onClick={handleManagementApprove}
                                                className="bg-blue-500 hover:bg-blue-600"
                                                disabled={!isLegalTeamFullyApproved()}
                                                title={!isLegalTeamFullyApproved() ? "Legal team must approve first" : ""}>
                                                <Check className="h-3.5 w-3.5 mr-1" />Approve
                                                                                </Button>
                                            <Button
                                                size="sm"
                                                onClick={handleManagementSendBack}
                                                variant="destructive"
                                                disabled={!isLegalTeamFullyApproved()}
                                                title={!isLegalTeamFullyApproved() ? "Legal team must approve first" : ""}>
                                                <ThumbsDown className="h-3.5 w-3.5 mr-1" />Send Back
                                                                                </Button>
                                        </>) : (<>
                                            <Badge className="bg-red-50 text-red-800 border-red-200">Sent Back
                                                                                </Badge>
                                            {isCurrentUserManagementApprover && (<Button
                                                size="sm"
                                                onClick={handleManagementWithdraw}
                                                variant="outline"
                                                className="text-amber-600 border-amber-200 hover:bg-amber-50">Undo
                                                                                  </Button>)}
                                        </>)}
                                    </div>)}
                                    {canEditApprovers && (<Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleRemoveManagementApprover(getSingleManagementApproverEmail())}
                                        className="h-8 w-8 p-0 text-destructive ml-2">
                                        <X className="h-4 w-4" />
                                    </Button>)}
                                </div>
                            </div>)) : (<div className="text-sm text-muted-foreground italic">
                                {isRequired ? "Required - Please assign a management team approver" : "No management approver assigned"}
                            </div>)}
                        </div>}
                        {}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <div>
                                    <Label className="text-sm font-medium">
                                        {isInAmendmentMode ? "Amendment Approver" : "Approver Team"}({normalizedContract.approvers?.approver?.length || 0}/{approverLimits.approver})
                                                            </Label>
                                    {!isInAmendmentMode && !isManagementTeamFullyApproved() && normalizedContract.approvers?.approver?.length > 0 && (<div className="text-xs text-amber-600 mt-1">Waiting for management team approval before final approval
                                                              </div>)}
                                    {isInAmendmentMode && !isManagementTeamFullyApproved() && normalizedContract.approvers?.approver?.length > 0 && (<div className="text-xs text-amber-600 mt-1">Waiting for management team approval before final amendment approval
                                                              </div>)}
                                </div>
                                {canEditApprovers && ((!normalizedContract.approvers?.approver || normalizedContract.approvers?.approver?.length < approverLimits.approver) ? (<div className="relative">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowApproverDropdown(!showApproverDropdown)}
                                        className="gap-1"
                                        disabled={approverMembers.length === 0}>
                                        <UserPlus className="h-3.5 w-3.5" />
                                        <span>Assign</span>
                                    </Button>
                                    {showApproverDropdown && (<div
                                        className="absolute right-0 mt-1 w-64 bg-card border rounded-md shadow-lg z-50">
                                        <div className="p-2">
                                            <div className="relative">
                                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search approvers..."
                                                    className="pl-8"
                                                    value={approverSearch}
                                                    onChange={e => setApproverSearch(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto">
                                            {filteredApproverMembers.length > 0 ? (filteredApproverMembers.map(member => (<div
                                                key={member.id}
                                                className="px-3 py-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                                                onClick={() => handleSelectApprover(member)}>
                                                <div>
                                                    <div className="font-medium text-sm">
                                                        {member.displayName || "No name"}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {member.email}
                                                    </div>
                                                </div>
                                                <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                                    <Check className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>))) : (<div className="px-3 py-2 text-sm text-muted-foreground">No approvers found
                                                                                </div>)}
                                        </div>
                                    </div>)}
                                </div>) : null)}
                            </div>
                            {normalizedContract.approvers?.approver?.length > 0 ? (normalizedContract.approvers.approver.map(approver => (<div
                                key={approver.email}
                                className="flex items-center justify-between p-3 border rounded-md bg-card/50">
                                <div>
                                    <div className="font-medium">{approver.name}</div>
                                    <div className="text-sm text-muted-foreground">{approver.email}</div>
                                </div>
                                <div>
                                    {approver.approved ? (<div className="flex items-center gap-2">
                                        <Badge className="bg-green-50 text-green-800 border-green-200">Approved
                                                                        </Badge>
                                        {currentUser?.email?.toLowerCase() === approver.email.toLowerCase() && (<Button
                                            size="sm"
                                            onClick={() => handleApproverWithdraw(approver.email)}
                                            variant="outline"
                                            className="text-amber-600 border-amber-200 hover:bg-amber-50">Undo
                                                                          </Button>)}
                                    </div>) : approver.declined ? (<div className="flex items-center gap-2">
                                        <Badge className="bg-red-50 text-red-800 border-red-200">Sent Back
                                                                        </Badge>
                                        {currentUser?.email?.toLowerCase() === approver.email.toLowerCase() && (<Button
                                            size="sm"
                                            onClick={() => handleApproverApprove(approver.email)}
                                            className="bg-blue-500 hover:bg-blue-600"
                                            disabled={!isManagementTeamFullyApproved()}
                                            title={!isManagementTeamFullyApproved() ? "Management team must approve first" : ""}>
                                            <Check className="h-3.5 w-3.5 mr-1" />Approve Instead
                                                                          </Button>)}
                                    </div>) : currentUser?.email?.toLowerCase() === approver.email.toLowerCase() ? (<div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handleApproverApprove(approver.email)}
                                            className="bg-blue-500 hover:bg-blue-600"
                                            disabled={!isManagementTeamFullyApproved()}
                                            title={!isManagementTeamFullyApproved() ? "Management team must approve first" : ""}>
                                            <Check className="h-3.5 w-3.5 mr-1" />Approve
                                                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => handleApproverSendBack(approver.email)}
                                            variant="destructive"
                                            disabled={!isManagementTeamFullyApproved()}
                                            title={!isManagementTeamFullyApproved() ? "Management team must approve first" : ""}>
                                            <ThumbsDown className="h-3.5 w-3.5 mr-1" />Send Back
                                                                        </Button>
                                    </div>) : (<div className="flex gap-2 items-center">
                                        <Badge
                                            variant="outline"
                                            className="bg-yellow-50 text-yellow-800 border-yellow-200">Pending
                                                                        </Badge>
                                        {canEditApprovers && (<Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleRemoveApprover(approver.email)}
                                            className="h-8 w-8 p-0 text-destructive">
                                            <X className="h-4 w-4" />
                                        </Button>)}
                                    </div>)}
                                </div>
                            </div>))) : (<div className="text-sm text-muted-foreground italic">No approver team member assigned - required for contract completion
                                                  </div>)}
                        </div>
                    </div>)}
                </CardContent>
            </Card>
        </div>
    );
};

export default ApprovalBoard;