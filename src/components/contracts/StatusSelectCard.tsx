import { useState } from 'react';
import { FileText } from 'lucide-react';
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
import { ContractStatus } from '@/lib/data';
import ContractStatusBadge from './ContractStatusBadge';

interface StatusSelectCardProps {
  status: ContractStatus;
  onStatusChange: (status: ContractStatus) => Promise<void>;
  isUpdating: boolean;
}

const StatusSelectCard = ({ status, onStatusChange, isUpdating }: StatusSelectCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Status options and their formatted labels
  const statusOptions: { value: ContractStatus; label: string }[] = [
    { value: 'requested', label: 'Requested' },
    { value: 'draft', label: 'Draft' },
    { value: 'legal_review', label: 'Legal Review' },
    { value: 'management_review', label: 'Management Review' },
    { value: 'approval', label: 'Approval' },
    { value: 'finished', label: 'Finished' },
  ];

  const handleStatusChange = async (value: string) => {
    await onStatusChange(value as ContractStatus);
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