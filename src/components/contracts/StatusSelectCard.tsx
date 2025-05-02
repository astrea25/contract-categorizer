import { useState } from 'react';
import { FileText, AlertCircle } from 'lucide-react';
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
import ContractStatusBadge from './ContractStatusBadge';
import { toast } from '@/components/ui/use-toast';

interface StatusSelectCardProps {
  status: ContractStatus;
  onStatusChange: (status: ContractStatus, additionalData?: Partial<Contract>) => Promise<void>;
  isUpdating: boolean;
  contract: Contract;
}

const StatusSelectCard = ({ status, onStatusChange, isUpdating, contract }: StatusSelectCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Define the workflow stages in order
  const workflowStages: ContractStatus[] = [
    'requested',
    'draft',
    'legal_review',
    'management_review',
    'wwf_signing',
    'counterparty_signing',
    'implementation',
    'contract_end'
  ];

  // Status options and their formatted labels, ordered according to the workflow
  const statusOptions: { value: ContractStatus; label: string }[] = [
    { value: 'requested', label: 'Requested' },
    { value: 'draft', label: 'Draft' },
    { value: 'legal_review', label: 'Legal Review' },
    { value: 'management_review', label: 'Management Review' },
    { value: 'wwf_signing', label: 'WWF Signing' },
    { value: 'counterparty_signing', label: 'Counterparty Signing' },
    { value: 'implementation', label: 'Implementation' },
    { value: 'contract_end', label: 'Contract End' },
    // Special statuses that are not part of the normal flow
    { value: 'amendment', label: 'Amendment' },
  ];

  // Check if both legal and management have approved the contract
  const areBothApproved =
    contract.approvers && (() => {
      const legalApproved = contract.approvers.legal
        ? Array.isArray(contract.approvers.legal)
          ? contract.approvers.legal.every(a => a.approved)
          : contract.approvers.legal.approved
        : false;

      const managementApproved = contract.approvers.management
        ? Array.isArray(contract.approvers.management)
          ? contract.approvers.management.every(a => a.approved)
          : contract.approvers.management.approved
        : false;

      return legalApproved && managementApproved;
    })();

  // Check if either legal or management have declined the contract
  const isEitherDeclined =
    contract.approvers && (() => {
      const legalDeclined = contract.approvers.legal
        ? Array.isArray(contract.approvers.legal)
          ? contract.approvers.legal.some(a => a.declined)
          : contract.approvers.legal.declined
        : false;

      const managementDeclined = contract.approvers.management
        ? Array.isArray(contract.approvers.management)
          ? contract.approvers.management.some(a => a.declined)
          : contract.approvers.management.declined
        : false;

      return legalDeclined || managementDeclined;
    })();

  const handleStatusChange = async (value: string) => {
    const newStatus = value as ContractStatus;

    // Get the current and new stage indices
    const currentStageIndex = workflowStages.indexOf(contract.status);
    const newStageIndex = workflowStages.indexOf(newStatus);

    // Check if we're trying to move forward in the workflow (not to draft or requested)
    const isMovingForward = newStageIndex > 1 && newStageIndex > currentStageIndex;

    // If moving forward in the workflow, check if both legal and management approvers are assigned
    if (isMovingForward) {
      // Check if legal approvers are assigned
      const hasLegalApprovers = contract.approvers?.legal &&
        (Array.isArray(contract.approvers.legal)
          ? contract.approvers.legal.length > 0
          : true);

      // Check if management approvers are assigned
      const hasManagementApprovers = contract.approvers?.management &&
        (Array.isArray(contract.approvers.management)
          ? contract.approvers.management.length > 0
          : true);

      // If either approver type is missing, prevent status change
      if (!hasLegalApprovers || !hasManagementApprovers) {
        const missingApprovers = [];
        if (!hasLegalApprovers) missingApprovers.push('legal team');
        if (!hasManagementApprovers) missingApprovers.push('management team');

        toast({
          title: "Cannot change status",
          description: `You must assign at least one ${missingApprovers.join(' and ')} approver before moving forward in the contract workflow.`,
          variant: "destructive"
        });
        setIsOpen(false);
        return;
      }
    }

    // Additional specific validations for legal_review and management_review
    if (newStatus === 'legal_review') {
      // Check if legal approvers are assigned
      const hasLegalApprovers = contract.approvers?.legal &&
        (Array.isArray(contract.approvers.legal)
          ? contract.approvers.legal.length > 0
          : true);

      if (!hasLegalApprovers) {
        toast({
          title: "Cannot change status to Legal Review",
          description: "You must assign at least one legal team approver before moving to Legal Review status.",
          variant: "destructive"
        });
        setIsOpen(false);
        return;
      }
    }

    // If trying to change to management_review status, check if management approvers are assigned
    if (newStatus === 'management_review') {
      // Check if management approvers are assigned
      const hasManagementApprovers = contract.approvers?.management &&
        (Array.isArray(contract.approvers.management)
          ? contract.approvers.management.length > 0
          : true);

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

    // If trying to change to WWF Signing status, check if both approvers have approved
    if (newStatus === 'wwf_signing') {
      // Check if either approver has declined
      if (isEitherDeclined) {
        const declinedBy = [];
        if (contract.approvers?.legal?.declined) declinedBy.push('Legal');
        if (contract.approvers?.management?.declined) declinedBy.push('Management');

        toast({
          title: "Cannot change status to WWF Signing",
          description: `This contract has been declined by: ${declinedBy.join(', ')}. The declined approver(s) must approve the contract before it can move to WWF Signing status.`,
          variant: "destructive"
        });
        setIsOpen(false);
        return;
      }

      // Check if both approvers have approved
      if (!areBothApproved) {
        // Check what approvals are missing
        const missingApprovals = [];
        if (!contract.approvers?.legal?.approved) missingApprovals.push('Legal');
        if (!contract.approvers?.management?.approved) missingApprovals.push('Management');

        // If approvers aren't even assigned
        if (!contract.approvers?.legal) missingApprovals.push('Legal (not assigned)');
        if (!contract.approvers?.management) missingApprovals.push('Management (not assigned)');

        toast({
          title: "Cannot change status to WWF Signing",
          description: `This contract requires approval from both legal and management teams before it can move to WWF Signing status. Missing approvals: ${missingApprovals.join(', ')}.`,
          variant: "destructive"
        });
        setIsOpen(false);
        return;
      }
    }

    // If changing to amendment status, validate and set isAmended flag and amendmentStage
    if (newStatus === 'amendment') {
      // Validate that amendment is only allowed from WWF Signing status and if contract is marked as amended
      if (contract.status !== 'wwf_signing' || contract.isAmended !== true) {
        toast({
          title: "Cannot change status to Amendment",
          description: "Amendment status is only available during the WWF Signing phase and only for contracts that have been marked for amendment.",
          variant: "destructive"
        });
        setIsOpen(false);
        return;
      }

      // Simply change the status to amendment
      // The contract should already be marked as amended
      await onStatusChange(newStatus, {
        amendmentStage: 'amendment'
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

          <Select
            value={status}
            onValueChange={handleStatusChange}
            disabled={isUpdating}
            onOpenChange={setIsOpen}
            open={isOpen}
          >
            <SelectTrigger className="w-full mt-2">
              <SelectValue placeholder="Change status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => {
                // Get the current status index in the workflow
                const currentIndex = workflowStages.indexOf(status);
                const optionIndex = workflowStages.indexOf(option.value);

                // Special statuses that can be selected from any stage
                const isSpecialStatus =
                  option.value === 'draft' ||
                  option.value === 'management_review' ||
                  option.value === 'wwf_signing' ||
                  option.value === 'counterparty_signing' ||
                  option.value === 'implementation' ||
                  option.value === 'contract_end';

                // Amendment is only available during WWF Signing phase AND if the contract is marked as amended
                const canAmend =
                  option.value === 'amendment' &&
                  (status === 'wwf_signing') &&
                  contract.isAmended === true;

                // Only show options that are:
                // 1. The current status
                // 2. The next status in the workflow
                // 3. The previous status in the workflow
                // 4. Special statuses like draft, etc.
                // 5. Amendment status if conditions are met
                const isValidOption =
                  option.value === status ||
                  (optionIndex !== -1 && (optionIndex === currentIndex + 1 || optionIndex === currentIndex - 1)) ||
                  isSpecialStatus ||
                  canAmend;

                // Only render the option if it's valid
                return isValidOption ? (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className={status === option.value ? 'bg-secondary/40' : ''}
                  >
                    {option.label}
                  </SelectItem>
                ) : null;
              })}
            </SelectContent>
          </Select>

          {isUpdating && (
            <p className="text-xs text-muted-foreground">Updating status...</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatusSelectCard;