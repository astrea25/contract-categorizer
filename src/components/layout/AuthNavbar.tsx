import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Menu, X, Shield, Inbox as InboxIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import UserRoleBadge from "@/components/ui/UserRoleBadge";
import NotificationDropdown from "@/components/notifications/NotificationDropdown";

const AuthNavbar = () => {
    const {
        currentUser,
        signOut,
        isAdmin,
        isLegalTeam,
        isManagementTeam,
        userRole
    } = useAuth();

    const [isOpen, setIsOpen] = useState(false);

    const handleSignOut = async () => {
        try {
            await signOut();
            toast.success("Successfully signed out");
        } catch (error) {
            toast.error("Failed to sign out");
        }
    };

    const userDisplayName = currentUser?.displayName || currentUser?.email || "";

    return (
        <nav
            className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="flex h-16 justify-between">
                    <div className="flex">
                        <Link to="/" className="flex items-center gap-2">
                            <img src="/wwf-4.svg" alt="WWF Logo" className="h-8 w-8" />
                            <span className="font-semibold">Contract Management</span>
                        </Link>
                        {}
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link
                                to="/"
                                className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium hover:border-primary hover:text-foreground">Dashboard
                                                                                                              </Link>
                            <Link
                                to="/contracts"
                                className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium hover:border-primary hover:text-foreground">Contracts
                                                                                                              </Link>
                            <Link
                                to="/profile"
                                className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium hover:border-primary hover:text-foreground">Profile
                                                                                                              </Link>
                            {isAdmin && (<Link
                                to="/admin"
                                className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium hover:border-primary hover:text-foreground text-primary">
                                <Shield className="h-4 w-4 mr-1" />Admin
                                                                                                                </Link>)}
                        </div>
                    </div>
                    <div className="flex items-center">
                        <div className="hidden sm:flex sm:items-center sm:ml-6">
                            <div className="flex items-center space-x-4">
                                {currentUser && (<div className="flex items-center">
                                    <div className="flex items-center gap-4 mr-4">
                                        <NotificationDropdown />
                                        <Link
                                            to="/inbox"
                                            className="inline-flex items-center text-muted-foreground hover:text-foreground">
                                            <InboxIcon className="h-5 w-5" />
                                        </Link>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground">
                                                {userDisplayName}
                                            </span>
                                            <UserRoleBadge role={userRole} />
                                        </div>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={handleSignOut}>
                                        <LogOut className="h-4 w-4 mr-2" />Sign out
                                                                                                                                            </Button>
                                </div>)}
                            </div>
                        </div>
                        {}
                        <div className="flex items-center sm:hidden">
                            <button
                                className="text-foreground focus:outline-none"
                                onClick={() => setIsOpen(!isOpen)}>
                                {isOpen ? (<X className="h-6 w-6" />) : (<Menu className="h-6 w-6" />)}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {}
            {isOpen && (<div className="sm:hidden">
                <div className="space-y-1 pb-3 pt-2">
                    <Link
                        to="/"
                        className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium hover:border-primary hover:bg-muted hover:text-foreground"
                        onClick={() => setIsOpen(false)}>Dashboard
                                                                                    </Link>
                    <Link
                        to="/contracts"
                        className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium hover:border-primary hover:bg-muted hover:text-foreground"
                        onClick={() => setIsOpen(false)}>Contracts
                                                                                    </Link>
                    <Link
                        to="/profile"
                        className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium hover:border-primary hover:bg-muted hover:text-foreground"
                        onClick={() => setIsOpen(false)}>Profile
                                                                                    </Link>
                    <Link
                        to="/inbox"
                        className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium hover:border-primary hover:bg-muted hover:text-foreground"
                        onClick={() => setIsOpen(false)}>
                        <div className="flex items-center">
                            <InboxIcon className="h-4 w-4 mr-2" />Inbox
                                                                                                  </div>
                    </Link>
                    {isAdmin && (<Link
                        to="/admin"
                        className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium hover:border-primary hover:bg-muted hover:text-foreground text-primary"
                        onClick={() => setIsOpen(false)}>
                        <div className="flex items-center">
                            <Shield className="h-4 w-4 mr-2" />Admin
                                                                                                    </div>
                    </Link>)}
                    {currentUser && (<div className="border-t pt-4 pb-2">
                        <div className="px-4 py-2">
                            <div className="flex items-center gap-2">
                                <p className="text-sm text-muted-foreground">
                                    {userDisplayName}
                                </p>
                                <UserRoleBadge role={userRole} />
                            </div>
                            <Button
                                variant="ghost"
                                className="mt-2 w-full justify-start"
                                size="sm"
                                onClick={() => {
                                    handleSignOut();
                                    setIsOpen(false);
                                }}>
                                <LogOut className="h-4 w-4 mr-2" />Sign out
                                                                                                                  </Button>
                        </div>
                    </div>)}
                </div>
            </div>)}
        </nav>
    );
};

export default AuthNavbar;