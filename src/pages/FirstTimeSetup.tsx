import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import PageTransition from '@/components/layout/PageTransition';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { updateUserProfile, updatePasswordChangeRequired } from '@/lib/data';
import { updatePassword } from 'firebase/auth';

const FirstTimeSetup = () => {
  const { currentUser, passwordChangeRequired } = useAuth();
  const navigate = useNavigate();

  // Profile information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password change
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    // If user is not logged in or doesn't need to change password, redirect to home
    if (currentUser && !passwordChangeRequired) {
      navigate('/');
    }

    if (currentUser) {
      // Extract first and last name from display name if available
      const displayNameValue = currentUser.displayName || '';

      const nameParts = displayNameValue.split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');

      setEmail(currentUser.email || '');
    }
  }, [currentUser, passwordChangeRequired, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !currentUser.email) {
      setError('You must be logged in to complete this setup');
      return;
    }

    // Validate form
    if (!firstName.trim()) {
      setError('First name is required');
      return;
    }

    if (!lastName.trim()) {
      setError('Last name is required');
      return;
    }

    // Current password is no longer required for this approach

    if (!newPassword) {
      setError('New password is required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // 1. Update profile information
      const newDisplayName = `${firstName} ${lastName}`.trim();
      await updateUserProfile(
        currentUser.uid,
        firstName,
        lastName,
        newDisplayName
      );

      // 2. Update password directly (user is already authenticated)
      try {
        console.log('Attempting to update password for user:', currentUser.email);

        // Update password directly - no need to reauthenticate since user is freshly logged in
        await updatePassword(currentUser, newPassword);

        // 3. Update the passwordChangeRequired flag
        await updatePasswordChangeRequired(currentUser.email, false);

        // Success - redirect to home page
        toast.success('Setup completed successfully!');

        // Force a hard redirect to ensure we get a fresh state
        setTimeout(() => {
          window.location.href = '/';
        }, 500);
      } catch (passwordError: any) {
        console.error('Password update error:', passwordError);

        // Handle specific Firebase auth errors
        if (passwordError.code === 'auth/requires-recent-login') {
          // This shouldn't happen since the user just logged in, but just in case
          setError('Your login session has expired. Please log out and log in again to change your password.');
        } else {
          setError(`Failed to update password: ${passwordError.message || 'Unknown error'}`);

          // Even if password change fails, update the profile
          try {
            // Mark the password change as completed to prevent getting stuck in this page
            await updatePasswordChangeRequired(currentUser.email, false);

            toast.warning('Your profile was updated, but password change failed. You can change your password later in the Profile page.');

            // Force a hard redirect to ensure we get a fresh state
            setTimeout(() => {
              window.location.href = '/';
            }, 500);
          } catch (flagError) {
            console.error('Error updating password change flag:', flagError);
          }
        }
      }
    } catch (error) {
      console.error('Error completing setup:', error);
      setError('Failed to complete setup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <img src="/wwf-4.svg" alt="WWF Logo" className="h-16 w-16" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Complete Your Account Setup</CardTitle>
            <CardDescription className="text-center">
              Please set up your profile and create a new password to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Current password field removed as it's not needed */}

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Complete Setup"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default FirstTimeSetup;
