import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import PageTransition from "@/components/layout/PageTransition";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { updateUserProfile, updatePasswordChangeRequired } from "@/lib/data";
import { updatePassword } from "firebase/auth";

const FirstTimeSetup = () => {
    const {
        currentUser,
        passwordChangeRequired,
        updatePasswordChangeRequiredState
    } = useAuth();

    const navigate = useNavigate();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        if (currentUser && !passwordChangeRequired && email) {
            navigate("/");
        }

        if (currentUser) {
            const displayNameValue = currentUser.displayName || "";
            const nameParts = displayNameValue.split(" ");
            setFirstName(nameParts[0] || "");
            setLastName(nameParts.slice(1).join(" ") || "");
            setEmail(currentUser.email || "");
        }
    }, [currentUser, passwordChangeRequired, navigate, email]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser || !currentUser.email) {
            setError("You must be logged in to complete this setup");
            return;
        }

        if (!firstName.trim()) {
            setError("First name is required");
            return;
        }

        if (!lastName.trim()) {
            setError("Last name is required");
            return;
        }

        if (!newPassword) {
            setError("New password is required");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);
            const newDisplayName = `${firstName} ${lastName}`.trim();
            await updateUserProfile(currentUser.uid, firstName, lastName, newDisplayName);

            try {
                await updatePassword(currentUser, newPassword);
                await updatePasswordChangeRequired(currentUser.email, false);
                updatePasswordChangeRequiredState(false);
                toast.success("Setup completed successfully!");

                navigate("/", {
                    replace: true
                });
            } catch (passwordError: any) {
                if (passwordError.code === "auth/requires-recent-login") {
                    setError(
                        "Your login session has expired. Please log out and log in again to change your password."
                    );
                } else {
                    setError(`Failed to update password: ${passwordError.message || "Unknown error"}`);

                    try {
                        await updatePasswordChangeRequired(currentUser.email, false);
                        updatePasswordChangeRequiredState(false);

                        toast.warning(
                            "Your profile was updated, but password change failed. You can change your password later in the Profile page."
                        );

                        navigate("/", {
                            replace: true
                        });
                    } catch (flagError) {}
                }
            }
        } catch (error) {
            setError("Failed to complete setup. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <PageTransition>
            <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <div className="flex justify-center mb-4">
                            <img src="/wwf-4.svg" alt="WWF Logo" className="h-16 w-16" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-center">Complete Your Account Setup</CardTitle>
                        <CardDescription className="text-center">Please set up your profile and create a new password to continue
                                                                                                </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {error && (<Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>)}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" type="email" value={email} disabled className="bg-muted" />
                                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        id="firstName"
                                        value={firstName}
                                        onChange={e => setFirstName(e.target.value)}
                                        required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        value={lastName}
                                        onChange={e => setLastName(e.target.value)}
                                        required />
                                </div>
                            </div>
                            {}
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    required />
                            </div>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? "Saving..." : "Complete Setup"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </PageTransition>
    );
};

export default FirstTimeSetup;