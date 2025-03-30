import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { updateInviteStatus } from '@/lib/data';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AcceptInvite() {
  const { inviteId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const handleAcceptInvite = async () => {
    if (!inviteId || !currentUser) {
      setError('Please log in to accept the invitation');
      setLoading(false);
      return;
    }

    try {
      await updateInviteStatus(inviteId, 'accepted');
      // Redirect to the contracts page after successful acceptance
      navigate('/contracts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If user is already logged in, accept invite automatically
    if (currentUser) {
      handleAcceptInvite();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <h2 className="text-xl font-semibold">Accepting Invite</h2>
          </CardHeader>
          <CardContent className="text-center">
            <div className="animate-pulse">Processing your invitation...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <h2 className="text-xl font-semibold">Accept Invitation</h2>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p>Please log in to accept the invitation</p>
            <Button onClick={() => navigate('/login')}>Log In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <h2 className="text-xl font-semibold text-red-600">Error</h2>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={() => navigate('/contracts')}>Go to Contracts</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}