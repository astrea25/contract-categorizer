import { useState } from "react";
import { Folder, ChevronRight } from "lucide-react";

interface DroppableFolderProps {
    id: string;
    name: string;
    count: number;
    isSelected: boolean;
    onSelect: () => void;
    onDrop: (contractId: string) => void;
    icon?: React.ReactNode;
}

const DroppableFolder = (
    {
        id,
        name,
        count,
        isSelected,
        onSelect,
        onDrop,
        icon
    }: DroppableFolderProps
) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const contractId = e.dataTransfer.getData("text/plain");

        if (contractId) {
            onDrop(contractId);
        }
    };

    return (
        <div
            className={`p-3 flex items-center cursor-pointer transition-colors relative ${isSelected ? "bg-primary/10 text-primary border-l-4 border-primary pl-2" : isDragOver ? "bg-secondary/20" : ""} ${isDragOver ? "ring-2 ring-primary/50" : ""} hover:bg-secondary/30`}
            onClick={onSelect}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}>
            {icon || <Folder
                className={`h-4 w-4 mr-2 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />}
            <div className="flex-1">
                <span className={`font-medium ${isSelected ? "text-primary" : ""}`}>{name}</span>
            </div>
            <ChevronRight className={`h-4 w-4 ml-auto ${isSelected ? "text-primary" : ""}`} />
        </div>
    );
};

export default DroppableFolder;