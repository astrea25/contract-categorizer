import React from 'react';
import { ContractStatus } from '@/lib/data';
import { CheckCircle, Circle } from 'lucide-react';

interface ContractProgressBarProps {
  currentStatus: ContractStatus;
}

const ContractProgressBar: React.FC<ContractProgressBarProps> = ({
  currentStatus,
}) => {
  // Define all the stages in order
  const stages: { status: ContractStatus; label: string }[] = [
    { status: 'requested', label: 'Requested' },
    { status: 'draft', label: 'Draft' },
    { status: 'legal_review', label: 'Legal Review' },
    { status: 'management_review', label: 'Management Review' },
    { status: 'approval', label: 'Approval' },
    { status: 'finished', label: 'Finished' },
  ];

  // Find current stage index
  const currentStageIndex = stages.findIndex(stage => stage.status === currentStatus);

  return (
    <div className="w-full py-4">
      <h3 className="font-medium text-base mb-4">Contract Progress</h3>
      
      <div className="flex items-center w-full">
        {stages.map((stage, index) => {
          const isCompleted = index < currentStageIndex;
          const isCurrent = index === currentStageIndex;
          const isLast = index === stages.length - 1;
          
          return (
            <div key={stage.status} className="flex-1 flex items-center">
              <div className="flex flex-col items-center relative">
                <div 
                  className={`flex items-center justify-center w-8 h-8 rounded-full z-10
                    ${isCompleted 
                      ? 'bg-primary text-primary-foreground' 
                      : isCurrent 
                        ? 'bg-primary/20 text-primary border-2 border-primary' 
                        : 'bg-secondary text-muted-foreground'
                    }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Circle className="w-5 h-5" />
                  )}
                </div>
                
                <span 
                  className={`absolute top-10 text-xs whitespace-nowrap text-center
                    ${isCompleted 
                      ? 'text-primary font-medium' 
                      : isCurrent 
                        ? 'text-primary font-medium' 
                        : 'text-muted-foreground'
                    }`}
                >
                  {stage.label}
                </span>
              </div>
              
              {!isLast && (
                <div 
                  className={`flex-1 h-1 ${
                    index < currentStageIndex 
                      ? 'bg-primary' 
                      : 'bg-secondary'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ContractProgressBar; 