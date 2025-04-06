import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const AuthNavbar = () => {
  const { currentUser, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Successfully signed out");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  // Get user's display name or fall back to email
  const userDisplayName = currentUser?.displayName || currentUser?.email || '';

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex h-16 justify-between">
          <div className="flex">
            <Link to="/" className="flex items-center font-semibold">
              Contract Management
            </Link>
            
            {/* Desktop navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium hover:border-primary hover:text-foreground"
              >
                Dashboard
              </Link>
              <Link
                to="/contracts"
                className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium hover:border-primary hover:text-foreground"
              >
                Contracts
              </Link>
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {currentUser && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  {userDisplayName}
                </span>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign out
                </Button>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-background hover:text-foreground focus:outline-none"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isOpen && (
        <div className="sm:hidden">
          <div className="space-y-1 pb-3 pt-2">
            <Link
              to="/"
              className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium hover:border-primary hover:bg-muted hover:text-foreground"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              to="/contracts"
              className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium hover:border-primary hover:bg-muted hover:text-foreground"
              onClick={() => setIsOpen(false)}
            >
              Contracts
            </Link>
            {currentUser && (
              <div className="border-t pt-4 pb-2">
                <div className="px-4 py-2">
                  <p className="text-sm text-muted-foreground">
                    {userDisplayName}
                  </p>
                  <Button 
                    variant="ghost" 
                    className="mt-2 w-full justify-start" 
                    size="sm"
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default AuthNavbar;
