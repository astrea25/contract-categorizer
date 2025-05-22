import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

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
    getSupportingDocuments,
} from "@/lib/data";

import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface ContractFormProps {
    initialData?: Partial<Contract>;
    initialFolder?: string;
    foldersList?: Folder[];
    onSave: (contract: Partial<Contract>) => void;
    trigger?: React.ReactNode;
}

const TypeSpecificFields = (
    {
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
    }
) => {
    switch (contractType) {
    case "consultancy":
        return (
            <>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="consultantName"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Consultant Name</Label>
                        <Input
                            id="consultantName"
                            name="consultantName"
                            value={typeSpecificFields?.consultantName || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="positionTitle"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Position Title</Label>
                        <Input
                            id="positionTitle"
                            name="positionTitle"
                            value={typeSpecificFields?.positionTitle || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="grossProfessionalFee"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Gross Professional Fee</Label>
                        <Input
                            id="grossProfessionalFee"
                            name="grossProfessionalFee"
                            type="number"
                            value={typeSpecificFields?.grossProfessionalFee || ""}
                            onChange={handleNumberChange}
                            required
                            disabled={disabled} />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="costCenter"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Cost Center/Charging</Label>
                        <Input
                            id="costCenter"
                            name="costCenter"
                            value={typeSpecificFields?.costCenter || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="paymentSchedules"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Payment Schedules</Label>
                    <Textarea
                        id="paymentSchedules"
                        name="paymentSchedules"
                        value={typeSpecificFields?.paymentSchedules || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="termsOfReferenceLink">Terms of Reference (PDF Link)</Label>
                    <Input
                        id="termsOfReferenceLink"
                        name="termsOfReferenceLink"
                        type="url"
                        value={typeSpecificFields?.termsOfReferenceLink || ""}
                        onChange={handleInputChange}
                        placeholder="Enter link to Terms of Reference document"
                        disabled={disabled} />
                </div>
            </>
        );
    case "wos":
        return (
            <>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="serviceProviderName"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Service Provider Name</Label>
                        <Input
                            id="serviceProviderName"
                            name="serviceProviderName"
                            value={typeSpecificFields?.serviceProviderName || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="positionTitle"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Position Title</Label>
                        <Input
                            id="positionTitle"
                            name="positionTitle"
                            value={typeSpecificFields?.positionTitle || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="grossTechnicalServiceFee"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Gross Technical Service Fee</Label>
                        <Input
                            id="grossTechnicalServiceFee"
                            name="grossTechnicalServiceFee"
                            type="number"
                            value={typeSpecificFields?.grossTechnicalServiceFee || ""}
                            onChange={handleNumberChange}
                            required
                            disabled={disabled} />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="costCenter"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Cost Center/Charging</Label>
                        <Input
                            id="costCenter"
                            name="costCenter"
                            value={typeSpecificFields?.costCenter || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="paymentSchedules"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Payment Schedules</Label>
                    <Textarea
                        id="paymentSchedules"
                        name="paymentSchedules"
                        value={typeSpecificFields?.paymentSchedules || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="scopeOfWorkLink">Scope of Work and Output (PDF Link)</Label>
                    <Input
                        id="scopeOfWorkLink"
                        name="scopeOfWorkLink"
                        type="url"
                        value={typeSpecificFields?.scopeOfWorkLink || ""}
                        onChange={handleInputChange}
                        placeholder="Enter link to Scope of Work document"
                        disabled={disabled} />
                </div>
            </>
        );
    case "service":
        return (
            <>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="serviceProviderName"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Service Provider Name</Label>
                        <Input
                            id="serviceProviderName"
                            name="serviceProviderName"
                            value={typeSpecificFields?.serviceProviderName || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="positionTitle"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Position Title</Label>
                        <Input
                            id="positionTitle"
                            name="positionTitle"
                            value={typeSpecificFields?.positionTitle || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="grossTechnicalServiceFee"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Gross Technical Service Fee</Label>
                        <Input
                            id="grossTechnicalServiceFee"
                            name="grossTechnicalServiceFee"
                            type="number"
                            value={typeSpecificFields?.grossTechnicalServiceFee || ""}
                            onChange={handleNumberChange}
                            required
                            disabled={disabled} />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="costCenter"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Cost Center/Charging</Label>
                        <Input
                            id="costCenter"
                            name="costCenter"
                            value={typeSpecificFields?.costCenter || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="paymentSchedules"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Payment Schedules</Label>
                    <Textarea
                        id="paymentSchedules"
                        name="paymentSchedules"
                        value={typeSpecificFields?.paymentSchedules || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="scopeOfWorkLink">Scope of Work and Output (PDF Link)</Label>
                    <Input
                        id="scopeOfWorkLink"
                        name="scopeOfWorkLink"
                        type="url"
                        value={typeSpecificFields?.scopeOfWorkLink || ""}
                        onChange={handleInputChange}
                        placeholder="Enter link to Scope of Work document"
                        disabled={disabled} />
                </div>
            </>
        );
    case "moa_mou":
        return (
            <>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="contractingPartyName"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Contracting Party Name</Label>
                        <Input
                            id="contractingPartyName"
                            name="contractingPartyName"
                            value={typeSpecificFields?.contractingPartyName || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="registeredAddress"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Registered Business/Office Address</Label>
                        <Input
                            id="registeredAddress"
                            name="registeredAddress"
                            value={typeSpecificFields?.registeredAddress || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="authorizedRepresentative"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Authorized Representative/Signatory</Label>
                        <Input
                            id="authorizedRepresentative"
                            name="authorizedRepresentative"
                            value={typeSpecificFields?.authorizedRepresentative || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="authorizedRepresentativeDesignation"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Designation of Authorized Representative</Label>
                        <Input
                            id="authorizedRepresentativeDesignation"
                            name="authorizedRepresentativeDesignation"
                            value={typeSpecificFields?.authorizedRepresentativeDesignation || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="recitals"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Recitals or Whereas Clauses</Label>
                    <Textarea
                        id="recitals"
                        name="recitals"
                        value={typeSpecificFields?.recitals || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled} />
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="purpose"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Purpose of the Agreement</Label>
                    <Textarea
                        id="purpose"
                        name="purpose"
                        value={typeSpecificFields?.purpose || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled} />
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="kkpfiRoles"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Roles of KKPFI</Label>
                    <Textarea
                        id="kkpfiRoles"
                        name="kkpfiRoles"
                        value={typeSpecificFields?.kkpfiRoles || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled} />
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="contractingPartyRoles"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Roles of the Contracting Party</Label>
                    <Textarea
                        id="contractingPartyRoles"
                        name="contractingPartyRoles"
                        value={typeSpecificFields?.contractingPartyRoles || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="mutualObligations">Mutual Obligations (if any)</Label>
                    <Textarea
                        id="mutualObligations"
                        name="mutualObligations"
                        value={typeSpecificFields?.mutualObligations || ""}
                        onChange={handleInputChange}
                        disabled={disabled} />
                </div>
            </>
        );
    case "employment":
        return (
            <>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="positionTitle"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Position Title</Label>
                        <Input
                            id="positionTitle"
                            name="positionTitle"
                            value={typeSpecificFields?.positionTitle || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="costCenter"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Cost Center/Charging</Label>
                        <Input
                            id="costCenter"
                            name="costCenter"
                            value={typeSpecificFields?.costCenter || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="numberOfStaff"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Number of Staff Needed</Label>
                        <Input
                            id="numberOfStaff"
                            name="numberOfStaff"
                            type="number"
                            value={typeSpecificFields?.numberOfStaff || ""}
                            onChange={handleNumberChange}
                            required
                            disabled={disabled} />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="salaryRate"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Salary Rate</Label>
                        <Input
                            id="salaryRate"
                            name="salaryRate"
                            type="number"
                            value={typeSpecificFields?.salaryRate || ""}
                            onChange={handleNumberChange}
                            required
                            disabled={disabled} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="communicationAllowance">Communication Allowance</Label>
                        <Input
                            id="communicationAllowance"
                            name="communicationAllowance"
                            type="number"
                            value={typeSpecificFields?.communicationAllowance || ""}
                            onChange={handleNumberChange}
                            disabled={disabled} />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="requisitionReason"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Reason for Requisition</Label>
                        <Select
                            value={typeSpecificFields?.requisitionReason || "new_position"}
                            onValueChange={value => handleSelectChange("requisitionReason", value)}
                            disabled={disabled}>
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
                {typeSpecificFields?.requisitionReason === "replacement" && (<div className="space-y-2">
                    <Label
                        htmlFor="replacementReason"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Replacement Reason</Label>
                    <Input
                        id="replacementReason"
                        name="replacementReason"
                        value={typeSpecificFields?.replacementReason || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled} />
                </div>)}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="employmentClassification"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Classification of Employment</Label>
                        <Select
                            value={typeSpecificFields?.employmentClassification || "core"}
                            onValueChange={value => handleSelectChange("employmentClassification", value)}
                            disabled={disabled}>
                            <SelectTrigger id="employmentClassification">
                                <SelectValue placeholder="Select classification" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="core">Core</SelectItem>
                                <SelectItem value="project">Project</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {typeSpecificFields?.employmentClassification === "project" && (<div className="space-y-2">
                        <Label
                            htmlFor="projectDurationMonths"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Project Duration (Months)</Label>
                        <Input
                            id="projectDurationMonths"
                            name="projectDurationMonths"
                            type="number"
                            value={typeSpecificFields?.projectDurationMonths || ""}
                            onChange={handleNumberChange}
                            required
                            disabled={disabled} />
                    </div>)}
                </div>
            </>
        );
    case "amendment":
        return (
            <>
                <div className="space-y-2">
                    <Label
                        htmlFor="originalContractType"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Contract Type</Label>
                    <Select
                        value={typeSpecificFields?.originalContractType || "consultancy"}
                        onValueChange={value => handleSelectChange("originalContractType", value)}
                        disabled={disabled}>
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
                    <Label
                        htmlFor="durationAmendment"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Duration Amendment</Label>
                    <Textarea
                        id="durationAmendment"
                        name="durationAmendment"
                        value={typeSpecificFields?.durationAmendment || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled}
                        placeholder="Enter 'None' if no amendment is needed" />
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="deliverablesAmendment"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Deliverables Amendment</Label>
                    <Textarea
                        id="deliverablesAmendment"
                        name="deliverablesAmendment"
                        value={typeSpecificFields?.deliverablesAmendment || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled}
                        placeholder="Enter 'None' if no amendment is needed" />
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="paymentAmendment"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Payment Amendment</Label>
                    <Textarea
                        id="paymentAmendment"
                        name="paymentAmendment"
                        value={typeSpecificFields?.paymentAmendment || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled}
                        placeholder="Enter 'None' if no amendment is needed" />
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="paymentSchedulesAmendment"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Payment Schedules Amendment</Label>
                    <Textarea
                        id="paymentSchedulesAmendment"
                        name="paymentSchedulesAmendment"
                        value={typeSpecificFields?.paymentSchedulesAmendment || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled}
                        placeholder="Enter 'None' if no amendment is needed" />
                </div>
            </>
        );
    case "grant":
        return (
            <>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="donorName"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Name of Donor</Label>
                        <Input
                            id="donorName"
                            name="donorName"
                            value={typeSpecificFields?.donorName || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="donorAddress"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Registered Address of Donor</Label>
                        <Input
                            id="donorAddress"
                            name="donorAddress"
                            value={typeSpecificFields?.donorAddress || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="projectLocation"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Project Location</Label>
                        <Input
                            id="projectLocation"
                            name="projectLocation"
                            value={typeSpecificFields?.projectLocation || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="primaryDonor"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Primary Donor</Label>
                        <Input
                            id="primaryDonor"
                            name="primaryDonor"
                            value={typeSpecificFields?.primaryDonor || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="primaryDonorFundingSourceAgreementNumber"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Primary Donor Funding Source Agreement Number</Label>
                        <Input
                            id="primaryDonorFundingSourceAgreementNumber"
                            name="primaryDonorFundingSourceAgreementNumber"
                            value={typeSpecificFields?.primaryDonorFundingSourceAgreementNumber || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="contractAmount"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Contract Amount</Label>
                        <Input
                            id="contractAmount"
                            name="contractAmount"
                            type="number"
                            value={typeSpecificFields?.contractAmount || ""}
                            onChange={handleNumberChange}
                            required
                            disabled={disabled} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="bankAccountInformation"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Bank Account Information (for transmittal of funds)</Label>
                    <Textarea
                        id="bankAccountInformation"
                        name="bankAccountInformation"
                        value={typeSpecificFields?.bankAccountInformation || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled} />
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="paymentSchedules"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Payment Schedules</Label>
                    <Textarea
                        id="paymentSchedules"
                        name="paymentSchedules"
                        value={typeSpecificFields?.paymentSchedules || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="donorContacts"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Donor Contacts</Label>
                        <Textarea
                            id="donorContacts"
                            name="donorContacts"
                            value={typeSpecificFields?.donorContacts || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="kkpfiContacts"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">KKPFI Contacts</Label>
                        <Textarea
                            id="kkpfiContacts"
                            name="kkpfiContacts"
                            value={typeSpecificFields?.kkpfiContacts || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="deliverables"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Deliverables and dates of submission</Label>
                    <Textarea
                        id="deliverables"
                        name="deliverables"
                        value={typeSpecificFields?.deliverables || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="authorizedSignatoryName"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Name of Authorized Signatory</Label>
                        <Input
                            id="authorizedSignatoryName"
                            name="authorizedSignatoryName"
                            value={typeSpecificFields?.authorizedSignatoryName || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="authorizedSignatoryDesignation"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Designation of Authorized Signatory</Label>
                        <Input
                            id="authorizedSignatoryDesignation"
                            name="authorizedSignatoryDesignation"
                            value={typeSpecificFields?.authorizedSignatoryDesignation || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                </div>
            </>
        );
    case "subgrant":
        return (
            <>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="recipientOrganizationName"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Name of Recipient Organization</Label>
                        <Input
                            id="recipientOrganizationName"
                            name="recipientOrganizationName"
                            value={typeSpecificFields?.recipientOrganizationName || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="recipientOrganizationAddress"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Registered Address of Recipient Organization</Label>
                        <Input
                            id="recipientOrganizationAddress"
                            name="recipientOrganizationAddress"
                            value={typeSpecificFields?.recipientOrganizationAddress || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="recipientOrganizationContact"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Contact Details of Recipient Organization</Label>
                    <Input
                        id="recipientOrganizationContact"
                        name="recipientOrganizationContact"
                        value={typeSpecificFields?.recipientOrganizationContact || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="projectLocation"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Project Location</Label>
                        <Input
                            id="projectLocation"
                            name="projectLocation"
                            value={typeSpecificFields?.projectLocation || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="primaryDonor"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Primary Donor</Label>
                        <Input
                            id="primaryDonor"
                            name="primaryDonor"
                            value={typeSpecificFields?.primaryDonor || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="primaryDonorFundingSourceAgreementNumber"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Primary Donor Funding Source Agreement Number</Label>
                        <Input
                            id="primaryDonorFundingSourceAgreementNumber"
                            name="primaryDonorFundingSourceAgreementNumber"
                            value={typeSpecificFields?.primaryDonorFundingSourceAgreementNumber || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="contractAmount"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Contract Amount</Label>
                        <Input
                            id="contractAmount"
                            name="contractAmount"
                            type="number"
                            value={typeSpecificFields?.contractAmount || ""}
                            onChange={handleNumberChange}
                            required
                            disabled={disabled} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="bankAccountInformation"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Bank Account Information (of recipient organization)</Label>
                    <Textarea
                        id="bankAccountInformation"
                        name="bankAccountInformation"
                        value={typeSpecificFields?.bankAccountInformation || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled} />
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="paymentSchedules"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Payment Schedules</Label>
                    <Textarea
                        id="paymentSchedules"
                        name="paymentSchedules"
                        value={typeSpecificFields?.paymentSchedules || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="recipientOrganizationContacts"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Recipient Organization Contacts</Label>
                        <Textarea
                            id="recipientOrganizationContacts"
                            name="recipientOrganizationContacts"
                            value={typeSpecificFields?.recipientOrganizationContacts || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="kkpfiContacts"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">KKPFI Contacts</Label>
                        <Textarea
                            id="kkpfiContacts"
                            name="kkpfiContacts"
                            value={typeSpecificFields?.kkpfiContacts || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="deliverables"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Deliverables and dates of submission</Label>
                    <Textarea
                        id="deliverables"
                        name="deliverables"
                        value={typeSpecificFields?.deliverables || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="authorizedSignatoryName"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Name of Authorized Signatory</Label>
                        <Input
                            id="authorizedSignatoryName"
                            name="authorizedSignatoryName"
                            value={typeSpecificFields?.authorizedSignatoryName || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="authorizedSignatoryDesignation"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Designation of Authorized Signatory</Label>
                        <Input
                            id="authorizedSignatoryDesignation"
                            name="authorizedSignatoryDesignation"
                            value={typeSpecificFields?.authorizedSignatoryDesignation || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                </div>
            </>
        );
    case "lease":
        return (
            <>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="lessorName"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Name of Lessor</Label>
                        <Input
                            id="lessorName"
                            name="lessorName"
                            value={typeSpecificFields?.lessorName || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="lessorAddress"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Registered Address of Lessor</Label>
                        <Input
                            id="lessorAddress"
                            name="lessorAddress"
                            value={typeSpecificFields?.lessorAddress || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="propertyDescription"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Description of Property to be Leased</Label>
                    <Textarea
                        id="propertyDescription"
                        name="propertyDescription"
                        value={typeSpecificFields?.propertyDescription || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled}
                        placeholder="e.g., apartment, lot" />
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="propertyAddress"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Complete Address of Property</Label>
                    <Input
                        id="propertyAddress"
                        name="propertyAddress"
                        value={typeSpecificFields?.propertyAddress || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled} />
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="leasePurpose"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Purpose of Lease</Label>
                    <Input
                        id="leasePurpose"
                        name="leasePurpose"
                        value={typeSpecificFields?.leasePurpose || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled}
                        placeholder="e.g., field office" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label
                            htmlFor="monthlyRentalFee"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Amount of Monthly Rental Fee</Label>
                        <Input
                            id="monthlyRentalFee"
                            name="monthlyRentalFee"
                            type="number"
                            value={typeSpecificFields?.monthlyRentalFee || ""}
                            onChange={handleNumberChange}
                            required
                            disabled={disabled} />
                    </div>
                    <div className="space-y-2">
                        <Label
                            htmlFor="paymentDueDate"
                            className="after:content-['*'] after:ml-0.5 after:text-red-500">Due Date of Payment</Label>
                        <Input
                            id="paymentDueDate"
                            name="paymentDueDate"
                            value={typeSpecificFields?.paymentDueDate || ""}
                            onChange={handleInputChange}
                            required
                            disabled={disabled}
                            placeholder="e.g., 5th day of each month" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="costCenter"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Cost Center/Charging</Label>
                    <Input
                        id="costCenter"
                        name="costCenter"
                        value={typeSpecificFields?.costCenter || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled} />
                </div>
            </>
        );
    case "donation":
        return (
            <>
                <div className="space-y-2">
                    <Label
                        htmlFor="recipientOrganizationName"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Name of Recipient Organization/Donee</Label>
                    <Input
                        id="recipientOrganizationName"
                        name="recipientOrganizationName"
                        value={typeSpecificFields?.recipientOrganizationName || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled} />
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="authorizedRepresentative"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Name of Authorized Representative of Donee</Label>
                    <Input
                        id="authorizedRepresentative"
                        name="authorizedRepresentative"
                        value={typeSpecificFields?.authorizedRepresentative || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled} />
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="recipientAddress"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Address of Donee</Label>
                    <Input
                        id="recipientAddress"
                        name="recipientAddress"
                        value={typeSpecificFields?.recipientAddress || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled} />
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="transferPurpose"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Purpose for the transfer of item/equipment</Label>
                    <Textarea
                        id="transferPurpose"
                        name="transferPurpose"
                        value={typeSpecificFields?.transferPurpose || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled} />
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="donatedItems"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">List of materials to be donated</Label>
                    <Textarea
                        id="donatedItems"
                        name="donatedItems"
                        value={typeSpecificFields?.donatedItems || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled}
                        placeholder="Include quantity and description" />
                </div>
                <div className="space-y-2">
                    <Label
                        htmlFor="doneeObligations"
                        className="after:content-['*'] after:ml-0.5 after:text-red-500">Specific Donee Obligations</Label>
                    <Textarea
                        id="doneeObligations"
                        name="doneeObligations"
                        value={typeSpecificFields?.doneeObligations || ""}
                        onChange={handleInputChange}
                        required
                        disabled={disabled} />
                </div>
            </>
        );
    default:
        return null;
    }
};

const isContractEditable = (contract?: Partial<Contract>, isAdmin: boolean = false): boolean => {
    if (contract && contract.status && !isAdmin) {
        return false;
    }

    if (!contract || !contract.status)
        return true;

    const editableStatuses: ContractStatus[] = [
        "requested",
        "draft",
        "legal_review",
        "management_review",
        "legal_send_back",
        "management_send_back"
    ];

    if (contract.status === "amendment") {
        return true;
    }

    if (contract.status === "contract_end") {
        return false;
    }

    return editableStatuses.includes(contract.status as ContractStatus);
};

const ContractForm = (
    {
        initialData,
        initialFolder,
        foldersList = [],
        onSave,
        trigger
    }: ContractFormProps
) => {
    const [open, setOpen] = useState(false);

    const {
        currentUser,
        isAdmin
    } = useAuth();

    const [hasPendingChanges, setHasPendingChanges] = useState(false);
    const isEditable = isContractEditable(initialData, isAdmin);

    const [formData, setFormData] = useState<Partial<Contract>>(() => {
        if (initialData) {
            return initialData;
        }

        const defaultType = "consultancy";

        return {
            projectName: "",
            type: defaultType,
            status: "requested",
            owner: currentUser?.email || "Unassigned",
            recipientEmail: "",
            startDate: new Date().toISOString().split("T")[0],
            endDate: null,
            reviewerInactivityDays: 3,
            regularInactivityDays: 1,
            typeSpecificFields: {},
            supportingDocuments: getSupportingDocuments(defaultType)
        };
    });

    useEffect(() => {
        if (formData.type && (!formData.typeSpecificFields || Object.keys(formData.typeSpecificFields).length === 0)) {
            let typeFields: ContractTypeFields = {};

            switch (formData.type) {
            case "consultancy":
                typeFields = {
                    consultantName: "",
                    positionTitle: "",
                    grossProfessionalFee: 0,
                    paymentSchedules: "",
                    costCenter: "",
                    termsOfReferenceLink: ""
                } as ConsultancyFields;

                break;
            case "wos":
                typeFields = {
                    serviceProviderName: "",
                    positionTitle: "",
                    grossTechnicalServiceFee: 0,
                    paymentSchedules: "",
                    costCenter: "",
                    scopeOfWorkLink: ""
                } as WOSFields;

                break;
            case "service":
                typeFields = {
                    serviceProviderName: "",
                    positionTitle: "",
                    grossTechnicalServiceFee: 0,
                    paymentSchedules: "",
                    costCenter: "",
                    scopeOfWorkLink: ""
                } as ServiceAgreementFields;

                break;
            case "moa_mou":
                typeFields = {
                    contractingPartyName: "",
                    registeredAddress: "",
                    authorizedRepresentative: "",
                    authorizedRepresentativeDesignation: "",
                    recitals: "",
                    purpose: "",
                    kkpfiRoles: "",
                    contractingPartyRoles: "",
                    mutualObligations: ""
                } as MOAMOUFields;

                break;
            case "employment":
                typeFields = {
                    positionTitle: "",
                    costCenter: "",
                    numberOfStaff: 1,
                    salaryRate: 0,
                    communicationAllowance: 0,
                    requisitionReason: "new_position",
                    replacementReason: "",
                    employmentClassification: "core",
                    projectDurationMonths: 0
                } as EmploymentFields;

                break;
            case "amendment":
                typeFields = {
                    originalContractType: "consultancy",
                    durationAmendment: "",
                    deliverablesAmendment: "",
                    paymentAmendment: "",
                    paymentSchedulesAmendment: ""
                } as AmendmentFields;

                break;
            case "grant":
                typeFields = {
                    donorName: "",
                    donorAddress: "",
                    projectLocation: "",
                    primaryDonor: "",
                    primaryDonorFundingSourceAgreementNumber: "",
                    contractAmount: 0,
                    bankAccountInformation: "",
                    paymentSchedules: "",
                    donorContacts: "",
                    kkpfiContacts: "",
                    deliverables: "",
                    authorizedSignatoryName: "",
                    authorizedSignatoryDesignation: ""
                } as GrantAgreementFields;

                break;
            case "subgrant":
                typeFields = {
                    recipientOrganizationName: "",
                    recipientOrganizationAddress: "",
                    recipientOrganizationContact: "",
                    projectLocation: "",
                    primaryDonor: "",
                    primaryDonorFundingSourceAgreementNumber: "",
                    contractAmount: 0,
                    bankAccountInformation: "",
                    paymentSchedules: "",
                    recipientOrganizationContacts: "",
                    kkpfiContacts: "",
                    deliverables: "",
                    authorizedSignatoryName: "",
                    authorizedSignatoryDesignation: ""
                } as SubgrantFields;

                break;
            case "lease":
                typeFields = {
                    lessorName: "",
                    lessorAddress: "",
                    propertyDescription: "",
                    propertyAddress: "",
                    leasePurpose: "",
                    monthlyRentalFee: 0,
                    paymentDueDate: "",
                    costCenter: ""
                } as LeaseFields;

                break;
            case "donation":
                typeFields = {
                    recipientOrganizationName: "",
                    authorizedRepresentative: "",
                    recipientAddress: "",
                    recipientEmail: "",
                    transferPurpose: "",
                    donatedItems: "",
                    doneeObligations: ""
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

    useEffect(() => {
        if (initialFolder) {
            setFormData(prev => ({
                ...prev,
                folderId: initialFolder
            }));
        }
    }, [initialFolder]);

    useEffect(() => {
        if (initialData && formData.type && (!formData.supportingDocuments || formData.supportingDocuments.length === 0)) {
            setFormData(prev => ({
                ...prev,
                supportingDocuments: getSupportingDocuments(formData.type as ContractType)
            }));
        }
    }, [initialData, formData.type]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {
            name,
            value
        } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        setHasPendingChanges(true);
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {
            name,
            value
        } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value ? Number(value) : null
        }));

        setHasPendingChanges(true);
    };

    const handleSelectChange = (name: string, value: string) => {
        if (name === "folderId" && value === "none") {
            setFormData(prev => ({
                ...prev,
                [name]: null
            }));
        } else if (name === "type") {
            if (initialData) {
                toast.error("Contract type cannot be changed after creation");
                return;
            }

            const contractType = value as ContractType;

            setFormData(prev => ({
                ...prev,
                [name]: value === "none" ? undefined : value,
                typeSpecificFields: {},
                supportingDocuments: getSupportingDocuments(contractType)
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        setHasPendingChanges(true);
    };

    const handleTypeSpecificInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {
            name,
            value
        } = e.target;

        setFormData(prev => ({
            ...prev,

            typeSpecificFields: {
                ...prev.typeSpecificFields,
                [name]: value
            }
        }));

        setHasPendingChanges(true);
    };

    const handleTypeSpecificNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {
            name,
            value
        } = e.target;

        setFormData(prev => ({
            ...prev,

            typeSpecificFields: {
                ...prev.typeSpecificFields,
                [name]: value ? Number(value) : 0
            }
        }));

        setHasPendingChanges(true);
    };

    const handleTypeSpecificSelectChange = (name: string, value: string) => {
        setFormData(prev => ({
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
            setFormData(prev => ({
                ...prev,
                startDate: date.toISOString().split("T")[0]
            }));

            setHasPendingChanges(true);
        }
    };

    const handleEndDateChange = (date: Date | undefined) => {
        if (date) {
            setFormData(prev => ({
                ...prev,
                endDate: date.toISOString().split("T")[0]
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                endDate: null
            }));
        }

        setHasPendingChanges(true);
    };

    const handleSupportingDocumentChange = (index: number, checked: boolean) => {
        setFormData(prev => {
            const updatedDocs = [...(prev.supportingDocuments || [])];

            updatedDocs[index] = {
                ...updatedDocs[index],
                checked
            };

            return {
                ...prev,
                supportingDocuments: updatedDocs
            };
        });

        setHasPendingChanges(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (initialData && !isEditable) {
            toast.error("This contract cannot be edited in its current status");
            return;
        }

        if (!formData.projectName || !formData.startDate || !formData.type) {
            toast.error("Please fill in all required fields");
            return;
        }

        let missingRequiredFields = false;

        if (formData.type) {
            switch (formData.type) {
            case "consultancy":
                if (!formData.typeSpecificFields?.consultantName || !formData.typeSpecificFields?.positionTitle || !formData.typeSpecificFields?.grossProfessionalFee || !formData.typeSpecificFields?.paymentSchedules || !formData.typeSpecificFields?.costCenter) {
                    missingRequiredFields = true;
                }

                break;
            case "wos":
            case "service":
                if (!formData.typeSpecificFields?.serviceProviderName || !formData.typeSpecificFields?.positionTitle || !formData.typeSpecificFields?.grossTechnicalServiceFee || !formData.typeSpecificFields?.paymentSchedules || !formData.typeSpecificFields?.costCenter) {
                    missingRequiredFields = true;
                }

                break;
            case "moa_mou":
                if (!formData.typeSpecificFields?.contractingPartyName || !formData.typeSpecificFields?.registeredAddress || !formData.typeSpecificFields?.authorizedRepresentative || !formData.typeSpecificFields?.authorizedRepresentativeDesignation || !formData.typeSpecificFields?.recitals || !formData.typeSpecificFields?.purpose || !formData.typeSpecificFields?.kkpfiRoles || !formData.typeSpecificFields?.contractingPartyRoles) {
                    missingRequiredFields = true;
                }

                break;
            case "employment":
                if (!formData.typeSpecificFields?.positionTitle || !formData.typeSpecificFields?.costCenter || !formData.typeSpecificFields?.numberOfStaff || !formData.typeSpecificFields?.salaryRate || !formData.typeSpecificFields?.requisitionReason || !formData.typeSpecificFields?.employmentClassification || (formData.typeSpecificFields?.requisitionReason === "replacement" && !formData.typeSpecificFields?.replacementReason) || (formData.typeSpecificFields?.employmentClassification === "project" && !formData.typeSpecificFields?.projectDurationMonths)) {
                    missingRequiredFields = true;
                }

                break;
            case "amendment":
                if (!formData.typeSpecificFields?.originalContractType || !formData.typeSpecificFields?.durationAmendment || !formData.typeSpecificFields?.deliverablesAmendment || !formData.typeSpecificFields?.paymentAmendment || !formData.typeSpecificFields?.paymentSchedulesAmendment) {
                    missingRequiredFields = true;
                }

                break;
            case "grant":
                if (!formData.typeSpecificFields?.donorName || !formData.typeSpecificFields?.donorAddress || !formData.typeSpecificFields?.projectLocation || !formData.typeSpecificFields?.primaryDonor || !formData.typeSpecificFields?.primaryDonorFundingSourceAgreementNumber || !formData.typeSpecificFields?.contractAmount || !formData.typeSpecificFields?.bankAccountInformation || !formData.typeSpecificFields?.paymentSchedules || !formData.typeSpecificFields?.donorContacts || !formData.typeSpecificFields?.kkpfiContacts || !formData.typeSpecificFields?.deliverables || !formData.typeSpecificFields?.authorizedSignatoryName || !formData.typeSpecificFields?.authorizedSignatoryDesignation) {
                    missingRequiredFields = true;
                }

                break;
            case "subgrant":
                if (!formData.typeSpecificFields?.recipientOrganizationName || !formData.typeSpecificFields?.recipientOrganizationAddress || !formData.typeSpecificFields?.recipientOrganizationContact || !formData.typeSpecificFields?.projectLocation || !formData.typeSpecificFields?.primaryDonor || !formData.typeSpecificFields?.primaryDonorFundingSourceAgreementNumber || !formData.typeSpecificFields?.contractAmount || !formData.typeSpecificFields?.bankAccountInformation || !formData.typeSpecificFields?.paymentSchedules || !formData.typeSpecificFields?.recipientOrganizationContacts || !formData.typeSpecificFields?.kkpfiContacts || !formData.typeSpecificFields?.deliverables || !formData.typeSpecificFields?.authorizedSignatoryName || !formData.typeSpecificFields?.authorizedSignatoryDesignation) {
                    missingRequiredFields = true;
                }

                break;
            case "lease":
                if (!formData.typeSpecificFields?.lessorName || !formData.typeSpecificFields?.lessorAddress || !formData.typeSpecificFields?.propertyDescription || !formData.typeSpecificFields?.propertyAddress || !formData.typeSpecificFields?.leasePurpose || !formData.typeSpecificFields?.monthlyRentalFee || !formData.typeSpecificFields?.paymentDueDate || !formData.typeSpecificFields?.costCenter) {
                    missingRequiredFields = true;
                }

                break;
            case "donation":
                if (!formData.typeSpecificFields?.recipientOrganizationName || !formData.typeSpecificFields?.authorizedRepresentative || !formData.typeSpecificFields?.recipientAddress || !formData.typeSpecificFields?.transferPurpose || !formData.typeSpecificFields?.donatedItems || !formData.typeSpecificFields?.doneeObligations) {
                    missingRequiredFields = true;
                }

                break;
            }
        }

        if (missingRequiredFields) {
            toast.error("Please fill in all required fields for the selected contract type");
            return;
        }

        const updatedFormData = {
            ...formData,
            title: formData.projectName,
            status: initialData ? formData.status : "requested"
        };

        onSave(updatedFormData);
        toast.success("Contract saved successfully");
        setHasPendingChanges(false);
        setOpen(false);
    };

    const defaultTrigger = (<Button className="inline-flex items-center gap-1">
        <Plus size={16} />
        <span>New Contract</span>
    </Button>);

    return (
        <Dialog
            open={open}
            onOpenChange={newOpen => {
                if (!newOpen && hasPendingChanges) {
                    if (window.confirm("You have unsaved changes. Are you sure you want to close this form?")) {
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
                        <DialogTitle>{initialData ? "Edit Contract" : "Create New Contract"}</DialogTitle>
                        <DialogDescription>Fill in the details for this contract. Required fields are marked with an asterisk (*).
                                                                                                </DialogDescription>
                    </DialogHeader>
                    {}
                    {initialData && !isEditable && (<Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            {!isAdmin ? (<>Warning: Only administrators can edit contracts. Please contact an administrator if you need to make changes to this contract.
                                                                                                                  </>) : (<>Warning: This contract is in {initialData.status?.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}status and should not be edited.
                                                                                                                    Contracts should only be edited until after the Reviews. After that, contracts should only be edited through amendment.
                                                                                                                  </>)}
                        </AlertDescription>
                    </Alert>)}
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="projectName"
                                    className="after:content-['*'] after:ml-0.5 after:text-red-500">Project Name</Label>
                                <Input
                                    id="projectName"
                                    name="projectName"
                                    value={formData.projectName || ""}
                                    onChange={handleInputChange}
                                    required
                                    disabled={initialData && !isEditable} />
                            </div>
                        </div>
                        {}
                        {(!initialData || isAdmin) && (<div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="recipientEmail">Recipient Email {initialData && !isAdmin && <span className="text-amber-600 text-sm">(Admin only)</span>}
                                </Label>
                                <Input
                                    id="recipientEmail"
                                    name="recipientEmail"
                                    type="email"
                                    value={formData.recipientEmail || ""}
                                    onChange={handleInputChange}
                                    disabled={(initialData && !isAdmin) || (initialData && !isEditable)}
                                    placeholder="Enter recipient's email address (optional)" />
                                {initialData && !isAdmin && (<p className="text-sm text-muted-foreground mt-1">Only administrators can edit recipient email for existing contracts
                                                                                                                                </p>)}
                            </div>
                        </div>)}
                        {}
                        {initialData && isAdmin && (<div className="grid grid-cols-1 gap-4">
                            <div className="space-y-2">
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="reviewerInactivityDays">Reviewer/Approver Inactivity Threshold</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Input
                                                id="reviewerInactivityDays"
                                                name="reviewerInactivityDays"
                                                type="number"
                                                min="1"
                                                max="365"
                                                value={formData.reviewerInactivityDays || ""}
                                                placeholder="3"
                                                onChange={e => {
                                                    const value = e.target.value === "" ? null : parseInt(e.target.value);

                                                    setFormData(prev => ({
                                                        ...prev,
                                                        reviewerInactivityDays: value
                                                    }));

                                                    setHasPendingChanges(true);
                                                }}
                                                disabled={!isEditable}
                                                className="w-24" />
                                            <span className="text-sm text-muted-foreground">business days</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">Default: 3 business days (72 hours) for legal team, management team, and approvers
                                                                                                                                                          </p>
                                    </div>
                                    <div>
                                        <Label htmlFor="regularInactivityDays">Regular User Inactivity Threshold</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Input
                                                id="regularInactivityDays"
                                                name="regularInactivityDays"
                                                type="number"
                                                min="1"
                                                max="365"
                                                value={formData.regularInactivityDays || ""}
                                                placeholder="1"
                                                onChange={e => {
                                                    const value = e.target.value === "" ? null : parseInt(e.target.value);

                                                    setFormData(prev => ({
                                                        ...prev,
                                                        regularInactivityDays: value
                                                    }));

                                                    setHasPendingChanges(true);
                                                }}
                                                disabled={!isEditable}
                                                className="w-24" />
                                            <span className="text-sm text-muted-foreground">business days</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">Default: 1 business day (24 hours) for all other users
                                                                                                                                                          </p>
                                    </div>
                                    <div
                                        className="text-sm text-muted-foreground space-y-1 pt-2 border-t border-gray-200">
                                        <p>
                                            <strong>Note:</strong>These thresholds count only business days (excluding weekends).
                                                                                                                                                          </p>
                                        <p>If left empty, the system will use the default values shown above.
                                                                                                                                                          </p>
                                    </div>
                                </div>
                            </div>
                        </div>)}
                        <div className="space-y-2">
                            <Label
                                htmlFor="type"
                                className="after:content-['*'] after:ml-0.5 after:text-red-500">Contract Type
                                                                                                                {initialData && <span className="ml-2 text-amber-600 text-sm">(Cannot be changed after creation)</span>}
                            </Label>
                            <Select
                                value={formData.type as string || "service"}
                                onValueChange={value => handleSelectChange("type", value)}
                                disabled={initialData ? true : false}>
                                <SelectTrigger id="type" className={initialData ? "opacity-70 cursor-not-allowed" : ""}>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(contractTypeLabels).map(([key, label]) => (<SelectItem key={key} value={key}>
                                        {label}
                                    </SelectItem>))}
                                </SelectContent>
                            </Select>
                            {initialData && (<p className="text-sm text-muted-foreground mt-1">Contract type cannot be changed after creation. To change the contract type, create a new contract.
                                                                                                                </p>)}
                        </div>
                        {}
                        {formData.type && (<div className="border p-4 rounded-md bg-muted/20">
                            <h3 className="text-lg font-medium mb-4">
                                {contractTypeLabels[formData.type as ContractType]}Details
                                                                                                                </h3>
                            <TypeSpecificFields
                                contractType={formData.type as ContractType}
                                typeSpecificFields={formData.typeSpecificFields}
                                handleInputChange={handleTypeSpecificInputChange}
                                handleNumberChange={handleTypeSpecificNumberChange}
                                handleSelectChange={handleTypeSpecificSelectChange}
                                disabled={initialData && !isEditable} />
                        </div>)}
                        {}
                        {formData.type && formData.supportingDocuments && formData.supportingDocuments.length > 0 && (<div className="border p-4 rounded-md bg-muted/20">
                            <h3 className="text-lg font-medium mb-4">Supporting Documents Checklist</h3>
                            <p className="text-sm text-muted-foreground mb-3">Documents marked with an asterisk (*) are required to move the contract to Draft status.</p>
                            <div className="space-y-2">
                                {formData.supportingDocuments.map((doc, index) => (<div key={index} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`supporting-doc-${index}`}
                                        checked={doc.checked}
                                        onCheckedChange={checked => handleSupportingDocumentChange(index, checked === true)}
                                        disabled={initialData && !isEditable} />
                                    <Label
                                        htmlFor={`supporting-doc-${index}`}
                                        className={`text-sm font-normal cursor-pointer ${doc.required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}`}>
                                        {doc.name}
                                    </Label>
                                </div>))}
                            </div>
                        </div>)}
                        {}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="startDate"
                                    className="after:content-['*'] after:ml-0.5 after:text-red-500">Start Date</Label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal",
                                                !formData.startDate && "text-muted-foreground"
                                            )}
                                            disabled={initialData && !isEditable}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.startDate ? (format(new Date(formData.startDate), "PPP")) : (<span>Pick a date</span>)}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={formData.startDate ? new Date(formData.startDate) : undefined}
                                            onSelect={handleStartDateChange}
                                            initialFocus />
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
                                            disabled={initialData && !isEditable}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {formData.endDate ? (format(new Date(formData.endDate), "PPP")) : (<span>Ongoing</span>)}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0">
                                        <Calendar
                                            mode="single"
                                            selected={formData.endDate ? new Date(formData.endDate) : undefined}
                                            onSelect={handleEndDateChange}
                                            initialFocus />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel
                                                                                                </Button>
                        <Button type="submit" disabled={initialData && !isEditable}>
                            {initialData && !isEditable ? "Cannot Edit" : "Save Contract"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ContractForm;