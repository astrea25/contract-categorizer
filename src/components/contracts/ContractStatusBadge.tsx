import { ContractStatus, statusColors } from '@/lib/data';
import { cn } from '@/lib/utils';

interface ContractStatusBadgeProps {
  status: ContractStatus;
  className?: string;
}

const ContractStatusBadge = ({ status, className }: ContractStatusBadgeProps) => {
  const { bg, text, border } = statusColors[status];
  
  // Format status: replace underscores with spaces and capitalize each word
  const formattedStatus = status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return (
    <span 
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        bg, 
        text, 
        border,
        className
      )}
    >
      {formattedStatus}
    </span>
  );
};

export default ContractStatusBadge;
