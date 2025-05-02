import { useState } from 'react';
import { FilePenLine } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Contract, ContractStatus } from '@/lib/data';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

interface AmendmentStatusCardProps {
  contract: Contract;
  onStatusChange: (status: ContractStatus, additionalData?: Partial<Contract>) => Promise<void>;
  isUpdating: boolean;
}

const AmendmentStatusCard = ({ contract, onStatusChange, isUpdating }: AmendmentStatusCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Amendment stage options
  const amendmentStageOptions: { value: string; label: string }[] = [
    { value: 'amendment', label: 'Amendment' },
    { value: 'legal', label: 'Legal Review' },
    { value: 'wwf', label: 'WWF Signing' },
    { value: 'counterparty', label: 'Counterparty Signing' },
  ];

  // Only show the card if the contract is in amendment mode
  if (!contract.isAmended || contract.status !== 'amendment') {
    return null;
  }

  const handleAmendmentStageChange = async (value: string) => {
    // Check if the value is one of the amendment stages
    const isAmendmentStage = amendmentStageOptions.some(option => option.value === value);

    if (isAmendmentStage) {
      // Update the amendment stage without changing the contract status
      await onStatusChange('amendment', {
        amendmentStage: value as 'amendment' | 'legal' | 'wwf' | 'counterparty'
      });
      setIsOpen(false);
      return;
    }

    // If trying to exit amendment mode, check if amendment is complete
    if (contract.amendmentStage !== 'counterparty') {
      toast({
        title: "Cannot exit amendment mode",
        description: "The amendment process must be completed (reach Counterparty stage) before changing the contract status.",
        variant: "destructive"
      });
      setIsOpen(false);
      return;
    }

    // If amendment is complete, restore the original status if available
    if (contract.originalStatus) {
      await onStatusChange(contract.originalStatus, {
        isAmended: false,
        amendmentStage: undefined,
        originalStatus: undefined,
        _customTimelineEntry: {
          action: 'Amendment Completed',
          details: `Contract returned to original status: ${contract.originalStatus.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}`
        }
      });
      setIsOpen(false);
      return;
    }
  };

  // Get the current amendment stage
  const currentStage = contract.amendmentStage || 'amendment';

  // Get the label for the current stage
  const currentStageLabel = amendmentStageOptions.find(option => option.value === currentStage)?.label || 'Amendment';

  // Check if approvals are in progress
  const hasLegalApprovers = contract.approvers?.legal &&
    (Array.isArray(contract.approvers.legal)
      ? contract.approvers.legal.length > 0
      : true);

  const hasApproverTeam = contract.approvers?.approver &&
    (Array.isArray(contract.approvers.approver)
      ? contract.approvers.approver.length > 0
      : true);

  // Only disable when updating
  const disableManualStageChange = isUpdating;

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-md bg-amber-50 border-amber-200">
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
            open={isOpen}
          >
            <SelectTrigger className="w-full mt-2">
              <SelectValue placeholder="Change amendment stage" />
            </SelectTrigger>
            <SelectContent>
              {amendmentStageOptions.map((option) => {
                const isCurrentStage = currentStage === option.value;
                const stageIndex = amendmentStageOptions.findIndex(stage => stage.value === option.value);
                const currentStageIndex = amendmentStageOptions.findIndex(stage => stage.value === currentStage);

                // Only show current stage, next stage, or previous stage
                const isValidOption =
                  isCurrentStage ||
                  stageIndex === currentStageIndex + 1 ||
                  stageIndex === currentStageIndex - 1;

                // If amendment is complete (counterparty stage), also show the original status option
                if (currentStage === 'counterparty' && option.value === 'counterparty') {
                  return (
                    <>
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className={isCurrentStage ? 'bg-secondary/40' : ''}
                      >
                        {option.label}
                      </SelectItem>
                      {contract.originalStatus && (
                        <SelectItem
                          key="restore-original"
                          value={contract.originalStatus}
                          className="text-green-600 font-medium"
                        >
                          Complete Amendment (Return to {contract.originalStatus.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')})
                        </SelectItem>
                      )}
                    </>
                  );
                }

                return isValidOption ? (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className={isCurrentStage ? 'bg-secondary/40' : ''}
                  >
                    {option.label}
                  </SelectItem>
                ) : null;
              })}
            </SelectContent>
          </Select>

          {isUpdating && (
            <p className="text-xs text-muted-foreground">Updating amendment stage...</p>
          )}

          {(hasLegalApprovers && hasApproverTeam) && (
            <p className="text-xs text-amber-600 mt-2">
              Amendment stage will automatically progress based on approvals, but you can still manually change it if needed.
            </p>
          )}

          {contract.originalStatus && (
            <p className="text-xs text-amber-600 mt-2">
              Original status: {contract.originalStatus.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AmendmentStatusCard;
