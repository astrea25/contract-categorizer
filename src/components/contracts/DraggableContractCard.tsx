import { useState } from "react";
import { Contract } from "@/lib/data";
import ContractCard from "./ContractCard";
import { cn } from "@/lib/utils";

interface DraggableContractCardProps {
    contract: Contract;
    className?: string;
    onRemoveFromFolder?: (contractId: string) => void;
}

const DraggableContractCard = (
    {
        contract,
        className,
        onRemoveFromFolder
    }: DraggableContractCardProps
) => {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        e.dataTransfer.setData("text/plain", contract.id);
        e.dataTransfer.effectAllowed = "move";
        setIsDragging(true);
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            className={cn("transition-opacity", isDragging ? "opacity-50" : "opacity-100", className)}>
            <ContractCard contract={contract} onRemoveFromFolder={onRemoveFromFolder} />
        </div>
    );
};

export default DraggableContractCard;