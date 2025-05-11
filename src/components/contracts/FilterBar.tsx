import { Search, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContractStatus, ContractType, contractTypeLabels } from "@/lib/data";
import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, isValid } from "date-fns";
import SortDropdown, { SortOption } from "./SortDropdown";

interface FilterBarProps {
    filters?: {
        search: string;
        status: ContractStatus | "all";
        type: ContractType | "all";
        project: string;
        owner: string;
        party: string;
        dateRange: {
            from: Date | null;
            to: Date | null;
        };
    };
    onFilterChange: (
        filters: {
            search: string;
            status: ContractStatus | "all";
            type: ContractType | "all";
            project: string;
            owner: string;
            party: string;
            dateRange: {
                from: Date | null;
                to: Date | null;
            };
        }
    ) => void;
    currentSort: SortOption;
    onSortChange: (sort: SortOption) => void;
    className?: string;
}

const safeFormatDate = (date: Date | null, formatStr: string): string => {
    if (!date)
        return "Select date";

    try {
        if (!isValid(date)) {
            return "Select date";
        }

        return format(date, formatStr);
    } catch (error) {
        return "Select date";
    }
};

const FilterBar = (
    {
        filters,
        onFilterChange,
        currentSort,
        onSortChange,
        className
    }: FilterBarProps
) => {
    const [search, setSearch] = useState(filters?.search || "");
    const [status, setStatus] = useState<ContractStatus | "all">(filters?.status || "all");
    const [type, setType] = useState<ContractType | "all">(filters?.type || "all");
    const [project, setProject] = useState(filters?.project || "");
    const [owner, setOwner] = useState(filters?.owner || "");
    const [party, setParty] = useState(filters?.party || "");

    const [dateRange, setDateRange] = useState<{
        from: Date | null;
        to: Date | null;
    }>(filters?.dateRange || {
        from: null,
        to: null
    });

    useEffect(() => {
        if (filters) {
            setSearch(filters.search);
            setStatus(filters.status);
            setType(filters.type);
            setProject(filters.project);
            setOwner(filters.owner);
            setParty(filters.party);
            setDateRange(filters.dateRange);
        }
    }, [filters]);

    useEffect(() => {
        const handler = setTimeout(() => {
            onFilterChange({
                search,
                status,
                type,
                project,
                owner,
                party,
                dateRange
            });
        }, 300);

        return () => {
            clearTimeout(handler);
        };
    }, [search, status, type, project, owner, party, dateRange, onFilterChange]);

    return (
        <div className={`space-y-6 ${className}`}>
            <div className="relative">
                <Search
                    size={18}
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search contracts..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-10" />
            </div>
            {}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="owner">Owner</Label>
                    <Input
                        id="owner"
                        placeholder="Filter by owner"
                        value={owner}
                        onChange={e => setOwner(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="party">Contract Party</Label>
                    <Input
                        id="party"
                        placeholder="Filter by contract party"
                        value={party}
                        onChange={e => setParty(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Date Range</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <Calendar className="mr-2 h-4 w-4" />
                                {dateRange.from ? (dateRange.to ? (<>
                                    {safeFormatDate(dateRange.from, "PPP")}- {safeFormatDate(dateRange.to, "PPP")}
                                </>) : (safeFormatDate(dateRange.from, "PPP"))) : (<span>Select date range</span>)}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange.from ?? undefined}
                                selected={{
                                    from: dateRange.from,
                                    to: dateRange.to
                                }}
                                onSelect={range => {
                                    try {
                                        if (!range) {
                                            setDateRange({
                                                from: null,
                                                to: null
                                            });

                                            return;
                                        }

                                        let from = null;
                                        let to = null;

                                        if (range.from) {
                                            try {
                                                from = new Date(range.from.getTime());
                                                from.setHours(12, 0, 0, 0);

                                                if (!isValid(from)) {
                                                    from = null;
                                                }
                                            } catch (e) {
                                                from = null;
                                            }
                                        }

                                        if (range.to) {
                                            try {
                                                to = new Date(range.to.getTime());
                                                to.setHours(12, 0, 0, 0);

                                                if (!isValid(to)) {
                                                    to = null;
                                                }
                                            } catch (e) {
                                                to = null;
                                            }
                                        }

                                        setDateRange({
                                            from,
                                            to
                                        });
                                    } catch (error) {
                                        setDateRange({
                                            from: null,
                                            to: null
                                        });
                                    }
                                }}
                                numberOfMonths={2} />
                        </PopoverContent>
                    </Popover>
                </div>
            </div>
            {}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2 border-t">
                <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                        value={status}
                        onValueChange={value => setStatus(value as ContractStatus | "all")}>
                        <SelectTrigger id="status">
                            <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="requested">Requested</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="legal_review">Legal Review</SelectItem>
                            <SelectItem value="management_review">Management Review</SelectItem>
                            <SelectItem value="wwf_signing">WWF Signing</SelectItem>
                            <SelectItem value="counterparty_signing">Counterparty Signing</SelectItem>
                            <SelectItem value="implementation">Implementation</SelectItem>
                            <SelectItem value="amendment">Amendment</SelectItem>
                            <SelectItem value="contract_end">Contract End</SelectItem>
                            <SelectItem value="legal_send_back">Legal Send Back</SelectItem>
                            <SelectItem value="management_send_back">Management Send Back</SelectItem>
                            <SelectItem value="approval">Approval</SelectItem>
                            <SelectItem value="finished">Finished</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="type">Contract Type</Label>
                    <Select
                        value={type}
                        onValueChange={value => setType(value as ContractType | "all")}>
                        <SelectTrigger id="type">
                            <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            {Object.entries(contractTypeLabels).map(([key, label]) => (<SelectItem key={key} value={key}>
                                {label}
                            </SelectItem>))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="project">Project</Label>
                    <Input
                        id="project"
                        placeholder="Filter by project"
                        value={project}
                        onChange={e => setProject(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="sort">Sort By</Label>
                    <SortDropdown currentSort={currentSort} onSortChange={onSortChange} />
                </div>
            </div>
        </div>
    );
};

export default FilterBar;