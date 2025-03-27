import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PageTransition from "@/components/layout/PageTransition";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

const Login = () => {
  const { signInWithGoogle, currentUser, error: authError } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      // Navigation is handled by the useEffect when currentUser changes
    } catch (error: any) {
      if (error.code === 'auth/unauthorized-domain') {
        toast.error("This domain is not authorized for authentication");
      } else {
        toast.error("Failed to login with Google");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Contract Management</CardTitle>
            <p className="text-sm text-muted-foreground">
              Sign in to access your account
            </p>
          </CardHeader>
          <CardContent>
            {authError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-4">
              <Button 
                type="button" 
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in with Google"}
              </Button>
              
              <div className="text-xs text-muted-foreground mt-2">
                <p className="text-center">
                  Note: Only authorized users can access this application.
                  Contact your administrator if you need access.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default Login;
