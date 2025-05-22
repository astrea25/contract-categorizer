import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sendNotificationEmail } from "@/lib/brevoService";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import AuthNavbar from "@/components/layout/AuthNavbar";
import ContractStatusBadge from "@/components/contracts/ContractStatusBadge";
import ContractForm from "@/components/contracts/ContractForm";
import ContractProgressBar from "@/components/contracts/ContractProgressBar";
import StatusSelectCard from "@/components/contracts/StatusSelectCard";
import AmendmentStatusCard from "@/components/contracts/AmendmentStatusCard";
import CommentSection from "@/components/contracts/CommentSection";
import ApprovalBoard from "@/components/contracts/ApprovalBoard";
import ConfirmationDialog from "@/components/contracts/ConfirmationDialog";
import TypeSpecificDetailsCard from "@/components/contracts/TypeSpecificDetailsCard";

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
    normalizeApprovers,
} from "@/lib/data";

import {
    ArrowLeft,
    CalendarClock,
    Edit,
    FileText,
    Wallet,
    ShieldAlert,
    Archive,
    Trash2,
    ArchiveRestore,
    RefreshCw,
    FilePenLine,
    Mail,
} from "lucide-react";

import { formatDistance } from "date-fns";
import { toast } from "sonner";
import PageTransition from "@/components/layout/PageTransition";
import { useAuth } from "@/contexts/AuthContext";
import { manuallyTriggerInactivityNotification } from "@/lib/inactivity-notification";

