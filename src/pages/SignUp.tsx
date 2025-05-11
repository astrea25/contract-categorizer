import { useState, useEffect } from "react";
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
import { z } from "zod";

const signUpSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters long")
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
});

const SignUp = () => {
    const {
        signUpWithEmail,
        currentUser,
        error: authError
    } = useAuth();

    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [validationError, setValidationError] = useState<string | null>(null);

    useEffect(() => {
        if (currentUser) {
            navigate("/");
        }
    }, [currentUser, navigate]);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        try {
            const validationResult = signUpSchema.safeParse({
                firstName,
                lastName,
                email,
                password,
                confirmPassword
            });

            if (!validationResult.success) {
                const error = validationResult.error.errors[0];
                setValidationError(error.message);
                return;
            }

            setIsLoading(true);
            await signUpWithEmail(email, password, firstName, lastName);
            toast.success("Account created successfully!");
        } catch (error: any) {} finally {
            setIsLoading(false);
        }
    };

    return (
        <PageTransition>
            <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
                        <p className="text-sm text-muted-foreground">Enter your details to sign up for an account
                                                                                                </p>
                    </CardHeader>
                    <CardContent>
                        {(authError || validationError) && (<Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{authError || validationError}</AlertDescription>
                        </Alert>)}
                        <form onSubmit={handleSignUp} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        id="firstName"
                                        placeholder="John"
                                        value={firstName}
                                        onChange={e => setFirstName(e.target.value)}
                                        required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        placeholder="Smith"
                                        value={lastName}
                                        onChange={e => setLastName(e.target.value)}
                                        required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    required />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? "Creating Account..." : "Sign Up"}
                            </Button>
                            <div className="text-center text-sm">Already have an account?{" "}
                                <Link
                                    to="/login"
                                    className="font-medium text-primary underline-offset-4 hover:underline">Sign In
                                                                                                                            </Link>
                            </div>
                            <div className="text-xs text-muted-foreground mt-4">
                                <p className="text-center font-medium">This is an invitation-only application.
                                                                                                                            </p>
                                <p className="text-center mt-1">You can only sign up if you've been invited by an administrator.
                                                                                                                            </p>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </PageTransition>
    );
};

export default SignUp;