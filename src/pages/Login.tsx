
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PageTransition from "@/components/layout/PageTransition";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const Login = () => {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithGoogle();
      toast.success("Logged in successfully");
      navigate("/");
    } catch (error: any) {
      console.error("Login error:", error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/unauthorized-domain') {
        setError("This domain is not authorized for authentication. Please add it to your Firebase console's authorized domains list.");
      } else {
        setError("Failed to login with Google. Please try again.");
      }
      
      toast.error("Failed to login with Google");
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
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
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
                  Note: You need to add this domain to your Firebase authorized domains
                  in the Firebase console if you encounter authentication errors.
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
