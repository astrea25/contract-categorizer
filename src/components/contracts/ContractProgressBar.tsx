// Helper function to determine if a stage is completed
// Same level as legal_review
// Same level as management_review
// Same level as legal_review (for backward compatibility)
// Same level as management_review (for backward compatibility)
// If contract is in amendment mode, use the original status for progress visualization
// This "freezes" the main contract progress while in amendment
// If current status is draft, don't consider later stages as completed
// This handles the case where the contract was reset to draft
// No special handling needed for approval and finished statuses as they are no longer used
// For all stages, use standard stageOrder comparison
// Helper function to determine if a stage is current
// If contract is in amendment mode, use the original status for progress visualization
// Each stage is only current if it exactly matches the current status
// Helper function to determine if a stage is sent back
// If contract is in amendment mode, use the original status for progress visualization
// legal_declined is deprecated
// management_declined is deprecated
// Helper function to render a stage node
// Sent back stage
// Completed or current stage
// Special case for contract_end
// Default state
// Text for sent back stages
// Text for contract_end
// Text for completed/current
// Default text
// Helper function to render a horizontal connecting line
// Format status labels for display
/* Main horizontal flow */
/* Requested */
/* Line from Requested to Draft */
/* Draft */
/* Line from Draft to Legal Review */
/* Legal Review */
/* Line from Legal Review to Management Review */
/* Management Review */
/* Line from Management Review to WWF Signing */
/* WWF Signing */
/* Line from WWF Signing to Counterparty Signing */
/* Counterparty Signing */
/* Line from Counterparty Signing to Implementation */
/* Implementation */
/* Line from Implementation to Contract End */
/* Contract End */
/* Show Amendment Progress Bar ONLY if the contract has been explicitly marked as amended */
import React from "react";
import { ContractStatus, Contract } from "@/lib/data";
import { CheckCircle, Circle } from "lucide-react";
import AmendmentProgressBar from "./AmendmentProgressBar";

interface ContractProgressBarProps {
    currentStatus: ContractStatus;
    contract?: Contract;
}

const ContractProgressBar: React.FC<ContractProgressBarProps> = (
    {
        currentStatus,
        contract
    }
) => {
    const isStageCompleted = (stage: ContractStatus) => {
        const stageOrder = {
            "requested": 0,
            "draft": 1,
            "legal_review": 2,
            "management_review": 3,
            "wwf_signing": 4,
            "counterparty_signing": 5,
            "implementation": 6,
            "amendment": 7,
            "contract_end": 8,
            "legal_send_back": 2,
            "management_send_back": 3,
            "legal_declined": 2,
            "management_declined": 3
        };

        const statusToUse = (contract?.isAmended && contract?.status === "amendment" && contract?.originalStatus) ? contract.originalStatus : currentStatus;
        const currentStageValue = stageOrder[statusToUse] || 0;
        const stageValue = stageOrder[stage] || 0;

        if (statusToUse === "draft" && stageValue > 1) {
            return false;
        }

        return stageValue < currentStageValue;
    };

    const isStageCurrent = (stage: ContractStatus) => {
        const statusToUse = (contract?.isAmended && contract?.status === "amendment" && contract?.originalStatus) ? contract.originalStatus : currentStatus;
        return stage === statusToUse;
    };

    const isStageSentBack = (stage: ContractStatus) => {
        const statusToUse = (contract?.isAmended && contract?.status === "amendment" && contract?.originalStatus) ? contract.originalStatus : currentStatus;

        if (stage === "legal_review") {
            return statusToUse === "legal_send_back" || statusToUse === "legal_declined";
        }

        if (stage === "management_review") {
            return statusToUse === "management_send_back" || statusToUse === "management_declined";
        }

        return false;
    };

    const renderStageNode = (status: ContractStatus, label: string) => {
        const isCompleted = isStageCompleted(status);
        const isCurrent = isStageCurrent(status);
        const isSentBack = isStageSentBack(status);

        return (
            <div className="flex flex-col items-center relative">
                <div
                    className={`flex items-center justify-center w-14 h-14 rounded-full z-10 border
            ${isSentBack ? "bg-red-500 text-white border-red-500" : isCompleted || isCurrent ? "bg-blue-500 text-white border-blue-500" : status === "contract_end" ? "bg-white text-green-500 border-green-500 border-2" : "bg-white text-muted-foreground border-gray-300"}`}>
                    {isCompleted || isCurrent || isSentBack ? (<CheckCircle className="w-6 h-6" />) : (<Circle className="w-6 h-6" />)}
                </div>
                <span
                    className={`absolute top-16 text-xs whitespace-nowrap text-center
            ${isSentBack ? "text-red-500 font-medium" : status === "contract_end" ? "text-green-500 font-medium" : isCompleted || isCurrent ? "text-blue-500 font-medium" : "text-muted-foreground"}`}>
                    {label}
                </span>
            </div>
        );
    };

    const renderHorizontalLine = (isCompleted: boolean) => (<div className="flex items-center justify-center w-16 relative">
        <div className={`w-full h-1 ${isCompleted ? "bg-blue-500" : "bg-gray-300"}`}></div>
    </div>);

    const formatStatusLabel = (status: ContractStatus): string => {
        return status.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    };

    return (
        <div className="w-full py-8">
            <h3 className="font-medium text-base mb-6">Contract Progress</h3>
            <div className="flex flex-col w-full">
                <div className="flex justify-center items-center w-full overflow-x-auto pb-8">
                    {}
                    <div className="flex items-center justify-start min-w-max">
                        {}
                        {renderStageNode("requested", "Requested")}
                        {}
                        {renderHorizontalLine(isStageCompleted("requested"))}
                        {}
                        {renderStageNode("draft", "Draft")}
                        {}
                        {renderHorizontalLine(isStageCompleted("draft"))}
                        {}
                        {renderStageNode("legal_review", "Legal Review")}
                        {}
                        {renderHorizontalLine(isStageCompleted("legal_review"))}
                        {}
                        {renderStageNode("management_review", "Management Review")}
                        {}
                        {renderHorizontalLine(isStageCompleted("management_review"))}
                        {}
                        {renderStageNode("wwf_signing", "WWF Signing")}
                        {}
                        {renderHorizontalLine(isStageCompleted("wwf_signing"))}
                        {}
                        {renderStageNode("counterparty_signing", "Counterparty Signing")}
                        {}
                        {renderHorizontalLine(isStageCompleted("counterparty_signing"))}
                        {}
                        {renderStageNode("implementation", "Implementation")}
                        {}
                        {renderHorizontalLine(isStageCompleted("implementation"))}
                        {}
                        {renderStageNode("contract_end", "Contract End")}
                    </div>
                </div>
            </div>
            {}
            {contract?.isAmended === true && (<div className="mt-8 border-t pt-4">
                <AmendmentProgressBar
                    key={`amendment-progress-${contract?.amendmentStage || "amendment"}`}
                    currentStatus={currentStatus}
                    amendmentStage={contract?.amendmentStage || "amendment"} />
            </div>)}
        </div>
    );
};

export default ContractProgressBar;