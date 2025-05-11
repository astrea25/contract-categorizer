import React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";
import { useNotifications } from "@/contexts/NotificationContext";

interface NotificationBadgeProps {
    className?: string;
    onClick?: () => void;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = (
    {
        className,
        onClick
    }
) => {
    const {
        unreadCount,
        loading
    } = useNotifications();

    if (loading) {
        return (
            <div className={cn("relative inline-flex", className)}>
                <Bell className="h-5 w-5" />
            </div>
        );
    }

    return (
        <div
            className={cn(
                "relative inline-flex cursor-pointer",
                className,
                unreadCount > 0 ? "animate-pulse" : ""
            )}
            onClick={onClick}>
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (<Badge
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>)}
        </div>
    );
};

export default NotificationBadge;