const ContractDetail = () => {
    const {
        id
    } = useParams<{
        id: string;
    }>();

    const {
        currentUser,
        isAdmin,
        isLegalTeam,
        isManagementTeam
    } = useAuth();

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

    const isUserApprover = (contractData: Contract, userEmail: string): boolean => {
        if (!contractData.approvers || !userEmail)
            return false;

        const normalizedEmail = userEmail.toLowerCase();

        if (contractData.approvers.legal) {
            if (Array.isArray(contractData.approvers.legal)) {
                if (contractData.approvers.legal.some(a => a.email.toLowerCase() === normalizedEmail)) {
                    return true;
                }
            } else if (contractData.approvers.legal.email.toLowerCase() === normalizedEmail) {
                return true;
            }
        }

        if (contractData.approvers.management) {
            if (Array.isArray(contractData.approvers.management)) {
                if (contractData.approvers.management.some(a => a.email.toLowerCase() === normalizedEmail)) {
                    return true;
                }
            } else if (contractData.approvers.management.email.toLowerCase() === normalizedEmail) {
                return true;
            }
        }

        if (contractData.approvers.approver && Array.isArray(contractData.approvers.approver)) {
            if (contractData.approvers.approver.some(a => a.email.toLowerCase() === normalizedEmail)) {
                return true;
            }
        }

        return false;
    };

    const fetchContractData = async () => {
        if (!id || !currentUser?.email || !isAuthorized)
            return;

        try {
            setIsRefreshing(true);
            const contractData = await getContract(id);

            if (contractData) {
                if (JSON.stringify(contractData) !== JSON.stringify(contract)) {
                    setContract(contractData);
                    lastUpdatedTimestamp.current = Date.now();

                    toast.info("Contract data was refreshed with the latest changes", {
                        duration: 2000,
                        position: "bottom-right"
                    });
                }
            }
        } catch (error) {} finally {
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
                setError("Missing contract ID or user not logged in");
                return;
            }

            const authStartTime = performance.now();
            setLoading(true);
            setError(null);

            try {
                const contractFetchStartTime = performance.now();
                const contractData = await getContract(id);
                const contractFetchEndTime = performance.now();

                if (contractData) {
                    setContract(contractData);
                    setError(null);
                    const roleAssignmentStartTime = performance.now();

                    if (isAdmin || isLegalTeam || isManagementTeam) {
                        setIsAuthorized(true);
                    } else {
                        const userEmail = currentUser.email.toLowerCase();

                        if (contractData.owner.toLowerCase() === userEmail) {
                            setIsAuthorized(true);
                        } else if (contractData.parties.some(party => party.email.toLowerCase() === userEmail)) {
                            setIsAuthorized(true);
                        } else if (isUserApprover(contractData, userEmail)) {
                            setIsAuthorized(true);
                        } else {
                            setIsAuthorized(false);
                            setError("You are not authorized to view this contract");
                        }
                    }

                    const roleAssignmentEndTime = performance.now();
                    const roleAssignmentDuration = roleAssignmentEndTime - roleAssignmentStartTime;
                } else {
                    setError("Contract not found");
                }
            } catch (error) {
                setError("Failed to load contract details");
            } finally {
                setLoading(false);
                const authEndTime = performance.now();
                const totalAuthTime = authEndTime - authStartTime;
            }
        };

        checkUserAndFetchContract();
    }, [id, currentUser]);

    const handleSaveContract = async (updatedData: Partial<Contract>) => {
        if (!contract || !id || !currentUser?.email || !isAuthorized)
            return;

        try {
            // Preserve approvers data when updating the contract
            const currentContract = await getContract(id);
            if (!currentContract) {
                throw new Error("Could not fetch current contract");
            }

            // Make sure we keep the existing approvers data
            const updateDataWithApprovers = {
                ...updatedData,
                approvers: currentContract.approvers
            };

            await updateContract(id, updateDataWithApprovers, {
                email: currentUser.email,
                displayName: currentUser.displayName
            });

            const updatedContract = await getContract(id);

            if (updatedContract) {
                setContract(updatedContract);
                toast.success("Contract updated successfully");
            }
        } catch (error) {
            toast.error("Failed to update contract");
        }
    };

    const handleArchiveContract = async () => {
        if (!contract || !id || !currentUser?.email || !isAuthorized)
            return;

        try {
            setIsArchiving(true);

            const user = {
                email: currentUser.email,
                displayName: currentUser.displayName || ""
            };

            if (contract.archived) {
                await unarchiveContract(id, user);
                toast.success("Contract restored from archive");
            } else {
                await archiveContract(id, user);
                toast.success("Contract archived successfully");
            }

            const updatedContract = await getContract(id);

            if (updatedContract) {
                setContract(updatedContract);
            }

            setShowArchiveDialog(false);
        } catch (error: any) {
            toast.error(
                `${contract.archived ? "Failed to restore contract" : "Failed to archive contract"}: ${error.message || "Unknown error"}`
            );
        } finally {
            setIsArchiving(false);
        }
    };

    const handleDeleteContract = async () => {
        if (!contract || !id || !currentUser?.email || !isAuthorized)
            return;

        if (!contract.archived) {
            toast.error("Contract must be archived before deletion");
            return;
        }

        try {
            setIsDeleting(true);
            await deleteContract(id);
            toast.success("Contract deleted successfully");
            navigate("/contracts");
        } catch (error) {
            toast.error("Failed to delete contract");
            setIsDeleting(false);
            setShowDeleteDialog(false);
        }
    };

    const handleSendInactivityNotification = async () => {
        if (!contract || !id || !currentUser?.email || !isAdmin)
            return;

        try {
            setIsSendingNotification(true);
            await manuallyTriggerInactivityNotification(id);
            toast.success("Inactivity notification sent successfully");
        } catch (error) {
            toast.error("Failed to send inactivity notification");
        } finally {
            setIsSendingNotification(false);
        }
    };

    const openArchiveDialog = () => {
        setShowArchiveDialog(true);
    };

    const openDeleteDialog = () => {
        if (contract?.archived) {
            setShowDeleteDialog(true);
        } else {
            toast.error("Contract must be archived before deletion");
        }
    };

    const handleStatusChange = async (newStatus: ContractStatus, additionalData?: Partial<Contract>): Promise<void> => {
        if (!contract || !id || !currentUser?.email || !isAuthorized)
            return;

        try {
            setUpdatingStatus(true);

            if (contract.status === "requested" && newStatus === "draft") {
                const latestContract = await getContract(id);

                if (!latestContract) {
                    toast.error("Failed to fetch latest contract data");
                    setUpdatingStatus(false);
                    return;
                }

                const hasLegalApprovers = latestContract.approvers?.legal && (Array.isArray(latestContract.approvers.legal) ? latestContract.approvers.legal.length > 0 : true);

                if (!hasLegalApprovers) {
                    toast.error(
                        "At least one legal team approver must be assigned before moving to Draft status."
                    );

                    setUpdatingStatus(false);
                    return;
                }

                if (latestContract.supportingDocuments && latestContract.supportingDocuments.length > 0) {
                    const requiredDocuments = latestContract.supportingDocuments.filter(doc => doc.required);

                    if (requiredDocuments.length > 0) {
                        const allRequiredDocumentsChecked = requiredDocuments.every(doc => doc.checked);

                        if (!allRequiredDocumentsChecked) {
                            toast.error("All required supporting documents must be checked before moving to Draft status.");
                            setUpdatingStatus(false);
                            return;
                        }
                    }
                }

                try {
                    const legalApprovers = latestContract.approvers?.legal && (Array.isArray(latestContract.approvers.legal) ? latestContract.approvers.legal : [latestContract.approvers.legal]);

                    if (legalApprovers) {
                        for (const approver of legalApprovers) {
                            await sendNotificationEmail(approver.email, `Contract Ready for Review: ${latestContract.title}`, `
                <p>Hello,</p>
                <p>A contract has been moved to Draft status and is ready for your review:</p>
                <ul>
                  <li><strong>Contract Title:</strong> ${latestContract.title}</li>
                  <li><strong>Project Name:</strong> ${latestContract.projectName}</li>
                  <li><strong>Contract Type:</strong> ${latestContract.type}</li>
                </ul>
                <p>You will be notified again when the contract reaches Legal Review stage.</p>
                `);
                        }
                    }
                } catch (error) {}
            }

            if (newStatus === "draft" && (contract.status === "wwf_signing" || contract.status === "legal_review" || contract.status === "management_review" || contract.status === "legal_send_back" || contract.status === "management_send_back" || contract.status === "legal_declined" || contract.status === "management_declined")) {
                const {
                    normalizeApprovers
                } = await import("@/lib/data");

                const normalizedContract = normalizeApprovers(contract);
                const approvers = JSON.parse(JSON.stringify(normalizedContract.approvers || {}));

                if (approvers.legal && approvers.legal.length > 0) {
                    approvers.legal = approvers.legal.map((approver: any) => ({
                        ...approver,
                        approved: false,
                        declined: false,
                        approvedAt: null,
                        declinedAt: null
                    }));
                }

                if (approvers.management && approvers.management.length > 0) {
                    approvers.management = approvers.management.map((approver: any) => ({
                        ...approver,
                        approved: false,
                        declined: false,
                        approvedAt: null,
                        declinedAt: null
                    }));
                }

                if (approvers.approver && approvers.approver.length > 0) {
                    approvers.approver = approvers.approver.map((approver: any) => ({
                        ...approver,
                        approved: false,
                        declined: false,
                        approvedAt: null,
                        declinedAt: null
                    }));
                }

                await updateContract(id, {
                    status: newStatus,
                    approvers,

                    _customTimelineEntry: {
                        action: "Approvals Reset",
                        details: "All approvals reset due to status change to Draft"
                    }
                }, {
                    email: currentUser.email,
                    displayName: currentUser.displayName
                });
            } else {
                const updateData: Partial<Contract> = {
                    status: newStatus,
                    ...additionalData
                };

                await updateContract(id, updateData, {
                    email: currentUser.email,
                    displayName: currentUser.displayName
                });
            }

            const updatedContract = await getContract(id);

            if (updatedContract) {
                setContract(updatedContract);

                if (newStatus === "draft" && (contract.status === "wwf_signing" || contract.status === "legal_review" || contract.status === "management_review" || contract.status === "legal_declined" || contract.status === "management_declined")) {
                    toast.success(`Status updated to Draft and all approvals have been reset`);
                } else {
                    toast.success(
                        `Status updated to ${newStatus.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}`
                    );
                }
            }
        } catch (error) {
            toast.error("Failed to update status");
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleUpdateApprovers = async (approversData: any) => {
        if (!contract || !id || !currentUser?.email || !isAuthorized)
            return;

        const {
            notifyManagementOfLegalApproval,
            notifyApproversOfManagementApproval
        } = await import("@/lib/approval-notifications");

        try {
            const updateStartTime = performance.now();
            const customTimelineEntry = approversData._customTimelineEntry;

            const {
                _customTimelineEntry,
                ...cleanApproversData
            } = approversData;

            const approvers = cleanApproversData.approvers || cleanApproversData;
            const fetchStartTime = performance.now();
            const currentContract = await getContract(id);
            const fetchEndTime = performance.now();

            if (!currentContract) {
                throw new Error("Could not fetch current contract");
            }

            if (currentContract.updatedAt !== contract.updatedAt) {
                setContract(currentContract);
                lastUpdatedTimestamp.current = Date.now();

                toast.info(
                    "Contract was updated by another user. Your changes will still be applied."
                );
            }

            const normalizeStartTime = performance.now();

            const normalizedApprovers: Contract["approvers"] = {
                ...(currentContract.approvers || {}),
                ...approvers
            };

            if (normalizedApprovers.legal && !Array.isArray(normalizedApprovers.legal)) {
                normalizedApprovers.legal = [normalizedApprovers.legal];
            }

            if (normalizedApprovers.management && !Array.isArray(normalizedApprovers.management)) {
                normalizedApprovers.management = [normalizedApprovers.management];
            }

            if (normalizedApprovers.approver && !Array.isArray(normalizedApprovers.approver)) {
                normalizedApprovers.approver = [normalizedApprovers.approver];
            }

            const normalizeEndTime = performance.now();

            const updateObject: any = {
                approvers: normalizedApprovers
            };

            if (cleanApproversData.status) {
                updateObject.status = cleanApproversData.status;
            }

            if (cleanApproversData.amendmentStage) {
                updateObject.amendmentStage = cleanApproversData.amendmentStage;
            }

            if (customTimelineEntry && currentContract.timeline) {
                const newTimelineEntry = {
                    timestamp: new Date().toISOString(),
                    action: customTimelineEntry.action,
                    userEmail: currentUser.email,
                    userName: currentUser.displayName || currentUser.email.split("@")[0] || "User",
                    details: customTimelineEntry.details || ""
                };

                updateObject.timeline = [...currentContract.timeline, newTimelineEntry];
            }

            const dbUpdateStartTime = performance.now();

            await updateContract(id, updateObject, {
                email: currentUser.email,
                displayName: currentUser.displayName
            });

            const dbUpdateEndTime = performance.now();
            const refetchStartTime = performance.now();
            const updatedContract = await getContract(id);
            const refetchEndTime = performance.now();

            if (updatedContract) {
                setContract(updatedContract);
                lastUpdatedTimestamp.current = Date.now();

                if (updatedContract.approvers?.legal) {
                    const legalApprovers = Array.isArray(updatedContract.approvers.legal) ? updatedContract.approvers.legal : [updatedContract.approvers.legal];
                    const allLegalApproved = legalApprovers.every(approver => approver.approved);

                    if (allLegalApproved && updatedContract.status === "legal_review") {
                        await notifyManagementOfLegalApproval(updatedContract);
                    }
                }

                if (updatedContract.approvers?.management) {
                    const managementApprovers = Array.isArray(updatedContract.approvers.management) ? updatedContract.approvers.management : [updatedContract.approvers.management];
                    const allManagementApproved = managementApprovers.every(approver => approver.approved);

                    if (allManagementApproved && updatedContract.status === "management_review") {
                        await notifyApproversOfManagementApproval(updatedContract);
                    }
                }

                toast.success("Approvers updated successfully");
            }

            const updateEndTime = performance.now();
            const totalUpdateTime = updateEndTime - updateStartTime;
            return Promise.resolve();
        } catch (error) {
            toast.error("Failed to update approvers");
            return Promise.reject(error);
        }
    };

    const isContractEditable = (contract: Contract): boolean => {
        if (!isAdmin) {
            return false;
        }

        const editableStatuses: ContractStatus[] = [
            "requested",
            "draft",
            "legal_review",
            "management_review",
            "legal_send_back",
            "management_send_back"
        ];

        if (contract.status === "amendment") {
            return true;
        }

        if (contract.status === "contract_end") {
            return false;
        }

        return editableStatuses.includes(contract.status);
    };

    const canContractBeAmended = (contract: Contract): boolean => {
        if (!isAdmin) {
            return false;
        }

        const amendableStatuses: ContractStatus[] = ["implementation", "wwf_signing", "counterparty_signing"];

        if (contract.status === "amendment") {
            return false;
        }

        if (contract.status === "contract_end") {
            return false;
        }

        if ([
            "requested",
            "draft",
            "legal_review",
            "management_review",
            "legal_send_back",
            "management_send_back"
        ].includes(contract.status)) {
            return false;
        }

        return amendableStatuses.includes(contract.status);
    };

    const openAmendDialog = () => {
        setShowAmendDialog(true);
    };

    const handleAmendContract = async () => {
        if (!contract || !id || !currentUser?.email || !isAuthorized)
            return;

        try {
            setUpdatingStatus(true);

            const {
                notifyRequesterOfAmendment
            } = await import("@/lib/approval-notifications");

            const originalStatus = contract.status;
            const normalizedContract = normalizeApprovers(contract);
            const approvers = JSON.parse(JSON.stringify(normalizedContract.approvers || {}));

            // Only reset management approvals, not legal approvals
            if (approvers.management && approvers.management.length > 0) {
                approvers.management = approvers.management.map((approver: any) => ({
                    ...approver,
                    approved: false,
                    declined: false,
                    approvedAt: null,
                    declinedAt: null
                }));
            }

            if (approvers.approver && approvers.approver.length > 0) {
                approvers.approver = approvers.approver.map((approver: any) => ({
                    ...approver,
                    approved: false,
                    declined: false,
                    approvedAt: null,
                    declinedAt: null
                }));
            }

            await updateContract(id, {
                status: "amendment",
                isAmended: true,
                amendmentStage: "amendment",
                originalStatus: originalStatus,
                approvers,

                _customTimelineEntry: {
                    action: "Contract Amendment Started",
                    details: `Contract moved to amendment status (original status: ${originalStatus.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}) - Management approvals reset`
                }
            }, {
                email: currentUser.email,
                displayName: currentUser.displayName
            });

            const updatedContract = await getContract(id);

            if (updatedContract) {
                setContract(updatedContract);
                toast.success("Contract amendment process started - Management approvals have been reset");

                try {
                    await notifyRequesterOfAmendment(updatedContract);
                } catch (notificationError) {}
            }

            setShowAmendDialog(false);
        } catch (error) {
            toast.error("Failed to start contract amendment");
        } finally {
            setUpdatingStatus(false);
        }
    };

    const formatTimelineDetails = (details: string, isStatusChange: boolean): string => {
        if (isStatusChange)
            return "";

        if (!details)
            return "";

        const cleanDetails = details.startsWith("Changed: ") ? details.substring("Changed: ".length) : details;

        return ": " + cleanDetails.split(", ").map(
            item => item.split(" ").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
        ).join(", ");
    };

    if (loading) {
        return (
            <>
                <AuthNavbar />
                <div
                    className="container mx-auto p-4 sm:p-6 flex justify-center items-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-pulse h-12 w-48 bg-muted rounded-lg mb-4 mx-auto"></div>
                        <div className="animate-pulse h-4 w-64 bg-muted rounded-full mb-8 mx-auto"></div>
                        <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
                            {[...Array(6)].map(
                                (_, i) => (<div key={i} className="animate-pulse h-24 bg-muted rounded-lg"></div>)
                            )}
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
                            <ArrowLeft size={16} />Back to contracts
                                                                                                </Link>
                    </Button>
                </div>
            </>
        );
    }

    if (!contract)
        return null;

    const daysRemaining = contract.endDate ? formatDistance(new Date(contract.endDate), new Date(), {
        addSuffix: true
    }) : "Ongoing";

    return (
        <PageTransition>
            <AuthNavbar />
            <div className="container mx-auto p-4 sm:p-6">
                <div className="mb-8">
                    <div
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <Button asChild variant="ghost" className="self-start">
                            <Link to="/contracts" className="flex items-center gap-2">
                                <ArrowLeft size={16} />Back to contracts
                                                                                                              </Link>
                        </Button>
                        <div className="flex gap-2 self-end">
                            {isRefreshing && (<div className="flex items-center text-sm text-muted-foreground mr-2">
                                <RefreshCw size={14} className="animate-spin mr-1" />
                                <span>Refreshing...</span>
                            </div>)}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={fetchContractData}
                                className="mr-2"
                                disabled={isRefreshing}>
                                <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
                                <span className="ml-1">Refresh</span>
                            </Button>
                            {}
                            {isAdmin && (<TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleSendInactivityNotification}
                                            disabled={isSendingNotification}
                                            className="mr-2">
                                            <Mail size={14} className={isSendingNotification ? "animate-spin" : ""} />
                                            <span className="ml-1">{isSendingNotification ? "Sending..." : "Send Notification"}</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Manually send an inactivity notification email to the contract owner and recipient</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>)}
                            {contract.archived ? (<>
                                <Button
                                    variant="outline"
                                    className="gap-1"
                                    onClick={openArchiveDialog}
                                    disabled={isArchiving}>
                                    <ArchiveRestore size={16} />Restore
                                                                                                                              </Button>
                                <Button
                                    variant="destructive"
                                    className="gap-1"
                                    onClick={openDeleteDialog}
                                    disabled={isDeleting}>
                                    <Trash2 size={16} />Permanently Delete
                                                                                                                              </Button>
                            </>) : (<>
                                <Button
                                    variant="outline"
                                    className="gap-1"
                                    onClick={openArchiveDialog}
                                    disabled={isArchiving}>
                                    <Archive size={16} />Archive
                                                                                                                              </Button>
                                {isContractEditable(contract) && isAdmin && (<ContractForm
                                    initialData={contract}
                                    onSave={handleSaveContract}
                                    trigger={<Button variant="outline" className="gap-1">
                                        <Edit size={16} />Edit Contract
                                                                                                                                                </Button>} />)}
                                {canContractBeAmended(contract) && isAdmin && (<Button
                                    variant="outline"
                                    className="gap-1"
                                    onClick={openAmendDialog}
                                    disabled={updatingStatus}>
                                    <FilePenLine size={16} />Amend Contract
                                                                                                                                </Button>)}
                            </>)}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                            <span
                                className="px-2 py-1 bg-secondary text-xs rounded-md font-medium text-secondary-foreground">
                                {contractTypeLabels[contract.type as ContractType]}
                            </span>
                            <ContractStatusBadge status={contract.status} />
                            {contract.archived && (<span
                                className="px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-md font-medium flex items-center gap-1">
                                <Archive className="h-3 w-3" />Archived
                                                                                                                </span>)}
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">{contract.title}</h1>
                        <p className="text-lg text-muted-foreground">
                            {contract.projectName}
                        </p>
                    </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
                    {}
                    <StatusSelectCard
                        status={contract.status}
                        onStatusChange={handleStatusChange}
                        isUpdating={updatingStatus}
                        contract={contract} />
                    {}
                    {contract.isAmended && contract.status === "amendment" && (<AmendmentStatusCard
                        contract={contract}
                        onStatusChange={handleStatusChange}
                        isUpdating={updatingStatus} />)}
                    {contract.value !== null && (<Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Contract Value</CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm">
                                <div className="font-medium">₱{contract.value.toLocaleString()}
                                </div>
                                <p className="text-muted-foreground mt-1">Last updated {new Date(contract.updatedAt).toLocaleDateString()}
                                </p>
                            </div>
                        </CardContent>
                    </Card>)}
                    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Duration</CardTitle>
                            <CalendarClock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm">
                                <div className="font-medium">{new Date(contract.startDate).toLocaleDateString()}- {contract.endDate ? new Date(contract.endDate).toLocaleDateString() : "Ongoing"}</div>
                                {contract.endDate && (<p className="text-muted-foreground mt-1">Expires {daysRemaining}
                                </p>)}
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
                                <p className="text-muted-foreground mt-1">ID: {contract.id}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Card
                                    className="overflow-hidden transition-all duration-300 hover:shadow-md cursor-help">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">Inactivity Notification</CardTitle>
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-sm">
                                            <div className="space-y-1">
                                                <div className="font-medium">
                                                    <span className="text-sm text-muted-foreground">Reviewers/Approvers:</span> {contract.reviewerInactivityDays !== undefined ? `${contract.reviewerInactivityDays} business days (custom)` : "3 business days (default)"}
                                                </div>
                                                <div className="font-medium">
                                                    <span className="text-sm text-muted-foreground">Regular Users:</span> {contract.regularInactivityDays !== undefined ? `${contract.regularInactivityDays} business days (custom)` : "1 business day (default)"}
                                                </div>
                                            </div>
                                            <p className="text-muted-foreground mt-1">
                                                {contract.lastActivityAt ? `Last activity: ${new Date(contract.lastActivityAt).toLocaleDateString()}` : "No activity recorded yet"}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">Creator: {contract.owner ? contract.owner.split("@")[0] : "Unknown"}
                                                {currentUser?.email === contract.owner && (<span className="ml-1 text-green-600">(you)</span>)}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TooltipTrigger>
                            <TooltipContent>
                                <div className="space-y-2 max-w-xs">
                                    <p>Current thresholds (business days only):</p>
                                    <ul className="list-disc pl-5 text-xs">
                                        <li>
                                            <strong>Reviewers/Approvers:</strong> {contract.reviewerInactivityDays !== undefined ? `${contract.reviewerInactivityDays} business days (custom)` : "3 business days (default)"}
                                        </li>
                                        <li>
                                            <strong>Regular Users:</strong> {contract.regularInactivityDays !== undefined ? `${contract.regularInactivityDays} business days (custom)` : "1 business day (default)"}
                                        </li>
                                    </ul>
                                    <p className="text-xs mt-1">Business days exclude weekends</p>
                                    <p className="text-xs mt-1 text-amber-600">Only admins can modify these settings</p>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                {}
                {contract.typeSpecificFields && Object.keys(contract.typeSpecificFields).length > 0 && (<div className="mb-8">
                    <TypeSpecificDetailsCard contract={contract} />
                </div>)}
                {contract.description && (<Card
                    className="mb-8 overflow-hidden transition-all duration-300 hover:shadow-md">
                    <CardHeader>
                        <CardTitle>Description</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-line">
                            {contract.description}
                        </p>
                    </CardContent>
                </Card>)}
                {contract.documentLink && (<Card
                    className="mb-8 overflow-hidden transition-all duration-300 hover:shadow-md">
                    <CardHeader>
                        <CardTitle>Document Link</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <a
                            href={contract.documentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline">View Document
                                                                                                  </a>
                    </CardContent>
                </Card>)}
                {}
                <Card
                    className="mb-8 overflow-hidden transition-all duration-300 hover:shadow-md">
                    <CardHeader>
                        <CardTitle>Contract Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ContractProgressBar currentStatus={contract.status} contract={contract} />
                    </CardContent>
                </Card>
                {}
                <ApprovalBoard
                    contract={contract}
                    onUpdateApprovers={handleUpdateApprovers}
                    isRequired={contract.status !== "requested"} />
                {}
                <Card
                    className="mb-8 overflow-hidden transition-all duration-300 hover:shadow-md">
                    <CardHeader>
                        <CardTitle>Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {}
                            {contract.timeline && contract.timeline.length > 0 ? (<>
                                {}
                                {(showAllTimelineEntries ? [...contract.timeline].sort(
                                    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                                ) : [...contract.timeline].sort(
                                    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                                ).slice(0, DEFAULT_TIMELINE_ENTRIES)).map((entry, index, displayedTimeline) => {
                                    const isStatusChange = entry.action.startsWith("Status Changed to");
                                    let statusKey: ContractStatus | null = null;

                                    if (isStatusChange) {
                                        const statusText = entry.action.replace("Status Changed to ", "");

                                        if (statusText === "Legal Review")
                                            statusKey = "legal_review";
                                        else if (statusText === "Management Review")
                                            statusKey = "management_review";
                                        else if (statusText === "WWF Signing")
                                            statusKey = "wwf_signing";
                                        else if (statusText === "Counterparty Signing")
                                            statusKey = "counterparty_signing";
                                        else if (statusText === "Implementation")
                                            statusKey = "implementation";
                                        else if (statusText === "Amendment")
                                            statusKey = "amendment";
                                        else if (statusText === "Contract End")
                                            statusKey = "contract_end";
                                        else if (statusText === "Legal Send Back")
                                            statusKey = "legal_send_back";
                                        else if (statusText === "Management Send Back")
                                            statusKey = "management_send_back";
                                        else if (statusText === "Legal Declined")
                                            statusKey = "legal_send_back";
                                        else if (statusText === "Management Declined")
                                            statusKey = "management_send_back";
                                        else
                                            statusKey = statusText.toLowerCase() as ContractStatus;
                                    }

                                    const userIdentifier = entry.userName || (entry.userEmail ? entry.userEmail.split("@")[0] : entry.userEmail);

                                    return (
                                        <div key={index} className="flex items-start">
                                            <div className="flex flex-col items-center mr-4">
                                                <div
                                                    className={`w-3 h-3 rounded-full mt-2 ${isStatusChange && statusKey ? statusKey === "requested" ? "bg-blue-800" : statusKey === "draft" ? "bg-gray-800" : statusKey === "legal_review" ? "bg-purple-800" : statusKey === "management_review" ? "bg-orange-800" : statusKey === "wwf_signing" ? "bg-indigo-800" : statusKey === "counterparty_signing" ? "bg-pink-800" : statusKey === "implementation" ? "bg-cyan-800" : statusKey === "amendment" ? "bg-amber-800" : statusKey === "contract_end" ? "bg-slate-800" : statusKey === "legal_send_back" ? "bg-red-800" : statusKey === "management_send_back" ? "bg-red-800" : statusKey === "legal_declined" ? "bg-red-800" : statusKey === "management_declined" ? "bg-red-800" : statusKey === "approval" ? "bg-yellow-800" : statusKey === "finished" ? "bg-green-800" : "bg-primary" : "bg-primary"}`}></div>
                                                {index < displayedTimeline.length - 1 && (<div
                                                    className={`w-0.5 h-full ${isStatusChange && statusKey && statusColors[statusKey] ? statusColors[statusKey].bg : "bg-border"}`}></div>)}
                                            </div>
                                            <div className="pt-0">
                                                <div
                                                    className={`font-medium ${isStatusChange && statusKey && statusColors[statusKey] ? statusColors[statusKey].text : ""}`}>
                                                    {entry.action}{entry.details ? formatTimelineDetails(entry.details, isStatusChange) : ""}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    {new Date(entry.timestamp).toLocaleString()}
                                                </div>
                                                <div className="text-sm text-muted-foreground">By: {userIdentifier}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {}
                                {contract.timeline.length > DEFAULT_TIMELINE_ENTRIES && (<div className="flex justify-center mt-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowAllTimelineEntries(!showAllTimelineEntries)}>
                                        {showAllTimelineEntries ? "Hide" : `Show More (${contract.timeline.length - DEFAULT_TIMELINE_ENTRIES} more)`}
                                    </Button>
                                </div>)}
                            </>) : (<>
                                {}
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
                                        <div className="text-sm text-muted-foreground">By: {typeof contract.owner === "string" && contract.owner.includes("@") ? contract.owner.split("@")[0] : (contract.owner || "System")}
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
                                        <div className="text-sm text-muted-foreground">By: {typeof contract.owner === "string" && contract.owner.includes("@") ? contract.owner.split("@")[0] : (contract.owner || "System")}
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
                                        <div className="text-sm text-muted-foreground">By: {typeof contract.owner === "string" && contract.owner.includes("@") ? contract.owner.split("@")[0] : (contract.owner || "System")}
                                        </div>
                                    </div>
                                </div>
                                {contract.endDate && (<div className="flex items-start">
                                    <div className="flex flex-col items-center mr-4">
                                        <div className="w-3 h-3 rounded-full mt-0.5 bg-muted-foreground"></div>
                                    </div>
                                    <div className="pt-0">
                                        <div className="font-medium">Contract End Date</div>
                                        <div className="text-sm text-muted-foreground">
                                            {new Date(contract.endDate).toLocaleDateString()}
                                        </div>
                                        <div className="text-sm text-muted-foreground">By: {typeof contract.owner === "string" && contract.owner.includes("@") ? contract.owner.split("@")[0] : (contract.owner || "System")}
                                        </div>
                                    </div>
                                </div>)}
                            </>)}
                        </div>
                        <Separator className="my-6" />
                    </CardContent>
                </Card>
                {}
                {currentUser && contract && (<CommentSection
                    contractId={id!}
                    comments={contract.comments || []}
                    userEmail={currentUser.email!}
                    onCommentsChange={() => {
                        const fetchLatestContract = async () => {
                            if (!id)
                                return;

                            try {
                                const contractData = await getContract(id);

                                if (contractData) {
                                    setContract(contractData);
                                }
                            } catch (error) {}
                        };

                        fetchLatestContract();
                    }} />)}
            </div>
            {}
            <ConfirmationDialog
                open={showArchiveDialog}
                onOpenChange={setShowArchiveDialog}
                title={contract.archived ? "Restore Contract" : "Archive Contract"}
                description={contract.archived ? "Are you sure you want to restore this contract from the archive? It will be visible in the main contracts list again." : "Are you sure you want to archive this contract? It will be moved to the archive and removed from the main contracts list."}
                confirmText={contract.archived ? "Restore" : "Archive"}
                onConfirm={handleArchiveContract}
                isLoading={isArchiving}
                confirmVariant="outline" />
            {}
            <ConfirmationDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="Permanently Delete Contract"
                description="Are you sure you want to permanently delete this archived contract? This action cannot be undone and all contract data will be permanently lost."
                confirmText="Permanently Delete"
                onConfirm={handleDeleteContract}
                isLoading={isDeleting}
                confirmVariant="destructive" />
            {}
            <ConfirmationDialog
                open={showAmendDialog}
                onOpenChange={setShowAmendDialog}
                title="Amend Contract"
                description="Are you sure you want to amend this contract? This will start the amendment process, which will require approvals from legal and management teams again."
                confirmText="Start Amendment"
                onConfirm={handleAmendContract}
                isLoading={updatingStatus}
                confirmVariant="outline" />
        </PageTransition>
    );
};

export default ContractDetail;