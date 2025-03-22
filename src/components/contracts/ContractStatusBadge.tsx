
import { ContractStatus, statusColors } from '@/lib/data';
import { cn } from '@/lib/utils';

interface ContractStatusBadgeProps {
  status: ContractStatus;
  className?: string;
}

const ContractStatusBadge = ({ status, className }: ContractStatusBadgeProps) => {
  const { bg, text, border } = statusColors[status];
  
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
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default ContractStatusBadge;
