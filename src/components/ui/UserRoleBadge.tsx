import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface UserRoleBadgeProps {
    role: string;
    className?: string;
}

const roleColors: Record<string, {
    bg: string;
    text: string;
}> = {
    admin: {
        bg: "bg-red-100",
        text: "text-red-800"
    },

    "Legal Team": {
        bg: "bg-blue-100",
        text: "text-blue-800"
    },

    legal: {
        bg: "bg-blue-100",
        text: "text-blue-800"
    },

    "Management Team": {
        bg: "bg-green-100",
        text: "text-green-800"
    },

    management: {
        bg: "bg-green-100",
        text: "text-green-800"
    },

    "Approver": {
        bg: "bg-purple-100",
        text: "text-purple-800"
    },

    approver: {
        bg: "bg-purple-100",
        text: "text-purple-800"
    },

    user: {
        bg: "bg-gray-100",
        text: "text-gray-800"
    }
};

const UserRoleBadge = (
    {
        role,
        className
    }: UserRoleBadgeProps
) => {
    const {
        bg,
        text
    } = roleColors[role] || roleColors.user;

    const displayRole = role.charAt(0).toUpperCase() + role.slice(1);

    return (
        <Badge
            className={cn("font-medium border-0", bg, text, className)}
            variant="outline">
            {displayRole}
        </Badge>
    );
};

export default UserRoleBadge;