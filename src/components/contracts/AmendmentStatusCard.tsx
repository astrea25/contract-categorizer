import { useState } from "react";
import { FilePenLine } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Contract, ContractStatus } from "@/lib/data";
import { toast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { sendNotificationEmail } from "@/lib/brevoService";

interface AmendmentStatusCardProps {
    contract: Contract;
    onStatusChange: (status: ContractStatus, additionalData?: Partial<Contract>) => Promise<void>;
    isUpdating: boolean;
}

const AmendmentStatusCard = (
    {
        contract,
        onStatusChange,
        isUpdating
    }: AmendmentStatusCardProps
) => {
    const [isOpen, setIsOpen] = useState(false);

    const amendmentStageOptions: {
        value: string;
        label: string;
    }[] = [{
        value: "amendment",
        label: "Amendment"
    }, {
        value: "management",
        label: "Management Review"
    }, {
        value: "wwf",
        label: "WWF Signing"
    }, {
        value: "counterparty",
        label: "Counterparty Signing"
    }];

    if (!contract.isAmended || contract.status !== "amendment") {
        return null;
    }

    const handleAmendmentStageChange = async (value: string) => {
        const isAmendmentStage = amendmentStageOptions.some(option => option.value === value);

        if (isAmendmentStage) {
            const newStageLabel = amendmentStageOptions.find(option => option.value === value)?.label || "Unknown";

            await onStatusChange("amendment", {
                amendmentStage: value as "amendment" | "management" | "wwf" | "counterparty",

                _customTimelineEntry: {
                    action: "Amendment Stage Changed",
                    details: `Amendment stage changed to ${newStageLabel}`
                }
            });

            try {
                if (contract.owner) {
                    const appUrl = import.meta.env.VITE_APP_URL || "https://contract-management-system-omega.vercel.app";
                    const contractUrl = `${appUrl}/contracts/${contract.id}`;

                    await sendNotificationEmail(contract.owner, `Contract Amendment Stage Updated: ${contract.title}`, `
            <div style="font-family: sans-serif;">
              <h2>Contract Amendment Stage Updated</h2>
              <p>The amendment stage for your contract has been updated:</p>

              <ul>
                <li><strong>Contract Title:</strong> ${contract.title}</li>
                <li><strong>Project Name:</strong> ${contract.projectName}</li>
                <li><strong>New Amendment Stage:</strong> ${newStageLabel}</li>
              </ul>

              <p>You can view the contract and track its progress through the amendment process:</p>
              <p><a href="${contractUrl}">Click here to view the contract</a></p>

              <hr>
              <p style="font-size: 12px; color: #666;">This is an automated message from the Contract Management System.</p>
            </div>
            `);
                }
            } catch (error) {}

            setIsOpen(false);
            return;
        }

        if (contract.amendmentStage !== "counterparty") {
            toast({
                title: "Cannot exit amendment mode",
                description: "The amendment process must be completed (reach Counterparty stage) before changing the contract status.",
                variant: "destructive"
            });

            setIsOpen(false);
            return;
        }

        if (contract.originalStatus) {
            const originalStatusLabel = contract.originalStatus.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

            await onStatusChange(contract.originalStatus, {
                isAmended: false,
                amendmentStage: undefined,
                originalStatus: undefined,

                _customTimelineEntry: {
                    action: "Amendment Completed",
                    details: `Contract returned to original status: ${originalStatusLabel}`
                }
            });

            try {
                if (contract.owner) {
                    const appUrl = import.meta.env.VITE_APP_URL || "https://contract-management-system-omega.vercel.app";
                    const contractUrl = `${appUrl}/contracts/${contract.id}`;

                    await sendNotificationEmail(contract.owner, `Contract Amendment Completed: ${contract.title}`, `
            <div style="font-family: sans-serif;">
              <h2>Contract Amendment Process Completed</h2>
              <p>The amendment process for your contract has been completed:</p>

              <ul>
                <li><strong>Contract Title:</strong> ${contract.title}</li>
                <li><strong>Project Name:</strong> ${contract.projectName}</li>
                <li><strong>New Status:</strong> ${originalStatusLabel}</li>
              </ul>

              <p>The contract has been returned to its original status after completing the amendment process.</p>
              <p><a href="${contractUrl}">Click here to view the contract</a></p>

              <hr>
              <p style="font-size: 12px; color: #666;">This is an automated message from the Contract Management System.</p>
            </div>
            `);
                }
            } catch (error) {}

            setIsOpen(false);
            return;
        }
    };

    const currentStage = contract.amendmentStage || "amendment";
    const currentStageLabel = amendmentStageOptions.find(option => option.value === currentStage)?.label || "Amendment";
    const hasManagementApprovers = contract.approvers?.management && (Array.isArray(contract.approvers.management) ? contract.approvers.management.length > 0 : true);
    const hasApproverTeam = contract.approvers?.approver && (Array.isArray(contract.approvers.approver) ? contract.approvers.approver.length > 0 : true);
    const disableManualStageChange = isUpdating;

    return (
        <Card
            className="overflow-hidden transition-all duration-300 hover:shadow-md bg-amber-50 border-amber-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Amendment Stage</CardTitle>
                <FilePenLine className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                            {currentStageLabel}
                        </Badge>
                    </div>
                    <Select
                        value={currentStage}
                        onValueChange={handleAmendmentStageChange}
                        disabled={disableManualStageChange}
                        onOpenChange={setIsOpen}
                        open={isOpen}>
                        <SelectTrigger className="w-full mt-2">
                            <SelectValue placeholder="Change amendment stage" />
                        </SelectTrigger>
                        <SelectContent>
                            {amendmentStageOptions.map(option => {
                                const isCurrentStage = currentStage === option.value;
                                const stageIndex = amendmentStageOptions.findIndex(stage => stage.value === option.value);
                                const currentStageIndex = amendmentStageOptions.findIndex(stage => stage.value === currentStage);
                                const isValidOption = isCurrentStage || stageIndex === currentStageIndex + 1 || stageIndex === currentStageIndex - 1;

                                if (currentStage === "counterparty" && option.value === "counterparty") {
                                    return (
                                        <>
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                                className={isCurrentStage ? "bg-secondary/40" : ""}>
                                                {option.label}
                                            </SelectItem>
                                            {contract.originalStatus && (<SelectItem
                                                key="restore-original"
                                                value={contract.originalStatus}
                                                className="text-green-600 font-medium">Complete Amendment (Return to {contract.originalStatus.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")})
                                                                                                                                                                        </SelectItem>)}
                                        </>
                                    );
                                }

                                return isValidOption ? (<SelectItem
                                    key={option.value}
                                    value={option.value}
                                    className={isCurrentStage ? "bg-secondary/40" : ""}>
                                    {option.label}
                                </SelectItem>) : null;
                            })}
                        </SelectContent>
                    </Select>
                    {isUpdating && (<p className="text-xs text-muted-foreground">Updating amendment stage...</p>)}
                    {(hasManagementApprovers && hasApproverTeam) && (<p className="text-xs text-amber-600 mt-2">Amendment stage will automatically progress based on approvals, but you can still manually change it if needed.
                                                                                    </p>)}
                    {contract.originalStatus && (<p className="text-xs text-amber-600 mt-2">Original status: {contract.originalStatus.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                    </p>)}
                </div>
            </CardContent>
        </Card>
    );
};

export default AmendmentStatusCard;