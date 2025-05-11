import { ContractStatus, statusColors } from "@/lib/data";
import { cn } from "@/lib/utils";

interface ContractStatusBadgeProps {
    status: ContractStatus;
    className?: string;
}

const ContractStatusBadge = (
    {
        status,
        className
    }: ContractStatusBadgeProps
) => {
    const colors = statusColors[status] || {
        bg: "bg-gray-100",
        text: "text-gray-800",
        border: "border-gray-200"
    };

    const {
        bg,
        text,
        border
    } = colors;

    let formattedStatus = status.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");

    if (status === "legal_declined" || status === "management_declined") {
        formattedStatus = formattedStatus.replace("Declined", "Sent Back");
    }

    return (
        <span
            className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                bg,
                text,
                border,
                className
            )}>
            {formattedStatus}
        </span>
    );
};

export default ContractStatusBadge;