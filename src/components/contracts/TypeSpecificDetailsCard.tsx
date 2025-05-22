import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Contract, ContractType, contractTypeLabels } from "@/lib/data";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

import {
    FileText,
    User,
    Briefcase,
    DollarSign,
    Calendar,
    Building,
    FileSpreadsheet,
    Mail,
    MapPin,
    FileCheck,
    CreditCard,
    Clock,
    FileEdit,
    Package,
    Home,
} from "lucide-react";

interface TypeSpecificDetailsCardProps {
    contract: Contract;
}

const TypeSpecificDetailsCard = (
    {
        contract
    }: TypeSpecificDetailsCardProps
) => {
    if (!contract.typeSpecificFields || Object.keys(contract.typeSpecificFields).length === 0) {
        return null;
    }

    const formatFieldName = (fieldName: string): string => {
        return fieldName.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase()).trim();
    };

    const formatFieldValue = (value: any): string => {
        if (value === null || value === undefined)
            return "Not specified";

        if (typeof value === "number")
            return value.toLocaleString();

        if (typeof value === "boolean")
            return value ? "Yes" : "No";

        return value.toString();
    };

    const formatCurrency = (value: number): string => {
        return `₱${value.toLocaleString()}`;
    };

    const getFieldIcon = (fieldName: string) => {
        const fieldNameLower = fieldName.toLowerCase();

        if (fieldNameLower.includes("name") || fieldNameLower.includes("consultant") || fieldNameLower.includes("representative"))
            return <User className="h-4 w-4" />;

        if (fieldNameLower.includes("position") || fieldNameLower.includes("title") || fieldNameLower.includes("designation"))
            return <Briefcase className="h-4 w-4" />;

        if (fieldNameLower.includes("fee") || fieldNameLower.includes("amount") || fieldNameLower.includes("value") || fieldNameLower.includes("rate") || fieldNameLower.includes("salary"))
            return <DollarSign className="h-4 w-4" />;

        if (fieldNameLower.includes("date") || fieldNameLower.includes("duration") || fieldNameLower.includes("schedule"))
            return <Calendar className="h-4 w-4" />;

        if (fieldNameLower.includes("center") || fieldNameLower.includes("charging"))
            return <Building className="h-4 w-4" />;

        if (fieldNameLower.includes("document") || fieldNameLower.includes("reference") || fieldNameLower.includes("link") || fieldNameLower.includes("scope"))
            return <FileText className="h-4 w-4" />;

        if (fieldNameLower.includes("payment") || fieldNameLower.includes("bank"))
            return <CreditCard className="h-4 w-4" />;

        if (fieldNameLower.includes("email"))
            return <Mail className="h-4 w-4" />;

        if (fieldNameLower.includes("address") || fieldNameLower.includes("location"))
            return <MapPin className="h-4 w-4" />;

        if (fieldNameLower.includes("deliverable") || fieldNameLower.includes("obligation"))
            return <FileCheck className="h-4 w-4" />;

        if (fieldNameLower.includes("due") || fieldNameLower.includes("time"))
            return <Clock className="h-4 w-4" />;

        if (fieldNameLower.includes("amendment"))
            return <FileEdit className="h-4 w-4" />;

        if (fieldNameLower.includes("item") || fieldNameLower.includes("material") || fieldNameLower.includes("donated"))
            return <Package className="h-4 w-4" />;

        if (fieldNameLower.includes("property") || fieldNameLower.includes("lease"))
            return <Home className="h-4 w-4" />;

        return <FileSpreadsheet className="h-4 w-4" />;
    };

    const renderGenericFieldCards = () => {
        const fields = contract.typeSpecificFields;

        if (!fields)
            return null;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {}
                {Object.entries(fields).map(([key, value]) => {
                    if (value === null || value === undefined || value === "")
                        return null;

                    const fieldName = formatFieldName(key);
                    const icon = getFieldIcon(key);

                    return (
                        <Card
                            key={key}
                            className="overflow-hidden transition-all duration-300 hover:shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    {icon}
                                    {fieldName}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {typeof value === "string" && value.startsWith("http") ? (<a
                                    href={value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:underline">View Document
                                                                                                                              </a>) : (<p className="whitespace-pre-line">
                                    {typeof value === "number" && (key.toLowerCase().includes("fee") || key.toLowerCase().includes("amount") || key.toLowerCase().includes("rate")) ? formatCurrency(value) : formatFieldValue(value)}
                                </p>)}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        );
    };

    const renderSupportingDocuments = () => {
        if (!contract.supportingDocuments || contract.supportingDocuments.length === 0) {
            return null;
        }

        return (
            <div className="mt-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <FileCheck className="h-5 w-5 text-primary" />
                    Supporting Documents
                </h3>
                <Card className="overflow-hidden transition-all duration-300 hover:shadow-md">
                    <CardHeader>
                        <CardTitle className="text-base">Required Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {contract.supportingDocuments.map((doc, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {doc.checked ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <XCircle className="h-4 w-4 text-red-500" />
                                        )}
                                        <span className="text-sm">
                                            {doc.name}
                                            {doc.required && (
                                                <Badge variant="outline" className="ml-2 text-xs">Required</Badge>
                                            )}
                                        </span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {doc.checked ? "Provided" : "Not Provided"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    return (
        <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {contract.type ? `${contractTypeLabels[contract.type as ContractType]} Details` : "Contract Details"}
            </h2>
            {renderGenericFieldCards()}
            {renderSupportingDocuments()}
        </div>
    );
};

export default TypeSpecificDetailsCard;