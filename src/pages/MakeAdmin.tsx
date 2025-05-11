import { useState } from "react";
import { addAdminUser } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import AuthNavbar from "@/components/layout/AuthNavbar";
import PageTransition from "@/components/layout/PageTransition";

const MakeAdmin = () => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);

    const {
        currentUser
    } = useAuth();

    if (!currentUser) {
        return <Navigate to="/login" />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email)
            return;

        try {
            setLoading(true);
            await addAdminUser(email);
            toast.success(`${email} has been made an admin`);
            setEmail("");
        } catch (error) {
            toast.error("Failed to make user an admin");
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageTransition>
            <AuthNavbar />
            <div className="container mx-auto p-4 sm:p-6">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Make Admin</h1>
                    <p className="text-muted-foreground">Add a user to the admin collection
                                                                                  </p>
                </header>
                <Card className="max-w-lg mx-auto">
                    <CardHeader>
                        <CardTitle>Make User an Admin</CardTitle>
                        <CardDescription>Enter the email of the user you want to make an admin
                                                                                                </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    type="email"
                                    placeholder="user@example.com"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required />
                            </div>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Processing..." : "Make Admin"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </PageTransition>
    );
};

export default MakeAdmin;