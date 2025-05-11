import { useState } from "react";
import { FileText, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Contract, ContractStatus } from "@/lib/data";
import ContractStatusBadge from "./ContractStatusBadge";
import { toast } from "@/components/ui/use-toast";

interface StatusSelectCardProps {
    status: ContractStatus;
    onStatusChange: (status: ContractStatus, additionalData?: Partial<Contract>) => Promise<void>;
    isUpdating: boolean;
    contract: Contract;
}

const StatusSelectCard = (
    {
        status,
        onStatusChange,
        isUpdating,
        contract
    }: StatusSelectCardProps
) => {
    const [isOpen, setIsOpen] = useState(false);

    const workflowStages: ContractStatus[] = [
        "requested",
        "draft",
        "legal_review",
        "management_review",
        "wwf_signing",
        "counterparty_signing",
        "implementation",
        "contract_end"
    ];

    const statusOptions: {
        value: ContractStatus;
        label: string;
    }[] = [{
        value: "requested",
        label: "Requested"
    }, {
        value: "draft",
        label: "Draft"
    }, {
        value: "legal_review",
        label: "Legal Review"
    }, {
        value: "management_review",
        label: "Management Review"
    }, {
        value: "wwf_signing",
        label: "WWF Signing"
    }, {
        value: "counterparty_signing",
        label: "Counterparty Signing"
    }, {
        value: "implementation",
        label: "Implementation"
    }, {
        value: "contract_end",
        label: "Contract End"
    }, {
        value: "amendment",
        label: "Amendment"
    }];

    const amendmentStageOptions: {
        value: string;
        label: string;
    }[] = [{
        value: "amendment",
        label: "Amendment"
    }, {
        value: "legal",
        label: "Legal Review"
    }, {
        value: "wwf",
        label: "WWF Signing"
    }, {
        value: "counterparty",
        label: "Counterparty Signing"
    }];

    const areBothApproved = contract.approvers && (() => {
        const legalApproved = contract.approvers.legal ? Array.isArray(contract.approvers.legal) ? contract.approvers.legal.every(a => a.approved) : contract.approvers.legal.approved : false;
        const managementApproved = contract.approvers.management ? Array.isArray(contract.approvers.management) ? contract.approvers.management.every(a => a.approved) : contract.approvers.management.approved : false;
        return legalApproved && managementApproved;
    })();

    const isEitherSentBack = contract.approvers && (() => {
        const legalSentBack = contract.approvers.legal ? Array.isArray(contract.approvers.legal) ? contract.approvers.legal.some(a => a.declined) : contract.approvers.legal.declined : false;
        const managementSentBack = contract.approvers.management ? Array.isArray(contract.approvers.management) ? contract.approvers.management.some(a => a.declined) : contract.approvers.management.declined : false;
        return legalSentBack || managementSentBack;
    })();

    const handleStatusChange = async (value: string) => {
        const newStatus = value as ContractStatus;

        if (contract.isAmended && contract.status === "amendment") {
            toast({
                title: "Cannot change status during amendment",
                description: "Please use the Amendment Stage card to manage the amendment process.",
                variant: "destructive"
            });

            setIsOpen(false);
            return;
        }

        const currentStageIndex = workflowStages.indexOf(contract.status);
        const newStageIndex = workflowStages.indexOf(newStatus);
        const isMovingForward = newStageIndex > 1 && newStageIndex > currentStageIndex;

        if (isMovingForward) {
            const hasLegalApprovers = contract.approvers?.legal && (Array.isArray(contract.approvers.legal) ? contract.approvers.legal.length > 0 : true);
            const hasManagementApprovers = contract.approvers?.management && (Array.isArray(contract.approvers.management) ? contract.approvers.management.length > 0 : true);

            if (!hasLegalApprovers || !hasManagementApprovers) {
                const missingApprovers = [];

                if (!hasLegalApprovers) {
                    missingApprovers.push("legal team");
                }

                if (!hasManagementApprovers) {
                    missingApprovers.push("management team");
                }

                toast({
                    title: "Cannot change status",
                    description: `You must assign at least one ${missingApprovers.join(" and ")} approver before moving forward in the contract workflow.`,
                    variant: "destructive"
                });

                setIsOpen(false);
                return;
            }
        }

        if (newStatus === "management_review") {
            const hasManagementApprovers = contract.approvers?.management && (Array.isArray(contract.approvers.management) ? contract.approvers.management.length > 0 : true);

            if (!hasManagementApprovers) {
                toast({
                    title: "Cannot change status to Management Review",
                    description: "You must assign at least one management team approver before moving to Management Review status.",
                    variant: "destructive"
                });

                setIsOpen(false);
                return;
            }
        }

        if (newStatus === "wwf_signing") {
            if (isEitherSentBack) {
                const sentBackBy = [];
                const legalApprovers = contract.approvers?.legal && (Array.isArray(contract.approvers.legal) ? contract.approvers.legal : [contract.approvers.legal]);

                if (legalApprovers?.some(a => a.declined)) {
                    sentBackBy.push("Legal");
                }

                const managementApprovers = contract.approvers?.management && (Array.isArray(contract.approvers.management) ? contract.approvers.management : [contract.approvers.management]);

                if (managementApprovers?.some(a => a.declined)) {
                    sentBackBy.push("Management");
                }

                toast({
                    title: "Cannot change status to WWF Signing",
                    description: `This contract has been sent back by: ${sentBackBy.join(", ")}. The approver(s) who sent it back must approve the contract before it can move to WWF Signing status.`,
                    variant: "destructive"
                });

                setIsOpen(false);
                return;
            }

            if (!areBothApproved) {
                const missingApprovals = [];
                const legalApprovers = contract.approvers?.legal && (Array.isArray(contract.approvers.legal) ? contract.approvers.legal : [contract.approvers.legal]);

                if (!legalApprovers || !legalApprovers.every(a => a.approved)) {
                    missingApprovals.push(legalApprovers ? "Legal" : "Legal (not assigned)");
                }

                const managementApprovers = contract.approvers?.management && (Array.isArray(contract.approvers.management) ? contract.approvers.management : [contract.approvers.management]);

                if (!managementApprovers || !managementApprovers.every(a => a.approved)) {
                    missingApprovals.push(managementApprovers ? "Management" : "Management (not assigned)");
                }

                toast({
                    title: "Cannot change status to WWF Signing",
                    description: `This contract requires approval from both legal and management teams before it can move to WWF Signing status. Missing approvals: ${missingApprovals.join(", ")}.`,
                    variant: "destructive"
                });

                setIsOpen(false);
                return;
            }
        }

        if (newStatus === "amendment") {
            if (contract.status !== "wwf_signing" || contract.isAmended !== true) {
                toast({
                    title: "Cannot change status to Amendment",
                    description: "Amendment status is only available during the WWF Signing phase and only for contracts that have been marked for amendment.",
                    variant: "destructive"
                });

                setIsOpen(false);
                return;
            }

            await onStatusChange(newStatus, {
                amendmentStage: "amendment"
            });
        } else {
            await onStatusChange(newStatus);
        }

        setIsOpen(false);
    };

    return (
        <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Status</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <ContractStatusBadge status={status} />
                    </div>
                    {}
                    {contract.isAmended && contract.status === "amendment" && (<p className="text-xs text-amber-600 mt-2 mb-1">Contract is in amendment mode. Original status: {contract.originalStatus?.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                    </p>)}
                    <Select
                        value={status}
                        onValueChange={handleStatusChange}
                        disabled={isUpdating || (contract.isAmended && contract.status === "amendment")}
                        onOpenChange={setIsOpen}
                        open={isOpen}>
                        <SelectTrigger className="w-full mt-2">
                            <SelectValue placeholder="Change status" />
                        </SelectTrigger>
                        <SelectContent>
                            {}
                            {statusOptions.map(option => {
                                const currentIndex = workflowStages.indexOf(status);
                                const optionIndex = workflowStages.indexOf(option.value);
                                const isSpecialStatus = option.value === "draft" || option.value === "management_review" || option.value === "wwf_signing" || option.value === "counterparty_signing" || option.value === "implementation" || option.value === "contract_end";
                                const canAmend = option.value === "amendment" && (status === "wwf_signing") && contract.isAmended === true;
                                const isValidOption = option.value === status || (optionIndex !== -1 && (optionIndex === currentIndex + 1 || optionIndex === currentIndex - 1)) || isSpecialStatus || canAmend;

                                return isValidOption ? (<SelectItem
                                    key={option.value}
                                    value={option.value}
                                    className={status === option.value ? "bg-secondary/40" : ""}>
                                    {option.label}
                                </SelectItem>) : null;
                            })}
                        </SelectContent>
                    </Select>
                    {isUpdating && (<p className="text-xs text-muted-foreground">Updating status...</p>)}
                </div>
            </CardContent>
        </Card>
    );
};

export default StatusSelectCard;