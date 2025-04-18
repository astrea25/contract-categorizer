import React from 'react';
import { ContractStatus } from '@/lib/data';
import { CheckCircle, Circle, ArrowRight } from 'lucide-react';

interface ContractProgressBarProps {
  currentStatus: ContractStatus;
}

const ContractProgressBar: React.FC<ContractProgressBarProps> = ({
  currentStatus,
}) => {
  // Helper function to determine if a stage is completed
  const isStageCompleted = (stage: ContractStatus) => {
    const stageOrder = {
      'requested': 0,
      'draft': 1,
      'legal_review': 2,
      'management_review': 2, // Same level as legal_review
      'legal_declined': 2, // Same level as legal_review
      'management_declined': 2, // Same level as management_review
      'approval': 3,
      'finished': 4
    };

    const currentStageValue = stageOrder[currentStatus];
    const stageValue = stageOrder[stage];

    // If current status is draft, don't consider legal_review or management_review as completed
    // This handles the case where the contract was reset to draft
    if (currentStatus === 'draft' && (stage === 'legal_review' || stage === 'management_review')) {
      return false;
    }

    // Special handling for review stages to be treated as a group
    if (stage === 'legal_review' || stage === 'management_review') {
      return currentStatus === 'legal_review' || 
             currentStatus === 'management_review' ||
             currentStatus === 'legal_declined' ||
             currentStatus === 'management_declined' ||
             currentStatus === 'approval' || 
             currentStatus === 'finished';
    }

    // For all other stages, use standard stageOrder comparison
    return stageValue < currentStageValue;
  };

  // Helper function to determine if a stage is current
  const isStageCurrent = (stage: ContractStatus) => {
    // If current status is draft, don't highlight legal_review or management_review
    if (currentStatus === 'draft' && (stage === 'legal_review' || stage === 'management_review')) {
      return false;
    }

    // Special handling for review stages to be treated as a group
    if (stage === 'legal_review' || stage === 'management_review') {
      return currentStatus === 'legal_review' || 
             currentStatus === 'management_review' ||
             currentStatus === 'legal_declined' ||
             currentStatus === 'management_declined';
    }

    // Each stage is only current if it exactly matches the current status
    return stage === currentStatus;
  };

  // Helper function to determine if a stage is declined
  const isStageDeclined = (stage: ContractStatus) => {
    // Both review stages should show declined if either one is declined
    if (stage === 'legal_review' || stage === 'management_review') {
      return currentStatus === 'legal_declined' || currentStatus === 'management_declined';
    }
    
    return false;
  };

  // Helper function to render a stage node
  const renderStageNode = (status: ContractStatus, label: string, isCompleted: boolean, isCurrent: boolean) => {
    // Check if the stage is declined
    let isDeclined = false;
    
    // Special handling for review stages - both should appear declined if either is declined
    if (status === 'legal_review' || status === 'management_review') {
      isDeclined = isReviewDeclined;
    } else {
      // For other stages, use the standard check
      isDeclined = isStageDeclined(status);
    }
    
    return (
      <div className="flex flex-col items-center relative">
        <div
          className={`flex items-center justify-center w-14 h-14 rounded-full z-10 border
            ${isDeclined
              ? 'bg-red-500 text-white border-red-500' // Declined stage
              : isCompleted || isCurrent
                ? 'bg-blue-500 text-white border-blue-500' // Completed or current stage
                : status === 'finished'
                  ? 'bg-white text-blue-500 border-blue-500 border-2' // Special case for finished
                  : 'bg-white text-muted-foreground border-gray-300' // Default state
            }`}
        >
          {isCompleted || isCurrent || isDeclined ? (
            <CheckCircle className="w-6 h-6" />
          ) : (
            <Circle className="w-6 h-6" />
          )}
        </div>

        <span
          className={`absolute top-16 text-xs whitespace-nowrap text-center
            ${isDeclined
              ? 'text-red-500 font-medium' // Text for declined stages
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

  // Helper function to render a diagonal connecting line
  const renderDiagonalLine = (type: 'top-diverge' | 'bottom-diverge' | 'top-converge' | 'bottom-converge', isCompleted: boolean) => {
    // Different paths for different line types
    let path;
    
    // Check if review stages are declined, apply to both diagonal lines
    const isDeclined = isReviewDeclined;

    // For better visual connection, we'll use the actual coordinates where we want the lines to connect
    const leftX = 0;
    const rightX = 100;
    const middleY = 50;
    const topY = 0;
    const bottomY = 100;

    switch(type) {
      case 'top-diverge':
        // From Draft circle to Legal Review circle
        path = `M ${leftX},${middleY} L ${rightX},${topY}`;
        break;
      case 'bottom-diverge':
        // From Draft circle to Management Review circle
        path = `M ${leftX},${middleY} L ${rightX},${bottomY}`;
        break;
      case 'top-converge':
        // From Legal Review circle to Approval circle
        path = `M ${leftX},${topY} L ${rightX},${middleY}`;
        break;
      case 'bottom-converge':
        // From Management Review circle to Approval circle
        path = `M ${leftX},${bottomY} L ${rightX},${middleY}`;
        break;
      default:
        path = `M ${leftX},${middleY} L ${rightX},${middleY}`;
    }

    return (
      <div className="w-28 h-28 relative">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <path
            d={path}
            stroke={isDeclined ? '#ef4444' : isCompleted ? '#3b82f6' : '#d1d5db'}
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>
    );
  };

  // Determine if paths are completed
  const isDraftCompleted = isStageCompleted('draft');

  // For visual consistency in the progress bar, treat both review paths as a single unit
  const isReviewCompleted = currentStatus === 'approval' || currentStatus === 'finished';
  const isReviewDeclined = currentStatus === 'legal_declined' || currentStatus === 'management_declined';
  const isReviewCurrent = currentStatus === 'legal_review' || currentStatus === 'management_review' || 
                         currentStatus === 'legal_declined' || currentStatus === 'management_declined';

  const isApprovalCompleted = isStageCompleted('approval');

  return (
    <div className="w-full py-8">
      <h3 className="font-medium text-base mb-6">Contract Progress</h3>

      <div className="flex flex-col w-full">
        <div className="flex justify-center items-center w-full">
          {/* Main horizontal flow */}
          <div className="flex items-center justify-center">
            {/* Requested */}
            {renderStageNode(
              'requested',
              'Requested',
              isStageCompleted('requested'),
              isStageCurrent('requested')
            )}

            {/* Line from Requested to Draft */}
            {renderHorizontalLine(isStageCompleted('requested'))}

            {/* Draft */}
            {renderStageNode(
              'draft',
              'Draft',
              isStageCompleted('draft'),
              isStageCurrent('draft')
            )}

            {/* Diverging and converging paths container */}
            <div className="flex flex-col items-center">
              <div className="flex items-center">
                {/* Top diagonal line to Legal Review */}
                {renderDiagonalLine('top-diverge', isDraftCompleted)}
              </div>

              <div className="flex items-center">
                {/* Bottom diagonal line to Management Review */}
                {renderDiagonalLine('bottom-diverge', isDraftCompleted)}
              </div>
            </div>

            {/* Parallel reviews container */}
            <div className="flex flex-col items-center">
              {/* Legal Review */}
              <div className="mb-24">
                {renderStageNode(
                  'legal_review',
                  'Legal Review',
                  isReviewCompleted || isReviewCurrent,
                  isReviewCurrent && !isReviewDeclined
                )}
              </div>

              {/* Management Review */}
              <div className="mt-24">
                {renderStageNode(
                  'management_review',
                  'Management Review',
                  isReviewCompleted || isReviewCurrent,
                  isReviewCurrent && !isReviewDeclined
                )}
              </div>
            </div>

            {/* Converging paths container */}
            <div className="flex flex-col items-center">
              <div className="flex items-center">
                {/* Diagonal line from Legal Review to Approval */}
                {renderDiagonalLine('top-converge', isReviewCompleted)}
              </div>

              <div className="flex items-center">
                {/* Diagonal line from Management Review to Approval */}
                {renderDiagonalLine('bottom-converge', isReviewCompleted)}
              </div>
            </div>

            {/* Approval */}
            {renderStageNode(
              'approval',
              'Approval',
              isStageCompleted('approval'),
              isStageCurrent('approval')
            )}

            {/* Line from Approval to Finished */}
            {renderHorizontalLine(isStageCompleted('approval'))}

            {/* Finished */}
            {renderStageNode(
              'finished',
              'Finished',
              isStageCompleted('finished'),
              isStageCurrent('finished')
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractProgressBar;