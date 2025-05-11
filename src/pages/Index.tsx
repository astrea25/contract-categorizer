import { useState, useEffect } from "react";
import { differenceInDays, parseISO, format } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import {
    getContractStats,
    getContracts,
    Contract,
    getUserContractStats,
    getUserContracts,
    normalizeApprovers,
} from "@/lib/data";

import { getContractsForApproval, getRespondedContracts } from "@/lib/approval-utils";
import { fixInconsistentApprovalStates } from "@/lib/fix-approvals";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { ArrowRight, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Link, useNavigate } from "react-router-dom";
import AuthNavbar from "@/components/layout/AuthNavbar";
import ContractCard from "@/components/contracts/ContractCard";
import PageTransition from "@/components/layout/PageTransition";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

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
    const [sentBackContracts, setSentBackContracts] = useState<Contract[]>([]);
    const [allContracts, setAllContracts] = useState<Contract[]>([]);
    const [expiringContractsList, setExpiringContractsList] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const [isFixingApprovals, setIsFixingApprovals] = useState(false);

    const {
        currentUser,
        isAdmin,
        isLegalTeam,
        isManagementTeam,
        isApprover
    } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                try {
                    await fixInconsistentApprovalStates();
                } catch (error) {}

                if (isAdmin) {
                    const contractStats = await getContractStats();
                    setStats(contractStats);
                    const fetchedContracts = await getContracts();
                    setAllContracts(fetchedContracts);

                    const recentContracts = [...fetchedContracts].sort(
                        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                    ).slice(0, 5);

                    setContracts(recentContracts);
                } else if (isLegalTeam || isManagementTeam || isApprover) {
                    const contractStats = await getUserContractStats(currentUser?.email || "");
                    const userContracts = await getUserContracts(currentUser?.email || "");
                    const normalizedContracts = userContracts.map(contract => normalizeApprovers(contract));

                    const approved = normalizedContracts.filter(c => {
                        const userEmail = currentUser?.email || "";

                        if (isLegalTeam && c.approvers?.legal) {
                            const legalApprovers = Array.isArray(c.approvers.legal) ? c.approvers.legal : [c.approvers.legal];
                            const userApprover = legalApprovers.find(a => a.email === userEmail);
                            return userApprover?.approved === true;
                        }

                        if (isManagementTeam && c.approvers?.management) {
                            const managementApprovers = Array.isArray(c.approvers.management) ? c.approvers.management : [c.approvers.management];
                            const userApprover = managementApprovers.find(a => a.email === userEmail);
                            return userApprover?.approved === true;
                        }

                        if (isApprover && c.approvers?.approver) {
                            const approvers = Array.isArray(c.approvers.approver) ? c.approvers.approver : [c.approvers.approver];
                            const userApprover = approvers.find(a => a.email === userEmail);
                            return userApprover?.approved === true;
                        }

                        return false;
                    });

                    setApprovedContracts(approved);

                    const sentBack = normalizedContracts.filter(c => {
                        const userEmail = currentUser?.email || "";

                        if (isLegalTeam && c.approvers?.legal) {
                            const legalApprovers = Array.isArray(c.approvers.legal) ? c.approvers.legal : [c.approvers.legal];
                            const userApprover = legalApprovers.find(a => a.email === userEmail);
                            return userApprover?.declined === true;
                        }

                        if (isManagementTeam && c.approvers?.management) {
                            const managementApprovers = Array.isArray(c.approvers.management) ? c.approvers.management : [c.approvers.management];
                            const userApprover = managementApprovers.find(a => a.email === userEmail);
                            return userApprover?.declined === true;
                        }

                        if (isApprover && c.approvers?.approver) {
                            const approvers = Array.isArray(c.approvers.approver) ? c.approvers.approver : [c.approvers.approver];
                            const userApprover = approvers.find(a => a.email === userEmail);
                            return userApprover?.declined === true;
                        }

                        return false;
                    });

                    setSentBackContracts(sentBack);
                    const freshContracts = await getContracts(false);
                    const contractsForApproval = await getContractsForApproval(currentUser?.email || "", isLegalTeam, isManagementTeam, isApprover);
                    const respondedContracts = await getRespondedContracts(currentUser?.email || "", isLegalTeam, isManagementTeam, isApprover);
                    const awaitingResponseCount = contractsForApproval.length;

                    const directCount = normalizedContracts.filter(contract => {
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

                        if (isLegalTeam) {
                            if (contract.status === "legal_review" || contract.status === "approval" || contract.status === "legal_send_back" || contract.status === "legal_declined") {
                                if (!contract.approvers || !contract.approvers.legal || (Array.isArray(contract.approvers.legal) && contract.approvers.legal.length === 0)) {
                                    return true;
                                }

                                const legalApprovers = Array.isArray(contract.approvers.legal) ? contract.approvers.legal : [contract.approvers.legal];

                                const userLegalApprover = legalApprovers.find(
                                    approver => approver.email.toLowerCase() === currentUser.email.toLowerCase()
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
                                if (!contract.approvers || !contract.approvers.management || (Array.isArray(contract.approvers.management) && contract.approvers.management.length === 0)) {
                                    return true;
                                }

                                const managementApprovers = Array.isArray(contract.approvers.management) ? contract.approvers.management : [contract.approvers.management];

                                const userManagementApprover = managementApprovers.find(
                                    approver => approver.email.toLowerCase() === currentUser.email.toLowerCase()
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
                                if (!contract.approvers || !contract.approvers.approver || (Array.isArray(contract.approvers.approver) && contract.approvers.approver.length === 0)) {
                                    return true;
                                }

                                const approversList = Array.isArray(contract.approvers.approver) ? contract.approvers.approver : [contract.approvers.approver];

                                const userApprover = approversList.find(
                                    approver => approver.email.toLowerCase() === currentUser.email.toLowerCase()
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
                    }).length;

                    const pendingCount = Math.max(directCount, contractsForApproval.length, awaitingResponseCount);
                    const respondedCount = respondedContracts.length;

                    const updatedStats = {
                        ...contractStats,
                        pendingApprovalContracts: awaitingResponseCount > 0 ? awaitingResponseCount : pendingCount
                    };

                    setStats(updatedStats);
                    const fetchedContracts = await getUserContracts(currentUser?.email || "");
                    setAllContracts(fetchedContracts);

                    const recentContracts = [...fetchedContracts].sort(
                        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                    ).slice(0, 5);

                    setContracts(recentContracts);
                } else if (currentUser?.email) {
                    const contractStats = await getUserContractStats(currentUser.email);
                    setStats(contractStats);
                    const userContracts = await getUserContracts(currentUser.email);
                    setAllContracts(userContracts);

                    const recentContracts = [...userContracts].sort(
                        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                    ).slice(0, 5);

                    setContracts(recentContracts);
                }

                setAllContracts(prevAllContracts => {
                    const today = new Date();
                    const thirtyDaysFromNow = new Date(today);
                    thirtyDaysFromNow.setDate(today.getDate() + 30);

                    const expiringSoon = prevAllContracts.filter(contract => {
                        if (!contract.endDate)
                            return false;

                        const endDateStr = typeof contract.endDate === "string" ? contract.endDate : (contract.endDate as any)?.toDate?.().toISOString();

                        if (!endDateStr)
                            return false;

                        try {
                            const endDate = parseISO(endDateStr);
                            return endDate >= today && endDate <= thirtyDaysFromNow;
                        } catch (e) {
                            return false;
                        }
                    });

                    setExpiringContractsList(expiringSoon);
                    return prevAllContracts;
                });
            } catch (error) {} finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser, isAdmin, isLegalTeam, isManagementTeam, isApprover]);

    const COLORS = {
        requested: "#3b82f6",
        draft: "#6b7280",
        legal_review: "#8b5cf6",
        management_review: "#f97316",
        wwf_signing: "#4f46e5",
        counterparty_signing: "#ec4899",
        implementation: "#06b6d4",
        amendment: "#f59e0b",
        contract_end: "#22c55e",
        legal_send_back: "#ef4444",
        management_send_back: "#ef4444"
    };

    const chartData = [{
        name: "Requested",
        value: allContracts.filter(c => c.status === "requested").length,
        color: COLORS.requested
    }, {
        name: "Draft",
        value: allContracts.filter(c => c.status === "draft").length,
        color: COLORS.draft
    }, {
        name: "Legal Review",
        value: allContracts.filter(c => c.status === "legal_review").length,
        color: COLORS.legal_review
    }, {
        name: "Management Review",
        value: allContracts.filter(c => c.status === "management_review").length,
        color: COLORS.management_review
    }, {
        name: "WWF Signing",
        value: allContracts.filter(c => c.status === "wwf_signing").length,
        color: COLORS.wwf_signing
    }, {
        name: "Counterparty Signing",
        value: allContracts.filter(c => c.status === "counterparty_signing").length,
        color: COLORS.counterparty_signing
    }, {
        name: "Implementation",
        value: allContracts.filter(c => c.status === "implementation").length,
        color: COLORS.implementation
    }, {
        name: "Amendment",
        value: allContracts.filter(c => c.status === "amendment").length,
        color: COLORS.amendment
    }, {
        name: "Contract End",
        value: allContracts.filter(c => c.status === "contract_end").length,
        color: COLORS.contract_end
    }, {
        name: "Legal Send Back",
        value: allContracts.filter(c => c.status === "legal_send_back" || c.status === "legal_declined").length,
        color: COLORS.legal_send_back
    }, {
        name: "Management Send Back",

        value: allContracts.filter(
            c => c.status === "management_send_back" || c.status === "management_declined"
        ).length,

        color: COLORS.management_send_back
    }];

    const filteredChartData = chartData.filter(item => item.value > 0);

    const statusMap: Record<string, string> = {
        "Requested": "requested",
        "Draft": "draft",
        "Legal Review": "legal_review",
        "Management Review": "management_review",
        "WWF Signing": "wwf_signing",
        "Counterparty Signing": "counterparty_signing",
        "Implementation": "implementation",
        "Amendment": "amendment",
        "Contract End": "contract_end",
        "Legal Send Back": "legal_send_back",
        "Management Send Back": "management_send_back"
    };

    const handlePieClick = (data: any) => {
        const status = statusMap[data.name];

        if (status) {
            navigate(`/contracts?status=${status}`);
        }
    };

    const handleFixApprovals = async () => {
        if (!isAdmin)
            return;

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

    const handleLegendClick = (data: any) => {
        handlePieClick(data);
    };

    const handlePieEnter = (data: any, index: number) => {
        if (data && typeof index === "number" && filteredChartData[index]) {
            setActiveIndex(index);
        }
    };

    const handlePieLeave = () => {
        setActiveIndex(null);
    };

    const getDaysSinceLastEdit = (updatedAt: string | null): string => {
        if (!updatedAt)
            return "N/A";

        try {
            const lastEditDate = parseISO(updatedAt);
            const days = differenceInDays(new Date(), lastEditDate);

            if (days === 0)
                return "today";

            if (days === 1)
                return "yesterday";

            return `${days} days ago`;
        } catch (e) {
            return "N/A";
        }
    };

    const getLastEditorDisplay = (contract: Contract): string => {
        if (!contract.timeline || contract.timeline.length === 0) {
            return contract.owner;
        }

        const latestEntry = [...contract.timeline].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];

        return latestEntry.userName || latestEntry.userEmail || "Unknown User";
    };

    const formatStatus = (status: string): string => {
        let formatted = status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

        if (status === "legal_declined" || status === "management_declined") {
            formatted = formatted.replace("Declined", "Sent Back");
        }

        return formatted;
    };

    return (
        <PageTransition>
            <AuthNavbar />
            <div className="container mx-auto p-4 sm:p-6">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Contract Management Dashboard</h1>
                    <p className="text-muted-foreground">Overview of your contract portfolio and key metrics
                                                                                  </p>
                </header>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                {isLegalTeam || isManagementTeam || isApprover ? "Awaiting Your Response" : "Total Contracts"}
                            </CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            {loading ? (<Skeleton className="h-8 w-16" />) : (<>
                                <div className="text-2xl font-bold">
                                    {isLegalTeam || isManagementTeam || isApprover ? (<>
                                        {stats.pendingApprovalContracts > 0 ? stats.pendingApprovalContracts : 1}
                                    </>) : stats.totalContracts}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {isLegalTeam || isManagementTeam || isApprover ? "Contracts waiting for your approval/response" : "Across all projects and types"}
                                </p>
                                <Link
                                    to={isLegalTeam || isManagementTeam || isApprover ? "/contracts?status=awaiting_response" : "/contracts"}
                                    className="text-xs text-primary hover:underline inline-flex items-center mt-2">
                                    {isLegalTeam || isManagementTeam || isApprover ? "View contracts needing response" : "View all contracts"}
                                    <ArrowRight className="h-3 w-3 ml-1" />
                                </Link>
                            </>)}
                        </CardContent>
                    </Card>
                    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                {isLegalTeam || isManagementTeam || isApprover ? "Total Contracts" : "Contracts Ended"}
                            </CardTitle>
                            <FileText className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            {loading ? (<Skeleton className="h-8 w-16" />) : (<>
                                <div className="text-2xl font-bold">
                                    {isLegalTeam || isManagementTeam || isApprover ? (<>
                                        {stats.totalContracts}
                                    </>) : stats.finishedContracts}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {isLegalTeam || isManagementTeam || isApprover ? "All contracts assigned to you" : "Contracts at end stage"}
                                </p>
                                <Link
                                    to={isLegalTeam || isManagementTeam || isApprover ? "/contracts" : "/contracts?status=contract_end"}
                                    className="text-xs text-primary hover:underline inline-flex items-center mt-2">
                                    {isLegalTeam || isManagementTeam || isApprover ? "View all your contracts" : "View ended contracts"}
                                    <ArrowRight className="h-3 w-3 ml-1" />
                                </Link>
                            </>)}
                        </CardContent>
                    </Card>
                    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                {isLegalTeam || isManagementTeam || isApprover ? "Approved" : "Expiring Soon"}
                            </CardTitle>
                            {isLegalTeam || isManagementTeam || isApprover ? (<Calendar className="h-4 w-4 text-green-500" />) : (<Calendar className="h-4 w-4 text-yellow-500" />)}
                        </CardHeader>
                        <CardContent>
                            {loading ? (<Skeleton className="h-8 w-16" />) : (<>
                                <div className="text-2xl font-bold">
                                    {isLegalTeam || isManagementTeam || isApprover ? (approvedContracts.length) : (stats.expiringContracts)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {isLegalTeam || isManagementTeam || isApprover ? "Contracts you have approved" : "Within the next 30 days"}
                                </p>
                                <Link
                                    to={isLegalTeam || isManagementTeam || isApprover ? "/contracts?filter=my_approved" : "/contracts?filter=expiringSoon"}
                                    className="text-xs text-primary hover:underline inline-flex items-center mt-2">
                                    {isLegalTeam || isManagementTeam || isApprover ? "View approved contracts" : "View expiring soon"}
                                    <ArrowRight className="h-3 w-3 ml-1" />
                                </Link>
                            </>)}
                        </CardContent>
                    </Card>
                    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                {isLegalTeam || isManagementTeam || isApprover ? "Sent Back" : "Expiring This Year"}
                            </CardTitle>
                            {isLegalTeam || isManagementTeam || isApprover ? (<Calendar className="h-4 w-4 text-red-500" />) : (<Calendar className="h-4 w-4 text-green-500" />)}
                        </CardHeader>
                        <CardContent>
                            {loading ? (<Skeleton className="h-8 w-16" />) : (<>
                                <div className="text-2xl font-bold">
                                    {isLegalTeam || isManagementTeam || isApprover ? (sentBackContracts.length) : (stats.expiringThisYear)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {isLegalTeam || isManagementTeam || isApprover ? "Contracts you have sent back" : `Contracts expiring in ${new Date().getFullYear()}`}
                                </p>
                                <Link
                                    to={isLegalTeam || isManagementTeam || isApprover ? "/contracts?filter=my_sent_back" : "/contracts?filter=expiringThisYear"}
                                    className="text-xs text-primary hover:underline inline-flex items-center mt-2">
                                    {isLegalTeam || isManagementTeam || isApprover ? "View sent back contracts" : "View all expiring this year"}
                                    <ArrowRight className="h-3 w-3 ml-1" />
                                </Link>
                            </>)}
                        </CardContent>
                    </Card>
                </div>
                <div className="grid gap-6 md:grid-cols-2 mb-8">
                    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
                        <CardHeader>
                            <CardTitle>Contract Status Overview</CardTitle>
                            <CardDescription>Distribution of contracts by status
                                                                                                              </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (<div className="h-[200px] flex items-center justify-center">
                                <Skeleton className="h-full w-full" />
                            </div>) : (<div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={filteredChartData.length > 0 ? filteredChartData : [{
                                                name: "No Data",
                                                value: 1,
                                                color: "#e5e7eb"
                                            }]}
                                            cx="50%"
                                            cy="45%"
                                            labelLine={false}
                                            innerRadius={0}
                                            outerRadius={90}
                                            paddingAngle={1}
                                            fill="#8884d8"
                                            dataKey="value"
                                            nameKey="name"
                                            onClick={handlePieClick}
                                            onMouseEnter={handlePieEnter}
                                            onMouseLeave={handlePieLeave}
                                            style={{
                                                cursor: "pointer"
                                            }}
                                            label={null}>
                                            {filteredChartData.map((entry, index) => (<Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                                style={{
                                                    filter: activeIndex === index ? "drop-shadow(0 0 8px rgba(0, 0, 0, 0.3))" : "none",
                                                    transform: activeIndex === index ? "scale(1.05)" : "scale(1)",
                                                    transformOrigin: "center",
                                                    transition: "transform 1s ease, filter 1s ease, opacity 1s ease",
                                                    opacity: activeIndex === null || activeIndex === index ? 1 : 0.7
                                                }} />))}
                                        </Pie>
                                        <Legend
                                            layout="vertical"
                                            verticalAlign="middle"
                                            align="right"
                                            wrapperStyle={{
                                                paddingLeft: 20
                                            }}
                                            iconSize={10}
                                            onClick={handleLegendClick}
                                            formatter={(value, _entry, index) => {
                                                if (filteredChartData.length === 0 || value === "No Data") {
                                                    return <span className="text-sm">No contracts</span>;
                                                }

                                                const item = filteredChartData[index];
                                                const isActive = activeIndex === index;

                                                return (
                                                    <div
                                                        className={`flex items-center gap-2 cursor-pointer ${isActive ? "scale-105" : "hover:opacity-80"}`}
                                                        style={{
                                                            transition: "all 1s ease",
                                                            transform: isActive ? "translateX(4px)" : "none"
                                                        }}>
                                                        <span className="text-sm">{value}</span>
                                                        <span
                                                            className="font-bold text-xs px-2 py-0.5 rounded-full"
                                                            style={{
                                                                backgroundColor: item.color + (isActive ? "40" : "20"),
                                                                color: item.color,
                                                                border: `1px solid ${item.color}${isActive ? "80" : "40"}`,
                                                                boxShadow: isActive ? `0 0 8px ${item.color}40` : "none",
                                                                transition: "all 1s ease"
                                                            }}>
                                                            {item.value}
                                                        </span>
                                                    </div>
                                                );
                                            }} />
                                        {}
                                        {}
                                        {activeIndex !== null && filteredChartData[activeIndex] && (<foreignObject
                                            x="0"
                                            y="0"
                                            width="100%"
                                            height="100%"
                                            style={{
                                                overflow: "visible",
                                                pointerEvents: "none"
                                            }}>
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    top: "50%",
                                                    left: "50%",
                                                    transform: "translate(-50%, -50%)",
                                                    backgroundColor: filteredChartData[activeIndex].color,
                                                    color: "white",
                                                    padding: "8px 12px",
                                                    borderRadius: "8px",
                                                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
                                                    fontWeight: "bold",
                                                    fontSize: "16px",
                                                    zIndex: 10,
                                                    transition: "all 0.2s ease",
                                                    opacity: 0.95,
                                                    border: "2px solid white",
                                                    pointerEvents: "none"
                                                }}>
                                                {filteredChartData[activeIndex].name}: {filteredChartData[activeIndex].value}
                                            </div>
                                        </foreignObject>)}
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>)}
                        </CardContent>
                    </Card>
                    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Contract Progress Statistics</CardTitle>
                                <CardDescription>Number of contracts in each stage
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
                            {loading ? (<div className="space-y-4">
                                {[...Array(3)].map((_, i) => (<div
                                    key={i}
                                    className="flex justify-between items-center border-b pb-3 last:border-0">
                                    <Skeleton className="h-14 w-full" />
                                </div>))}
                            </div>) : (<div className="space-y-4">
                                {chartData.map(item => (<div
                                    key={item.name}
                                    className="flex justify-between items-center border-b pb-3 last:border-0 cursor-pointer hover:bg-secondary/50 px-2 -mx-2 rounded transition-colors"
                                    onClick={() => handlePieClick(item)}
                                    style={{
                                        transition: "all 0.2s ease"
                                    }}>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{
                                                backgroundColor: item.color
                                            }} />
                                        <h4 className="font-medium">{item.name}</h4>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium">{item.value}contracts</p>
                                    </div>
                                </div>))}
                                {chartData.length === 0 && (<p className="text-center text-muted-foreground py-4">No contracts found
                                                                                                                                </p>)}
                            </div>)}
                        </CardContent>
                    </Card>
                </div>
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold tracking-tight">Recent Contracts</h2>
                        <div className="flex gap-2">
                            {isAdmin && (<Button
                                variant="outline"
                                onClick={handleFixApprovals}
                                disabled={isFixingApprovals}>
                                {isFixingApprovals ? "Fixing..." : "Fix Approval States"}
                            </Button>)}
                            <Button asChild>
                                <Link to="/contracts">View All Contracts</Link>
                            </Button>
                        </div>
                    </div>
                    {loading ? (<div className="space-y-4">
                        {[...Array(3)].map((_, i) => (<Skeleton key={i} className="h-12 w-full" />))}
                    </div>) : (contracts.length > 0 ? (<Card>
                        <CardContent className="p-0"> {}
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
                                    {contracts.map(contract => (<TableRow key={contract.id}>
                                        <TableCell>
                                            <Link
                                                to={`/contract/${contract.id}`}
                                                className="font-medium hover:underline text-primary">
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
                                            <Button variant="outline" size="sm" asChild>
                                                <Link to={`/contract/${contract.id}`}>View</Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>) : (<p className="text-sm text-muted-foreground text-center py-4">No recent contract activity.
                                                                                      </p>))}
                </div>
            </div>
        </PageTransition>
    );
};

export default Index;