import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import PageTransition from "@/components/layout/PageTransition";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

const Login = () => {
  const { signInWithGoogle, signInWithEmail, currentUser, error: authError } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      await signInWithEmail(email, password);
      // Navigation is handled by the useEffect when currentUser changes
    } catch (error: any) {
      // Error handling is done in AuthContext
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
            
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in with Email"}
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>
              
              <Button 
                type="button" 
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                variant="outline"
              >
                {isLoading ? "Signing in..." : "Sign in with Google"}
              </Button>
              
              <div className="text-center text-sm">
                Don't have an account?{" "}
                <Link to="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
                  Sign Up
                </Link>
              </div>
              
              <div className="text-xs text-muted-foreground mt-2">
                <p className="text-center font-medium">
                  This is an invitation-only application.
                </p>
                <p className="text-center mt-1">
                  You must be invited by an existing administrator to access the system.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default Login;
