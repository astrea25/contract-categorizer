import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { doesUserExist } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email) {
            setError("Please enter your email address");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const userExists = await doesUserExist(email);

            if (!userExists) {
                setError("No account found with this email address");
                setIsSubmitting(false);
                return;
            }

            const auth = getAuth();
            await sendPasswordResetEmail(auth, email);
            setSuccess(true);

            toast({
                title: "Reset email sent",
                description: "Check your inbox for password reset instructions"
            });
        } catch (error: any) {
            if (error.code === "auth/user-not-found") {
                setError("No account found with this email address");
            } else if (error.code === "auth/invalid-email") {
                setError("Invalid email address");
            } else if (error.code === "auth/too-many-requests") {
                setError("Too many requests. Please try again later");
            } else {
                setError("Failed to send password reset email. Please try again later");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-center">Reset Password</CardTitle>
                    <CardDescription className="text-center">Enter your email address and we'll send you a link to reset your password
                                                                                  </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (<Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>)}
                    {success ? (<div className="text-center space-y-4">
                        <div className="rounded-full bg-green-100 p-3 mx-auto w-fit">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6 text-green-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Check your email</h3>
                        <p className="text-sm text-gray-500">We've sent a password reset link to <span className="font-medium">{email}</span>
                        </p>
                        <p className="text-sm text-gray-500">Didn't receive the email? Check your spam folder or try again.
                                                                                                  </p>
                    </div>) : (<form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email address
                                                                                                                </label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                                className="w-full" />
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Sending..." : "Send Reset Link"}
                        </Button>
                    </form>)}
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Link
                        to="/login"
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                        <ArrowLeft className="h-4 w-4 mr-1" />Back to login
                                                                                  </Link>
                </CardFooter>
            </Card>
        </div>
    );
};

export default ForgotPassword;