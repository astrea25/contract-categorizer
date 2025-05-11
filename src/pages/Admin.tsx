import { useState, useEffect } from "react";
import AuthNavbar from "@/components/layout/AuthNavbar";
import PageTransition from "@/components/layout/PageTransition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collection, getDocs, doc, updateDoc, query, where, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

import {
    getLegalTeamMembers,
    addLegalTeamMember,
    removeLegalTeamMember,
    getManagementTeamMembers,
    addManagementTeamMember,
    removeManagementTeamMember,
    getApprovers,
    addApprover,
    removeApprover,
    inviteUser,
    addAdminUser,
    removeAdminUser,
    removeUser,
    markUserDeletedInAuth,
} from "@/lib/data";

import { AlertCircle, Check, Plus, Trash2, X, Settings } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Link } from "react-router-dom";

interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    role?: string;
    createdAt?: string;
    isPendingInvite?: boolean;
}

interface AdminUser {
    id: string;
    email: string;
    displayName?: string;
    createdAt?: string;
}

interface LegalTeamMember {
    id: string;
    email: string;
    displayName?: string;
    role?: string;
    createdAt?: string;
}

interface ManagementTeamMember {
    id: string;
    email: string;
    displayName?: string;
    role?: string;
    createdAt?: string;
}

interface ApproverMember {
    id: string;
    email: string;
    displayName?: string;
    role?: string;
    createdAt?: string;
}

