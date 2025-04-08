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

    // Special case for parallel reviews
    if (stage === 'legal_review' && currentStatus === 'management_review') {
      // If current stage is management_review, consider legal_review as completed
      return true;
    }

    if (stage === 'management_review' && currentStatus === 'legal_review') {
      // If current stage is legal_review, consider management_review as completed
      return true;
    }

    return stageValue < currentStageValue;
  };

  // Helper function to determine if a stage is current
  const isStageCurrent = (stage: ContractStatus) => {
    // If current status is draft, don't highlight legal_review or management_review
    if (currentStatus === 'draft' && (stage === 'legal_review' || stage === 'management_review')) {
      return false;
    }

    // Special case for parallel reviews
    if (stage === 'legal_review' && currentStatus === 'management_review') {
      // If current stage is management_review, also highlight legal_review
      return true;
    }

    if (stage === 'management_review' && currentStatus === 'legal_review') {
      // If current stage is legal_review, also highlight management_review
      return true;
    }

    return stage === currentStatus;
  };

  // Helper function to render a stage node
  const renderStageNode = (status: ContractStatus, label: string, isCompleted: boolean, isCurrent: boolean) => (
    <div className="flex flex-col items-center relative">
      <div
        className={`flex items-center justify-center w-14 h-14 rounded-full z-10 border
          ${isCompleted || isCurrent
            ? 'bg-blue-500 text-white border-blue-500'
            : status === 'finished'
              ? 'bg-white text-blue-500 border-blue-500 border-2'
              : 'bg-white text-muted-foreground border-gray-300'
          }`}
      >
        {isCompleted || isCurrent ? (
          <CheckCircle className="w-6 h-6" />
        ) : (
          <Circle className="w-6 h-6" />
        )}
      </div>

      <span
        className={`absolute top-16 text-xs whitespace-nowrap text-center
          ${isCompleted || isCurrent
            ? 'text-blue-500 font-medium'
            : 'text-muted-foreground'
          }`}
      >
        {label}
      </span>
    </div>
  );

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
            stroke={isCompleted ? '#3b82f6' : '#d1d5db'}
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>
    );
  };

  // Determine if paths are completed
  const isDraftCompleted = isStageCompleted('draft');

  // Legal review path is completed if:
  // 1. Legal review is completed OR
  // 2. Current status is management_review, approval, or finished
  // But not if current status is draft (reset case)
  const isLegalReviewCompleted = currentStatus !== 'draft' && (
    isStageCompleted('legal_review') ||
    currentStatus === 'management_review' ||
    currentStatus === 'approval' ||
    currentStatus === 'finished'
  );

  // Management review path is completed if:
  // 1. Management review is completed OR
  // 2. Current status is legal_review, approval, or finished
  // But not if current status is draft (reset case)
  const isManagementReviewCompleted = currentStatus !== 'draft' && (
    isStageCompleted('management_review') ||
    currentStatus === 'legal_review' ||
    currentStatus === 'approval' ||
    currentStatus === 'finished'
  );

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
                  isStageCompleted('legal_review'),
                  isStageCurrent('legal_review')
                )}
              </div>

              {/* Management Review */}
              <div className="mt-24">
                {renderStageNode(
                  'management_review',
                  'Management Review',
                  isStageCompleted('management_review'),
                  isStageCurrent('management_review')
                )}
              </div>
            </div>

            {/* Converging paths container */}
            <div className="flex flex-col items-center">
              <div className="flex items-center">
                {/* Diagonal line from Legal Review to Approval */}
                {renderDiagonalLine('top-converge', isLegalReviewCompleted)}
              </div>

              <div className="flex items-center">
                {/* Diagonal line from Management Review to Approval */}
                {renderDiagonalLine('bottom-converge', isManagementReviewCompleted)}
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