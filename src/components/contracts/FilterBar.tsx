
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ContractStatus, ContractType, contractTypeLabels } from '@/lib/data';
import { useState, useEffect } from 'react';

interface FilterBarProps {
  onFilterChange: (filters: {
    search: string;
    status: ContractStatus | 'all';
    type: ContractType | 'all';
    project: string;
  }) => void;
  className?: string;
}

const FilterBar = ({ onFilterChange, className }: FilterBarProps) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ContractStatus | 'all'>('all');
  const [type, setType] = useState<ContractType | 'all'>('all');
  const [project, setProject] = useState('');

  useEffect(() => {
    // Small delay to avoid too many filter events
    const handler = setTimeout(() => {
      onFilterChange({ search, status, type, project });
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [search, status, type, project, onFilterChange]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search contracts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as ContractStatus | 'all')}
          >
            <SelectTrigger id="status">
              <SelectValue placeholder="Select a status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="type">Contract Type</Label>
          <Select
            value={type}
            onValueChange={(value) => setType(value as ContractType | 'all')}
          >
            <SelectTrigger id="type">
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(contractTypeLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="project">Project</Label>
          <Input
            id="project"
            placeholder="Filter by project"
            value={project}
            onChange={(e) => setProject(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