const Admin = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [legalTeam, setLegalTeam] = useState<LegalTeamMember[]>([]);
    const [managementTeam, setManagementTeam] = useState<ManagementTeamMember[]>([]);
    const [approvers, setApprovers] = useState<ApproverMember[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [activeTab, setActiveTab] = useState<string>("users");

    const {
        currentUser,
        isAdmin
    } = useAuth();

    useEffect(() => {
        if (!loading && currentUser && !isAdmin) {
            window.location.href = "/";
        }
    }, [currentUser, isAdmin, loading]);

    const [newUserEmail, setNewUserEmail] = useState("");
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
    const [inviting, setInviting] = useState(false);
    const [adminUserSearch, setAdminUserSearch] = useState("");
    const [filteredAdminUsers, setFilteredAdminUsers] = useState<User[]>([]);
    const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
    const [newAdminEmail, setNewAdminEmail] = useState("");
    const [addingAdmin, setAddingAdmin] = useState(false);
    const [legalUserSearch, setLegalUserSearch] = useState("");
    const [filteredLegalUsers, setFilteredLegalUsers] = useState<User[]>([]);
    const [isLegalDialogOpen, setIsLegalDialogOpen] = useState(false);
    const [addingLegal, setAddingLegal] = useState(false);
    const [managementUserSearch, setManagementUserSearch] = useState("");
    const [filteredManagementUsers, setFilteredManagementUsers] = useState<User[]>([]);
    const [isManagementDialogOpen, setIsManagementDialogOpen] = useState(false);
    const [addingManagement, setAddingManagement] = useState(false);
    const [approverUserSearch, setApproverUserSearch] = useState("");
    const [filteredApproverUsers, setFilteredApproverUsers] = useState<User[]>([]);
    const [isApproverDialogOpen, setIsApproverDialogOpen] = useState(false);
    const [addingApprover, setAddingApprover] = useState(false);
    const [userToRemove, setUserToRemove] = useState<User | null>(null);
    const [isRemovingUser, setIsRemovingUser] = useState(false);
    const [confirmDeleteEmail, setConfirmDeleteEmail] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            const usersRef = collection(db, "users");
            const usersSnapshot = await getDocs(usersRef);

            const usersData = usersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as User[];

            const adminsRef = collection(db, "admin");
            const adminsSnapshot = await getDocs(adminsRef);

            const adminsData = adminsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as AdminUser[];

            const legalTeamData = await getLegalTeamMembers() as LegalTeamMember[];
            const managementTeamData = await getManagementTeamMembers() as ManagementTeamMember[];
            const approversData = await getApprovers() as ApproverMember[];
            const pendingUsers = usersData.filter(user => (user as any).status === "pending");
            const adminEmails = adminsData.map(admin => admin.email.toLowerCase());
            const legalEmails = legalTeamData.map(legal => legal.email.toLowerCase());
            const managementEmails = managementTeamData.map(management => management.email.toLowerCase());
            const approverEmails = approversData.map(approver => approver.email.toLowerCase());

            const registeredEmails = new Set([
                ...usersData.map(user => user.email.toLowerCase()),
                ...adminEmails,
                ...legalEmails,
                ...managementEmails,
                ...approverEmails
            ]);

            const pendingInvites: User[] = pendingUsers.map(user => ({
                ...user,
                isPendingInvite: true
            }));

            const filteredUsers = usersData.filter(
                user => !adminEmails.includes(user.email.toLowerCase()) && !legalEmails.includes(user.email.toLowerCase()) && !managementEmails.includes(user.email.toLowerCase()) && !approverEmails.includes(user.email.toLowerCase())
            );

            const allUsers = [...usersData, ...pendingInvites];
            setUsers([...filteredUsers, ...pendingInvites]);
            setAllUsers(allUsers);
            setAdmins(adminsData);
            setLegalTeam(legalTeamData);
            setManagementTeam(managementTeamData);
            setApprovers(approversData);
        } catch (error) {
            toast.error("Error fetching data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleInviteUser = async () => {
        if (!newUserEmail) {
            toast.error("Email is required");
            return;
        }

        try {
            setInviting(true);
            await inviteUser(newUserEmail, "user", currentUser?.email || "admin");
            toast.success(`Account created for ${newUserEmail}`);
            setNewUserEmail("");
            setIsInviteDialogOpen(false);
            fetchData();
        } catch (error) {
            toast.error("Failed to create user account");
        } finally {
            setInviting(false);
        }
    };

    useEffect(() => {
        if (isAdminDialogOpen) {
            const adminEmails = admins.map(admin => admin.email.toLowerCase());
            const legalEmails = legalTeam.map(member => member.email.toLowerCase());
            const managementEmails = managementTeam.map(member => member.email.toLowerCase());
            const approverEmails = approvers.map(member => member.email.toLowerCase());

            if (adminUserSearch.trim() !== "") {
                const filtered = allUsers.filter(
                    user => !adminEmails.includes(user.email.toLowerCase()) && !legalEmails.includes(user.email.toLowerCase()) && !managementEmails.includes(user.email.toLowerCase()) && !approverEmails.includes(user.email.toLowerCase()) && (user.email.toLowerCase().includes(adminUserSearch.toLowerCase()) || user.displayName?.toLowerCase().includes(adminUserSearch.toLowerCase()) || `${user.firstName || ""} ${user.lastName || ""}`.trim().toLowerCase().includes(adminUserSearch.toLowerCase()))
                );

                setFilteredAdminUsers(filtered);
            } else {
                setFilteredAdminUsers([]);
            }
        }
    }, [
        adminUserSearch,
        isAdminDialogOpen,
        admins,
        legalTeam,
        managementTeam,
        approvers,
        allUsers
    ]);

    const handleAddAdmin = async (user: User) => {
        try {
            setAddingAdmin(true);
            let displayName = user.displayName;

            if (!displayName && (user.firstName || user.lastName)) {
                displayName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
            }

            if (!displayName) {
                displayName = user.email.split("@")[0];
            }

            await addAdminUser(user.email, currentUser?.email || undefined, displayName);
            toast.success(`${user.email} is now an admin`);
            setAdminUserSearch("");
            setNewAdminEmail("");
            setFilteredAdminUsers([]);
            setIsAdminDialogOpen(false);
            fetchData();
        } catch (error: any) {
            if (error.message && error.message.includes("legal team member")) {
                toast.error(
                    "This user is already a legal team member. A user cannot have multiple roles."
                );
            } else if (error.message && error.message.includes("management team member")) {
                toast.error(
                    "This user is already a management team member. A user cannot have multiple roles."
                );
            } else if (error.message && error.message.includes("approver")) {
                toast.error("This user is already an approver. A user cannot have multiple roles.");
            } else if (error.message && error.message.includes("Unauthorized")) {
                toast.error("Unauthorized: Only administrators can add admin users");
            } else {
                toast.error(`Failed to add admin user: ${error.message || "Unknown error"}`);
            }
        } finally {
            setAddingAdmin(false);
        }
    };

    const handleRemoveAdmin = async (id: string, email: string) => {
        try {
            await removeAdminUser(id, currentUser?.email || undefined);
            toast.success(`Removed ${email} from administrators`);
            fetchData();
        } catch (error) {
            toast.error(
                `Failed to remove admin user: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        }
    };

    useEffect(() => {
        if (isLegalDialogOpen) {
            const legalEmails = legalTeam.map(member => member.email.toLowerCase());
            const managementEmails = managementTeam.map(member => member.email.toLowerCase());

            if (legalUserSearch.trim() !== "") {
                const filtered = users.filter(
                    user => !legalEmails.includes(user.email.toLowerCase()) && !managementEmails.includes(user.email.toLowerCase()) && (user.email.toLowerCase().includes(legalUserSearch.toLowerCase()) || user.displayName?.toLowerCase().includes(legalUserSearch.toLowerCase()) || `${user.firstName || ""} ${user.lastName || ""}`.trim().toLowerCase().includes(legalUserSearch.toLowerCase()))
                );

                setFilteredLegalUsers(filtered);
            } else {
                setFilteredLegalUsers([]);
            }
        }
    }, [legalUserSearch, isLegalDialogOpen, legalTeam, managementTeam, users]);

    const handleAddLegalMember = async (user: User) => {
        try {
            setAddingLegal(true);
            const displayName = user.displayName || `${user.firstName || ""} ${user.lastName || ""}`.trim();
            await addLegalTeamMember(user.email, displayName);
            await inviteUser(user.email, "legal", currentUser?.email || "admin");
            toast.success(`${user.email} is now a legal team member`);
            setLegalUserSearch("");
            setFilteredLegalUsers([]);
            setIsLegalDialogOpen(false);
            fetchData();
        } catch (error: any) {
            if (error.message && error.message.includes("cannot be in both legal and management teams")) {
                toast.error(
                    "This user is already a management team member. A user cannot be in both legal and management teams."
                );
            } else {
                toast.error("Failed to add legal team member");
            }
        } finally {
            setAddingLegal(false);
        }
    };

    const handleRemoveLegalMember = async (id: string, email: string) => {
        try {
            await removeLegalTeamMember(id);
            toast.success(`Removed ${email} from the legal team`);
            fetchData();
        } catch (error) {
            toast.error("Failed to remove legal team member");
        }
    };

    useEffect(() => {
        if (isManagementDialogOpen) {
            const managementEmails = managementTeam.map(member => member.email.toLowerCase());
            const legalEmails = legalTeam.map(member => member.email.toLowerCase());

            if (managementUserSearch.trim() !== "") {
                const filtered = users.filter(
                    user => !managementEmails.includes(user.email.toLowerCase()) && !legalEmails.includes(user.email.toLowerCase()) && (user.email.toLowerCase().includes(managementUserSearch.toLowerCase()) || user.displayName?.toLowerCase().includes(managementUserSearch.toLowerCase()) || `${user.firstName || ""} ${user.lastName || ""}`.trim().toLowerCase().includes(managementUserSearch.toLowerCase()))
                );

                setFilteredManagementUsers(filtered);
            } else {
                setFilteredManagementUsers([]);
            }
        }
    }, [
        managementUserSearch,
        isManagementDialogOpen,
        managementTeam,
        legalTeam,
        users
    ]);

    useEffect(() => {
        if (isApproverDialogOpen) {
            const approverEmails = approvers.map(member => member.email.toLowerCase());
            const legalEmails = legalTeam.map(member => member.email.toLowerCase());
            const managementEmails = managementTeam.map(member => member.email.toLowerCase());

            if (approverUserSearch.trim() !== "") {
                const filtered = users.filter(
                    user => !approverEmails.includes(user.email.toLowerCase()) && !legalEmails.includes(user.email.toLowerCase()) && !managementEmails.includes(user.email.toLowerCase()) && (user.email.toLowerCase().includes(approverUserSearch.toLowerCase()) || user.displayName?.toLowerCase().includes(approverUserSearch.toLowerCase()) || `${user.firstName || ""} ${user.lastName || ""}`.trim().toLowerCase().includes(approverUserSearch.toLowerCase()))
                );

                setFilteredApproverUsers(filtered);
            } else {
                setFilteredApproverUsers([]);
            }
        }
    }, [
        approverUserSearch,
        isApproverDialogOpen,
        approvers,
        legalTeam,
        managementTeam,
        users
    ]);

    const handleAddManagementMember = async (user: User) => {
        try {
            setAddingManagement(true);
            const displayName = user.displayName || `${user.firstName || ""} ${user.lastName || ""}`.trim();
            await addManagementTeamMember(user.email, displayName);
            await inviteUser(user.email, "management", currentUser?.email || "admin");
            toast.success(`${user.email} is now a management team member`);
            setManagementUserSearch("");
            setFilteredManagementUsers([]);
            setIsManagementDialogOpen(false);
            fetchData();
        } catch (error: any) {
            if (error.message && error.message.includes("cannot be in both legal and management teams")) {
                toast.error(
                    "This user is already a legal team member. A user cannot be in both legal and management teams."
                );
            } else {
                toast.error("Failed to add management team member");
            }
        } finally {
            setAddingManagement(false);
        }
    };

    const handleRemoveManagementMember = async (id: string, email: string) => {
        try {
            await removeManagementTeamMember(id);
            toast.success(`Removed ${email} from the management team`);
            fetchData();
        } catch (error) {
            toast.error("Failed to remove management team member");
        }
    };

    const handleAddApprover = async (user: User) => {
        try {
            setAddingApprover(true);
            const displayName = user.displayName || `${user.firstName || ""} ${user.lastName || ""}`.trim();
            await addApprover(user.email, displayName);
            await inviteUser(user.email, "approver", currentUser?.email || "admin");
            toast.success(`${user.email} is now an approver`);
            setApproverUserSearch("");
            setFilteredApproverUsers([]);
            setIsApproverDialogOpen(false);
            fetchData();
        } catch (error: any) {
            if (error.message && error.message.includes("legal team member")) {
                toast.error(
                    "This user is already a legal team member. A user cannot be in both legal team and approver roles."
                );
            } else if (error.message && error.message.includes("management team member")) {
                toast.error(
                    "This user is already a management team member. A user cannot be in both management team and approver roles."
                );
            } else {
                toast.error("Failed to add approver");
            }
        } finally {
            setAddingApprover(false);
        }
    };

    const handleRemoveApprover = async (id: string, email: string) => {
        try {
            await removeApprover(id);
            toast.success(`Removed ${email} from approvers`);
            fetchData();
        } catch (error) {
            toast.error("Failed to remove approver");
        }
    };

    const updateAdminFields = async () => {
        try {
            const adminsToUpdate = admins.filter(admin => !admin.displayName || !admin.createdAt);

            if (adminsToUpdate.length === 0) {
                toast.info("No admin users with missing fields found");
                return;
            }

            for (const admin of adminsToUpdate) {
                const updates: any = {};

                if (!admin.displayName) {
                    const matchingUser = allUsers.find(user => user.email.toLowerCase() === admin.email.toLowerCase());

                    if (matchingUser) {
                        let displayName = matchingUser.displayName;

                        if (!displayName && (matchingUser.firstName || matchingUser.lastName)) {
                            displayName = `${matchingUser.firstName || ""} ${matchingUser.lastName || ""}`.trim();
                        }

                        if (!displayName) {
                            displayName = matchingUser.email.split("@")[0];
                        }

                        if (displayName) {
                            updates.displayName = displayName;
                        }
                    }
                }

                if (!admin.createdAt) {
                    updates.createdAt = new Date().toISOString();
                }

                if (Object.keys(updates).length > 0) {
                    const adminRef = doc(db, "admin", admin.id);
                    await updateDoc(adminRef, updates);
                    toast.success(`Updated fields for admin: ${admin.email}`);
                }
            }

            fetchData();
        } catch (error) {
            toast.error("Failed to update admin fields");
        }
    };

    const syncAuthDisplayNames = async () => {
        try {
            if (!currentUser) {
                toast.error("No authenticated user found");
                return;
            }

            const usersRef = collection(db, "users");
            const userQuery = query(usersRef, where("email", "==", currentUser.email?.toLowerCase() || ""));
            const userSnapshot = await getDocs(userQuery);

            if (!userSnapshot.empty) {
                const userDoc = userSnapshot.docs[0];

                await updateDoc(doc(db, "users", userDoc.id), {
                    displayName: currentUser.displayName || ""
                });

                toast.success("Successfully synced display name from Firebase Auth");
                fetchData();
            } else {
                toast.error("User not found in Firestore");
            }
        } catch (error) {
            toast.error("Failed to sync display names");
        }
    };

    const debugUserData = () => {
        if (users.length > 0) {
            const firstUser = users[0];

            toast.info(`First user: ${JSON.stringify({
    email: firstUser.email,
    displayName: firstUser.displayName || "None",
    firstName: firstUser.firstName || "None",
    lastName: firstUser.lastName || "None"
}, null, 2)}`);
        }
    };

    const handleRemoveUser = async () => {
        if (!userToRemove)
            return;

        try {
            setIsRemovingUser(true);

            if (userToRemove.isPendingInvite) {
                await removeUser(userToRemove.id, currentUser?.email || "admin");
                toast.success(`Invitation for ${userToRemove.email} has been canceled`);
            } else {
                const userRef = doc(db, "users", userToRemove.id);
                await deleteDoc(userRef);

                toast.success(`User ${userToRemove.email} has been removed from the database`, {
                    description: "Note: The user has been removed from the Firestore database only. You'll need to manually delete them from Firebase Authentication using the guide above."
                });
            }

            setUserToRemove(null);
            fetchData();
        } catch (error) {
            toast.error(
                `Failed to remove user: ${error instanceof Error ? error.message : "Unknown error"}`
            );
        } finally {
            setIsRemovingUser(false);
        }
    };

    const updateMissingDisplayNames = async () => {
        try {
            const usersToUpdate = users.filter(user => !user.displayName && (user.firstName || user.lastName));

            if (usersToUpdate.length === 0) {
                toast.info("No users with missing display names found");
                return;
            }

            for (const user of usersToUpdate) {
                const displayName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

                if (displayName) {
                    await updateDoc(doc(db, "users", user.id), {
                        displayName
                    });
                }
            }

            toast.success(`Updated display names for ${usersToUpdate.length} users`);
            fetchData();
        } catch (error) {
            toast.error("Failed to update display names");
        }
    };

    const handleConfirmFirebaseAuthDeletion = async () => {
        if (!confirmDeleteEmail) {
            toast.error("Please enter a valid email");
            return;
        }

        try {
            const {
                markUserDeletedInAuth
            } = await import("@/lib/data");

            await markUserDeletedInAuth(confirmDeleteEmail, currentUser?.email || "admin");

            toast.success(`User ${confirmDeleteEmail} marked as deleted in Firebase Auth`, {
                description: "The system has recorded that you've manually deleted this user from Firebase Authentication."
            });

            setConfirmDeleteEmail("");
        } catch (error) {
            toast.error("Failed to confirm Firebase Auth deletion");
        }
    };

    const userColumns: ColumnDef<User>[] = [{
        accessorKey: "email",
        header: "Email"
    }, {
        accessorKey: "displayName",
        header: "Name",

        cell: (
            {
                row
            }
        ) => {
            if (row.original.isPendingInvite) {
                return <span className="text-muted-foreground italic">Pending registration</span>;
            }

            const displayName = row.original.displayName;
            const firstName = row.original.firstName || "";
            const lastName = row.original.lastName || "";
            const fullName = `${firstName} ${lastName}`.trim();

            return (
                <div>
                    <div>{displayName || fullName || "-"}</div>
                    {displayName !== fullName && displayName && fullName && (<div className="text-xs text-muted-foreground">Alt: {fullName}
                    </div>)}
                </div>
            );
        }
    }, {
        accessorKey: "firstName",
        header: "First Name",

        cell: (
            {
                row
            }
        ) => {
            if (row.original.isPendingInvite)
                return "-";

            return row.original.firstName || "-";
        }
    }, {
        accessorKey: "lastName",
        header: "Last Name",

        cell: (
            {
                row
            }
        ) => {
            if (row.original.isPendingInvite)
                return "-";

            return row.original.lastName || "-";
        }
    }, {
        accessorKey: "role",
        header: "Role",

        cell: (
            {
                row
            }
        ) => {
            if (row.original.isPendingInvite) {
                return (
                    <span
                        className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-yellow-50 text-yellow-800 border-yellow-200">Invited
                                                                                  </span>
                );
            }

            return row.original.role || "User";
        }
    }, {
        accessorKey: "createdAt",
        header: "Created At",

        cell: (
            {
                row
            }
        ) => row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : "-"
    }, {
        id: "actions",
        header: "Actions",

        cell: (
            {
                row
            }
        ) => (<Button variant="ghost" size="icon" onClick={() => setUserToRemove(row.original)}>
            <Trash2 className="h-4 w-4 text-destructive" />
        </Button>)
    }];

    const adminColumns: ColumnDef<AdminUser>[] = [{
        accessorKey: "email",
        header: "Email"
    }, {
        accessorKey: "displayName",
        header: "Name",

        cell: (
            {
                row
            }
        ) => row.original.displayName || "-"
    }, {
        accessorKey: "createdAt",
        header: "Added On",

        cell: (
            {
                row
            }
        ) => row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : "-"
    }, {
        id: "actions",
        header: "Actions",

        cell: (
            {
                row
            }
        ) => (<Button
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveAdmin(row.original.id, row.original.email)}>
            <Trash2 className="h-4 w-4 text-destructive" />
        </Button>)
    }];

    const legalColumns: ColumnDef<LegalTeamMember>[] = [{
        accessorKey: "email",
        header: "Email"
    }, {
        accessorKey: "displayName",
        header: "Name",

        cell: (
            {
                row
            }
        ) => row.original.displayName || "-"
    }, {
        accessorKey: "createdAt",
        header: "Added On",

        cell: (
            {
                row
            }
        ) => row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : "-"
    }, {
        id: "actions",
        header: "Actions",

        cell: (
            {
                row
            }
        ) => (<Button
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveLegalMember(row.original.id, row.original.email)}>
            <Trash2 className="h-4 w-4 text-destructive" />
        </Button>)
    }];

    const managementColumns: ColumnDef<ManagementTeamMember>[] = [{
        accessorKey: "email",
        header: "Email"
    }, {
        accessorKey: "displayName",
        header: "Name",

        cell: (
            {
                row
            }
        ) => row.original.displayName || "-"
    }, {
        accessorKey: "createdAt",
        header: "Added On",

        cell: (
            {
                row
            }
        ) => row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : "-"
    }, {
        id: "actions",
        header: "Actions",

        cell: (
            {
                row
            }
        ) => (<Button
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveManagementMember(row.original.id, row.original.email)}>
            <Trash2 className="h-4 w-4 text-destructive" />
        </Button>)
    }];

    const approverColumns: ColumnDef<ApproverMember>[] = [{
        accessorKey: "email",
        header: "Email"
    }, {
        accessorKey: "displayName",
        header: "Name",

        cell: (
            {
                row
            }
        ) => row.original.displayName || "-"
    }, {
        accessorKey: "createdAt",
        header: "Added On",

        cell: (
            {
                row
            }
        ) => row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : "-"
    }, {
        id: "actions",
        header: "Actions",

        cell: (
            {
                row
            }
        ) => (<Button
            variant="ghost"
            size="icon"
            onClick={() => handleRemoveApprover(row.original.id, row.original.email)}>
            <Trash2 className="h-4 w-4 text-destructive" />
        </Button>)
    }];

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AuthNavbar />
            <PageTransition>
                <div className="flex-1 w-full">
                    <div className="container mx-auto py-8 space-y-6">
                        <h1 className="text-3xl font-bold">Admin Panel</h1>
                        <div className="flex flex-wrap items-center gap-4 mb-6">
                            <Button asChild variant="outline">
                                <Link to="/system-settings">
                                    <Settings className="h-4 w-4 mr-2" />System Settings
                                                                                                                            </Link>
                            </Button>
                            <Button asChild variant="outline">
                                <Link to="/admin-tools">
                                    <Settings className="h-4 w-4 mr-2" />Admin Tools
                                                                                                                            </Link>
                            </Button>
                        </div>
                        <Tabs
                            defaultValue="users"
                            value={activeTab}
                            onValueChange={setActiveTab}
                            className="w-full">
                            <TabsList className="mb-6">
                                <TabsTrigger value="users">Users</TabsTrigger>
                                <TabsTrigger value="admins">Admins</TabsTrigger>
                                <TabsTrigger value="legalTeam">Legal Team</TabsTrigger>
                                <TabsTrigger value="managementTeam">Management Team</TabsTrigger>
                                <TabsTrigger value="approvers">Approvers</TabsTrigger>
                            </TabsList>
                            <TabsContent value="users">
                                <Card>
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <CardTitle>Users</CardTitle>
                                                <CardDescription>List of all regular users in the application (excluding admins and legal team)
                                                                                                                                                                                    </CardDescription>
                                            </div>
                                            <Dialog
                                                open={isInviteDialogOpen}
                                                onOpenChange={open => {
                                                    setIsInviteDialogOpen(open);

                                                    if (!open) {
                                                        setNewUserEmail("");
                                                    }
                                                }}>
                                                <DialogTrigger asChild>
                                                    <Button size="sm">
                                                        <Plus className="h-4 w-4 mr-2" />Invite User
                                                                                                                                                                                                  </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Invite New User</DialogTitle>
                                                        <DialogDescription>Enter the email address of the user you want to invite. They will receive an email with login credentials.
                                                                                                                                                                                                                </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="newUserEmail">Email Address</Label>
                                                            <Input
                                                                id="newUserEmail"
                                                                placeholder="user@example.com"
                                                                type="email"
                                                                value={newUserEmail}
                                                                onChange={e => setNewUserEmail(e.target.value)} />
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">The user will receive an email with a temporary password (12345678) and instructions to log in.
                                                                                                                                                                                                                </div>
                                                    </div>
                                                    <DialogFooter>
                                                        <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>Cancel
                                                                                                                                                                                                                </Button>
                                                        <Button onClick={handleInviteUser} disabled={inviting || !newUserEmail}>
                                                            {inviting ? "Inviting..." : "Invite User"}
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="mb-4 flex flex-wrap gap-2">
                                            <Button variant="outline" onClick={updateAdminFields} disabled={loading}>Fix Missing Display Names
                                                                                                                                                                      </Button>
                                            <Button variant="outline" onClick={syncAuthDisplayNames} disabled={loading}>Sync Auth Display Name
                                                                                                                                                                      </Button>
                                            <Button variant="outline" onClick={debugUserData} disabled={loading}>Debug User Data
                                                                                                                                                                      </Button>
                                        </div>
                                        {loading ? (<Skeleton className="w-full h-64" />) : (<>
                                            {}
                                            <Card className="mb-6 border-amber-200 bg-amber-50">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-lg flex items-center gap-2">
                                                        <AlertCircle className="h-5 w-5 text-amber-600" />
                                                        <span>Firebase Auth User Deletion Guide</span>
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-sm mb-2">When deleting users from the system, please note that you'll need to manually delete them from Firebase Authentication:
                                                                                                                                                                                                    </p>
                                                    <ol className="list-decimal list-inside text-sm space-y-1 pl-2">
                                                        <li>Go to the <a
                                                                href="https://console.firebase.google.com/"
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 underline">Firebase Console</a></li>
                                                        <li>Select your project</li>
                                                        <li>Navigate to Authentication → Users</li>
                                                        <li>Find the user by email address</li>
                                                        <li>Click the three dots menu (⋮) next to the user</li>
                                                        <li>Select "Delete account"</li>
                                                    </ol>
                                                    <p className="text-sm mt-3 italic">This step is necessary because client-side applications cannot directly delete users from Firebase Authentication for security reasons.</p>
                                                </CardContent>
                                            </Card>
                                            <DataTable columns={userColumns} data={users} />
                                        </>)}
                                    </CardContent>
                                    <CardFooter className="border-t pt-6 flex flex-col gap-2">
                                        <div className="text-sm text-muted-foreground">This section shows both registered users and pending invitations.
                                                                                                                                                          This application is invitation-only - new users must be invited via the "Invite User" button before they can sign up.
                                                                                                                                                          The delete button will remove users from the Firestore database only. To completely delete users, you must also
                                                                                                                                                          manually delete them from Firebase Authentication using the guide above.
                                                                                                                                                        </div>
                                    </CardFooter>
                                </Card>
                            </TabsContent>
                            <TabsContent value="admins">
                                <Card>
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <CardTitle>Administrators</CardTitle>
                                                <CardDescription>Users with full access to the application
                                                                                                                                                                                    </CardDescription>
                                            </div>
                                            <Dialog
                                                open={isAdminDialogOpen}
                                                onOpenChange={open => {
                                                    setIsAdminDialogOpen(open);

                                                    if (!open) {
                                                        setAdminUserSearch("");
                                                        setNewAdminEmail("");
                                                        setFilteredAdminUsers([]);
                                                    }
                                                }}>
                                                <DialogTrigger asChild>
                                                    <Button size="sm">
                                                        <Plus className="h-4 w-4 mr-2" />Add Admin
                                                                                                                                                                                                  </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Add Administrator</DialogTitle>
                                                        <DialogDescription>Search for an existing user to promote to administrator role.
                                                                                                                                                                                                                </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="adminUserSearch">Search Existing Users</Label>
                                                            <div className="relative">
                                                                <Input
                                                                    id="adminUserSearch"
                                                                    placeholder="Search by name or email"
                                                                    value={adminUserSearch}
                                                                    onChange={e => setAdminUserSearch(e.target.value)} />
                                                                {filteredAdminUsers.length > 0 && (<div
                                                                    className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-popover border rounded-md shadow-md">
                                                                    {filteredAdminUsers.map(user => (<div
                                                                        key={user.id}
                                                                        className="p-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                                                                        onClick={() => handleAddAdmin(user)}>
                                                                        <div>
                                                                            <div className="font-medium">
                                                                                {user.displayName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "No name"}
                                                                            </div>
                                                                            <div className="text-xs text-muted-foreground">{user.email}</div>
                                                                        </div>
                                                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                                            <Check className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>))}
                                                                </div>)}
                                                            </div>
                                                        </div>
                                                        {filteredAdminUsers.length === 0 && adminUserSearch.trim() !== "" && (<div className="text-sm flex items-center gap-2 text-muted-foreground">
                                                            <AlertCircle className="h-4 w-4" />No matching users found
                                                                                                                                                                                                                  </div>)}
                                                        {adminUserSearch.trim() === "" && (<div className="text-sm text-muted-foreground">Type to search for users to add as administrators
                                                                                                                                                                                                                  </div>)}
                                                    </div>
                                                    <DialogFooter>
                                                        <Button variant="outline" onClick={() => setIsAdminDialogOpen(false)}>Cancel
                                                                                                                                                                                                                </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (<Skeleton className="w-full h-64" />) : (<>
                                            <div className="mb-4">
                                                <Button variant="outline" onClick={updateAdminFields} disabled={loading}>Fix Admin Fields
                                                                                                                                                                                      </Button>
                                            </div>
                                            <DataTable columns={adminColumns} data={admins} />
                                        </>)}
                                    </CardContent>
                                    <CardFooter className="border-t pt-6 flex justify-between">
                                        <div className="text-sm text-muted-foreground">Administrators have full access to all features and settings.
                                                                                                                                                        </div>
                                    </CardFooter>
                                </Card>
                            </TabsContent>
                            <TabsContent value="legalTeam">
                                <Card>
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <CardTitle>Legal Team</CardTitle>
                                                <CardDescription>Manage legal team members who review contracts
                                                                                                                                                                                    </CardDescription>
                                            </div>
                                            <Dialog
                                                open={isLegalDialogOpen}
                                                onOpenChange={open => {
                                                    setIsLegalDialogOpen(open);

                                                    if (!open) {
                                                        setLegalUserSearch("");
                                                        setFilteredLegalUsers([]);
                                                    }
                                                }}>
                                                <DialogTrigger asChild>
                                                    <Button size="sm">
                                                        <Plus className="h-4 w-4 mr-2" />Add Member
                                                                                                                                                                                                  </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Add Legal Team Member</DialogTitle>
                                                        <DialogDescription>Search for an existing user to add to the legal team.
                                                                                                                                                                                                                </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="legalUserSearch">Search Existing Users</Label>
                                                            <div className="relative">
                                                                <Input
                                                                    id="legalUserSearch"
                                                                    placeholder="Search by name or email"
                                                                    value={legalUserSearch}
                                                                    onChange={e => setLegalUserSearch(e.target.value)} />
                                                                {filteredLegalUsers.length > 0 && (<div
                                                                    className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-popover border rounded-md shadow-md">
                                                                    {filteredLegalUsers.map(user => (<div
                                                                        key={user.id}
                                                                        className="p-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                                                                        onClick={() => handleAddLegalMember(user)}>
                                                                        <div>
                                                                            <div className="font-medium">
                                                                                {user.displayName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "No name"}
                                                                            </div>
                                                                            <div className="text-xs text-muted-foreground">{user.email}</div>
                                                                        </div>
                                                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                                            <Check className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>))}
                                                                </div>)}
                                                            </div>
                                                        </div>
                                                        {filteredLegalUsers.length === 0 && legalUserSearch.trim() !== "" && (<div className="text-sm flex items-center gap-2 text-muted-foreground">
                                                            <AlertCircle className="h-4 w-4" />No matching users found
                                                                                                                                                                                                                  </div>)}
                                                        {legalUserSearch.trim() === "" && (<div className="text-sm text-muted-foreground">Type to search for users to add to the legal team
                                                                                                                                                                                                                  </div>)}
                                                    </div>
                                                    <DialogFooter>
                                                        <Button variant="outline" onClick={() => setIsLegalDialogOpen(false)}>Cancel
                                                                                                                                                                                                                </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (<Skeleton className="w-full h-64" />) : (<DataTable columns={legalColumns} data={legalTeam} />)}
                                    </CardContent>
                                    <CardFooter className="border-t pt-6 flex justify-between">
                                        <div className="text-sm text-muted-foreground">Legal team members can review contracts and provide feedback.
                                                                                                                                                        </div>
                                    </CardFooter>
                                </Card>
                            </TabsContent>
                            <TabsContent value="managementTeam">
                                <Card>
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <CardTitle>Management Team</CardTitle>
                                                <CardDescription>Manage management team members who approve contracts
                                                                                                                                                                                    </CardDescription>
                                            </div>
                                            <Dialog
                                                open={isManagementDialogOpen}
                                                onOpenChange={open => {
                                                    setIsManagementDialogOpen(open);

                                                    if (!open) {
                                                        setManagementUserSearch("");
                                                        setFilteredManagementUsers([]);
                                                    }
                                                }}>
                                                <DialogTrigger asChild>
                                                    <Button size="sm">
                                                        <Plus className="h-4 w-4 mr-2" />Add Member
                                                                                                                                                                                                  </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Add Management Team Member</DialogTitle>
                                                        <DialogDescription>Search for an existing user to add to the management team.
                                                                                                                                                                                                                </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="managementUserSearch">Search Existing Users</Label>
                                                            <div className="relative">
                                                                <Input
                                                                    id="managementUserSearch"
                                                                    placeholder="Search by name or email"
                                                                    value={managementUserSearch}
                                                                    onChange={e => setManagementUserSearch(e.target.value)} />
                                                                {filteredManagementUsers.length > 0 && (<div
                                                                    className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-popover border rounded-md shadow-md">
                                                                    {filteredManagementUsers.map(user => (<div
                                                                        key={user.id}
                                                                        className="p-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                                                                        onClick={() => handleAddManagementMember(user)}>
                                                                        <div>
                                                                            <div className="font-medium">
                                                                                {user.displayName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "No name"}
                                                                            </div>
                                                                            <div className="text-xs text-muted-foreground">{user.email}</div>
                                                                        </div>
                                                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                                            <Check className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>))}
                                                                </div>)}
                                                            </div>
                                                        </div>
                                                        {filteredManagementUsers.length === 0 && managementUserSearch.trim() !== "" && (<div className="text-sm flex items-center gap-2 text-muted-foreground">
                                                            <AlertCircle className="h-4 w-4" />No matching users found
                                                                                                                                                                                                                  </div>)}
                                                        {managementUserSearch.trim() === "" && (<div className="text-sm text-muted-foreground">Type to search for users to add to the management team
                                                                                                                                                                                                                  </div>)}
                                                    </div>
                                                    <DialogFooter>
                                                        <Button variant="outline" onClick={() => setIsManagementDialogOpen(false)}>Cancel
                                                                                                                                                                                                                </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (<Skeleton className="w-full h-64" />) : (<DataTable columns={managementColumns} data={managementTeam} />)}
                                    </CardContent>
                                    <CardFooter className="border-t pt-6 flex justify-between">
                                        <div className="text-sm text-muted-foreground">Management team members can approve contracts and make business decisions.
                                                                                                                                                        </div>
                                    </CardFooter>
                                </Card>
                            </TabsContent>
                            <TabsContent value="approvers">
                                <Card>
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <CardTitle>Approvers</CardTitle>
                                                <CardDescription>Manage approvers who can approve contracts
                                                                                                                                                                                    </CardDescription>
                                            </div>
                                            <Dialog
                                                open={isApproverDialogOpen}
                                                onOpenChange={open => {
                                                    setIsApproverDialogOpen(open);

                                                    if (!open) {
                                                        setApproverUserSearch("");
                                                        setFilteredApproverUsers([]);
                                                    }
                                                }}>
                                                <DialogTrigger asChild>
                                                    <Button size="sm">
                                                        <Plus className="h-4 w-4 mr-2" />Add Member
                                                                                                                                                                                                  </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Add Approver</DialogTitle>
                                                        <DialogDescription>Search for an existing user to add as an approver.
                                                                                                                                                                                                                </DialogDescription>
                                                    </DialogHeader>
                                                    <div className="grid gap-4 py-4">
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="approverUserSearch">Search Existing Users</Label>
                                                            <div className="relative">
                                                                <Input
                                                                    id="approverUserSearch"
                                                                    placeholder="Search by name or email"
                                                                    value={approverUserSearch}
                                                                    onChange={e => setApproverUserSearch(e.target.value)} />
                                                                {filteredApproverUsers.length > 0 && (<div
                                                                    className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-popover border rounded-md shadow-md">
                                                                    {filteredApproverUsers.map(user => (<div
                                                                        key={user.id}
                                                                        className="p-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                                                                        onClick={() => handleAddApprover(user)}>
                                                                        <div>
                                                                            <div className="font-medium">
                                                                                {user.displayName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "No name"}
                                                                            </div>
                                                                            <div className="text-xs text-muted-foreground">{user.email}</div>
                                                                        </div>
                                                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                                                            <Check className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>))}
                                                                </div>)}
                                                            </div>
                                                        </div>
                                                        {filteredApproverUsers.length === 0 && approverUserSearch.trim() !== "" && (<div className="text-sm flex items-center gap-2 text-muted-foreground">
                                                            <AlertCircle className="h-4 w-4" />No matching users found
                                                                                                                                                                                                                  </div>)}
                                                        {approverUserSearch.trim() === "" && (<div className="text-sm text-muted-foreground">Type to search for users to add as approvers
                                                                                                                                                                                                                  </div>)}
                                                    </div>
                                                    <DialogFooter>
                                                        <Button variant="outline" onClick={() => setIsApproverDialogOpen(false)}>Cancel
                                                                                                                                                                                                                </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {loading ? (<Skeleton className="w-full h-64" />) : (<DataTable columns={approverColumns} data={approvers} />)}
                                    </CardContent>
                                    <CardFooter className="border-t pt-6 flex justify-between">
                                        <div className="text-sm text-muted-foreground">Approvers can review and approve contracts.
                                                                                                                                                        </div>
                                    </CardFooter>
                                </Card>
                            </TabsContent>
                        </Tabs>
                        {}
                        <AlertDialog
                            open={!!userToRemove}
                            onOpenChange={open => !open && setUserToRemove(null)}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        {userToRemove?.isPendingInvite ? "Cancel Invitation" : "Remove User from Database"}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {userToRemove?.isPendingInvite ? (<>Are you sure you want to cancel the invitation for <span className="font-semibold">{userToRemove?.email}</span>?
                                                                                                                                                            This will prevent this person from being able to sign up for the application.
                                                                                                                                                          </>) : (<>Are you sure you want to remove <span className="font-semibold">{userToRemove?.email}</span>from the database?
                                                                                                                                                            This will remove the user from the Firestore database only.
                                                                                                                                                          </>)}
                                    </AlertDialogDescription>
                                    {!userToRemove?.isPendingInvite && (<div className="mt-3 p-3 border border-amber-200 bg-amber-50 rounded-md">
                                        <div className="text-amber-700 text-sm font-medium">Important Note</div>
                                        <div className="text-amber-700 text-sm mt-1">This operation will only remove the user from the Firestore database.
                                                                                                                                                          </div>
                                        <div className="text-amber-700 text-sm mt-1">The user will still exist in Firebase Authentication and will need to be manually deleted
                                                                                                                                                            through the Firebase Console as explained in the guide above.
                                                                                                                                                          </div>
                                        <div className="text-amber-700 text-sm mt-1">Until deleted from Firebase Authentication, the user may still be able to log in,
                                                                                                                                                            but will appear as a new user without any roles or permissions.
                                                                                                                                                          </div>
                                    </div>)}
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleRemoveUser}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        disabled={isRemovingUser}>
                                        {isRemovingUser ? "Processing..." : userToRemove?.isPendingInvite ? "Cancel Invitation" : "Remove from Database"}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </PageTransition>
        </div>
    );
};

export default Admin;