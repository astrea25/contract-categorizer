import { useState, useEffect, useMemo } from "react";
import { PlusCircle, X, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthNavbar from "@/components/layout/AuthNavbar";
import FilterBar from "@/components/contracts/FilterBar";
import DraggableContractCard from "@/components/contracts/DraggableContractCard";
import FolderList from "@/components/contracts/FolderList";
import ContractForm from "@/components/contracts/ContractForm";
import SortDropdown, { SortOption, SortField } from "@/components/contracts/SortDropdown";
import { exportContractsToExcel } from "@/lib/excel-export";

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
    normalizeApprovers,
} from "@/lib/data";

import { getContractsForApproval, getApprovedContracts, getRespondedContracts } from "@/lib/approval-utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tooltip } from "@/components/ui/tooltip";
import { ResponsiveContainer, BarChart, Bar, XAxis } from "recharts";
import PageTransition from "@/components/layout/PageTransition";
import { Badge } from "@/components/ui/badge";
import { format, isValid } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Contracts = () => {
    const {
        toast: uiToast
    } = useToast();

    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);
    const [selectedFolder, setSelectedFolder] = useState<string | "all" | "archive">("all");
    const [folders, setFolders] = useState<Folder[]>([]);

    const [sort, setSort] = useState<SortOption>({
        field: "updatedAt",
        direction: "desc"
    });

    const [filters, setFilters] = useState({
        search: "",
        status: "all" as ContractStatus | "all",
        type: "all" as ContractType | "all",
        project: "",
        owner: "",
        party: "",

        dateRange: {
            from: null as Date | null,
            to: null as Date | null
        }
    });

    const [searchParams] = useSearchParams();
    const status = searchParams.get("status");
    const filter = searchParams.get("filter");

    const {
        currentUser,
        isAdmin,
        isLegalTeam,
        isManagementTeam,
        isApprover
    } = useAuth();

    useEffect(() => {
        const loadFolders = async () => {
            try {
                if (currentUser?.email) {
                    const foldersList = await getFolders(currentUser.email);
                    setFolders(foldersList);
                } else {
                    setFolders([]);
                }
            } catch (error) {
                setFolders([]);
            }
        };

        loadFolders();
    }, [currentUser]);

    useEffect(() => {
        const fetchContracts = async () => {
            try {
                setLoading(true);

                if (isAdmin) {
                    const contractsList = await getContracts();
                    setContracts(contractsList);
                } else if (isLegalTeam || isManagementTeam) {
                    const contractsList = await getUserContracts(currentUser?.email || "");
                    setContracts(contractsList);
                } else if (currentUser?.email) {
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

                if (selectedFolder === "archive") {
                    if (currentUser?.email) {
                        allContracts = await getUserArchivedContracts(currentUser.email);
                    } else {
                        allContracts = await getArchivedContracts();
                    }

                    setContracts(allContracts);
                    return;
                } else {
                    if (isAdmin) {
                        allContracts = await getContracts(false);
                    } else if ((isLegalTeam || isManagementTeam) && currentUser?.email) {
                        allContracts = await getUserContracts(currentUser.email, false);
                    } else if (currentUser?.email) {
                        allContracts = await getUserContracts(currentUser.email, false);
                    } else {
                        allContracts = [];
                    }
                }

                let filteredContracts = [...allContracts];

                if (status === "awaiting_response" && currentUser?.email) {
                    try {
                        const freshContracts = await getContracts(false);
                        const contractsAwaitingResponse = await getContractsForApproval(currentUser.email, isLegalTeam, isManagementTeam, isApprover);

                        if (contractsAwaitingResponse.length > 0) {
                            filteredContracts = contractsAwaitingResponse;
                        } else {
                            filteredContracts = freshContracts.filter(contract => {
                                const skipStatuses = [
                                    "finished",
                                    "contract_end",
                                    "implementation",
                                    "wwf_signing",
                                    "counterparty_signing"
                                ];

                                if (skipStatuses.includes(contract.status)) {
                                    return false;
                                }

                                const normalizedContract = normalizeApprovers(contract);
                                const approvers = normalizedContract.approvers as any;

                                if (isLegalTeam) {
                                    if (contract.status === "legal_review" || contract.status === "approval" || contract.status === "legal_send_back" || contract.status === "legal_declined") {
                                        if (!approvers || !approvers.legal || (Array.isArray(approvers.legal) && approvers.legal.length === 0)) {
                                            return true;
                                        }

                                        const legalApprovers = Array.isArray(approvers.legal) ? approvers.legal : [approvers.legal];

                                        const userLegalApprover = legalApprovers.find(
                                            (approver: any) => approver.email.toLowerCase() === currentUser.email.toLowerCase()
                                        );

                                        if (userLegalApprover) {
                                            const isApproved = userLegalApprover.approved === true;
                                            const isDeclined = userLegalApprover.declined === true;
                                            const shouldShow = !isApproved && !isDeclined;
                                            return shouldShow;
                                        }
                                    }
                                }

                                if (isManagementTeam) {
                                    if (contract.status === "management_review" || contract.status === "approval" || contract.status === "management_send_back" || contract.status === "management_declined") {
                                        if (!approvers || !approvers.management || (Array.isArray(approvers.management) && approvers.management.length === 0)) {
                                            return true;
                                        }

                                        const managementApprovers = Array.isArray(approvers.management) ? approvers.management : [approvers.management];

                                        const userManagementApprover = managementApprovers.find(
                                            (approver: any) => approver.email.toLowerCase() === currentUser.email.toLowerCase()
                                        );

                                        if (userManagementApprover) {
                                            const isApproved = userManagementApprover.approved === true;
                                            const isDeclined = userManagementApprover.declined === true;
                                            const shouldShow = !isApproved && !isDeclined;
                                            return shouldShow;
                                        }
                                    }
                                }

                                if (isApprover) {
                                    if (contract.status === "approval" || contract.status === "draft" || contract.status === "requested" || contract.status.includes("send_back") || contract.status.includes("declined")) {
                                        if (!approvers || !approvers.approver || (Array.isArray(approvers.approver) && approvers.approver.length === 0)) {
                                            return true;
                                        }

                                        const approversList = Array.isArray(approvers.approver) ? approvers.approver : [approvers.approver];

                                        const userApprover = approversList.find(
                                            (approver: any) => approver.email.toLowerCase() === currentUser.email.toLowerCase()
                                        );

                                        if (userApprover) {
                                            const isApproved = userApprover.approved === true;
                                            const isDeclined = userApprover.declined === true;
                                            const shouldShow = !isApproved && !isDeclined;
                                            return shouldShow;
                                        }
                                    }
                                }

                                return false;
                            });

                            if (filteredContracts.length === 0) {
                                const respondedContracts = await getRespondedContracts(currentUser.email, isLegalTeam, isManagementTeam, isApprover);

                                if (respondedContracts.length > 0) {
                                    const potentialContract = freshContracts.find(contract => {
                                        const status = contract.status;
                                        return status === "legal_review" || status === "management_review" || status === "approval" || status === "draft" || status === "requested" || status.includes("send_back") || status.includes("declined");
                                    });

                                    if (potentialContract) {
                                        filteredContracts = [potentialContract];
                                    }
                                }
                            }
                        }

                        if (filteredContracts.length === 0) {
                            if (allContracts.length > 0) {
                                filteredContracts = [allContracts[0]];
                            }
                        }
                    } catch (error) {
                        filteredContracts = allContracts;
                    }
                } else if (status) {
                    filteredContracts = filteredContracts.filter(contract => contract.status === status);
                }

                if (filter) {
                    const currentYear = new Date().getFullYear();
                    const now = new Date();
                    const thirtyDaysFromNow = new Date(now);
                    thirtyDaysFromNow.setDate(now.getDate() + 30);

                    switch (filter) {
                    case "expiringThisMonth":
                        filteredContracts = filteredContracts.filter(contract => {
                            if (!contract.endDate)
                                return false;

                            const endDate = new Date(contract.endDate);
                            return endDate.getMonth() === now.getMonth() && endDate.getFullYear() === now.getFullYear();
                        });

                        break;
                    case "expiringThisYear":
                        filteredContracts = filteredContracts.filter(contract => {
                            if (!contract.endDate)
                                return false;

                            const endDate = new Date(contract.endDate);
                            return endDate.getFullYear() === currentYear;
                        });

                        break;
                    case "expiringSoon":
                        filteredContracts = filteredContracts.filter(contract => {
                            if (!contract.endDate)
                                return false;

                            try {
                                const endDate = new Date(contract.endDate);
                                return endDate >= now && endDate <= thirtyDaysFromNow;
                            } catch (e) {
                                return false;
                            }
                        });

                        break;
                    case "my_approved":
                        if (currentUser?.email) {
                            filteredContracts = filteredContracts.filter(contract => {
                                const normalizedContract = normalizeApprovers(contract);
                                const approvers = normalizedContract.approvers as any;
                                const email = currentUser.email.toLowerCase();

                                if (isLegalTeam && approvers?.legal) {
                                    const legalApprovers = Array.isArray(approvers.legal) ? approvers.legal : [approvers.legal];

                                    const userApprover = legalApprovers.find(
                                        approver => approver.email.toLowerCase() === email && approver.approved === true
                                    );

                                    if (userApprover)
                                        return true;
                                }

                                if (isManagementTeam && approvers?.management) {
                                    const managementApprovers = Array.isArray(approvers.management) ? approvers.management : [approvers.management];

                                    const userApprover = managementApprovers.find(
                                        approver => approver.email.toLowerCase() === email && approver.approved === true
                                    );

                                    if (userApprover)
                                        return true;
                                }

                                if (isApprover && approvers?.approver) {
                                    const approversList = Array.isArray(approvers.approver) ? approvers.approver : [approvers.approver];

                                    const userApprover = approversList.find(
                                        approver => approver.email.toLowerCase() === email && approver.approved === true
                                    );

                                    if (userApprover)
                                        return true;
                                }

                                return false;
                            });
                        }

                        break;
                    case "my_sent_back":
                        if (currentUser?.email) {
                            filteredContracts = filteredContracts.filter(contract => {
                                const normalizedContract = normalizeApprovers(contract);
                                const approvers = normalizedContract.approvers as any;
                                const email = currentUser.email.toLowerCase();

                                if (isLegalTeam && approvers?.legal) {
                                    const legalApprovers = Array.isArray(approvers.legal) ? approvers.legal : [approvers.legal];

                                    const userApprover = legalApprovers.find(
                                        approver => approver.email.toLowerCase() === email && approver.declined === true
                                    );

                                    if (userApprover)
                                        return true;
                                }

                                if (isManagementTeam && approvers?.management) {
                                    const managementApprovers = Array.isArray(approvers.management) ? approvers.management : [approvers.management];

                                    const userApprover = managementApprovers.find(
                                        approver => approver.email.toLowerCase() === email && approver.declined === true
                                    );

                                    if (userApprover)
                                        return true;
                                }

                                if (isApprover && approvers?.approver) {
                                    const approversList = Array.isArray(approvers.approver) ? approvers.approver : [approvers.approver];

                                    const userApprover = approversList.find(
                                        approver => approver.email.toLowerCase() === email && approver.declined === true
                                    );

                                    if (userApprover)
                                        return true;
                                }

                                return false;
                            });
                        }

                        break;
                    }
                }

                setContracts(filteredContracts);
            } catch (error) {
                toast.error("Failed to load contracts");
                setContracts([]);
            }
        };

        fetchAndFilterContracts();
    }, [
        status,
        filter,
        currentUser,
        isAdmin,
        isLegalTeam,
        isManagementTeam,
        isApprover,
        selectedFolder
    ]);

    const handleFilterChange = (newFilters: typeof filters) => {
        setFilters(newFilters);
    };

    const clearFilters = () => {
        setFilters({
            search: "",
            status: "all",
            type: "all",
            project: "",
            owner: "",
            party: "",

            dateRange: {
                from: null,
                to: null
            }
        });
    };

    const handleSaveContract = async (newContract: Partial<Contract>) => {
        if (!currentUser?.email)
            return;

        try {
            const owner = newContract.owner || currentUser.email;
            let parties = newContract.parties || [];

            if (parties.length === 0) {
                parties = [{
                    name: currentUser.displayName || currentUser.email.split("@")[0] || "User",
                    email: currentUser.email,
                    role: "owner"
                }, {
                    name: "",
                    email: "",
                    role: "client"
                }];
            }

            const projectName = newContract.projectName || "Unassigned";

            const contractToAdd = {
                title: newContract.title || projectName,
                projectName: projectName,
                type: newContract.type || "service",
                status: newContract.status || "requested",
                owner: owner,
                recipientEmail: newContract.recipientEmail || "",
                inactivityNotificationDays: newContract.inactivityNotificationDays || null,
                reviewerInactivityDays: newContract.reviewerInactivityDays || null,
                regularInactivityDays: newContract.regularInactivityDays || null,
                parties: parties,
                startDate: newContract.startDate || new Date().toISOString().split("T")[0],
                endDate: newContract.endDate || null,
                value: newContract.value || null,
                description: newContract.description || "",
                documentLink: newContract.documentLink || "",
                folderId: newContract.folderId === null || newContract.folderId === "none" ? null : (newContract.folderId || (selectedFolder !== "all" && selectedFolder !== "archive" ? selectedFolder : null)),
                typeSpecificFields: newContract.typeSpecificFields || {},
                supportingDocuments: newContract.supportingDocuments || []
            } as Omit<Contract, "id" | "createdAt" | "updatedAt">;

            await createContract(contractToAdd, {
                email: currentUser.email,
                displayName: currentUser.displayName
            });

            let updatedContracts: Contract[] = [];

            if (isAdmin) {
                updatedContracts = await getContracts(false);
            } else if ((isLegalTeam || isManagementTeam) && currentUser?.email) {
                updatedContracts = await getUserContracts(currentUser.email, false);
            } else if (currentUser?.email) {
                updatedContracts = await getUserContracts(currentUser.email, false);
            } else {
                updatedContracts = [];
            }

            if (selectedFolder !== "all" && selectedFolder !== "archive") {
                updatedContracts = filterByFolder(updatedContracts, selectedFolder);
            }

            setContracts(updatedContracts);

            uiToast({
                title: "Contract created",
                description: "Your new contract has been created successfully."
            });
        } catch (error) {
            toast.error(`Failed to create contract: ${error.message}`);
        }
    };

    const handleDeleteFolder = async (folderId: string) => {
        try {
            await deleteFolder(folderId);

            if (selectedFolder === folderId) {
                setSelectedFolder("all");
            }

            let updatedContracts: Contract[] = [];

            if (isAdmin) {
                updatedContracts = await getContracts(false);
            } else if ((isLegalTeam || isManagementTeam) && currentUser?.email) {
                updatedContracts = await getUserContracts(currentUser.email, false);
            } else if (currentUser?.email) {
                updatedContracts = await getUserContracts(currentUser.email, false);
            }

            setContracts(updatedContracts);
            toast.success("Folder deleted successfully");
        } catch (error) {
            toast.error("Failed to delete folder");
        }
    };

    const handleDropContract = async (contractId: string, folderId: string | null) => {
        if (!currentUser?.email) {
            toast.error("You must be logged in to move contracts.");
            return;
        }

        try {
            await assignContractToFolder(contractId, folderId, {
                email: currentUser.email,
                displayName: currentUser.displayName || ""
            });

            toast.success(`Contract moved successfully`);
            let updatedContracts: Contract[] = [];

            if (isAdmin) {
                updatedContracts = await getContracts(false);
            } else if ((isLegalTeam || isManagementTeam) && currentUser?.email) {
                updatedContracts = await getUserContracts(currentUser.email, false);
            } else if (currentUser?.email) {
                updatedContracts = await getUserContracts(currentUser.email, false);
            }

            setContracts(updatedContracts);
        } catch (error: any) {
            toast.error(`Failed to move contract: ${error.message || "Unknown error"}`);
        }
    };

    const sortContracts = (contractsToSort: Contract[], sortOption: SortOption) => {
        const {
            field,
            direction
        } = sortOption;

        const multiplier = direction === "asc" ? 1 : -1;

        return [...contractsToSort].sort((a, b) => {
            switch (field) {
            case "title":
                return multiplier * a.title.localeCompare(b.title);
            case "updatedAt":
                if (!a.updatedAt && !b.updatedAt)
                    return 0;

                if (!a.updatedAt)
                    return multiplier * 1;

                if (!b.updatedAt)
                    return multiplier * -1;

                try {
                    return multiplier * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
                } catch (error) {
                    return 0;
                }
            case "createdAt":
                if (!a.createdAt && !b.createdAt)
                    return 0;

                if (!a.createdAt)
                    return multiplier * 1;

                if (!b.createdAt)
                    return multiplier * -1;

                try {
                    return multiplier * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                } catch (error) {
                    return 0;
                }
            case "startDate":
                if (!a.startDate && !b.startDate)
                    return 0;

                if (!a.startDate)
                    return multiplier * 1;

                if (!b.startDate)
                    return multiplier * -1;

                try {
                    return multiplier * (new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
                } catch (error) {
                    return 0;
                }
            case "endDate":
                if (!a.endDate && !b.endDate)
                    return 0;

                if (!a.endDate)
                    return multiplier * 1;

                if (!b.endDate)
                    return multiplier * -1;

                try {
                    return multiplier * (new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
                } catch (error) {
                    return 0;
                }
            case "value":
                if (a.value === null && b.value === null)
                    return 0;

                if (a.value === null)
                    return multiplier * 1;

                if (b.value === null)
                    return multiplier * -1;

                return multiplier * (a.value - b.value);
            default:
                return 0;
            }
        });
    };

    const filteredAndSortedContracts = useMemo(() => {
        let result = [...contracts];

        if (selectedFolder === "archive") {
            return sortContracts(result, sort);
        }

        if (selectedFolder !== "all" && selectedFolder) {
            result = filterByFolder(result, selectedFolder);
        }

        result = filterByStatus(result, filters.status);
        result = filterByType(result, filters.type);
        result = filterByProject(result, filters.project);
        result = filterByOwner(result, filters.owner);
        result = filterByParty(result, filters.party);

        if (filters.dateRange.from || filters.dateRange.to) {
            try {
                const fromDate = filters.dateRange.from;
                const toDate = filters.dateRange.to;
                const fromStr = fromDate && isValid(fromDate) ? fromDate.toISOString().split("T")[0] : null;
                const toStr = toDate && isValid(toDate) ? toDate.toISOString().split("T")[0] : null;

                if (fromStr || toStr) {
                    result = filterByDateRange(result, fromStr, toStr);
                }
            } catch (error) {}
        }

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();

            result = result.filter(
                contract => contract.title.toLowerCase().includes(searchLower) || contract.projectName.toLowerCase().includes(searchLower) || contract.description.toLowerCase().includes(searchLower)
            );
        }

        return sortContracts(result, sort);
    }, [contracts, filters, selectedFolder, sort]);

    const selectedFolderName = useMemo(() => {
        if (selectedFolder === "all")
            return "All Contracts";

        if (selectedFolder === "archive")
            return "Archive";

        const folder = folders.find(f => f.id === selectedFolder);
        return folder ? folder.name : "";
    }, [selectedFolder, folders]);

    const hasActiveFilters = filters.search !== "" || filters.status !== "all" || filters.type !== "all" || filters.project !== "" || filters.owner !== "" || filters.party !== "" || filters.dateRange.from !== null || filters.dateRange.to !== null;

    useEffect(() => {
        const fetchContracts = async () => {
            try {
                setLoading(true);

                if (isAdmin) {
                    const contractsList = await getContracts();
                    setContracts(contractsList);
                } else if (isLegalTeam || isManagementTeam) {
                    const contractsList = await getUserContracts(currentUser?.email || "");
                    setContracts(contractsList);
                } else if (currentUser?.email) {
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
                if (currentUser?.email) {
                    const foldersList = await getFolders(currentUser.email);
                    setFolders(foldersList);
                } else {
                    setFolders([]);
                }
            } catch (error) {
                setFolders([]);
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                const hasPendingForms = document.querySelector("form[data-pending-changes=\"true\"]");

                if (!hasPendingForms) {
                    fetchContracts();
                    loadFolders();
                }
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);

    return (
        <>
            <AuthNavbar />
            <div className="container mx-auto p-4 sm:p-6">
                <header className="mb-8">
                    <div
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight mb-2">
                                {selectedFolder !== "all" && (<>
                                    <span className="text-muted-foreground mr-2">Folder:</span>
                                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-md">
                                        {selectedFolderName}
                                    </span>
                                </>)}
                                {selectedFolder === "all" && "All Contracts"}
                            </h1>
                            <p className="text-muted-foreground">
                                {selectedFolder !== "all" ? `Viewing contracts in the "${selectedFolderName}" folder` : "Manage and track all your contracts in one place"}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                className="gap-1"
                                disabled={exportLoading}
                                onClick={async () => {
                                    try {
                                        if (filteredAndSortedContracts.length === 0) {
                                            toast.error("No contracts to export");
                                            return;
                                        }

                                        setExportLoading(true);
                                        await exportContractsToExcel(
                                            filteredAndSortedContracts,
                                            `contracts-export-${new Date().toISOString().split('T')[0]}`
                                        );
                                        toast.success("Contracts exported successfully to multi-tab Excel file");
                                    } catch (error) {
                                        toast.error("Failed to export contracts");
                                        console.error("Export error:", error);
                                    } finally {
                                        setExportLoading(false);
                                    }
                                }}>
                                {exportLoading ? (
                                    <span>Exporting...</span>
                                ) : (
                                    <>
                                        <FileDown size={16} />
                                        <span>Export to Excel (Multi-tab)</span>
                                    </>
                                )}
                            </Button>
                            <ContractForm
                                onSave={handleSaveContract}
                                initialFolder={selectedFolder !== "all" ? selectedFolder : undefined}
                                foldersList={folders}
                                trigger={<Button className="gap-1">
                                    <PlusCircle size={16} />
                                    <span>New Contract</span>
                                </Button>} />
                        </div>
                    </div>
                    <FilterBar
                        filters={filters}
                        onFilterChange={handleFilterChange}
                        currentSort={sort}
                        onSortChange={setSort}
                        className="glass p-4 rounded-lg" />
                    {hasActiveFilters && (<div className="mt-4 flex flex-wrap gap-2 items-center">
                        <span className="text-sm text-muted-foreground">Active filters:</span>
                        {filters.status !== "all" && (<Badge variant="secondary" className="flex items-center gap-1">Status: {filters.status}
                            <X
                                size={14}
                                className="cursor-pointer"
                                onClick={() => setFilters({
                                    ...filters,
                                    status: "all"
                                })} />
                        </Badge>)}
                        {filters.type !== "all" && (<Badge variant="secondary" className="flex items-center gap-1">Type: {filters.type}
                            <X
                                size={14}
                                className="cursor-pointer"
                                onClick={() => setFilters({
                                    ...filters,
                                    type: "all"
                                })} />
                        </Badge>)}
                        {filters.project && (<Badge variant="secondary" className="flex items-center gap-1">Project: {filters.project}
                            <X
                                size={14}
                                className="cursor-pointer"
                                onClick={() => setFilters({
                                    ...filters,
                                    project: ""
                                })} />
                        </Badge>)}
                        {filters.owner && (<Badge variant="secondary" className="flex items-center gap-1">Owner: {filters.owner}
                            <X
                                size={14}
                                className="cursor-pointer"
                                onClick={() => setFilters({
                                    ...filters,
                                    owner: ""
                                })} />
                        </Badge>)}
                        {filters.party && (<Badge variant="secondary" className="flex items-center gap-1">Party: {filters.party}
                            <X
                                size={14}
                                className="cursor-pointer"
                                onClick={() => setFilters({
                                    ...filters,
                                    party: ""
                                })} />
                        </Badge>)}
                        {(filters.dateRange.from || filters.dateRange.to) && (<Badge variant="secondary" className="flex items-center gap-1">Dates: {filters.dateRange.from && isValid(filters.dateRange.from) ? format(filters.dateRange.from, "PP") : "Any"}- {filters.dateRange.to && isValid(filters.dateRange.to) ? format(filters.dateRange.to, "PP") : "Any"}
                            <X
                                size={14}
                                className="cursor-pointer"
                                onClick={() => setFilters({
                                    ...filters,

                                    dateRange: {
                                        from: null,
                                        to: null
                                    }
                                })} />
                        </Badge>)}
                    </div>)}
                </header>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-1">
                        <FolderList
                            selectedFolder={selectedFolder}
                            onFolderSelect={setSelectedFolder}
                            onDeleteFolder={handleDeleteFolder}
                            onDropContract={handleDropContract} />
                    </div>
                    <div className="md:col-span-3">
                        {loading ? (<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {[...Array(6)].map((_, i) => (<Skeleton key={i} className="h-48 w-full" />))}
                        </div>) : filteredAndSortedContracts.length > 0 ? (<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredAndSortedContracts.map(contract => (<DraggableContractCard
                                key={contract.id}
                                contract={contract}
                                className="animate-slide-in"
                                onRemoveFromFolder={contractId => handleDropContract(contractId, null)} />))}
                        </div>) : (<div className="text-center py-12 border rounded-lg bg-secondary/30">
                            <h3 className="font-medium text-lg mb-2">No contracts found</h3>
                            <p className="text-muted-foreground mb-6">
                                {contracts.length === 0 ? "You haven't created any contracts yet." : selectedFolder !== "all" ? "This folder doesn't have any contracts yet." : "There are no contracts matching your current filters."}
                            </p>
                            {contracts.length === 0 || selectedFolder !== "all" ? (<ContractForm
                                onSave={handleSaveContract}
                                initialFolder={selectedFolder !== "all" ? selectedFolder : undefined}
                                foldersList={folders}
                                trigger={<Button>Create {selectedFolder !== "all" ? "First Contract in this Folder" : "Your First Contract"}
                                </Button>} />) : (<Button variant="outline" onClick={clearFilters}>Reset Filters
                                                                                                                  </Button>)}
                        </div>)}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Contracts;