import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Share2 } from 'lucide-react';
import { createShareInvite } from '@/lib/data';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ShareDialogProps {
  contractId: string;
}

export function ShareDialog({ contractId }: ShareDialogProps) {
  const [email, setEmail] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();

  const handleShare = async () => {
    if (!email || !currentUser) return;

    try {
      setIsLoading(true);
      await createShareInvite(contractId, email);
      toast.success('Invitation sent successfully');
      setEmail('');
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to send invitation');
      console.error('Error sharing contract:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Share2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Contract</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={handleShare}
            disabled={!email || isLoading}
          >
            {isLoading ? 'Sharing...' : 'Share'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}