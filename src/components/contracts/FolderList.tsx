import { useState, useEffect } from "react";

import {
    Folder,
    getFolders,
    createFolder,
    renameFolder,
    getArchivedContracts,
    getUserArchivedContracts,
} from "@/lib/data";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from "@/components/ui/dialog";

import {
    FolderPlus,
    Pencil,
    MoreVertical,
    Trash2,
    Search,
    X,
    ChevronsRight,
    ChevronsLeft,
    Archive,
    ClipboardCheck,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import DroppableFolder from "./DroppableFolder";
import { cn } from "@/lib/utils";

interface FolderListProps {
    selectedFolder: string | "all" | "archive";
    onFolderSelect: (folderId: string | "all" | "archive") => void;
    onDeleteFolder: (folderId: string) => void;
    onDropContract: (contractId: string, folderId: string | null) => void;
}

const FolderList = (
    {
        selectedFolder,
        onFolderSelect,
        onDeleteFolder,
        onDropContract
    }: FolderListProps
) => {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);
    const [openNewFolder, setOpenNewFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState("");
    const [archivedCount, setArchivedCount] = useState(0);
    const [newFolderDesc, setNewFolderDesc] = useState("");
    const [folderToRename, setFolderToRename] = useState<Folder | null>(null);
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [renameFolderName, setRenameFolderName] = useState("");
    const [renameFolderDesc, setRenameFolderDesc] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const {
        currentUser,
        isLegalTeam,
        isManagementTeam
    } = useAuth();

    useEffect(() => {
        const loadFolders = async () => {
            try {
                setLoading(true);

                if (currentUser?.email) {
                    const folderList = await getFolders(currentUser.email);
                    setFolders(folderList);
                    const archivedContracts = await getUserArchivedContracts(currentUser.email);
                    setArchivedCount(archivedContracts.length);
                } else {
                    setFolders([]);
                    setArchivedCount(0);
                }
            } catch (error) {
                toast.error("Failed to load folders");
                setFolders([]);
            } finally {
                setLoading(false);
            }
        };

        loadFolders();
    }, [currentUser]);

    const handleCreateFolder = async () => {
        if (!newFolderName.trim() || !currentUser?.email) {
            return;
        }

        try {
            const newFolder = {
                name: newFolderName.trim(),
                description: newFolderDesc.trim(),
                createdBy: currentUser.email
            };

            await createFolder(newFolder);
            const updatedFolders = await getFolders(currentUser.email);
            setFolders(updatedFolders);
            setNewFolderName("");
            setNewFolderDesc("");
            setOpenNewFolder(false);
            toast.success("Folder created successfully");
        } catch (error) {
            toast.error("Failed to create folder");
        }
    };

    const handleRenameFolder = async () => {
        if (!folderToRename || !renameFolderName.trim()) {
            return;
        }

        try {
            await renameFolder(folderToRename.id, {
                name: renameFolderName.trim(),
                description: renameFolderDesc.trim()
            });

            if (currentUser?.email) {
                const updatedFolders = await getFolders(currentUser.email);
                setFolders(updatedFolders);
            }

            setFolderToRename(null);
            setRenameFolderName("");
            setRenameFolderDesc("");
            setRenameDialogOpen(false);
            toast.success("Folder renamed successfully");
        } catch (error) {
            toast.error("Failed to rename folder");
        }
    };

    const openRenameDialog = (folder: Folder, e: React.MouseEvent) => {
        e.stopPropagation();
        setFolderToRename(folder);
        setRenameFolderName(folder.name);
        setRenameFolderDesc(folder.description || "");
        setRenameDialogOpen(true);
    };

    const handleDelete = (folderId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onDeleteFolder(folderId);
    };

    const toggleExpanded = () => {
        setIsExpanded(!isExpanded);

        if (!isExpanded) {
            setTimeout(() => {
                const searchInput = document.getElementById("folder-search-input");

                if (searchInput) {
                    searchInput.focus();
                }
            }, 100);
        } else {
            setSearchQuery("");
        }
    };

    const clearSearch = () => {
        setSearchQuery("");
        document.getElementById("folder-search-input")?.focus();
    };

    const filteredFolders = folders.filter(
        folder => folder.name.toLowerCase().includes(searchQuery.toLowerCase()) || (folder.description && folder.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div
            className={cn(
                "border rounded-md overflow-hidden transition-all duration-300",
                isExpanded ? "md:col-span-2 lg:col-span-1 w-full" : ""
            )}>
            <div className="bg-secondary/50 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="font-medium">Folders</h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={toggleExpanded}
                        title={isExpanded ? "Collapse folders" : "Expand folders"}>
                        {isExpanded ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    {isExpanded && (<div className="relative flex-1 mr-2">
                        <Search
                            className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="folder-search-input"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search folders..."
                            className="w-full h-8 pl-8 pr-8 min-w-[200px]" />
                        {searchQuery && (<X
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground"
                            onClick={clearSearch} />)}
                    </div>)}
                    <Dialog open={openNewFolder} onOpenChange={setOpenNewFolder}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <FolderPlus className="h-4 w-4 mr-2" />
                                <span>New Folder</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Folder</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-sm font-medium">Folder Name
                                                                                                                                          </label>
                                    <Input
                                        id="name"
                                        value={newFolderName}
                                        onChange={e => setNewFolderName(e.target.value)}
                                        placeholder="Enter folder name" />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="description" className="text-sm font-medium">Description (Optional)
                                                                                                                                          </label>
                                    <Input
                                        id="description"
                                        value={newFolderDesc}
                                        onChange={e => setNewFolderDesc(e.target.value)}
                                        placeholder="Enter folder description" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setOpenNewFolder(false)}>Cancel
                                                                                                                            </Button>
                                <Button onClick={handleCreateFolder}>Create Folder</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                {}
                <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Rename Folder</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <label htmlFor="rename-name" className="text-sm font-medium">Folder Name
                                                                                                                            </label>
                                <Input
                                    id="rename-name"
                                    value={renameFolderName}
                                    onChange={e => setRenameFolderName(e.target.value)}
                                    placeholder="Enter folder name" />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="rename-description" className="text-sm font-medium">Description (Optional)
                                                                                                                            </label>
                                <Input
                                    id="rename-description"
                                    value={renameFolderDesc}
                                    onChange={e => setRenameFolderDesc(e.target.value)}
                                    placeholder="Enter folder description" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>Cancel
                                                                                                              </Button>
                            <Button onClick={handleRenameFolder}>Save Changes</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <div
                className={cn("divide-y", isExpanded && "max-h-[calc(100vh-12rem)] overflow-y-auto")}>
                <DroppableFolder
                    id="all"
                    name="All Contracts"
                    count={0}
                    isSelected={selectedFolder === "all"}
                    onSelect={() => onFolderSelect("all")}
                    onDrop={contractId => {}} />
                <DroppableFolder
                    id="archive"
                    name="Archive"
                    count={archivedCount}
                    icon={<Archive className="h-4 w-4 mr-2" />}
                    isSelected={selectedFolder === "archive"}
                    onSelect={() => onFolderSelect("archive")}
                    onDrop={contractId => {}} />
                {loading ? (<div className="p-3 text-center text-muted-foreground">Loading folders...</div>) : folders.length === 0 ? (<div className="p-3 text-center text-muted-foreground">No folders created yet</div>) : filteredFolders.length === 0 ? (<div className="p-3 text-center text-muted-foreground">No folders match your search</div>) : (filteredFolders.map(folder => (<div key={folder.id} className="relative">
                    <DroppableFolder
                        id={folder.id}
                        name={folder.name}
                        count={folder.contractCount || 0}
                        isSelected={selectedFolder === folder.id}
                        onSelect={() => onFolderSelect(folder.id)}
                        onDrop={contractId => onDropContract(contractId, folder.id)} />
                    <div className="absolute right-2 top-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={e => openRenameDialog(folder, e)}>
                                    <Pencil className="h-4 w-4 mr-2" />Rename
                                                                                                                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={e => handleDelete(folder.id, e)}>
                                    <Trash2 className="h-4 w-4 mr-2" />Delete
                                                                                                                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>)))}
            </div>
        </div>
    );
};

export default FolderList;