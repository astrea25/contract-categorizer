import { useState, useEffect } from 'react';
import AuthNavbar from '@/components/layout/AuthNavbar';
import PageTransition from '@/components/layout/PageTransition';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
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

const Admin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [legalTeam, setLegalTeam] = useState<LegalTeamMember[]>([]);
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
  const [newLegalEmail, setNewLegalEmail] = useState('');
  const [legalUserSearch, setLegalUserSearch] = useState('');
  const [filteredLegalUsers, setFilteredLegalUsers] = useState<User[]>([]);
  const [newLegalName, setNewLegalName] = useState('');
  const [newLegalRole, setNewLegalRole] = useState('Legal Reviewer');
  const [isLegalDialogOpen, setIsLegalDialogOpen] = useState(false);
  const [addingLegal, setAddingLegal] = useState(false);
  const [addingExistingLegalUser, setAddingExistingLegalUser] = useState(false);

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
      
      // Filter out admin users from the users list
      const adminEmails = adminsData.map(admin => admin.email.toLowerCase());
      const legalEmails = legalTeamData.map(legal => legal.email.toLowerCase());
      
      const filteredUsers = usersData.filter(user => 
        !adminEmails.includes(user.email.toLowerCase()) &&
        !legalEmails.includes(user.email.toLowerCase())
      );
      
      setUsers(filteredUsers);
      setAdmins(adminsData);
      setLegalTeam(legalTeamData);
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

  // Function to invite a new user
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
      
      toast.success(`Invitation sent to ${newUserEmail}`);
      setNewUserEmail('');
      setIsInviteDialogOpen(false);
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error('Failed to invite user');
    } finally {
      setInviting(false);
    }
  };

  // Filter users for adding to admin team
  useEffect(() => {
    if (isAdminDialogOpen) {
      const adminEmails = admins.map(admin => admin.email.toLowerCase());
      
      if (adminUserSearch.trim() !== '') {
        const filtered = users.filter(user => 
          !adminEmails.includes(user.email.toLowerCase()) &&
          (user.email.toLowerCase().includes(adminUserSearch.toLowerCase()) ||
           user.displayName?.toLowerCase().includes(adminUserSearch.toLowerCase()) ||
           `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase().includes(adminUserSearch.toLowerCase()))
        );
        setFilteredAdminUsers(filtered);
      } else {
        setFilteredAdminUsers([]);
      }
    }
  }, [adminUserSearch, isAdminDialogOpen, admins, users]);

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
      
      if (legalUserSearch.trim() !== '') {
        const filtered = users.filter(user => 
          !legalEmails.includes(user.email.toLowerCase()) &&
          (user.email.toLowerCase().includes(legalUserSearch.toLowerCase()) ||
           user.displayName?.toLowerCase().includes(legalUserSearch.toLowerCase()) ||
           `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase().includes(legalUserSearch.toLowerCase()))
        );
        setFilteredLegalUsers(filtered);
      } else {
        setFilteredLegalUsers([]);
      }
    }
  }, [legalUserSearch, isLegalDialogOpen, legalTeam, users]);

  // Function to select an existing user for legal team
  const selectUserForLegalTeam = (user: User) => {
    setNewLegalEmail(user.email);
    setNewLegalName(user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim());
    setLegalUserSearch('');
    setFilteredLegalUsers([]);
    setAddingExistingLegalUser(true);
  };

  // Function to add a legal team member
  const handleAddLegalMember = async () => {
    if (!newLegalEmail) {
      toast.error('Email is required');
      return;
    }

    try {
      setAddingLegal(true);
      await addLegalTeamMember(newLegalEmail, newLegalName, newLegalRole);
      
      // Also add to shareInvites so they can access the app
      await inviteUser(
        newLegalEmail, 
        'legal', 
        currentUser?.email || 'admin'
      );
      
      toast.success(`Added ${newLegalEmail} to the legal team`);
      setNewLegalEmail('');
      setNewLegalName('');
      setNewLegalRole('Legal Reviewer');
      setLegalUserSearch('');
      setFilteredLegalUsers([]);
      setAddingExistingLegalUser(false);
      setIsLegalDialogOpen(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error adding legal team member:', error);
      toast.error('Failed to add legal team member');
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
    console.log("Current Firebase Auth User:", currentUser);
    console.log("Users from Firestore:", users);
    console.log("Admin users:", admins);
    console.log("Legal team:", legalTeam);
    
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
      await removeUser(userToRemove.id);
      toast.success(`User ${userToRemove.email} has been completely removed from the system`);
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
      cell: ({ row }) => row.original.firstName || '-',
    },
    {
      accessorKey: 'lastName',
      header: 'Last Name',
      cell: ({ row }) => row.original.lastName || '-',
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => row.original.role || 'User',
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
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => row.original.role || 'Legal Reviewer',
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
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New User</DialogTitle>
                <DialogDescription>
                  Invite a new user to the application. This will grant them access to sign up and log in.
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
                  <p>Only invited users can access this application. The invited user will need to sign up with this exact email address.</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInviteUser} disabled={inviting}>
                  {inviting ? 'Sending...' : 'Send Invite'}
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
              <CardFooter className="border-t pt-6 flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Regular users can be removed using the delete icon. This application is invitation-only - new users must be invited via the "Invite User" button before they can sign up.
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
                      setNewLegalEmail('');
                      setNewLegalName('');
                      setNewLegalRole('Legal Reviewer');
                      setLegalUserSearch('');
                      setFilteredLegalUsers([]);
                      setAddingExistingLegalUser(false);
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
                          Add a new member to the legal team. They will have access to review contracts.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        {!addingExistingLegalUser && (
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
                                      onClick={() => selectUserForLegalTeam(user)}
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
                            <div className="text-xs text-muted-foreground mt-1">
                              Or fill in the details manually below
                            </div>
                          </div>
                        )}

                        {addingExistingLegalUser && (
                          <div className="bg-muted p-3 rounded-md mb-2 flex justify-between items-center">
                            <div>
                              <div className="font-medium">{newLegalName}</div>
                              <div className="text-xs text-muted-foreground">{newLegalEmail}</div>
                            </div>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0" 
                              onClick={() => {
                                setNewLegalEmail('');
                                setNewLegalName('');
                                setAddingExistingLegalUser(false);
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}

                        {!addingExistingLegalUser && (
                          <>
                            <div className="grid gap-2">
                              <Label htmlFor="legalEmail">Email</Label>
                              <Input
                                id="legalEmail"
                                type="email"
                                placeholder="legal@example.com"
                                value={newLegalEmail}
                                onChange={(e) => setNewLegalEmail(e.target.value)}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="legalName">Display Name</Label>
                              <Input
                                id="legalName"
                                placeholder="John Doe"
                                value={newLegalName}
                                onChange={(e) => setNewLegalName(e.target.value)}
                              />
                            </div>
                          </>
                        )}
                        
                        <div className="grid gap-2">
                          <Label htmlFor="legalRole">Role</Label>
                          <Select value={newLegalRole} onValueChange={setNewLegalRole}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Legal Reviewer">Legal Reviewer</SelectItem>
                              <SelectItem value="Senior Legal Counsel">Senior Legal Counsel</SelectItem>
                              <SelectItem value="Legal Assistant">Legal Assistant</SelectItem>
                              <SelectItem value="Legal Manager">Legal Manager</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsLegalDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddLegalMember} disabled={addingLegal}>
                          {addingLegal ? 'Adding...' : 'Add Member'}
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
        </Tabs>

        {/* User removal confirmation dialog */}
        <AlertDialog open={!!userToRemove} onOpenChange={(open) => !open && setUserToRemove(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm User Removal</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove <span className="font-semibold">{userToRemove?.email}</span>?
                This will permanently delete the user from the system, including any pending invitations.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveUser}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isRemovingUser}
              >
                {isRemovingUser ? 'Removing...' : 'Remove User'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </PageTransition>
  );
};

export default Admin; 