import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationContext";

import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    RecipientRole,
    Notification,
    NotificationType,
} from "@/lib/notifications";

import { formatDistanceToNow } from "date-fns";
import { Check, Filter, Inbox as InboxIcon, Search, X } from "lucide-react";
import { useCustomToast } from "@/hooks/use-custom-toast";
import AuthNavbar from "@/components/layout/AuthNavbar";
import PageTransition from "@/components/layout/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Inbox: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [readFilter, setReadFilter] = useState<string>("all");

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
            const fetchedNotifications = await getNotifications(role);
            setNotifications(fetchedNotifications);
            setFilteredNotifications(fetchedNotifications);
        } catch (error) {
            setNotifications([]);
            setFilteredNotifications([]);

            toast({
                title: "Failed to load notifications",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, [isAdmin, isLegalTeam, isManagementTeam, isApprover]);

    useEffect(() => {
        let filtered = [...notifications];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();

            filtered = filtered.filter(
                notification => notification.message.toLowerCase().includes(query) || notification.contractTitle.toLowerCase().includes(query)
            );
        }

        if (typeFilter !== "all") {
            filtered = filtered.filter(notification => notification.type === typeFilter);
        }

        if (readFilter === "read") {
            filtered = filtered.filter(notification => notification.read);
        } else if (readFilter === "unread") {
            filtered = filtered.filter(notification => !notification.read);
        }

        setFilteredNotifications(filtered);
    }, [notifications, searchQuery, typeFilter, readFilter]);

    const {
        refreshUnreadCount
    } = useNotifications();

    const handleNotificationClick = async (notification: Notification) => {
        try {
            if (!notification.read) {
                await markNotificationAsRead(notification.id, getUserRole());

                setNotifications(
                    prevNotifications => prevNotifications.map(n => n.id === notification.id ? {
                        ...n,
                        read: true
                    } : n)
                );

                await refreshUnreadCount();
            }

            navigate(`/contract/${notification.contractId}`);
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

    const getNotificationTypeLabel = (type: NotificationType): string => {
        switch (type) {
        case "contract_created":
            return "New Contract";
        case "contract_requested":
            return "Contract Requested";
        case "status_changed":
            return "Status Changed";
        case "contract_sent_back":
            return "Contract Sent Back";
        case "contract_approved":
            return "Contract Approved";
        default:
            return "Notification";
        }
    };

    const getNotificationTypeColor = (type: NotificationType): string => {
        switch (type) {
        case "contract_created":
            return "bg-green-100 text-green-800";
        case "contract_requested":
            return "bg-blue-100 text-blue-800";
        case "status_changed":
            return "bg-purple-100 text-purple-800";
        case "contract_sent_back":
            return "bg-red-100 text-red-800";
        case "contract_approved":
            return "bg-indigo-100 text-indigo-800";
        default:
            return "bg-gray-100 text-gray-800";
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AuthNavbar />
            <PageTransition>
                <div className="flex-1 container mx-auto py-8 space-y-6">
                    <div
                        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center">
                                <InboxIcon className="h-8 w-8 mr-2" />Inbox
                                                                                                                {unreadCount > 0 && (<Badge className="ml-2 bg-red-500 text-white">
                                    {unreadCount}unread
                                                                                                                              </Badge>)}
                            </h1>
                            <p className="text-muted-foreground mt-1">View and manage your notifications
                                                                                                              </p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={handleMarkAllAsRead}
                            disabled={unreadCount === 0}>
                            <Check className="h-4 w-4 mr-2" />Mark all as read
                                                                                                </Button>
                    </div>
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle>Filters</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="search"
                                            placeholder="Search notifications..."
                                            className="pl-8"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)} />
                                        {searchQuery && (<button
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground">
                                            <X className="h-4 w-4" />
                                        </button>)}
                                    </div>
                                </div>
                                <div className="w-full md:w-48">
                                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All types</SelectItem>
                                            <SelectItem value="contract_created">New Contract</SelectItem>
                                            <SelectItem value="contract_requested">Contract Requested</SelectItem>
                                            <SelectItem value="status_changed">Status Changed</SelectItem>
                                            <SelectItem value="contract_sent_back">Contract Sent Back</SelectItem>
                                            <SelectItem value="contract_approved">Contract Approved</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-full md:w-48">
                                    <Select value={readFilter} onValueChange={setReadFilter}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Filter by read status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All notifications</SelectItem>
                                            <SelectItem value="unread">Unread only</SelectItem>
                                            <SelectItem value="read">Read only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <div className="bg-white rounded-lg shadow">
                        {loading ? (<div className="p-6 space-y-4">
                            {[1, 2, 3, 4, 5].map(i => (<div key={i} className="flex flex-col gap-2">
                                <div className="flex justify-between">
                                    <Skeleton className="h-5 w-24" />
                                    <Skeleton className="h-5 w-16" />
                                </div>
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                                <div className="border-b my-2" />
                            </div>))}
                        </div>) : filteredNotifications.length === 0 ? (<div className="p-12 text-center">
                            <InboxIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">No notifications found</h3>
                            <p className="text-muted-foreground mt-1">
                                {searchQuery || typeFilter !== "all" || readFilter !== "all" ? "Try adjusting your filters" : "You don't have any notifications yet"}
                            </p>
                        </div>) : (<div className="divide-y">
                            {filteredNotifications.map(notification => (<div
                                key={notification.id}
                                className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${notification.read ? "" : "bg-primary/5"}`}
                                onClick={() => handleNotificationClick(notification)}>
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        <Badge className={getNotificationTypeColor(notification.type)}>
                                            {getNotificationTypeLabel(notification.type)}
                                        </Badge>
                                        {!notification.read && (<span className="h-2 w-2 rounded-full bg-blue-500"></span>)}
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {formatTimeAgo(notification.createdAt)}
                                    </span>
                                </div>
                                <h4 className="font-medium">
                                    {notification.contractTitle}
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {notification.message}
                                </p>
                            </div>))}
                        </div>)}
                    </div>
                </div>
            </PageTransition>
        </div>
    );
};

export default Inbox;