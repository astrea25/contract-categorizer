import React from 'react';
import { ContractStatus, Contract } from '@/lib/data';
import { CheckCircle, Circle } from 'lucide-react';
import AmendmentProgressBar from './AmendmentProgressBar';

interface ContractProgressBarProps {
  currentStatus: ContractStatus;
  contract?: Contract;
}

const ContractProgressBar: React.FC<ContractProgressBarProps> = ({
  currentStatus,
  contract,
}) => {
  // Helper function to determine if a stage is completed
  const isStageCompleted = (stage: ContractStatus) => {
    const stageOrder = {
      'requested': 0,
      'draft': 1,
      'legal_review': 2,
      'management_review': 3,
      'wwf_signing': 4,
      'counterparty_signing': 5,
      'implementation': 6,
      'amendment': 7,
      'contract_end': 8,
      'legal_send_back': 2, // Same level as legal_review
      'management_send_back': 3, // Same level as management_review
      'legal_declined': 2, // Same level as legal_review (for backward compatibility)
      'management_declined': 3, // Same level as management_review (for backward compatibility)
      'approval': 9,
      'finished': 10
    };

    const currentStageValue = stageOrder[currentStatus] || 0;
    const stageValue = stageOrder[stage] || 0;

    // If current status is draft, don't consider later stages as completed
    // This handles the case where the contract was reset to draft
    if (currentStatus === 'draft' && stageValue > 1) {
      return false;
    }

    // Special handling for approval and finished statuses
    // If we're checking if approval is completed and current status is contract_end,
    // we should return true for backward compatibility
    if (stage === 'approval' &&
        (currentStatus === 'contract_end' || currentStatus === 'amendment' || currentStatus === 'implementation')) {
      return true;
    }

    // For all stages, use standard stageOrder comparison
    return stageValue < currentStageValue;
  };

  // Helper function to determine if a stage is current
  const isStageCurrent = (stage: ContractStatus) => {
    // Each stage is only current if it exactly matches the current status
    return stage === currentStatus;
  };

  // Helper function to determine if a stage is sent back
  const isStageSentBack = (stage: ContractStatus) => {
    if (stage === 'legal_review') {
      return currentStatus === 'legal_send_back' || currentStatus === 'legal_declined'; // legal_declined is deprecated
    }

    if (stage === 'management_review') {
      return currentStatus === 'management_send_back' || currentStatus === 'management_declined'; // management_declined is deprecated
    }

    return false;
  };

  // Helper function to render a stage node
  const renderStageNode = (status: ContractStatus, label: string) => {
    const isCompleted = isStageCompleted(status);
    const isCurrent = isStageCurrent(status);
    const isSentBack = isStageSentBack(status);

    return (
      <div className="flex flex-col items-center relative">
        <div
          className={`flex items-center justify-center w-14 h-14 rounded-full z-10 border
            ${isSentBack
              ? 'bg-red-500 text-white border-red-500' // Sent back stage
              : isCompleted || isCurrent
                ? 'bg-blue-500 text-white border-blue-500' // Completed or current stage
                : status === 'contract_end'
                  ? 'bg-white text-blue-500 border-blue-500 border-2' // Special case for contract_end
                  : 'bg-white text-muted-foreground border-gray-300' // Default state
            }`}
        >
          {isCompleted || isCurrent || isSentBack ? (
            <CheckCircle className="w-6 h-6" />
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </div>

        <span
          className={`absolute top-16 text-xs whitespace-nowrap text-center
            ${isSentBack
              ? 'text-red-500 font-medium' // Text for sent back stages
              : isCompleted || isCurrent
                ? 'text-blue-500 font-medium' // Text for completed/current
                : 'text-muted-foreground' // Default text
            }`}
        >
          {label}
        </span>
      </div>
    );
  };

  // Helper function to render a horizontal connecting line
  const renderHorizontalLine = (isCompleted: boolean) => (
    <div className="flex items-center justify-center w-16 relative">
      <div className={`w-full h-1 ${isCompleted ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
    </div>
  );

  // Format status labels for display
  const formatStatusLabel = (status: ContractStatus): string => {
    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="w-full py-8">
      <h3 className="font-medium text-base mb-6">Contract Progress</h3>

      <div className="flex flex-col w-full">
        <div className="flex justify-center items-center w-full overflow-x-auto pb-8">
          {/* Main horizontal flow */}
          <div className="flex items-center justify-start min-w-max">
            {/* Requested */}
            {renderStageNode('requested', 'Requested')}

            {/* Line from Requested to Draft */}
            {renderHorizontalLine(isStageCompleted('requested'))}

            {/* Draft */}
            {renderStageNode('draft', 'Draft')}

            {/* Line from Draft to Legal Review */}
            {renderHorizontalLine(isStageCompleted('draft'))}

            {/* Legal Review */}
            {renderStageNode('legal_review', 'Legal Review')}

            {/* Line from Legal Review to Management Review */}
            {renderHorizontalLine(isStageCompleted('legal_review'))}

            {/* Management Review */}
            {renderStageNode('management_review', 'Management Review')}

            {/* Line from Management Review to WWF Signing */}
            {renderHorizontalLine(isStageCompleted('management_review'))}

            {/* WWF Signing */}
            {renderStageNode('wwf_signing', 'WWF Signing')}

            {/* Line from WWF Signing to Counterparty Signing */}
            {renderHorizontalLine(isStageCompleted('wwf_signing'))}

            {/* Counterparty Signing */}
            {renderStageNode('counterparty_signing', 'Counterparty Signing')}

            {/* Line from Counterparty Signing to Implementation */}
            {renderHorizontalLine(isStageCompleted('counterparty_signing'))}

            {/* Implementation */}
            {renderStageNode('implementation', 'Implementation')}

            {/* Line from Implementation to Contract End */}
            {renderHorizontalLine(isStageCompleted('implementation'))}

            {/* Contract End */}
            {renderStageNode('contract_end', 'Contract End')}

            {/* For backward compatibility with existing contracts that might use approval/finished statuses */}
            {(currentStatus === 'approval' || currentStatus === 'finished') && (
              <>
                {/* Line from Contract End to Approval */}
                {renderHorizontalLine(isStageCompleted('contract_end'))}

                {/* Approval */}
                {renderStageNode('approval', 'Approval')}

                {/* Only show Finished if that's the current status */}
                {currentStatus === 'finished' && (
                  <>
                    {/* Line from Approval to Finished */}
                    {renderHorizontalLine(isStageCompleted('approval'))}

                    {/* Finished */}
                    {renderStageNode('finished', 'Finished')}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Show Amendment Progress Bar ONLY if the contract has been explicitly marked as amended */}
      {contract?.isAmended === true && (
        <div className="mt-8 border-t pt-4">
          <AmendmentProgressBar
            currentStatus={currentStatus}
            amendmentStage={contract?.amendmentStage || 'amendment'}
          />
        </div>
      )}
    </div>
  );
};

export default ContractProgressBar;