import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { updateInviteStatus } from '@/lib/data';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function AcceptInvite() {
  const { inviteId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const acceptInvite = async () => {
      if (!inviteId || !currentUser) {
        setError('Invalid invite or not authenticated');
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

    acceptInvite();
  }, [inviteId, currentUser, navigate]);

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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-[400px]">
          <CardHeader className="text-center">
            <h2 className="text-xl font-semibold text-red-600">Error</h2>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}