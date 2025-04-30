import React from 'react';
import { ContractStatus } from '@/lib/data';
import { CheckCircle, Circle } from 'lucide-react';

interface AmendmentProgressBarProps {
  currentStatus: ContractStatus;
  amendmentStage?: 'amendment' | 'legal' | 'wwf' | 'counterparty';
}

const AmendmentProgressBar: React.FC<AmendmentProgressBarProps> = ({
  currentStatus,
  amendmentStage = 'amendment',
}) => {
  // Helper function to determine if a stage is completed
  const isStageCompleted = (stage: string) => {
    const stageOrder = {
      'amendment': 0,
      'legal': 1,
      'wwf': 2,
      'counterparty': 3
    };

    const currentStageValue = stageOrder[amendmentStage] || 0;
    const stageValue = stageOrder[stage] || 0;

    return stageValue < currentStageValue;
  };

  // Helper function to determine if a stage is current
  const isStageCurrent = (stage: string) => {
    return stage === amendmentStage;
  };

  // Helper function to render a stage node
  const renderStageNode = (stage: string, label: string) => {
    const isCompleted = isStageCompleted(stage);
    const isCurrent = isStageCurrent(stage);
    
    return (
      <div className="flex flex-col items-center relative">
        <div
          className={`flex items-center justify-center w-14 h-14 rounded-full z-10 border
            ${isCompleted || isCurrent
              ? 'bg-amber-500 text-white border-amber-500' // Completed or current stage
              : 'bg-white text-muted-foreground border-gray-300' // Default state
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
              ? 'text-amber-500 font-medium' // Text for completed/current
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
      <div className={`w-full h-1 ${isCompleted ? 'bg-amber-500' : 'bg-gray-300'}`}></div>
    </div>
  );

  return (
    <div className="w-full py-4">
      <h3 className="font-medium text-base mb-6">Amendment Progress</h3>

      <div className="flex flex-col w-full">
        <div className="flex justify-center items-center w-full overflow-x-auto pb-8">
          {/* Amendment flow */}
          <div className="flex items-center justify-start min-w-max">
            {/* Amendment */}
            {renderStageNode('amendment', 'Amendment')}

            {/* Line from Amendment to Legal */}
            {renderHorizontalLine(isStageCompleted('amendment'))}

            {/* Legal */}
            {renderStageNode('legal', 'Legal')}

            {/* Line from Legal to WWF */}
            {renderHorizontalLine(isStageCompleted('legal'))}

            {/* WWF */}
            {renderStageNode('wwf', 'WWF')}

            {/* Line from WWF to Counterparty */}
            {renderHorizontalLine(isStageCompleted('wwf'))}

            {/* Counterparty */}
            {renderStageNode('counterparty', 'Counterparty')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmendmentProgressBar;
