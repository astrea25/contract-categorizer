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

  // Status options and their formatted labels
  const statusOptions: { value: ContractStatus; label: string }[] = [
    { value: 'requested', label: 'Requested' },
    { value: 'draft', label: 'Draft' },
    { value: 'legal_review', label: 'Legal Review' },
    { value: 'management_review', label: 'Management Review' },
    { value: 'wwf_signing', label: 'WWF Signing' },
    { value: 'counterparty_signing', label: 'Counterparty Signing' },
    { value: 'implementation', label: 'Implementation' },
    { value: 'amendment', label: 'Amendment' },
    { value: 'contract_end', label: 'Contract End' },
    { value: 'legal_send_back', label: 'Legal Send Back' },
    { value: 'management_send_back', label: 'Management Send Back' },
    { value: 'approval', label: 'Approval' },
    { value: 'finished', label: 'Finished' },
    // Keep old statuses for backward compatibility but don't show in dropdown
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

    // If trying to change to approval status, check if both approvers have approved
    if (newStatus === 'approval') {
      // Check if either approver has declined
      if (isEitherDeclined) {
        const declinedBy = [];
        if (contract.approvers?.legal?.declined) declinedBy.push('Legal');
        if (contract.approvers?.management?.declined) declinedBy.push('Management');

        toast({
          title: "Cannot change status to Approval",
          description: `This contract has been declined by: ${declinedBy.join(', ')}. The declined approver(s) must approve the contract before it can move to Approval status.`,
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
          title: "Cannot change status to Approval",
          description: `This contract requires approval from both legal and management teams before it can move to Approval status. Missing approvals: ${missingApprovals.join(', ')}.`,
          variant: "destructive"
        });
        setIsOpen(false);
        return;
      }
    }

    // If changing to amendment status, set isAmended flag and amendmentStage
    if (newStatus === 'amendment') {
      await onStatusChange(newStatus);

      // Update the contract with amendment flags
      try {
        // We need to call onStatusChange again with the same status but additional data
        // This is a bit of a hack, but it allows us to update the contract with the amendment flags
        await onStatusChange(newStatus, {
          isAmended: true,
          amendmentStage: 'amendment'
        });
      } catch (error) {
        console.error('Error setting amendment flags:', error);
        toast({
          title: "Warning",
          description: "Contract status was changed to Amendment, but there was an error setting up the amendment tracking.",
          variant: "destructive"
        });
      }
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
              {statusOptions.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className={status === option.value ? 'bg-secondary/40' : ''}
                >
                  {option.label}
                </SelectItem>
              ))}
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