import React, { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";

import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    RecipientRole,
    Notification,
} from "@/lib/notifications";

import NotificationBadge from "./NotificationBadge";
import { formatDistanceToNow } from "date-fns";
import { Check, InboxIcon, Trash } from "lucide-react";
import { useCustomToast } from "@/hooks/use-custom-toast";

const NotificationDropdown: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [open, setOpen] = useState<boolean>(false);

    const {
        isAdmin,
        isLegalTeam,
        isManagementTeam,
        isApprover
    } = useAuth();

    const navigate = useNavigate();

    const {
        toast
    } = useCustomToast();

    const getUserRole = (): RecipientRole => {
        if (isAdmin)
            return "admin";

        if (isLegalTeam)
            return "legal";

        if (isManagementTeam)
            return "management";

        if (isApprover)
            return "approver";

        return "user";
    };

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const role = getUserRole();

            const fetchedNotifications = await getNotifications(role, {
                limit: 10
            });

            setNotifications(fetchedNotifications);
        } catch (error) {
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchNotifications();
        }
    }, [open, isAdmin, isLegalTeam, isManagementTeam, isApprover]);

    const {
        refreshUnreadCount
    } = useNotifications();

    const handleNotificationClick = async (notification: Notification) => {
        try {
            await markNotificationAsRead(notification.id, getUserRole());

            setNotifications(
                prevNotifications => prevNotifications.map(n => n.id === notification.id ? {
                    ...n,
                    read: true
                } : n)
            );

            await refreshUnreadCount();
            navigate(`/contract/${notification.contractId}`);
            setOpen(false);
        } catch (error) {}
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllNotificationsAsRead(getUserRole());

            setNotifications(prevNotifications => prevNotifications.map(n => ({
                ...n,
                read: true
            })));

            await refreshUnreadCount();

            toast({
                title: "All notifications marked as read",
                variant: "default"
            });
        } catch (error) {
            toast({
                title: "Failed to mark notifications as read",
                variant: "destructive"
            });
        }
    };

    const formatTimeAgo = (timestamp: string) => {
        try {
            return formatDistanceToNow(new Date(timestamp), {
                addSuffix: true
            });
        } catch (error) {
            return "Unknown time";
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div>
                    <NotificationBadge />
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4">
                    <h3 className="font-medium text-sm flex items-center">
                        <InboxIcon className="h-4 w-4 mr-2" />Notifications
                                                                                  </h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleMarkAllAsRead}
                        className="h-8 px-2 text-xs">
                        <Check className="h-3 w-3 mr-1" />Mark all read
                                                                                  </Button>
                </div>
                <Separator />
                <ScrollArea className="h-[300px]">
                    {loading ? (<div className="p-4 text-center text-sm text-muted-foreground">Loading notifications...
                                                                                    </div>) : notifications.length === 0 ? (<div className="p-4 text-center text-sm text-muted-foreground">No notifications
                                                                                    </div>) : (<div>
                        {notifications.map(notification => (<div
                            key={notification.id}
                            className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-muted/50 transition-colors ${notification.read ? "opacity-70" : "bg-primary/5"}`}
                            onClick={() => handleNotificationClick(notification)}>
                            <div className="flex justify-between items-start mb-1">
                                <h4 className="text-sm font-medium">
                                    {notification.type === "contract_created" ? "New Contract" : notification.type === "contract_requested" ? "Contract Requested" : "Notification"}
                                </h4>
                                <span className="text-xs text-muted-foreground">
                                    {formatTimeAgo(notification.createdAt)}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {notification.message}
                            </p>
                        </div>))}
                    </div>)}
                </ScrollArea>
                <Separator />
                <div className="p-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => {
                            navigate("/inbox");
                            setOpen(false);
                        }}>View all notifications
                                                                                  </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
};

export default NotificationDropdown;