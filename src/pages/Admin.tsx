import { useState, useEffect } from 'react';
import AuthNavbar from '@/components/layout/AuthNavbar';
import PageTransition from '@/components/layout/PageTransition';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

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

const Admin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('users');
  const { currentUser } = useAuth();

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
      
      // Filter out admin users from the users list
      const adminEmails = adminsData.map(admin => admin.email.toLowerCase());
      const filteredUsers = usersData.filter(user => 
        !adminEmails.includes(user.email.toLowerCase())
      );
      
      setUsers(filteredUsers);
      setAdmins(adminsData);
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
  ];

  // Define columns for admins table
  const adminColumns: ColumnDef<AdminUser>[] = [
    {
      accessorKey: 'email',
      header: 'Email',
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

        <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="admins">Admins</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
                <CardDescription>
                  List of all regular users in the application (excluding admins)
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
            </Card>
          </TabsContent>
          
          <TabsContent value="admins">
            <Card>
              <CardHeader>
                <CardTitle>Administrators</CardTitle>
                <CardDescription>
                  List of all admin users with full access
                </CardDescription>
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
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageTransition>
  );
};

export default Admin; 