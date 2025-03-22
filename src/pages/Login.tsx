
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import PageTransition from "@/components/layout/PageTransition";

const Login = () => {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await signInWithGoogle();
      toast.success("Logged in successfully");
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
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
            <div className="space-y-4">
              <Button 
                type="button" 
                className="w-full"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in with Google"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default Login;
