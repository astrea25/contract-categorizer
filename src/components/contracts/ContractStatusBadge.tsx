import { ContractStatus, statusColors } from '@/lib/data';
import { cn } from '@/lib/utils';

interface ContractStatusBadgeProps {
  status: ContractStatus;
  className?: string;
}

const ContractStatusBadge = ({ status, className }: ContractStatusBadgeProps) => {
  // Add a safety check to handle undefined values
  const colors = statusColors[status] || {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200'
  };

  const { bg, text, border } = colors;

  // Format status: replace underscores with spaces and capitalize each word
  let formattedStatus = status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Handle deprecated status names
  if (status === 'legal_declined' || status === 'management_declined') {
    formattedStatus = formattedStatus.replace('Declined', 'Sent Back');
  }

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
