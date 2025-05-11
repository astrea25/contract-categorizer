// Helper function to determine if a stage is completed
// Make sure we're using the correct amendment stage
// Stage value comparison for determining completion
// A stage is completed if:
// 1. It's not the current stage (current stage should be marked as "current", not "completed")
// 2. Its value is less than or equal to the current stage value
// Helper function to determine if a stage is current
// Helper function to render a stage node
// Current stage
// Completed stage
// Default state
// Text for current stage
// Text for completed stage
// Default text
// Helper function to render a horizontal connecting line
// A line should be highlighted if the stage before it is completed or is the current stage
/* Amendment flow */
/* Amendment */
/* Line from Amendment to Management */
/* Management */
/* Line from Management to WWF */
/* WWF */
/* Line from WWF to Counterparty */
/* Counterparty */
import React from "react";
import { ContractStatus } from "@/lib/data";
import { CheckCircle, Circle } from "lucide-react";

interface AmendmentProgressBarProps {
    currentStatus: ContractStatus;
    amendmentStage?: "amendment" | "management" | "wwf" | "counterparty";
}

const AmendmentProgressBar: React.FC<AmendmentProgressBarProps> = (
    {
        currentStatus,
        amendmentStage = "amendment"
    }
) => {
    const isStageCompleted = (stage: string) => {
        const stageOrder = {
            "amendment": 0,
            "management": 1,
            "wwf": 2,
            "counterparty": 3
        };

        const currentStageValue = stageOrder[amendmentStage] || 0;
        const stageValue = stageOrder[stage] || 0;
        return stage !== amendmentStage && stageValue <= currentStageValue;
    };

    const isStageCurrent = (stage: string) => {
        return stage === amendmentStage;
    };

    const renderStageNode = (stage: string, label: string) => {
        const isCompleted = isStageCompleted(stage);
        const isCurrent = isStageCurrent(stage);

        return (
            <div className="flex flex-col items-center relative">
                <div
                    className={`flex items-center justify-center w-14 h-14 rounded-full z-10 border
            ${isCurrent ? "bg-amber-500 text-white border-amber-500" : isCompleted ? "bg-amber-400 text-white border-amber-400" : "bg-white text-muted-foreground border-gray-300"}`}>
                    {isCompleted ? (<CheckCircle className="w-6 h-6" />) : isCurrent ? (<CheckCircle className="w-6 h-6" />) : (<Circle className="w-6 h-6" />)}
                </div>
                <span
                    className={`absolute top-16 text-xs whitespace-nowrap text-center
            ${isCurrent ? "text-amber-500 font-bold" : isCompleted ? "text-amber-500 font-medium" : "text-muted-foreground"}`}>
                    {label}
                </span>
            </div>
        );
    };

    const renderHorizontalLine = (stage: string) => {
        const isHighlighted = isStageCompleted(stage) || isStageCurrent(stage);

        return (
            <div className="flex items-center justify-center w-16 relative">
                <div
                    className={`w-full h-1 ${isHighlighted ? "bg-amber-500" : "bg-gray-300"}`}></div>
            </div>
        );
    };

    return (
        <div className="w-full py-4">
            <h3 className="font-medium text-base mb-6">Amendment Progress</h3>
            <div className="flex flex-col w-full">
                <div className="flex justify-center items-center w-full overflow-x-auto pb-8">
                    {}
                    <div className="flex items-center justify-start min-w-max">
                        {}
                        {renderStageNode("amendment", "Amendment")}
                        {}
                        {renderHorizontalLine("amendment")}
                        {}
                        {renderStageNode("management", "Management")}
                        {}
                        {renderHorizontalLine("management")}
                        {}
                        {renderStageNode("wwf", "WWF")}
                        {}
                        {renderHorizontalLine("wwf")}
                        {}
                        {renderStageNode("counterparty", "Counterparty")}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AmendmentProgressBar;