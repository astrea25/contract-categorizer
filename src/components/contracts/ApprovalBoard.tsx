import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Search, UserPlus, X } from 'lucide-react';
import { Contract, getLegalTeamMembers, getManagementTeamMembers } from '@/lib/data';
import { useAuth } from '@/contexts/AuthContext';

interface TeamMember {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

interface ApprovalBoardProps {
  contract: Contract;
  onUpdateApprovers: (approvers: Contract['approvers']) => Promise<void>;
  isRequired: boolean;
}

const ApprovalBoard = ({
  contract,
  onUpdateApprovers,
  isRequired
}: ApprovalBoardProps) => {
  const { isAdmin, isLegalTeam, isManagementTeam, currentUser } = useAuth();
  const [legalTeamMembers, setLegalTeamMembers] = useState<TeamMember[]>([]);
  const [managementTeamMembers, setManagementTeamMembers] = useState<TeamMember[]>([]);
  const [legalSearch, setLegalSearch] = useState('');
  const [managementSearch, setManagementSearch] = useState('');
  const [filteredLegalMembers, setFilteredLegalMembers] = useState<TeamMember[]>([]);
  const [filteredManagementMembers, setFilteredManagementMembers] = useState<TeamMember[]>([]);
  const [showLegalDropdown, setShowLegalDropdown] = useState(false);
  const [showManagementDropdown, setShowManagementDropdown] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch team members
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setLoading(true);
        const legalMembers = await getLegalTeamMembers() as TeamMember[];
        const managementMembers = await getManagementTeamMembers() as TeamMember[];
        
        setLegalTeamMembers(legalMembers);
        setManagementTeamMembers(managementMembers);
      } catch (error) {
        console.error('Error fetching team members:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  // Filter legal team members based on search
  useEffect(() => {
    if (legalSearch.trim() === '') {
      setFilteredLegalMembers(legalTeamMembers);
    } else {
      const filtered = legalTeamMembers.filter(
        member => 
          member.email.toLowerCase().includes(legalSearch.toLowerCase()) ||
          (member.displayName && member.displayName.toLowerCase().includes(legalSearch.toLowerCase()))
      );
      setFilteredLegalMembers(filtered);
    }
  }, [legalSearch, legalTeamMembers]);

  // Filter management team members based on search
  useEffect(() => {
    if (managementSearch.trim() === '') {
      setFilteredManagementMembers(managementTeamMembers);
    } else {
      const filtered = managementTeamMembers.filter(
        member => 
          member.email.toLowerCase().includes(managementSearch.toLowerCase()) ||
          (member.displayName && member.displayName.toLowerCase().includes(managementSearch.toLowerCase()))
      );
      setFilteredManagementMembers(filtered);
    }
  }, [managementSearch, managementTeamMembers]);

  // Handle selecting a legal team member
  const handleSelectLegalMember = (member: TeamMember) => {
    onUpdateApprovers({
      ...contract.approvers,
      legal: {
        email: member.email,
        name: member.displayName || member.email,
        approved: false
      }
    });
    setShowLegalDropdown(false);
    setLegalSearch('');
  };

  // Handle selecting a management team member
  const handleSelectManagementMember = (member: TeamMember) => {
    onUpdateApprovers({
      ...contract.approvers,
      management: {
        email: member.email,
        name: member.displayName || member.email,
        approved: false
      }
    });
    setShowManagementDropdown(false);
    setManagementSearch('');
  };

  // Handle removing a legal team approver
  const handleRemoveLegalApprover = () => {
    const { legal, ...rest } = contract.approvers || {};
    onUpdateApprovers(rest);
  };

  // Handle removing a management team approver
  const handleRemoveManagementApprover = () => {
    const { management, ...rest } = contract.approvers || {};
    onUpdateApprovers(rest);
  };

  // Handle approving as legal team member
  const handleLegalApprove = () => {
    if (!isLegalTeam || !currentUser?.email) return;
    
    // Only allow if the current user is the assigned legal approver
    if (contract.approvers?.legal?.email.toLowerCase() !== currentUser.email.toLowerCase()) return;
    
    onUpdateApprovers({
      ...contract.approvers,
      legal: {
        ...contract.approvers.legal!,
        approved: true,
        approvedAt: new Date().toISOString()
      }
    });
  };

  // Handle approving as management team member
  const handleManagementApprove = () => {
    if (!isManagementTeam || !currentUser?.email) return;
    
    // Only allow if the current user is the assigned management approver
    if (contract.approvers?.management?.email.toLowerCase() !== currentUser.email.toLowerCase()) return;
    
    onUpdateApprovers({
      ...contract.approvers,
      management: {
        ...contract.approvers.management!,
        approved: true,
        approvedAt: new Date().toISOString()
      }
    });
  };

  // Check if current user is the legal approver
  const isCurrentUserLegalApprover = 
    currentUser?.email && 
    contract.approvers?.legal?.email.toLowerCase() === currentUser.email.toLowerCase();

  // Check if current user is the management approver
  const isCurrentUserManagementApprover = 
    currentUser?.email && 
    contract.approvers?.management?.email.toLowerCase() === currentUser.email.toLowerCase();

  // Determine if the user can edit approvers
  const canEditApprovers = isAdmin || contract.status === 'requested' || contract.status === 'draft';

  return (
    <div className="mb-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Approval Board</span>
            {isRequired && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                Required
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading team members...</p>
          ) : (
            <div className="space-y-6">
              {/* Legal Team Approver */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Legal Team Approver</Label>
                  {canEditApprovers && (
                    !contract.approvers?.legal ? (
                      <div className="relative">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowLegalDropdown(!showLegalDropdown)}
                          className="gap-1"
                          disabled={legalTeamMembers.length === 0}
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>Assign</span>
                        </Button>
                        
                        {showLegalDropdown && (
                          <div className="absolute right-0 mt-1 w-64 bg-card border rounded-md shadow-lg z-50">
                            <div className="p-2">
                              <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Search legal team..."
                                  className="pl-8"
                                  value={legalSearch}
                                  onChange={(e) => setLegalSearch(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              {filteredLegalMembers.length > 0 ? (
                                filteredLegalMembers.map((member) => (
                                  <div
                                    key={member.id}
                                    className="px-3 py-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                                    onClick={() => handleSelectLegalMember(member)}
                                  >
                                    <div>
                                      <div className="font-medium text-sm">
                                        {member.displayName || 'No name'}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {member.email}
                                      </div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                      <Check className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                  No legal team members found
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleRemoveLegalApprover}
                        className="h-8 w-8 p-0 text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )
                  )}
                </div>
                
                {contract.approvers?.legal ? (
                  <div className="flex items-center justify-between p-3 border rounded-md bg-card/50">
                    <div>
                      <div className="font-medium">{contract.approvers.legal.name}</div>
                      <div className="text-sm text-muted-foreground">{contract.approvers.legal.email}</div>
                    </div>
                    <div>
                      {contract.approvers.legal.approved ? (
                        <Badge className="bg-green-50 text-green-800 border-green-200">
                          Approved
                        </Badge>
                      ) : isCurrentUserLegalApprover ? (
                        <Button 
                          size="sm" 
                          onClick={handleLegalApprove}
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          Approve
                        </Button>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    {isRequired ? "Required - Please assign a legal team approver" : "No legal approver assigned"}
                  </div>
                )}
              </div>
              
              {/* Management Team Approver */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">Management Team Approver</Label>
                  {canEditApprovers && (
                    !contract.approvers?.management ? (
                      <div className="relative">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowManagementDropdown(!showManagementDropdown)}
                          className="gap-1"
                          disabled={managementTeamMembers.length === 0}
                        >
                          <UserPlus className="h-3.5 w-3.5" />
                          <span>Assign</span>
                        </Button>
                        
                        {showManagementDropdown && (
                          <div className="absolute right-0 mt-1 w-64 bg-card border rounded-md shadow-lg z-50">
                            <div className="p-2">
                              <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="Search management team..."
                                  className="pl-8"
                                  value={managementSearch}
                                  onChange={(e) => setManagementSearch(e.target.value)}
                                />
                              </div>
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              {filteredManagementMembers.length > 0 ? (
                                filteredManagementMembers.map((member) => (
                                  <div
                                    key={member.id}
                                    className="px-3 py-2 hover:bg-accent cursor-pointer flex justify-between items-center"
                                    onClick={() => handleSelectManagementMember(member)}
                                  >
                                    <div>
                                      <div className="font-medium text-sm">
                                        {member.displayName || 'No name'}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {member.email}
                                      </div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                                      <Check className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-sm text-muted-foreground">
                                  No management team members found
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleRemoveManagementApprover}
                        className="h-8 w-8 p-0 text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )
                  )}
                </div>
                
                {contract.approvers?.management ? (
                  <div className="flex items-center justify-between p-3 border rounded-md bg-card/50">
                    <div>
                      <div className="font-medium">{contract.approvers.management.name}</div>
                      <div className="text-sm text-muted-foreground">{contract.approvers.management.email}</div>
                    </div>
                    <div>
                      {contract.approvers.management.approved ? (
                        <Badge className="bg-green-50 text-green-800 border-green-200">
                          Approved
                        </Badge>
                      ) : isCurrentUserManagementApprover ? (
                        <Button 
                          size="sm" 
                          onClick={handleManagementApprove}
                          className="bg-blue-500 hover:bg-blue-600"
                        >
                          Approve
                        </Button>
                      ) : (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    {isRequired ? "Required - Please assign a management team approver" : "No management approver assigned"}
                  </div>
                )}
              </div>
              
              {/* Approval Status Summary */}
              {(contract.approvers?.legal || contract.approvers?.management) && (
                <div className={`mt-4 p-3 border rounded-md ${
                  (contract.approvers?.legal?.approved && contract.approvers?.management?.approved) 
                    ? "bg-green-50 border-green-200" 
                    : "bg-yellow-50 border-yellow-200"
                }`}>
                  <div className="text-sm font-medium">
                    {(contract.approvers?.legal?.approved && contract.approvers?.management?.approved) 
                      ? "✅ All approvals complete" 
                      : "⏳ Waiting for approvals"}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {!contract.approvers?.legal?.approved && "Pending legal approval. "}
                    {!contract.approvers?.management?.approved && "Pending management approval."}
                    {(contract.approvers?.legal?.approved && contract.approvers?.management?.approved) && 
                      "This contract has been approved by both legal and management teams."}
                  </div>
                </div>
              )}
              
              {/* Warning for required approvers */}
              {isRequired && 
               contract.status !== 'requested' && 
               (!contract.approvers?.legal || !contract.approvers?.management) && (
                <div className="mt-4 p-3 border border-yellow-200 bg-yellow-50 rounded-md">
                  <div className="text-sm font-medium text-yellow-800">
                    Approval Required
                  </div>
                  <div className="text-xs text-yellow-700 mt-1">
                    This contract requires approval from both legal and management teams before it can proceed to the approval stage.
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApprovalBoard;
