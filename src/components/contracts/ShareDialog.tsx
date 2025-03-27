import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createShareInvite } from '@/lib/data';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Share2 } from 'lucide-react';

interface ShareDialogProps {
  contractId: string;
}

export function ShareDialog({ contractId }: ShareDialogProps) {
  const { currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'viewer' | 'editor'>('viewer');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShare = async () => {
    setError(null);
    console.log('Share initiated');
    if (!currentUser) {
      const errorMsg = 'You must be logged in to share contracts';
      console.log(errorMsg);
      setError(errorMsg);
      return;
    }
    
    try {
      console.log('Sharing contract with params:', {
        contractId,
        recipientEmail: email,
        role,
        senderEmail: currentUser.email,
        currentUser: {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName
        }
      });
      
      setIsLoading(true);
      const inviteId = await createShareInvite(
        contractId,
        email,
        role,
        currentUser.email!
      );
      
      if (!inviteId) {
        throw new Error('Failed to create share invite - no invite ID returned');
      }
      
      console.log('Share invite created successfully:', {
        inviteId,
        recipient: email,
        role: role,
        sender: currentUser.email
      });
      
      // Only close dialog on success
      setIsOpen(false);
      setEmail('');
      setRole('viewer');
    } catch (error) {
      const message = error instanceof Error 
        ? error.message 
        : 'Failed to share contract. Please check your email configuration.';
      console.error('Error sharing contract:', {
        error,
        email,
        contractId
      });
      setError(message);
      // Keep dialog open on error
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
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-900 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
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
          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium">
              Role
            </label>
            <Select value={role} onValueChange={(value: 'viewer' | 'editor') => setRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
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