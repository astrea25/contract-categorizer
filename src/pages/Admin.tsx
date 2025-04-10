import { useState, useEffect } from 'react';
import AuthNavbar from '@/components/layout/AuthNavbar';
import PageTransition from '@/components/layout/PageTransition';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, getDocs, doc, updateDoc, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
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
  removeUser
} from '@/lib/data';
import { AlertCircle, Check, Plus, Trash2, X } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

// Types
interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  role?: string;
  createdAt?: string;
  isPendingInvite?: boolean; // Flag for users who are invited but not registered yet
}

interface AdminUser {
  id: string;
  email: string;
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
  const [allUsers, setAllUsers] = useState<User[]>([]); // All users including those in teams
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [legalTeam, setLegalTeam] = useState<LegalTeamMember[]>([]);
  const [managementTeam, setManagementTeam] = useState<ManagementTeamMember[]>([]);
  const [approvers, setApprovers] = useState<ApproverMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('users');
  const { currentUser } = useAuth();

  // State for user invitation form
  const [newUserEmail, setNewUserEmail] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviting, setInviting] = useState(false);

  // State for admin user form
  const [adminUserSearch, setAdminUserSearch] = useState('');
  const [filteredAdminUsers, setFilteredAdminUsers] = useState<User[]>([]);
  const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [addingAdmin, setAddingAdmin] = useState(false);

  // State for legal team member form
  const [legalUserSearch, setLegalUserSearch] = useState('');
  const [filteredLegalUsers, setFilteredLegalUsers] = useState<User[]>([]);
  const [isLegalDialogOpen, setIsLegalDialogOpen] = useState(false);
  const [addingLegal, setAddingLegal] = useState(false);

  // State for management team member form
  const [managementUserSearch, setManagementUserSearch] = useState('');
  const [filteredManagementUsers, setFilteredManagementUsers] = useState<User[]>([]);
  const [isManagementDialogOpen, setIsManagementDialogOpen] = useState(false);
  const [addingManagement, setAddingManagement] = useState(false);

  // State for approver member form
  const [approverUserSearch, setApproverUserSearch] = useState('');
  const [filteredApproverUsers, setFilteredApproverUsers] = useState<User[]>([]);
  const [isApproverDialogOpen, setIsApproverDialogOpen] = useState(false);
  const [addingApprover, setAddingApprover] = useState(false);

  // State for user removal confirmation
  const [userToRemove, setUserToRemove] = useState<User | null>(null);
  const [isRemovingUser, setIsRemovingUser] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch users
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];

      // Fetch admins
      const adminsRef = collection(db, 'admin');
      const adminsSnapshot = await getDocs(adminsRef);
      const adminsData = adminsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AdminUser[];

      // Fetch legal team members
      const legalTeamData = await getLegalTeamMembers() as LegalTeamMember[];

      // Fetch management team members
      const managementTeamData = await getManagementTeamMembers() as ManagementTeamMember[];

      // Fetch approvers
      const approversData = await getApprovers() as ApproverMember[];

      // Get users with pending status (invites)
      const pendingUsers = usersData.filter(user => (user as any).status === 'pending');

      // Filter out admin users, legal team, and management team members from the users list
      const adminEmails = adminsData.map(admin => admin.email.toLowerCase());
      const legalEmails = legalTeamData.map(legal => legal.email.toLowerCase());
      const managementEmails = managementTeamData.map(management => management.email.toLowerCase());
      const approverEmails = approversData.map(approver => approver.email.toLowerCase());

      // Create a set of emails that are already registered in the system
      const registeredEmails = new Set([
        ...usersData.map(user => user.email.toLowerCase()),
        ...adminEmails,
        ...legalEmails,
        ...managementEmails,
        ...approverEmails
      ]);

      // Mark pending users as invites for the UI
      const pendingInvites: User[] = pendingUsers.map(user => ({
        ...user,
        isPendingInvite: true // Flag to identify pending invites in the UI
      }));

      // Filter users for the regular users tab (excluding admins, legal, and management)
      const filteredUsers = usersData.filter(user =>
        !adminEmails.includes(user.email.toLowerCase()) &&
        !legalEmails.includes(user.email.toLowerCase()) &&
        !managementEmails.includes(user.email.toLowerCase()) &&
        !approverEmails.includes(user.email.toLowerCase())
      );

      // Keep a separate list of all users for admin selection
      const allUsers = [...usersData, ...pendingInvites];

      // Combine regular users with pending invites for the users tab
      setUsers([...filteredUsers, ...pendingInvites]);

      // Set all users for admin selection
      setAllUsers(allUsers);
      setAdmins(adminsData);
      setLegalTeam(legalTeamData);
      setManagementTeam(managementTeamData);
      setApprovers(approversData);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Function to create a new user account
  const handleInviteUser = async () => {
    if (!newUserEmail) {
      toast.error('Email is required');
      return;
    }

    try {
      setInviting(true);
      await inviteUser(
        newUserEmail,
        'user', // Default role
        currentUser?.email || 'admin'
      );

      toast.success(`Account created for ${newUserEmail}`);
      setNewUserEmail('');
      setIsInviteDialogOpen(false);
      fetchData(); // Refresh data to show the new user
    } catch (error) {
      console.error('Error creating user account:', error);
      toast.error('Failed to create user account');
    } finally {
      setInviting(false);
    }
  };

  // Filter users for adding to admin team
  useEffect(() => {
    if (isAdminDialogOpen) {
      const adminEmails = admins.map(admin => admin.email.toLowerCase());

      if (adminUserSearch.trim() !== '') {
        // Allow all users to be admins, including those in legal and management teams
        const filtered = allUsers.filter(user =>
          !adminEmails.includes(user.email.toLowerCase()) && // Only exclude existing admins
          (user.email.toLowerCase().includes(adminUserSearch.toLowerCase()) ||
           user.displayName?.toLowerCase().includes(adminUserSearch.toLowerCase()) ||
           `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase().includes(adminUserSearch.toLowerCase()))
        );
        setFilteredAdminUsers(filtered);
      } else {
        setFilteredAdminUsers([]);
      }
    }
  }, [adminUserSearch, isAdminDialogOpen, admins, allUsers]);

  // Function to add user as admin
  const handleAddAdmin = async (user: User) => {
    try {
      setAddingAdmin(true);
      await addAdminUser(user.email);
      toast.success(`${user.email} is now an admin`);
      setAdminUserSearch('');
      setNewAdminEmail('');
      setFilteredAdminUsers([]);
      setIsAdminDialogOpen(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error adding admin:', error);
      toast.error('Failed to add admin user');
    } finally {
      setAddingAdmin(false);
    }
  };

  // Function to remove an admin
  const handleRemoveAdmin = async (id: string, email: string) => {
    try {
      await removeAdminUser(id);
      toast.success(`Removed ${email} from administrators`);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error removing admin:', error);
      toast.error('Failed to remove admin user');
    }
  };



  // Filter users for adding to legal team
  useEffect(() => {
    if (isLegalDialogOpen) {
      const legalEmails = legalTeam.map(member => member.email.toLowerCase());
      const managementEmails = managementTeam.map(member => member.email.toLowerCase());

      if (legalUserSearch.trim() !== '') {
        const filtered = users.filter(user =>
          !legalEmails.includes(user.email.toLowerCase()) &&
          !managementEmails.includes(user.email.toLowerCase()) && // Exclude management team members
          (user.email.toLowerCase().includes(legalUserSearch.toLowerCase()) ||
           user.displayName?.toLowerCase().includes(legalUserSearch.toLowerCase()) ||
           `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase().includes(legalUserSearch.toLowerCase()))
        );
        setFilteredLegalUsers(filtered);
      } else {
        setFilteredLegalUsers([]);
      }
    }
  }, [legalUserSearch, isLegalDialogOpen, legalTeam, managementTeam, users]);

  // Function to add a legal team member
  const handleAddLegalMember = async (user: User) => {
    try {
      setAddingLegal(true);

      // Get the display name from user
      const displayName = user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim();

      await addLegalTeamMember(user.email, displayName);

      // Also invite the user with the legal role
      await inviteUser(
        user.email,
        'legal',
        currentUser?.email || 'admin'
      );

      toast.success(`${user.email} is now a legal team member`);
      setLegalUserSearch('');
      setFilteredLegalUsers([]);
      setIsLegalDialogOpen(false);
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error adding legal team member:', error);

      // Check for specific error message
      if (error.message && error.message.includes('cannot be in both legal and management teams')) {
        toast.error('This user is already a management team member. A user cannot be in both legal and management teams.');
      } else {
        toast.error('Failed to add legal team member');
      }
    } finally {
      setAddingLegal(false);
    }
  };

  // Function to remove a legal team member
  const handleRemoveLegalMember = async (id: string, email: string) => {
    try {
      await removeLegalTeamMember(id);
      toast.success(`Removed ${email} from the legal team`);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error removing legal team member:', error);
      toast.error('Failed to remove legal team member');
    }
  };

  // Filter users for adding to management team
  useEffect(() => {
    if (isManagementDialogOpen) {
      const managementEmails = managementTeam.map(member => member.email.toLowerCase());
      const legalEmails = legalTeam.map(member => member.email.toLowerCase());

      if (managementUserSearch.trim() !== '') {
        const filtered = users.filter(user =>
          !managementEmails.includes(user.email.toLowerCase()) &&
          !legalEmails.includes(user.email.toLowerCase()) && // Exclude legal team members
          (user.email.toLowerCase().includes(managementUserSearch.toLowerCase()) ||
           user.displayName?.toLowerCase().includes(managementUserSearch.toLowerCase()) ||
           `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase().includes(managementUserSearch.toLowerCase()))
        );
        setFilteredManagementUsers(filtered);
      } else {
        setFilteredManagementUsers([]);
      }
    }
  }, [managementUserSearch, isManagementDialogOpen, managementTeam, legalTeam, users]);

  // Filter users for adding to approvers
  useEffect(() => {
    if (isApproverDialogOpen) {
      const approverEmails = approvers.map(member => member.email.toLowerCase());

      if (approverUserSearch.trim() !== '') {
        const filtered = users.filter(user =>
          !approverEmails.includes(user.email.toLowerCase()) &&
          (user.email.toLowerCase().includes(approverUserSearch.toLowerCase()) ||
           user.displayName?.toLowerCase().includes(approverUserSearch.toLowerCase()) ||
           `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase().includes(approverUserSearch.toLowerCase()))
        );
        setFilteredApproverUsers(filtered);
      } else {
        setFilteredApproverUsers([]);
      }
    }
  }, [approverUserSearch, isApproverDialogOpen, approvers, users]);

  // Function to add a management team member
  const handleAddManagementMember = async (user: User) => {
    try {
      setAddingManagement(true);

      // Get the display name from user
      const displayName = user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim();

      await addManagementTeamMember(user.email, displayName);

      // Also invite the user with the management role
      await inviteUser(
        user.email,
        'management',
        currentUser?.email || 'admin'
      );

      toast.success(`${user.email} is now a management team member`);
      setManagementUserSearch('');
      setFilteredManagementUsers([]);
      setIsManagementDialogOpen(false);
      fetchData(); // Refresh data
    } catch (error: any) {
      console.error('Error adding management team member:', error);

      // Check for specific error message
      if (error.message && error.message.includes('cannot be in both legal and management teams')) {
        toast.error('This user is already a legal team member. A user cannot be in both legal and management teams.');
      } else {
        toast.error('Failed to add management team member');
      }
    } finally {
      setAddingManagement(false);
    }
  };

  // Function to remove a management team member
  const handleRemoveManagementMember = async (id: string, email: string) => {
    try {
      await removeManagementTeamMember(id);
      toast.success(`Removed ${email} from the management team`);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error removing management team member:', error);
      toast.error('Failed to remove management team member');
    }
  };

  // Function to add an approver
  const handleAddApprover = async (user: User) => {
    try {
      setAddingApprover(true);

      // Get the display name from user
      const displayName = user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim();

      await addApprover(user.email, displayName);

      // Also invite the user with the approver role
      await inviteUser(
        user.email,
        'approver',
        currentUser?.email || 'admin'
      );

      toast.success(`${user.email} is now an approver`);
      setApproverUserSearch('');
      setFilteredApproverUsers([]);
      setIsApproverDialogOpen(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error adding approver:', error);
      toast.error('Failed to add approver');
    } finally {
      setAddingApprover(false);
    }
  };

  // Function to remove an approver
  const handleRemoveApprover = async (id: string, email: string) => {
    try {
      await removeApprover(id);
      toast.success(`Removed ${email} from approvers`);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error removing approver:', error);
      toast.error('Failed to remove approver');
    }
  };

  // Function to update display names for users without one
  const updateMissingDisplayNames = async () => {
    try {
      // Find users missing display names but with first/last names
      const usersToUpdate = users.filter(user =>
        !user.displayName && (user.firstName || user.lastName)
      );

      if (usersToUpdate.length === 0) {
        toast.info("No users with missing display names found");
        return;
      }

      // Update each user
      for (const user of usersToUpdate) {
        const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        if (displayName) {
          await updateDoc(doc(db, 'users', user.id), {
            displayName
          });
        }
      }

      toast.success(`Updated display names for ${usersToUpdate.length} users`);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error updating display names:', error);
      toast.error('Failed to update display names');
    }
  };

  // Function to sync Firebase Auth display names with Firestore
  const syncAuthDisplayNames = async () => {
    try {
      if (!currentUser) {
        toast.error("No authenticated user found");
        return;
      }

      // Update current user's display name in Firestore
      const usersRef = collection(db, 'users');
      const userQuery = query(usersRef, where('email', '==', currentUser.email?.toLowerCase() || ''));
      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        await updateDoc(doc(db, 'users', userDoc.id), {
          displayName: currentUser.displayName || ''
        });

        toast.success("Successfully synced display name from Firebase Auth");
        fetchData(); // Refresh data
      } else {
        toast.error("User not found in Firestore");
      }
    } catch (error) {
      console.error('Error syncing display names:', error);
      toast.error('Failed to sync display names');
    }
  };

  // Debug function to log user data
  const debugUserData = () => {
    if (users.length > 0) {
      // Show details of the first user
      const firstUser = users[0];
      toast.info(`First user: ${JSON.stringify({
        email: firstUser.email,
        displayName: firstUser.displayName || 'None',
        firstName: firstUser.firstName || 'None',
        lastName: firstUser.lastName || 'None'
      }, null, 2)}`);
    }
  };

  // Function to handle user removal
  const handleRemoveUser = async () => {
    if (!userToRemove) return;

    try {
      setIsRemovingUser(true);

      if (userToRemove.isPendingInvite) {
        // This is a pending invitation - delete from users collection with pending status
        await removeUser(userToRemove.id, currentUser?.email || 'admin');
        toast.success(`Invitation for ${userToRemove.email} has been canceled`);
      } else {
        // This is a registered user - use the removeUser function
        // Pass the admin's email for logging and potential server-side operations
        await removeUser(userToRemove.id, currentUser?.email || 'admin');

        toast.success(`User ${userToRemove.email} has been completely removed`, {
          description: "The user has been removed from both the database and Firebase Authentication. You will be logged out."
        });
      }

      setUserToRemove(null);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error removing user:', error);
      toast.error('Failed to remove user');
    } finally {
      setIsRemovingUser(false);
    }
  };

  // Define columns for users table
  const userColumns: ColumnDef<User>[] = [
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'displayName',
      header: 'Name',
      cell: ({ row }) => {
        if (row.original.isPendingInvite) {
          return <span className="text-muted-foreground italic">Pending registration</span>;
        }

        const displayName = row.original.displayName;
        const firstName = row.original.firstName || '';
        const lastName = row.original.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();

        // Show both options for debugging
        return (
          <div>
            <div>{displayName || fullName || '-'}</div>
            {displayName !== fullName && displayName && fullName && (
              <div className="text-xs text-muted-foreground">
                Alt: {fullName}
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'firstName',
      header: 'First Name',
      cell: ({ row }) => {
        if (row.original.isPendingInvite) return '-';
        return row.original.firstName || '-';
      }
    },
    {
      accessorKey: 'lastName',
      header: 'Last Name',
      cell: ({ row }) => {
        if (row.original.isPendingInvite) return '-';
        return row.original.lastName || '-';
      }
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => {
        if (row.original.isPendingInvite) {
          return <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-yellow-50 text-yellow-800 border-yellow-200">
            Invited
          </span>;
        }
        return row.original.role || 'User';
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ row }) => row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setUserToRemove(row.original)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  // Define columns for admins table
  const adminColumns: ColumnDef<AdminUser>[] = [
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleRemoveAdmin(row.original.id, row.original.email)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  // Define columns for legal team table
  const legalColumns: ColumnDef<LegalTeamMember>[] = [
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'displayName',
      header: 'Name',
      cell: ({ row }) => row.original.displayName || '-',
    },
    {
      accessorKey: 'createdAt',
      header: 'Added On',
      cell: ({ row }) => row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleRemoveLegalMember(row.original.id, row.original.email)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  // Define columns for management team table
  const managementColumns: ColumnDef<ManagementTeamMember>[] = [
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'displayName',
      header: 'Name',
      cell: ({ row }) => row.original.displayName || '-',
    },
    {
      accessorKey: 'createdAt',
      header: 'Added On',
      cell: ({ row }) => row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleRemoveManagementMember(row.original.id, row.original.email)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  // Define columns for approvers table
  const approverColumns: ColumnDef<ApproverMember>[] = [
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'displayName',
      header: 'Name',
      cell: ({ row }) => row.original.displayName || '-',
    },
    {
      accessorKey: 'createdAt',
      header: 'Added On',
      cell: ({ row }) => row.original.createdAt ? new Date(row.original.createdAt).toLocaleDateString() : '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleRemoveApprover(row.original.id, row.original.email)}
        >
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  return (
    <PageTransition>
      <AuthNavbar />
      <div className="container mx-auto p-4 sm:p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage users and application settings
          </p>
        </header>

        <div className="mb-6 flex justify-end">
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create User Account</DialogTitle>
                <DialogDescription>
                  Create a new user account. An email with login credentials will be sent to the user.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>A new account will be created with the default password '12345678'. The user will receive an email with login instructions.</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInviteUser} disabled={inviting}>
                  {inviting ? 'Creating...' : 'Create Account'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab}>
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
                <CardTitle>Users</CardTitle>
                <CardDescription>
                  List of all regular users in the application (excluding admins and legal team)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={updateMissingDisplayNames}
                    disabled={loading}
                  >
                    Fix Missing Display Names
                  </Button>
                  <Button
                    variant="outline"
                    onClick={syncAuthDisplayNames}
                    disabled={loading}
                  >
                    Sync Auth Display Name
                  </Button>
                  <Button
                    variant="outline"
                    onClick={debugUserData}
                    disabled={loading}
                  >
                    Debug User Data
                  </Button>
                </div>
                {loading ? (
                  <Skeleton className="w-full h-64" />
                ) : (
                  <DataTable
                    columns={userColumns}
                    data={users}
                  />
                )}
              </CardContent>
              <CardFooter className="border-t pt-6 flex flex-col gap-2">
                <div className="text-sm text-muted-foreground">
                  This section shows both registered users and pending invitations. Regular users can be removed using the delete icon.
                  This application is invitation-only - new users must be invited via the "Invite User" button before they can sign up.
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
                    <CardDescription>
                      Users with full access to the application
                    </CardDescription>
                  </div>
                  <Dialog open={isAdminDialogOpen} onOpenChange={(open) => {
                    setIsAdminDialogOpen(open);
                    if (!open) {
                      setAdminUserSearch('');
                      setNewAdminEmail('');
                      setFilteredAdminUsers([]);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Admin
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Administrator</DialogTitle>
                        <DialogDescription>
                          Search for an existing user to promote to administrator role.
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
                              onChange={(e) => setAdminUserSearch(e.target.value)}
                            />
                            {filteredAdminUsers.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-popover border rounded-md shadow-md">
                                {filteredAdminUsers.map(user => (
                                  <div
                                    key={user.id}
                                    className="p-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                                    onClick={() => handleAddAdmin(user)}
                                  >
                                    <div>
                                      <div className="font-medium">
                                        {user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No name'}
                                      </div>
                                      <div className="text-xs text-muted-foreground">{user.email}</div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        {filteredAdminUsers.length === 0 && adminUserSearch.trim() !== '' && (
                          <div className="text-sm flex items-center gap-2 text-muted-foreground">
                            <AlertCircle className="h-4 w-4" />
                            No matching users found
                          </div>
                        )}
                        {adminUserSearch.trim() === '' && (
                          <div className="text-sm text-muted-foreground">
                            Type to search for users to add as administrators
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAdminDialogOpen(false)}>
                          Cancel
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="w-full h-64" />
                ) : (
                  <DataTable
                    columns={adminColumns}
                    data={admins}
                  />
                )}
              </CardContent>
              <CardFooter className="border-t pt-6 flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Administrators have full access to all features and settings.
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
                    <CardDescription>
                      Manage legal team members who review contracts
                    </CardDescription>
                  </div>
                  <Dialog open={isLegalDialogOpen} onOpenChange={(open) => {
                    setIsLegalDialogOpen(open);
                    if (!open) {
                      setLegalUserSearch('');
                      setFilteredLegalUsers([]);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Legal Team Member</DialogTitle>
                        <DialogDescription>
                          Search for an existing user to add to the legal team.
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
                              onChange={(e) => setLegalUserSearch(e.target.value)}
                            />
                            {filteredLegalUsers.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-popover border rounded-md shadow-md">
                                {filteredLegalUsers.map(user => (
                                  <div
                                    key={user.id}
                                    className="p-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                                    onClick={() => handleAddLegalMember(user)}
                                  >
                                    <div>
                                      <div className="font-medium">
                                        {user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No name'}
                                      </div>
                                      <div className="text-xs text-muted-foreground">{user.email}</div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        {filteredLegalUsers.length === 0 && legalUserSearch.trim() !== '' && (
                          <div className="text-sm flex items-center gap-2 text-muted-foreground">
                            <AlertCircle className="h-4 w-4" />
                            No matching users found
                          </div>
                        )}
                        {legalUserSearch.trim() === '' && (
                          <div className="text-sm text-muted-foreground">
                            Type to search for users to add to the legal team
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLegalDialogOpen(false)}>
                          Cancel
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="w-full h-64" />
                ) : (
                  <DataTable
                    columns={legalColumns}
                    data={legalTeam}
                  />
                )}
              </CardContent>
              <CardFooter className="border-t pt-6 flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Legal team members can review contracts and provide feedback.
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
                    <CardDescription>
                      Manage management team members who approve contracts
                    </CardDescription>
                  </div>
                  <Dialog open={isManagementDialogOpen} onOpenChange={(open) => {
                    setIsManagementDialogOpen(open);
                    if (!open) {
                      setManagementUserSearch('');
                      setFilteredManagementUsers([]);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Management Team Member</DialogTitle>
                        <DialogDescription>
                          Search for an existing user to add to the management team.
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
                              onChange={(e) => setManagementUserSearch(e.target.value)}
                            />
                            {filteredManagementUsers.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-popover border rounded-md shadow-md">
                                {filteredManagementUsers.map(user => (
                                  <div
                                    key={user.id}
                                    className="p-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                                    onClick={() => handleAddManagementMember(user)}
                                  >
                                    <div>
                                      <div className="font-medium">
                                        {user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No name'}
                                      </div>
                                      <div className="text-xs text-muted-foreground">{user.email}</div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        {filteredManagementUsers.length === 0 && managementUserSearch.trim() !== '' && (
                          <div className="text-sm flex items-center gap-2 text-muted-foreground">
                            <AlertCircle className="h-4 w-4" />
                            No matching users found
                          </div>
                        )}
                        {managementUserSearch.trim() === '' && (
                          <div className="text-sm text-muted-foreground">
                            Type to search for users to add to the management team
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsManagementDialogOpen(false)}>
                          Cancel
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="w-full h-64" />
                ) : (
                  <DataTable
                    columns={managementColumns}
                    data={managementTeam}
                  />
                )}
              </CardContent>
              <CardFooter className="border-t pt-6 flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Management team members can approve contracts and make business decisions.
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
                    <CardDescription>
                      Manage approvers who can approve contracts
                    </CardDescription>
                  </div>
                  <Dialog open={isApproverDialogOpen} onOpenChange={(open) => {
                    setIsApproverDialogOpen(open);
                    if (!open) {
                      setApproverUserSearch('');
                      setFilteredApproverUsers([]);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Approver</DialogTitle>
                        <DialogDescription>
                          Search for an existing user to add as an approver.
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
                              onChange={(e) => setApproverUserSearch(e.target.value)}
                            />
                            {filteredApproverUsers.length > 0 && (
                              <div className="absolute z-10 w-full mt-1 max-h-60 overflow-auto bg-popover border rounded-md shadow-md">
                                {filteredApproverUsers.map(user => (
                                  <div
                                    key={user.id}
                                    className="p-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                                    onClick={() => handleAddApprover(user)}
                                  >
                                    <div>
                                      <div className="font-medium">
                                        {user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No name'}
                                      </div>
                                      <div className="text-xs text-muted-foreground">{user.email}</div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                      <Check className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        {filteredApproverUsers.length === 0 && approverUserSearch.trim() !== '' && (
                          <div className="text-sm flex items-center gap-2 text-muted-foreground">
                            <AlertCircle className="h-4 w-4" />
                            No matching users found
                          </div>
                        )}
                        {approverUserSearch.trim() === '' && (
                          <div className="text-sm text-muted-foreground">
                            Type to search for users to add as approvers
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsApproverDialogOpen(false)}>
                          Cancel
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="w-full h-64" />
                ) : (
                  <DataTable
                    columns={approverColumns}
                    data={approvers}
                  />
                )}
              </CardContent>
              <CardFooter className="border-t pt-6 flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Approvers can review and approve contracts.
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        {/* User removal confirmation dialog */}
        <AlertDialog open={!!userToRemove} onOpenChange={(open) => !open && setUserToRemove(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {userToRemove?.isPendingInvite ? 'Cancel Invitation' : 'Confirm User Removal'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {userToRemove?.isPendingInvite ? (
                  <>
                    Are you sure you want to cancel the invitation for <span className="font-semibold">{userToRemove?.email}</span>?
                    This will prevent this person from being able to sign up for the application.
                  </>
                ) : (
                  <>
                    Are you sure you want to remove <span className="font-semibold">{userToRemove?.email}</span>?
                    This will permanently delete the user's data from the database and prevent them from accessing the application.
                    <p className="mt-3 text-green-600 text-sm">
                      <strong>Note:</strong> This will remove the user from both the database and Firebase Authentication.
                      The user will no longer be able to sign in after this operation.
                    </p>
                    <div className="mt-3 p-3 border border-amber-200 bg-amber-50 rounded-md">
                      <p className="text-amber-700 text-sm font-medium">Warning</p>
                      <p className="text-amber-700 text-sm mt-1">
                        This operation will delete the user's Firebase Authentication account, which will log you out.
                      </p>
                      <p className="text-amber-700 text-sm mt-1">
                        You will need to log back in after the operation is complete.
                      </p>
                    </div>

                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveUser}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isRemovingUser}
              >
                {isRemovingUser
                  ? 'Processing...'
                  : userToRemove?.isPendingInvite
                    ? 'Cancel Invitation'
                    : 'Remove User'
                }
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
};

export default Admin;