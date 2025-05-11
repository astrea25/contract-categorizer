import { Contract, contractTypeLabels } from "@/lib/data";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import ContractStatusBadge from "./ContractStatusBadge";
import { Calendar, DollarSign, FileText, Users, FolderMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ContractCardProps {
    contract: Contract;
    className?: string;
    onRemoveFromFolder?: (contractId: string) => void;
}

const ContractCard = (
    {
        contract,
        className,
        onRemoveFromFolder
    }: ContractCardProps
) => {
    const {
        id,
        title,
        projectName,
        type,
        status,
        startDate,
        endDate,
        value,
        updatedAt,
        folderId
    } = contract;

    const formattedDate = new Date(startDate).toLocaleDateString();
    const formattedEndDate = endDate ? new Date(endDate).toLocaleDateString() : "Ongoing";

    const updatedTimeAgo = formatDistanceToNow(new Date(updatedAt), {
        addSuffix: true
    });

    return (
        <Card
            className={cn("overflow-hidden transition-all duration-300 hover:shadow-md", className)}>
            <CardContent className="p-6 space-y-4">
                <div className="flex flex-wrap justify-between gap-2">
                    <span
                        className="px-2 py-1 bg-secondary text-xs rounded-md font-medium text-secondary-foreground">
                        {contractTypeLabels[type]}
                    </span>
                    <ContractStatusBadge status={status} />
                </div>
                <div className="space-y-1">
                    <h3 className="font-medium text-lg line-clamp-1">{title}</h3>
                    <p className="text-sm text-muted-foreground">{projectName}</p>
                </div>
                <div className="space-y-2">
                    <div className="flex items-center text-sm">
                        <Calendar size={16} className="mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">
                            {formattedDate}- {formattedEndDate}
                        </span>
                    </div>
                    {value !== null && (<div className="flex items-center text-sm">
                        <DollarSign size={16} className="mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">₱{value.toLocaleString()}
                        </span>
                    </div>)}
                    <div className="flex items-center text-sm">
                        <Users size={16} className="mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">
                            {contract.parties.length} {contract.parties.length === 1 ? "Party" : "Parties"}
                        </span>
                    </div>
                </div>
                {contract.documentLink && (<div className="flex items-center text-sm">
                    <FileText size={16} className="mr-2 text-muted-foreground" />
                    <a
                        href={contract.documentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:underline">Document Link
                                                                                    </a>
                </div>)}
            </CardContent>
            <CardFooter className="bg-secondary/30 px-6 py-3 flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Updated {updatedTimeAgo}
                </span>
                <div className="flex items-center gap-2">
                    {folderId && onRemoveFromFolder && (<TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="gap-1 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                    onClick={() => onRemoveFromFolder(id)}>
                                    <FolderMinus size={14} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Remove from folder</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>)}
                    <Button asChild size="sm" variant="ghost" className="gap-1">
                        <Link to={`/contract/${id}`}>
                            <span>View</span>
                            <FileText size={14} />
                        </Link>
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};

export default ContractCard;