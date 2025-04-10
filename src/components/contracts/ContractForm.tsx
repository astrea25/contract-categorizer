import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarIcon, FolderIcon, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Contract, ContractStatus, ContractType, contractTypeLabels, Folder } from '@/lib/data';
import { toast } from 'sonner';

type Party = {
  name: string;
  email: string;
  role: string;
};

interface ContractFormProps {
  initialData?: Partial<Contract>;
  initialFolder?: string;
  foldersList?: Folder[];
  onSave: (contract: Partial<Contract>) => void;
  trigger?: React.ReactNode;
}

const ContractForm = ({
  initialData,
  initialFolder,
  foldersList = [],
  onSave,
  trigger
}: ContractFormProps) => {
  const [open, setOpen] = useState(false);
  const { currentUser } = useAuth();

  const [formData, setFormData] = useState<Partial<Contract>>(
    initialData || {
      title: '',
      projectName: '',
      type: 'service',
      status: 'draft',
      owner: currentUser?.email || 'Unassigned', // Ensure owner is never empty
      parties: [
        {
          name: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User',
          email: currentUser?.email || '',
          role: 'owner'
        },
        { name: '', email: '', role: 'client' }
      ],
      startDate: new Date().toISOString().split('T')[0],
      endDate: null,
      value: null,
      description: '',
      folderId: initialFolder || undefined
    }
  );

  // Update folder if initialFolder changes
  useEffect(() => {
    if (initialFolder) {
      setFormData(prev => ({
        ...prev,
        folderId: initialFolder
      }));
    }
  }, [initialFolder]);

  const [parties, setParties] = useState<Party[]>(
    initialData?.parties || [
      {
        name: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User',
        email: currentUser?.email || '',
        role: 'owner'
      },
      { name: '', email: '', role: 'client' }
    ]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value ? Number(value) : null }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'folderId' && value === 'none') {
      // For folder selection, explicitly set to null when 'none' is selected
      setFormData((prev) => ({
        ...prev,
        [name]: null
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value === "none" ? undefined : value
      }));
    }
  };

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      // The date is already fixed by our custom Calendar component
      setFormData((prev) => ({ ...prev, startDate: date.toISOString().split('T')[0] }));
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      // The date is already fixed by our custom Calendar component
      setFormData((prev) => ({ ...prev, endDate: date.toISOString().split('T')[0] }));
    } else {
      setFormData((prev) => ({ ...prev, endDate: null }));
    }
  };

  const handlePartyChange = (index: number, field: keyof Party, value: string) => {
    const updatedParties = [...parties];
    updatedParties[index] = { ...updatedParties[index], [field]: value };
    setParties(updatedParties);
  };

  const addParty = () => {
    setParties([...parties, { name: '', email: '', role: '' }]);
  };

  const removeParty = (index: number) => {
    if (parties.length > 2) {
      const updatedParties = [...parties];
      updatedParties.splice(index, 1);
      setParties(updatedParties);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();


    if (!formData.title || !formData.projectName || !formData.startDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    onSave({ ...formData, parties });
    toast.success('Contract saved successfully');
    setOpen(false);
  };

  const defaultTrigger = (
    <Button className="inline-flex items-center gap-1">
      <Plus size={16} />
      <span>New Contract</span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{initialData ? 'Edit Contract' : 'Create New Contract'}</DialogTitle>
            <DialogDescription>
              Fill in the details for this contract. Required fields are marked with an asterisk (*).
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="after:content-['*'] after:ml-0.5 after:text-red-500">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projectName" className="after:content-['*'] after:ml-0.5 after:text-red-500">Project Name</Label>
                <Input
                  id="projectName"
                  name="projectName"
                  value={formData.projectName || ''}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Contract Type</Label>
                <Select
                  value={formData.type as string || 'service'}
                  onValueChange={(value) => handleSelectChange('type', value)}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(contractTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status as ContractStatus || 'draft'}
                  onValueChange={(value) => handleSelectChange('status', value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="requested">Requested</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="legal_review">Legal Review</SelectItem>
                    <SelectItem value="management_review">Management Review</SelectItem>
                    <SelectItem value="approval">Approval</SelectItem>
                    <SelectItem value="finished">Finished</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="folder">Folder</Label>
                <Select
                  value={formData.folderId || "none"}
                  onValueChange={(value) => handleSelectChange('folderId', value)}
                >
                  <SelectTrigger id="folder" className="flex items-center">
                    <SelectValue placeholder="Select folder">
                      <div className="flex items-center">
                        <FolderIcon className="mr-2 h-4 w-4" />
                        <span>
                          {formData.folderId
                            ? foldersList.find(f => f.id === formData.folderId)?.name || 'Select folder'
                            : 'None (Unfiled)'}
                        </span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (Unfiled)</SelectItem>
                    {foldersList.map((folder) => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">Contract Value</Label>
                <Input
                  id="value"
                  name="value"
                  type="number"
                  value={formData.value !== null ? formData.value : ''}
                  onChange={handleNumberChange}
                  placeholder="Enter contract value (optional)"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate" className="after:content-['*'] after:ml-0.5 after:text-red-500">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startDate ? (
                        format(new Date(formData.startDate), "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startDate ? new Date(formData.startDate) : undefined}
                      onSelect={handleStartDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.endDate ? (
                        format(new Date(formData.endDate), "PPP")
                      ) : (
                        <span>Ongoing</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.endDate ? new Date(formData.endDate) : undefined}
                      onSelect={handleEndDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Parties</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addParty}
                  className="h-8 gap-1"
                >
                  <Plus size={14} />
                  Add Party
                </Button>
              </div>

              {parties.map((party, index) => (
                <div key={index} className="space-y-3 border p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <Label>Party {index + 1}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeParty(index)}
                      disabled={parties.length <= 2}
                      className="h-8 w-8"
                    >
                      <X size={14} />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Name</Label>
                    <Input
                      placeholder="Party name"
                      value={party.name}
                      onChange={(e) => handlePartyChange(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Email</Label>
                    <Input
                      placeholder="Party email"
                      type="email"
                      value={party.email}
                      onChange={(e) => handlePartyChange(index, 'email', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Role</Label>
                    <Select
                      value={party.role}
                      onValueChange={(value) => handlePartyChange(index, 'role', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">Owner</SelectItem>
                        <SelectItem value="client">Client</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                placeholder="Enter contract description"
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documentLink">Document Link</Label>
              <Input
                id="documentLink"
                name="documentLink"
                type="url"
                value={formData.documentLink || ''}
                onChange={handleInputChange}
                placeholder="Enter document link"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Contract</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContractForm;
