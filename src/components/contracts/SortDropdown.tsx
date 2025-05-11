import { Button } from "@/components/ui/button";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { ChevronDown, ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
export type SortField = "title" | "updatedAt" | "createdAt" | "startDate" | "endDate" | "value";
export type SortDirection = "asc" | "desc";

export interface SortOption {
    field: SortField;
    direction: SortDirection;
}

interface SortDropdownProps {
    currentSort: SortOption;
    onSortChange: (sort: SortOption) => void;
}

const SortDropdown = (
    {
        currentSort,
        onSortChange
    }: SortDropdownProps
) => {
    const sortOptions: {
        label: string;
        field: SortField;
    }[] = [{
        label: "Title",
        field: "title"
    }, {
        label: "Last Updated",
        field: "updatedAt"
    }, {
        label: "Created Date",
        field: "createdAt"
    }, {
        label: "Start Date",
        field: "startDate"
    }, {
        label: "End Date",
        field: "endDate"
    }, {
        label: "Contract Value",
        field: "value"
    }];

    const handleSortSelect = (field: SortField) => {
        const direction = (currentSort.field === field && currentSort.direction === "asc") ? "desc" : "asc";

        onSortChange({
            field,
            direction
        });
    };

    const getSortIcon = (field: SortField) => {
        if (currentSort.field !== field) {
            return <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />;
        }

        return currentSort.direction === "asc" ? <ArrowUp className="h-4 w-4 text-primary" /> : <ArrowDown className="h-4 w-4 text-primary" />;
    };

    const getCurrentSortLabel = () => {
        const option = sortOptions.find(opt => opt.field === currentSort.field);
        return option ? option.label : "Sort by";
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full h-10">
                    <span className="flex items-center justify-between w-full">
                        {getCurrentSortLabel()}
                        <span className="flex items-center ml-2">
                            {getSortIcon(currentSort.field)}
                        </span>
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-full min-w-[200px]">
                <DropdownMenuLabel>Sort Contracts</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                    {sortOptions.map(option => (<DropdownMenuItem
                        key={option.field}
                        onClick={() => handleSortSelect(option.field)}
                        className="flex justify-between cursor-pointer">
                        <span>{option.label}</span>
                        {getSortIcon(option.field)}
                    </DropdownMenuItem>))}
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default SortDropdown;