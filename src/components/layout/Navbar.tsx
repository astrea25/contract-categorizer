import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { FileText, Home, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Navbar = () => {
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const routes = [{
        path: "/",
        label: "Dashboard",
        icon: Home
    }, {
        path: "/contracts",
        label: "Contracts",
        icon: FileText
    }];

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    return (
        <nav
            className="sticky top-0 z-40 w-full backdrop-blur-md bg-background/80 border-b">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex items-center">
                        <Link to="/" className="flex items-center gap-2">
                            <img src="/wwf-4.svg" alt="WWF Logo" className="h-8 w-8" />
                            <span className="text-primary font-bold text-xl">Contracts</span>
                        </Link>
                    </div>
                    {}
                    <div className="hidden md:flex items-center space-x-4">
                        {routes.map(route => {
                            const isActive = location.pathname === route.path;

                            return (
                                <Link
                                    key={route.path}
                                    to={route.path}
                                    className={cn(
                                        "px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ease-in-out flex items-center gap-2",
                                        isActive ? "bg-primary/10 text-primary" : "text-foreground/70 hover:text-foreground hover:bg-accent"
                                    )}>
                                    <route.icon size={16} />
                                    {route.label}
                                </Link>
                            );
                        })}
                    </div>
                    {}
                    <div className="md:hidden">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleMobileMenu}
                            aria-label="Toggle menu">
                            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </Button>
                    </div>
                </div>
            </div>
            {}
            {mobileMenuOpen && (<div className="md:hidden animate-slide-in">
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 glass rounded-lg m-2">
                    {routes.map(route => {
                        const isActive = location.pathname === route.path;

                        return (
                            <Link
                                key={route.path}
                                to={route.path}
                                className={cn(
                                    "block px-3 py-2 rounded-md text-base font-medium transition-colors duration-150 ease-in-out flex items-center gap-2",
                                    isActive ? "bg-primary/10 text-primary" : "text-foreground/70 hover:text-foreground hover:bg-accent"
                                )}
                                onClick={() => setMobileMenuOpen(false)}>
                                <route.icon size={18} />
                                {route.label}
                            </Link>
                        );
                    })}
                </div>
            </div>)}
        </nav>
    );
};

export default Navbar;