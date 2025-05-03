import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
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
import { CalendarIcon, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Contract,
  ContractStatus,
  ContractType,
  contractTypeLabels,
  Folder,
  ConsultancyFields,
  WOSFields,
  ServiceAgreementFields,
  MOAMOUFields,
  EmploymentFields,
  AmendmentFields,
  GrantAgreementFields,
  SubgrantFields,
  LeaseFields,
  DonationFields,
  ContractTypeFields,
  SupportingDocument,
  getSupportingDocuments
} from '@/lib/data';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

// Party type removed as it's not in the contract_types file

interface ContractFormProps {
  initialData?: Partial<Contract>;
  initialFolder?: string;
  foldersList?: Folder[];
  onSave: (contract: Partial<Contract>) => void;
  trigger?: React.ReactNode;
}

// Helper function to determine if a contract is editable based on its status
// Component to render type-specific fields based on contract type
const TypeSpecificFields = ({
  contractType,
  typeSpecificFields,
  handleInputChange,
  handleNumberChange,
  handleSelectChange,
  disabled
}: {
  contractType: ContractType;
  typeSpecificFields: any;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
  disabled: boolean;
}) => {
  switch (contractType) {
    case 'consultancy':
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="consultantName" className="after:content-['*'] after:ml-0.5 after:text-red-500">Consultant Name</Label>
              <Input
                id="consultantName"
                name="consultantName"
                value={typeSpecificFields?.consultantName || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="positionTitle" className="after:content-['*'] after:ml-0.5 after:text-red-500">Position Title</Label>
              <Input
                id="positionTitle"
                name="positionTitle"
                value={typeSpecificFields?.positionTitle || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grossProfessionalFee" className="after:content-['*'] after:ml-0.5 after:text-red-500">Gross Professional Fee</Label>
              <Input
                id="grossProfessionalFee"
                name="grossProfessionalFee"
                type="number"
                value={typeSpecificFields?.grossProfessionalFee || ''}
                onChange={handleNumberChange}
                required
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costCenter" className="after:content-['*'] after:ml-0.5 after:text-red-500">Cost Center/Charging</Label>
              <Input
                id="costCenter"
                name="costCenter"
                value={typeSpecificFields?.costCenter || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentSchedules" className="after:content-['*'] after:ml-0.5 after:text-red-500">Payment Schedules</Label>
            <Textarea
              id="paymentSchedules"
              name="paymentSchedules"
              value={typeSpecificFields?.paymentSchedules || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="termsOfReferenceLink">Terms of Reference (PDF Link)</Label>
            <Input
              id="termsOfReferenceLink"
              name="termsOfReferenceLink"
              type="url"
              value={typeSpecificFields?.termsOfReferenceLink || ''}
              onChange={handleInputChange}
              placeholder="Enter link to Terms of Reference document"
              disabled={disabled}
            />
          </div>
        </>
      );

    case 'wos':
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serviceProviderName" className="after:content-['*'] after:ml-0.5 after:text-red-500">Service Provider Name</Label>
              <Input
                id="serviceProviderName"
                name="serviceProviderName"
                value={typeSpecificFields?.serviceProviderName || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="positionTitle" className="after:content-['*'] after:ml-0.5 after:text-red-500">Position Title</Label>
              <Input
                id="positionTitle"
                name="positionTitle"
                value={typeSpecificFields?.positionTitle || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grossTechnicalServiceFee" className="after:content-['*'] after:ml-0.5 after:text-red-500">Gross Technical Service Fee</Label>
              <Input
                id="grossTechnicalServiceFee"
                name="grossTechnicalServiceFee"
                type="number"
                value={typeSpecificFields?.grossTechnicalServiceFee || ''}
                onChange={handleNumberChange}
                required
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costCenter" className="after:content-['*'] after:ml-0.5 after:text-red-500">Cost Center/Charging</Label>
              <Input
                id="costCenter"
                name="costCenter"
                value={typeSpecificFields?.costCenter || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentSchedules" className="after:content-['*'] after:ml-0.5 after:text-red-500">Payment Schedules</Label>
            <Textarea
              id="paymentSchedules"
              name="paymentSchedules"
              value={typeSpecificFields?.paymentSchedules || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scopeOfWorkLink">Scope of Work and Output (PDF Link)</Label>
            <Input
              id="scopeOfWorkLink"
              name="scopeOfWorkLink"
              type="url"
              value={typeSpecificFields?.scopeOfWorkLink || ''}
              onChange={handleInputChange}
              placeholder="Enter link to Scope of Work document"
              disabled={disabled}
            />
          </div>
        </>
      );

    case 'service':
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="serviceProviderName" className="after:content-['*'] after:ml-0.5 after:text-red-500">Service Provider Name</Label>
              <Input
                id="serviceProviderName"
                name="serviceProviderName"
                value={typeSpecificFields?.serviceProviderName || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="positionTitle" className="after:content-['*'] after:ml-0.5 after:text-red-500">Position Title</Label>
              <Input
                id="positionTitle"
                name="positionTitle"
                value={typeSpecificFields?.positionTitle || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grossTechnicalServiceFee" className="after:content-['*'] after:ml-0.5 after:text-red-500">Gross Technical Service Fee</Label>
              <Input
                id="grossTechnicalServiceFee"
                name="grossTechnicalServiceFee"
                type="number"
                value={typeSpecificFields?.grossTechnicalServiceFee || ''}
                onChange={handleNumberChange}
                required
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costCenter" className="after:content-['*'] after:ml-0.5 after:text-red-500">Cost Center/Charging</Label>
              <Input
                id="costCenter"
                name="costCenter"
                value={typeSpecificFields?.costCenter || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentSchedules" className="after:content-['*'] after:ml-0.5 after:text-red-500">Payment Schedules</Label>
            <Textarea
              id="paymentSchedules"
              name="paymentSchedules"
              value={typeSpecificFields?.paymentSchedules || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scopeOfWorkLink">Scope of Work and Output (PDF Link)</Label>
            <Input
              id="scopeOfWorkLink"
              name="scopeOfWorkLink"
              type="url"
              value={typeSpecificFields?.scopeOfWorkLink || ''}
              onChange={handleInputChange}
              placeholder="Enter link to Scope of Work document"
              disabled={disabled}
            />
          </div>
        </>
      );

    case 'moa_mou':
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contractingPartyName" className="after:content-['*'] after:ml-0.5 after:text-red-500">Contracting Party Name</Label>
              <Input
                id="contractingPartyName"
                name="contractingPartyName"
                value={typeSpecificFields?.contractingPartyName || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="registeredAddress" className="after:content-['*'] after:ml-0.5 after:text-red-500">Registered Business/Office Address</Label>
              <Input
                id="registeredAddress"
                name="registeredAddress"
                value={typeSpecificFields?.registeredAddress || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="authorizedRepresentative" className="after:content-['*'] after:ml-0.5 after:text-red-500">Authorized Representative/Signatory</Label>
              <Input
                id="authorizedRepresentative"
                name="authorizedRepresentative"
                value={typeSpecificFields?.authorizedRepresentative || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="authorizedRepresentativeDesignation" className="after:content-['*'] after:ml-0.5 after:text-red-500">Designation of Authorized Representative</Label>
              <Input
                id="authorizedRepresentativeDesignation"
                name="authorizedRepresentativeDesignation"
                value={typeSpecificFields?.authorizedRepresentativeDesignation || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="recitals" className="after:content-['*'] after:ml-0.5 after:text-red-500">Recitals or Whereas Clauses</Label>
            <Textarea
              id="recitals"
              name="recitals"
              value={typeSpecificFields?.recitals || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="purpose" className="after:content-['*'] after:ml-0.5 after:text-red-500">Purpose of the Agreement</Label>
            <Textarea
              id="purpose"
              name="purpose"
              value={typeSpecificFields?.purpose || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="kkpfiRoles" className="after:content-['*'] after:ml-0.5 after:text-red-500">Roles of KKPFI</Label>
            <Textarea
              id="kkpfiRoles"
              name="kkpfiRoles"
              value={typeSpecificFields?.kkpfiRoles || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contractingPartyRoles" className="after:content-['*'] after:ml-0.5 after:text-red-500">Roles of the Contracting Party</Label>
            <Textarea
              id="contractingPartyRoles"
              name="contractingPartyRoles"
              value={typeSpecificFields?.contractingPartyRoles || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="mutualObligations">Mutual Obligations (if any)</Label>
            <Textarea
              id="mutualObligations"
              name="mutualObligations"
              value={typeSpecificFields?.mutualObligations || ''}
              onChange={handleInputChange}
              disabled={disabled}
            />
          </div>
        </>
      );

    case 'employment':
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="positionTitle" className="after:content-['*'] after:ml-0.5 after:text-red-500">Position Title</Label>
              <Input
                id="positionTitle"
                name="positionTitle"
                value={typeSpecificFields?.positionTitle || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="costCenter" className="after:content-['*'] after:ml-0.5 after:text-red-500">Cost Center/Charging</Label>
              <Input
                id="costCenter"
                name="costCenter"
                value={typeSpecificFields?.costCenter || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numberOfStaff" className="after:content-['*'] after:ml-0.5 after:text-red-500">Number of Staff Needed</Label>
              <Input
                id="numberOfStaff"
                name="numberOfStaff"
                type="number"
                value={typeSpecificFields?.numberOfStaff || ''}
                onChange={handleNumberChange}
                required
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="salaryRate" className="after:content-['*'] after:ml-0.5 after:text-red-500">Salary Rate</Label>
              <Input
                id="salaryRate"
                name="salaryRate"
                type="number"
                value={typeSpecificFields?.salaryRate || ''}
                onChange={handleNumberChange}
                required
                disabled={disabled}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="communicationAllowance">Communication Allowance</Label>
              <Input
                id="communicationAllowance"
                name="communicationAllowance"
                type="number"
                value={typeSpecificFields?.communicationAllowance || ''}
                onChange={handleNumberChange}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requisitionReason" className="after:content-['*'] after:ml-0.5 after:text-red-500">Reason for Requisition</Label>
              <Select
                value={typeSpecificFields?.requisitionReason || 'new_position'}
                onValueChange={(value) => handleSelectChange('requisitionReason', value)}
                disabled={disabled}
              >
                <SelectTrigger id="requisitionReason">
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_position">New Position</SelectItem>
                  <SelectItem value="additional">Additional</SelectItem>
                  <SelectItem value="replacement">Replacement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {typeSpecificFields?.requisitionReason === 'replacement' && (
            <div className="space-y-2">
              <Label htmlFor="replacementReason" className="after:content-['*'] after:ml-0.5 after:text-red-500">Replacement Reason</Label>
              <Input
                id="replacementReason"
                name="replacementReason"
                value={typeSpecificFields?.replacementReason || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employmentClassification" className="after:content-['*'] after:ml-0.5 after:text-red-500">Classification of Employment</Label>
              <Select
                value={typeSpecificFields?.employmentClassification || 'core'}
                onValueChange={(value) => handleSelectChange('employmentClassification', value)}
                disabled={disabled}
              >
                <SelectTrigger id="employmentClassification">
                  <SelectValue placeholder="Select classification" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="core">Core</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {typeSpecificFields?.employmentClassification === 'project' && (
              <div className="space-y-2">
                <Label htmlFor="projectDurationMonths" className="after:content-['*'] after:ml-0.5 after:text-red-500">Project Duration (Months)</Label>
                <Input
                  id="projectDurationMonths"
                  name="projectDurationMonths"
                  type="number"
                  value={typeSpecificFields?.projectDurationMonths || ''}
                  onChange={handleNumberChange}
                  required
                  disabled={disabled}
                />
              </div>
            )}
          </div>
        </>
      );

    case 'amendment':
      return (
        <>
          <div className="space-y-2">
            <Label htmlFor="originalContractType" className="after:content-['*'] after:ml-0.5 after:text-red-500">Contract Type</Label>
            <Select
              value={typeSpecificFields?.originalContractType || 'consultancy'}
              onValueChange={(value) => handleSelectChange('originalContractType', value)}
              disabled={disabled}
            >
              <SelectTrigger id="originalContractType">
                <SelectValue placeholder="Select contract type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="consultancy">Consultancy</SelectItem>
                <SelectItem value="wos">Work Order for Services (WOS)</SelectItem>
                <SelectItem value="service">Service Agreement</SelectItem>
                <SelectItem value="moa_mou">Memorandum of Agreement/Understanding (MOA/MOU)</SelectItem>
                <SelectItem value="employment">Employment Contract</SelectItem>
                <SelectItem value="grant">Grant Agreement</SelectItem>
                <SelectItem value="subgrant">Subgrant Agreement</SelectItem>
                <SelectItem value="lease">Lease Contract</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="durationAmendment" className="after:content-['*'] after:ml-0.5 after:text-red-500">Duration Amendment</Label>
            <Textarea
              id="durationAmendment"
              name="durationAmendment"
              value={typeSpecificFields?.durationAmendment || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
              placeholder="Enter 'None' if no amendment is needed"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="deliverablesAmendment" className="after:content-['*'] after:ml-0.5 after:text-red-500">Deliverables Amendment</Label>
            <Textarea
              id="deliverablesAmendment"
              name="deliverablesAmendment"
              value={typeSpecificFields?.deliverablesAmendment || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
              placeholder="Enter 'None' if no amendment is needed"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentAmendment" className="after:content-['*'] after:ml-0.5 after:text-red-500">Payment Amendment</Label>
            <Textarea
              id="paymentAmendment"
              name="paymentAmendment"
              value={typeSpecificFields?.paymentAmendment || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
              placeholder="Enter 'None' if no amendment is needed"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentSchedulesAmendment" className="after:content-['*'] after:ml-0.5 after:text-red-500">Payment Schedules Amendment</Label>
            <Textarea
              id="paymentSchedulesAmendment"
              name="paymentSchedulesAmendment"
              value={typeSpecificFields?.paymentSchedulesAmendment || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
              placeholder="Enter 'None' if no amendment is needed"
            />
          </div>
        </>
      );

    case 'grant':
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="donorName" className="after:content-['*'] after:ml-0.5 after:text-red-500">Name of Donor</Label>
              <Input
                id="donorName"
                name="donorName"
                value={typeSpecificFields?.donorName || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="donorAddress" className="after:content-['*'] after:ml-0.5 after:text-red-500">Registered Address of Donor</Label>
              <Input
                id="donorAddress"
                name="donorAddress"
                value={typeSpecificFields?.donorAddress || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectLocation" className="after:content-['*'] after:ml-0.5 after:text-red-500">Project Location</Label>
              <Input
                id="projectLocation"
                name="projectLocation"
                value={typeSpecificFields?.projectLocation || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryDonor" className="after:content-['*'] after:ml-0.5 after:text-red-500">Primary Donor</Label>
              <Input
                id="primaryDonor"
                name="primaryDonor"
                value={typeSpecificFields?.primaryDonor || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryDonorFundingSourceAgreementNumber" className="after:content-['*'] after:ml-0.5 after:text-red-500">Primary Donor Funding Source Agreement Number</Label>
              <Input
                id="primaryDonorFundingSourceAgreementNumber"
                name="primaryDonorFundingSourceAgreementNumber"
                value={typeSpecificFields?.primaryDonorFundingSourceAgreementNumber || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractAmount" className="after:content-['*'] after:ml-0.5 after:text-red-500">Contract Amount</Label>
              <Input
                id="contractAmount"
                name="contractAmount"
                type="number"
                value={typeSpecificFields?.contractAmount || ''}
                onChange={handleNumberChange}
                required
                disabled={disabled}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankAccountInformation" className="after:content-['*'] after:ml-0.5 after:text-red-500">Bank Account Information (for transmittal of funds)</Label>
            <Textarea
              id="bankAccountInformation"
              name="bankAccountInformation"
              value={typeSpecificFields?.bankAccountInformation || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentSchedules" className="after:content-['*'] after:ml-0.5 after:text-red-500">Payment Schedules</Label>
            <Textarea
              id="paymentSchedules"
              name="paymentSchedules"
              value={typeSpecificFields?.paymentSchedules || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="donorContacts" className="after:content-['*'] after:ml-0.5 after:text-red-500">Donor Contacts</Label>
              <Textarea
                id="donorContacts"
                name="donorContacts"
                value={typeSpecificFields?.donorContacts || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kkpfiContacts" className="after:content-['*'] after:ml-0.5 after:text-red-500">KKPFI Contacts</Label>
              <Textarea
                id="kkpfiContacts"
                name="kkpfiContacts"
                value={typeSpecificFields?.kkpfiContacts || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deliverables" className="after:content-['*'] after:ml-0.5 after:text-red-500">Deliverables and dates of submission</Label>
            <Textarea
              id="deliverables"
              name="deliverables"
              value={typeSpecificFields?.deliverables || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="authorizedSignatoryName" className="after:content-['*'] after:ml-0.5 after:text-red-500">Name of Authorized Signatory</Label>
              <Input
                id="authorizedSignatoryName"
                name="authorizedSignatoryName"
                value={typeSpecificFields?.authorizedSignatoryName || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="authorizedSignatoryDesignation" className="after:content-['*'] after:ml-0.5 after:text-red-500">Designation of Authorized Signatory</Label>
              <Input
                id="authorizedSignatoryDesignation"
                name="authorizedSignatoryDesignation"
                value={typeSpecificFields?.authorizedSignatoryDesignation || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
          </div>
        </>
      );

    case 'subgrant':
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipientOrganizationName" className="after:content-['*'] after:ml-0.5 after:text-red-500">Name of Recipient Organization</Label>
              <Input
                id="recipientOrganizationName"
                name="recipientOrganizationName"
                value={typeSpecificFields?.recipientOrganizationName || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipientOrganizationAddress" className="after:content-['*'] after:ml-0.5 after:text-red-500">Registered Address of Recipient Organization</Label>
              <Input
                id="recipientOrganizationAddress"
                name="recipientOrganizationAddress"
                value={typeSpecificFields?.recipientOrganizationAddress || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="recipientOrganizationContact" className="after:content-['*'] after:ml-0.5 after:text-red-500">Contact Details of Recipient Organization</Label>
            <Input
              id="recipientOrganizationContact"
              name="recipientOrganizationContact"
              value={typeSpecificFields?.recipientOrganizationContact || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectLocation" className="after:content-['*'] after:ml-0.5 after:text-red-500">Project Location</Label>
              <Input
                id="projectLocation"
                name="projectLocation"
                value={typeSpecificFields?.projectLocation || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="primaryDonor" className="after:content-['*'] after:ml-0.5 after:text-red-500">Primary Donor</Label>
              <Input
                id="primaryDonor"
                name="primaryDonor"
                value={typeSpecificFields?.primaryDonor || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryDonorFundingSourceAgreementNumber" className="after:content-['*'] after:ml-0.5 after:text-red-500">Primary Donor Funding Source Agreement Number</Label>
              <Input
                id="primaryDonorFundingSourceAgreementNumber"
                name="primaryDonorFundingSourceAgreementNumber"
                value={typeSpecificFields?.primaryDonorFundingSourceAgreementNumber || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractAmount" className="after:content-['*'] after:ml-0.5 after:text-red-500">Contract Amount</Label>
              <Input
                id="contractAmount"
                name="contractAmount"
                type="number"
                value={typeSpecificFields?.contractAmount || ''}
                onChange={handleNumberChange}
                required
                disabled={disabled}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bankAccountInformation" className="after:content-['*'] after:ml-0.5 after:text-red-500">Bank Account Information (of recipient organization)</Label>
            <Textarea
              id="bankAccountInformation"
              name="bankAccountInformation"
              value={typeSpecificFields?.bankAccountInformation || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentSchedules" className="after:content-['*'] after:ml-0.5 after:text-red-500">Payment Schedules</Label>
            <Textarea
              id="paymentSchedules"
              name="paymentSchedules"
              value={typeSpecificFields?.paymentSchedules || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="recipientOrganizationContacts" className="after:content-['*'] after:ml-0.5 after:text-red-500">Recipient Organization Contacts</Label>
              <Textarea
                id="recipientOrganizationContacts"
                name="recipientOrganizationContacts"
                value={typeSpecificFields?.recipientOrganizationContacts || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kkpfiContacts" className="after:content-['*'] after:ml-0.5 after:text-red-500">KKPFI Contacts</Label>
              <Textarea
                id="kkpfiContacts"
                name="kkpfiContacts"
                value={typeSpecificFields?.kkpfiContacts || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="deliverables" className="after:content-['*'] after:ml-0.5 after:text-red-500">Deliverables and dates of submission</Label>
            <Textarea
              id="deliverables"
              name="deliverables"
              value={typeSpecificFields?.deliverables || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="authorizedSignatoryName" className="after:content-['*'] after:ml-0.5 after:text-red-500">Name of Authorized Signatory</Label>
              <Input
                id="authorizedSignatoryName"
                name="authorizedSignatoryName"
                value={typeSpecificFields?.authorizedSignatoryName || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="authorizedSignatoryDesignation" className="after:content-['*'] after:ml-0.5 after:text-red-500">Designation of Authorized Signatory</Label>
              <Input
                id="authorizedSignatoryDesignation"
                name="authorizedSignatoryDesignation"
                value={typeSpecificFields?.authorizedSignatoryDesignation || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
          </div>
        </>
      );

    case 'lease':
      return (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="lessorName" className="after:content-['*'] after:ml-0.5 after:text-red-500">Name of Lessor</Label>
              <Input
                id="lessorName"
                name="lessorName"
                value={typeSpecificFields?.lessorName || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lessorAddress" className="after:content-['*'] after:ml-0.5 after:text-red-500">Registered Address of Lessor</Label>
              <Input
                id="lessorAddress"
                name="lessorAddress"
                value={typeSpecificFields?.lessorAddress || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="propertyDescription" className="after:content-['*'] after:ml-0.5 after:text-red-500">Description of Property to be Leased</Label>
            <Textarea
              id="propertyDescription"
              name="propertyDescription"
              value={typeSpecificFields?.propertyDescription || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
              placeholder="e.g., apartment, lot"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="propertyAddress" className="after:content-['*'] after:ml-0.5 after:text-red-500">Complete Address of Property</Label>
            <Input
              id="propertyAddress"
              name="propertyAddress"
              value={typeSpecificFields?.propertyAddress || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="leasePurpose" className="after:content-['*'] after:ml-0.5 after:text-red-500">Purpose of Lease</Label>
            <Input
              id="leasePurpose"
              name="leasePurpose"
              value={typeSpecificFields?.leasePurpose || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
              placeholder="e.g., field office"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monthlyRentalFee" className="after:content-['*'] after:ml-0.5 after:text-red-500">Amount of Monthly Rental Fee</Label>
              <Input
                id="monthlyRentalFee"
                name="monthlyRentalFee"
                type="number"
                value={typeSpecificFields?.monthlyRentalFee || ''}
                onChange={handleNumberChange}
                required
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDueDate" className="after:content-['*'] after:ml-0.5 after:text-red-500">Due Date of Payment</Label>
              <Input
                id="paymentDueDate"
                name="paymentDueDate"
                value={typeSpecificFields?.paymentDueDate || ''}
                onChange={handleInputChange}
                required
                disabled={disabled}
                placeholder="e.g., 5th day of each month"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="costCenter" className="after:content-['*'] after:ml-0.5 after:text-red-500">Cost Center/Charging</Label>
            <Input
              id="costCenter"
              name="costCenter"
              value={typeSpecificFields?.costCenter || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
            />
          </div>
        </>
      );

    case 'donation':
      return (
        <>
          <div className="space-y-2">
            <Label htmlFor="recipientOrganizationName" className="after:content-['*'] after:ml-0.5 after:text-red-500">Name of Recipient Organization/Donee</Label>
            <Input
              id="recipientOrganizationName"
              name="recipientOrganizationName"
              value={typeSpecificFields?.recipientOrganizationName || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="authorizedRepresentative" className="after:content-['*'] after:ml-0.5 after:text-red-500">Name of Authorized Representative of Donee</Label>
            <Input
              id="authorizedRepresentative"
              name="authorizedRepresentative"
              value={typeSpecificFields?.authorizedRepresentative || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="recipientAddress" className="after:content-['*'] after:ml-0.5 after:text-red-500">Address of Donee</Label>
            <Input
              id="recipientAddress"
              name="recipientAddress"
              value={typeSpecificFields?.recipientAddress || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="transferPurpose" className="after:content-['*'] after:ml-0.5 after:text-red-500">Purpose for the transfer of item/equipment</Label>
            <Textarea
              id="transferPurpose"
              name="transferPurpose"
              value={typeSpecificFields?.transferPurpose || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="donatedItems" className="after:content-['*'] after:ml-0.5 after:text-red-500">List of materials to be donated</Label>
            <Textarea
              id="donatedItems"
              name="donatedItems"
              value={typeSpecificFields?.donatedItems || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
              placeholder="Include quantity and description"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="doneeObligations" className="after:content-['*'] after:ml-0.5 after:text-red-500">Specific Donee Obligations</Label>
            <Textarea
              id="doneeObligations"
              name="doneeObligations"
              value={typeSpecificFields?.doneeObligations || ''}
              onChange={handleInputChange}
              required
              disabled={disabled}
            />
          </div>
        </>
      );

    default:
      return null;
  }
};

const isContractEditable = (contract?: Partial<Contract>): boolean => {
  if (!contract || !contract.status) return true; // New contracts are always editable

  // Contract can be edited if it's in one of these statuses
  const editableStatuses: ContractStatus[] = ['requested', 'draft', 'legal_review', 'management_review', 'legal_send_back', 'management_send_back'];

  // Also allow editing if the contract is in amendment status
  if (contract.status === 'amendment') {
    return true;
  }

  // Don't allow editing if the contract is in contract_end status
  if (contract.status === 'contract_end') {
    return false;
  }

  return editableStatuses.includes(contract.status as ContractStatus);
};

const ContractForm = ({
  initialData,
  initialFolder,
  foldersList = [],
  onSave,
  trigger
}: ContractFormProps) => {
  const [open, setOpen] = useState(false);
  const { currentUser } = useAuth();
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  // Check if the contract should be editable based on its status
  const isEditable = isContractEditable(initialData);

  const [formData, setFormData] = useState<Partial<Contract>>(() => {
    // If we have initial data, use it
    if (initialData) {
      return initialData;
    }

    // Otherwise create a new contract with default values
    const defaultType = 'consultancy';
    return {
      projectName: '',
      type: defaultType, // Default to consultancy as the first contract type
      status: 'requested', // Automatically set status to requested
      owner: currentUser?.email || 'Unassigned', // Ensure owner is never empty
      recipientEmail: '', // Initialize recipient email field
      inactivityNotificationDays: 30, // Default to 30 days for inactivity notifications
      startDate: new Date().toISOString().split('T')[0],
      endDate: null,
      typeSpecificFields: {}, // Initialize empty type-specific fields
      supportingDocuments: getSupportingDocuments(defaultType) // Initialize supporting documents based on type
    };
  });

  // Initialize type-specific fields based on contract type
  useEffect(() => {
    if (formData.type && (!formData.typeSpecificFields || Object.keys(formData.typeSpecificFields).length === 0)) {
      // Initialize type-specific fields based on the selected contract type
      let typeFields: ContractTypeFields = {};

      switch (formData.type) {
        case 'consultancy':
          typeFields = {
            consultantName: '', // Name of Consultant
            positionTitle: '', // Position Title
            grossProfessionalFee: 0, // Gross Professional Fee
            paymentSchedules: '', // Payment Schedules
            costCenter: '', // Cost Center/Charging
            termsOfReferenceLink: '' // Terms of Reference (attachable as PDF link)
          } as ConsultancyFields;
          break;
        case 'wos':
          typeFields = {
            serviceProviderName: '', // Name of Service Provider
            positionTitle: '', // Position Title
            grossTechnicalServiceFee: 0, // Gross Technical Service Fee
            paymentSchedules: '', // Payment Schedules
            costCenter: '', // Cost Center/Charging
            scopeOfWorkLink: '' // Scope of Work and Output (attachable as PDF link)
          } as WOSFields;
          break;
        case 'service':
          typeFields = {
            serviceProviderName: '', // Name of Service Provider
            positionTitle: '', // Position Title
            grossTechnicalServiceFee: 0, // Gross Technical Service Fee
            paymentSchedules: '', // Payment Schedules
            costCenter: '', // Cost Center/Charging
            scopeOfWorkLink: '' // Scope of Work and Output (attachable as PDF link)
          } as ServiceAgreementFields;
          break;
        case 'moa_mou':
          typeFields = {
            contractingPartyName: '', // Name of Contracting Party
            registeredAddress: '', // Registered Business/Office Address
            authorizedRepresentative: '', // Name of Authorized Representative/Signatory
            authorizedRepresentativeDesignation: '', // Designation of Authorized Representative
            recitals: '', // Recitals or Whereas Clauses
            purpose: '', // Purpose of the agreement
            kkpfiRoles: '', // Roles of KKPFI
            contractingPartyRoles: '', // Roles of the contracting party
            mutualObligations: '' // Mutual obligations (if any)
          } as MOAMOUFields;
          break;
        case 'employment':
          typeFields = {
            positionTitle: '', // Position Title
            costCenter: '', // Cost Center/Charging
            numberOfStaff: 1, // Number of staff needed
            salaryRate: 0, // Salary Rate
            communicationAllowance: 0, // Communication Allowance
            requisitionReason: 'new_position', // Reason for Requisition
            replacementReason: '', // Specify reason if replacement
            employmentClassification: 'core', // Classification of employment
            projectDurationMonths: 0 // Number of months if project
          } as EmploymentFields;
          break;
        case 'amendment':
          typeFields = {
            originalContractType: 'consultancy', // Contract type
            durationAmendment: '', // Duration
            deliverablesAmendment: '', // Deliverables
            paymentAmendment: '', // Payment
            paymentSchedulesAmendment: '' // Schedules of Payment
          } as AmendmentFields;
          break;
        case 'grant':
          typeFields = {
            donorName: '', // Name of Donor
            donorAddress: '', // Registered Address of Donor
            projectLocation: '', // Project Location
            primaryDonor: '', // Primary Donor
            primaryDonorFundingSourceAgreementNumber: '', // Primary Donor Funding Source Agreement Number
            contractAmount: 0, // Contract Amount
            bankAccountInformation: '', // Bank Account Information
            paymentSchedules: '', // Payment Schedules
            donorContacts: '', // Donor contacts
            kkpfiContacts: '', // KKPFI contacts
            deliverables: '', // Deliverables and dates of submission
            authorizedSignatoryName: '', // Name of Authorized Signatory
            authorizedSignatoryDesignation: '' // Designation of Authorized Signatory
          } as GrantAgreementFields;
          break;
        case 'subgrant':
          typeFields = {
            recipientOrganizationName: '', // Name of Recipient Organization
            recipientOrganizationAddress: '', // Registered Address of Recipient Organization
            recipientOrganizationContact: '', // Contact Details of Recipient Organization
            projectLocation: '', // Project Location
            primaryDonor: '', // Primary Donor
            primaryDonorFundingSourceAgreementNumber: '', // Primary Donor Funding Source Agreement Number
            contractAmount: 0, // Contract Amount
            bankAccountInformation: '', // Bank Account Information
            paymentSchedules: '', // Payment Schedules
            recipientOrganizationContacts: '', // Recipient Organization contacts
            kkpfiContacts: '', // KKPFI contacts
            deliverables: '', // Deliverables and dates of submission
            authorizedSignatoryName: '', // Name of Authorized Signatory
            authorizedSignatoryDesignation: '' // Designation of Authorized Signatory
          } as SubgrantFields;
          break;
        case 'lease':
          typeFields = {
            lessorName: '', // Name of Lessor
            lessorAddress: '', // Registered Address of Lessor
            propertyDescription: '', // Description of Property to be Leased
            propertyAddress: '', // Complete Address of Property
            leasePurpose: '', // Purpose of Lease
            monthlyRentalFee: 0, // Amount of Monthly Rental Fee
            paymentDueDate: '', // Due Date of Payment
            costCenter: '' // Cost Center/Charging
          } as LeaseFields;
          break;
        case 'donation':
          typeFields = {
            recipientOrganizationName: '', // Name of Recipient Organization/Donee
            authorizedRepresentative: '', // Name of Authorized Representative of Donee
            recipientAddress: '', // Address of Donee
            recipientEmail: '', // Email Address of Donee
            transferPurpose: '', // Purpose for the transfer of item/equipment
            donatedItems: '', // List of materials to be donated
            doneeObligations: '' // Specific Donee Obligations
          } as DonationFields;
          break;
        default:
          typeFields = {};
      }

      setFormData(prev => ({
        ...prev,
        typeSpecificFields: typeFields
      }));
    }
  }, [formData.type]);

  // Update folder if initialFolder changes
  useEffect(() => {
    if (initialFolder) {
      setFormData(prev => ({
        ...prev,
        folderId: initialFolder
      }));
    }
  }, [initialFolder]);

  // Initialize supporting documents if they don't exist when editing a contract
  useEffect(() => {
    if (initialData && formData.type && (!formData.supportingDocuments || formData.supportingDocuments.length === 0)) {
      setFormData(prev => ({
        ...prev,
        supportingDocuments: getSupportingDocuments(formData.type as ContractType)
      }));
    }
  }, [initialData, formData.type]);



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setHasPendingChanges(true);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value ? Number(value) : null }));
    setHasPendingChanges(true);
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'folderId' && value === 'none') {
      // For folder selection, explicitly set to null when 'none' is selected
      setFormData((prev) => ({
        ...prev,
        [name]: null
      }));
    } else if (name === 'type') {
      // Prevent changing contract type when editing an existing contract
      if (initialData) {
        toast.error('Contract type cannot be changed after creation');
        return;
      }

      const contractType = value as ContractType;

      // When contract type changes, reset type-specific fields and update supporting documents
      setFormData((prev) => ({
        ...prev,
        [name]: value === "none" ? undefined : value,
        typeSpecificFields: {}, // Reset type-specific fields
        supportingDocuments: getSupportingDocuments(contractType) // Update supporting documents based on new type
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
    setHasPendingChanges(true);
  };

  // Handler for type-specific fields
  const handleTypeSpecificInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      typeSpecificFields: {
        ...prev.typeSpecificFields,
        [name]: value
      }
    }));
    setHasPendingChanges(true);
  };

  // Handler for type-specific number fields
  const handleTypeSpecificNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      typeSpecificFields: {
        ...prev.typeSpecificFields,
        [name]: value ? Number(value) : 0
      }
    }));
    setHasPendingChanges(true);
  };

  // Handler for type-specific select fields
  const handleTypeSpecificSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      typeSpecificFields: {
        ...prev.typeSpecificFields,
        [name]: value
      }
    }));
    setHasPendingChanges(true);
  };

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      // The date is already fixed by our custom Calendar component
      setFormData((prev) => ({ ...prev, startDate: date.toISOString().split('T')[0] }));
      setHasPendingChanges(true);
    }
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      // The date is already fixed by our custom Calendar component
      setFormData((prev) => ({ ...prev, endDate: date.toISOString().split('T')[0] }));
    } else {
      setFormData((prev) => ({ ...prev, endDate: null }));
    }
    setHasPendingChanges(true);
  };

  // Handler for supporting documents checkboxes
  const handleSupportingDocumentChange = (index: number, checked: boolean) => {
    setFormData((prev) => {
      const updatedDocs = [...(prev.supportingDocuments || [])];
      updatedDocs[index] = { ...updatedDocs[index], checked };
      return { ...prev, supportingDocuments: updatedDocs };
    });
    setHasPendingChanges(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if the contract is editable based on its status
    if (initialData && !isEditable) {
      toast.error('This contract cannot be edited in its current status');
      return;
    }

    // Validate required fields based on contract_types file
    if (!formData.projectName || !formData.startDate || !formData.type || !formData.recipientEmail) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate type-specific required fields
    let missingRequiredFields = false;

    if (formData.type) {
      switch (formData.type) {
        case 'consultancy':
          if (!formData.typeSpecificFields?.consultantName ||
              !formData.typeSpecificFields?.positionTitle ||
              !formData.typeSpecificFields?.grossProfessionalFee ||
              !formData.typeSpecificFields?.paymentSchedules ||
              !formData.typeSpecificFields?.costCenter) {
            missingRequiredFields = true;
          }
          break;
        case 'wos':
        case 'service':
          if (!formData.typeSpecificFields?.serviceProviderName ||
              !formData.typeSpecificFields?.positionTitle ||
              !formData.typeSpecificFields?.grossTechnicalServiceFee ||
              !formData.typeSpecificFields?.paymentSchedules ||
              !formData.typeSpecificFields?.costCenter) {
            missingRequiredFields = true;
          }
          break;
        case 'moa_mou':
          if (!formData.typeSpecificFields?.contractingPartyName ||
              !formData.typeSpecificFields?.registeredAddress ||
              !formData.typeSpecificFields?.authorizedRepresentative ||
              !formData.typeSpecificFields?.authorizedRepresentativeDesignation ||
              !formData.typeSpecificFields?.recitals ||
              !formData.typeSpecificFields?.purpose ||
              !formData.typeSpecificFields?.kkpfiRoles ||
              !formData.typeSpecificFields?.contractingPartyRoles) {
            missingRequiredFields = true;
          }
          break;
        case 'employment':
          if (!formData.typeSpecificFields?.positionTitle ||
              !formData.typeSpecificFields?.costCenter ||
              !formData.typeSpecificFields?.numberOfStaff ||
              !formData.typeSpecificFields?.salaryRate ||
              !formData.typeSpecificFields?.requisitionReason ||
              !formData.typeSpecificFields?.employmentClassification ||
              (formData.typeSpecificFields?.requisitionReason === 'replacement' && !formData.typeSpecificFields?.replacementReason) ||
              (formData.typeSpecificFields?.employmentClassification === 'project' && !formData.typeSpecificFields?.projectDurationMonths)) {
            missingRequiredFields = true;
          }
          break;
        case 'amendment':
          if (!formData.typeSpecificFields?.originalContractType ||
              !formData.typeSpecificFields?.durationAmendment ||
              !formData.typeSpecificFields?.deliverablesAmendment ||
              !formData.typeSpecificFields?.paymentAmendment ||
              !formData.typeSpecificFields?.paymentSchedulesAmendment) {
            missingRequiredFields = true;
          }
          break;
        case 'grant':
          if (!formData.typeSpecificFields?.donorName ||
              !formData.typeSpecificFields?.donorAddress ||
              !formData.typeSpecificFields?.projectLocation ||
              !formData.typeSpecificFields?.primaryDonor ||
              !formData.typeSpecificFields?.primaryDonorFundingSourceAgreementNumber ||
              !formData.typeSpecificFields?.contractAmount ||
              !formData.typeSpecificFields?.bankAccountInformation ||
              !formData.typeSpecificFields?.paymentSchedules ||
              !formData.typeSpecificFields?.donorContacts ||
              !formData.typeSpecificFields?.kkpfiContacts ||
              !formData.typeSpecificFields?.deliverables ||
              !formData.typeSpecificFields?.authorizedSignatoryName ||
              !formData.typeSpecificFields?.authorizedSignatoryDesignation) {
            missingRequiredFields = true;
          }
          break;
        case 'subgrant':
          if (!formData.typeSpecificFields?.recipientOrganizationName ||
              !formData.typeSpecificFields?.recipientOrganizationAddress ||
              !formData.typeSpecificFields?.recipientOrganizationContact ||
              !formData.typeSpecificFields?.projectLocation ||
              !formData.typeSpecificFields?.primaryDonor ||
              !formData.typeSpecificFields?.primaryDonorFundingSourceAgreementNumber ||
              !formData.typeSpecificFields?.contractAmount ||
              !formData.typeSpecificFields?.bankAccountInformation ||
              !formData.typeSpecificFields?.paymentSchedules ||
              !formData.typeSpecificFields?.recipientOrganizationContacts ||
              !formData.typeSpecificFields?.kkpfiContacts ||
              !formData.typeSpecificFields?.deliverables ||
              !formData.typeSpecificFields?.authorizedSignatoryName ||
              !formData.typeSpecificFields?.authorizedSignatoryDesignation) {
            missingRequiredFields = true;
          }
          break;
        case 'lease':
          if (!formData.typeSpecificFields?.lessorName ||
              !formData.typeSpecificFields?.lessorAddress ||
              !formData.typeSpecificFields?.propertyDescription ||
              !formData.typeSpecificFields?.propertyAddress ||
              !formData.typeSpecificFields?.leasePurpose ||
              !formData.typeSpecificFields?.monthlyRentalFee ||
              !formData.typeSpecificFields?.paymentDueDate ||
              !formData.typeSpecificFields?.costCenter) {
            missingRequiredFields = true;
          }
          break;
        case 'donation':
          if (!formData.typeSpecificFields?.recipientOrganizationName ||
              !formData.typeSpecificFields?.authorizedRepresentative ||
              !formData.typeSpecificFields?.recipientAddress ||
              !formData.typeSpecificFields?.transferPurpose ||
              !formData.typeSpecificFields?.donatedItems ||
              !formData.typeSpecificFields?.doneeObligations) {
            missingRequiredFields = true;
          }
          break;
      }
    }

    if (missingRequiredFields) {
      toast.error('Please fill in all required fields for the selected contract type');
      return;
    }

    // Use project name as the title and ensure status is set to requested for new contracts
    const updatedFormData = {
      ...formData,
      title: formData.projectName, // Set title to be the same as project name
      status: initialData ? formData.status : 'requested' // Ensure new contracts always have requested status
    };

    onSave(updatedFormData);
    toast.success('Contract saved successfully');
    setHasPendingChanges(false);
    setOpen(false);
  };

  const defaultTrigger = (
    <Button className="inline-flex items-center gap-1">
      <Plus size={16} />
      <span>New Contract</span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen && hasPendingChanges) {
        if (window.confirm('You have unsaved changes. Are you sure you want to close this form?')) {
          setOpen(false);
          setHasPendingChanges(false);
        }
      } else {
        setOpen(newOpen);
      }
    }}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} data-pending-changes={hasPendingChanges}>
          <DialogHeader>
            <DialogTitle>{initialData ? 'Edit Contract' : 'Create New Contract'}</DialogTitle>
            <DialogDescription>
              Fill in the details for this contract. Required fields are marked with an asterisk (*).
            </DialogDescription>
          </DialogHeader>

          {/* Show warning if contract is not editable */}
          {initialData && !isEditable && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Warning: This contract is in {initialData.status?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} status and should not be edited.
                Contracts should only be edited until after the Reviews. After that, contracts should only be edited through amendment.
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectName" className="after:content-['*'] after:ml-0.5 after:text-red-500">Project Name</Label>
                <Input
                  id="projectName"
                  name="projectName"
                  value={formData.projectName || ''}
                  onChange={handleInputChange}
                  required
                  disabled={initialData && !isEditable}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipientEmail" className="after:content-['*'] after:ml-0.5 after:text-red-500">Recipient Email</Label>
                <Input
                  id="recipientEmail"
                  name="recipientEmail"
                  type="email"
                  value={formData.recipientEmail || ''}
                  onChange={handleInputChange}
                  required
                  disabled={initialData && !isEditable}
                  placeholder="Enter recipient's email address"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inactivityNotificationDays">Inactivity Notification Days</Label>
                <Input
                  id="inactivityNotificationDays"
                  name="inactivityNotificationDays"
                  type="number"
                  min="1"
                  max="365"
                  value={formData.inactivityNotificationDays || 30}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value > 0) {
                      setFormData((prev) => ({ ...prev, inactivityNotificationDays: value }));
                      setHasPendingChanges(true);
                    }
                  }}
                  disabled={initialData && (!isEditable || (currentUser?.email !== initialData.owner))}
                />
                <p className="text-sm text-muted-foreground">
                  Number of days of inactivity before sending a notification email (default: 30)
                  {initialData && currentUser?.email !== initialData.owner && (
                    <span className="block text-amber-600 mt-1">
                      Only the contract creator can modify this setting
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type" className="after:content-['*'] after:ml-0.5 after:text-red-500">
                Contract Type
                {initialData && <span className="ml-2 text-amber-600 text-sm">(Cannot be changed after creation)</span>}
              </Label>
              <Select
                value={formData.type as string || 'service'}
                onValueChange={(value) => handleSelectChange('type', value)}
                disabled={initialData ? true : false}
              >
                <SelectTrigger id="type" className={initialData ? "opacity-70 cursor-not-allowed" : ""}>
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
              {initialData && (
                <p className="text-sm text-muted-foreground mt-1">
                  Contract type cannot be changed after creation. To change the contract type, create a new contract.
                </p>
              )}
            </div>

            {/* Type-specific fields */}
            {formData.type && (
              <div className="border p-4 rounded-md bg-muted/20">
                <h3 className="text-lg font-medium mb-4">
                  {contractTypeLabels[formData.type as ContractType]} Details
                </h3>
                <TypeSpecificFields
                  contractType={formData.type as ContractType}
                  typeSpecificFields={formData.typeSpecificFields}
                  handleInputChange={handleTypeSpecificInputChange}
                  handleNumberChange={handleTypeSpecificNumberChange}
                  handleSelectChange={handleTypeSpecificSelectChange}
                  disabled={initialData && !isEditable}
                />
              </div>
            )}

            {/* Supporting Documents Checklist */}
            {formData.type && formData.supportingDocuments && formData.supportingDocuments.length > 0 && (
              <div className="border p-4 rounded-md bg-muted/20">
                <h3 className="text-lg font-medium mb-4">
                  Supporting Documents Checklist
                </h3>
                <div className="space-y-2">
                  {formData.supportingDocuments.map((doc, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Checkbox
                        id={`supporting-doc-${index}`}
                        checked={doc.checked}
                        onCheckedChange={(checked) => handleSupportingDocumentChange(index, checked === true)}
                        disabled={initialData && !isEditable}
                      />
                      <Label
                        htmlFor={`supporting-doc-${index}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {doc.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Folder and Contract Value fields removed as they're not in the contract_types file */}

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
                      disabled={initialData && !isEditable}
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
                      disabled={initialData && !isEditable}
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
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={initialData && !isEditable}>
              {initialData && !isEditable ? 'Cannot Edit' : 'Save Contract'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContractForm;
