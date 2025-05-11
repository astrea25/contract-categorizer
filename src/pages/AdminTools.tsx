import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { runContractDeletionTask, runInactivityNotificationTask } from "@/lib/scheduled-tasks";
import { useAuth } from "@/contexts/AuthContext";
import { isUserAdmin } from "@/lib/data";
import { useNavigate } from "react-router-dom";
import AuthNavbar from "@/components/layout/AuthNavbar";

const AdminTools = () => {
    const [isRunningInactivityCheck, setIsRunningInactivityCheck] = useState<boolean>(false);
    const [inactivityResult, setInactivityResult] = useState<string | null>(null);
    const [inactivityError, setInactivityError] = useState<string | null>(null);
    const [isRunningDeletion, setIsRunningDeletion] = useState<boolean>(false);
    const [deletionResult, setDeletionResult] = useState<string | null>(null);
    const [deletionError, setDeletionError] = useState<string | null>(null);

    const {
        currentUser
    } = useAuth();

    const navigate = useNavigate();

    React.useEffect(() => {
        const checkAdmin = async () => {
            if (!currentUser) {
                navigate("/login");
                return;
            }

            const admin = await isUserAdmin(currentUser.email);

            if (!admin) {
                navigate("/");
            }
        };

        checkAdmin();
    }, [currentUser, navigate]);

    const handleInactivityCheck = async () => {
        try {
            setIsRunningInactivityCheck(true);
            setInactivityResult(null);
            setInactivityError(null);
            const result = await runInactivityNotificationTask();

            if (result.success) {
                setInactivityResult(`Successfully sent ${result.notificationsSent} inactivity notifications.`);
            } else {
                setInactivityError(result.message);
            }
        } catch (error) {
            setInactivityError(`Error: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsRunningInactivityCheck(false);
        }
    };

    const handleContractDeletion = async () => {
        try {
            setIsRunningDeletion(true);
            setDeletionResult(null);
            setDeletionError(null);
            const result = await runContractDeletionTask();

            if (result.success) {
                setDeletionResult(`Successfully deleted ${result.deletedCount} expired archived contracts.`);
            } else {
                setDeletionError(result.message);
            }
        } catch (error) {
            setDeletionError(`Error: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsRunningDeletion(false);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <AuthNavbar />
            <div className="container mx-auto py-10">
                <h1 className="text-3xl font-bold mb-6">Admin Tools</h1>
                <Tabs defaultValue="inactivity">
                    <TabsList className="mb-4">
                        <TabsTrigger value="inactivity">Inactivity Notifications</TabsTrigger>
                        <TabsTrigger value="deletion">Contract Deletion</TabsTrigger>
                    </TabsList>
                    <TabsContent value="inactivity">
                        <Card>
                            <CardHeader>
                                <CardTitle>Contract Inactivity Check</CardTitle>
                                <CardDescription>Check for contracts that have been inactive for a specified number of business days and send notification emails.
                                                                                                                            </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <p className="text-sm">This tool checks for contracts that have been inactive for a specified number of <strong>business days</strong>(excluding weekends) and sends notification emails.
                                                                                                                                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            <strong>Role-based thresholds:</strong>
                                        </p>
                                        <ul className="text-sm text-muted-foreground list-disc pl-5">
                                            <li>For reviewers and approvers: 3 business days (72 hours)</li>
                                            <li>For all other users: 1 business day (24 hours)</li>
                                        </ul>
                                    </div>
                                    {inactivityResult && (<Alert className="bg-green-50 border-green-200">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <AlertTitle>Success</AlertTitle>
                                        <AlertDescription>{inactivityResult}</AlertDescription>
                                    </Alert>)}
                                    {inactivityError && (<Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{inactivityError}</AlertDescription>
                                    </Alert>)}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleInactivityCheck} disabled={isRunningInactivityCheck}>
                                    {isRunningInactivityCheck ? "Running..." : "Run Inactivity Check"}
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                    <TabsContent value="deletion">
                        <Card>
                            <CardHeader>
                                <CardTitle>Contract Deletion</CardTitle>
                                <CardDescription>Delete expired archived contracts based on system settings.
                                                                                                                            </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">This will permanently delete archived contracts that have been expired for the period specified in system settings.
                                                                                                                                          </p>
                                    {deletionResult && (<Alert className="bg-green-50 border-green-200">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <AlertTitle>Success</AlertTitle>
                                        <AlertDescription>{deletionResult}</AlertDescription>
                                    </Alert>)}
                                    {deletionError && (<Alert variant="destructive">
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{deletionError}</AlertDescription>
                                    </Alert>)}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    onClick={handleContractDeletion}
                                    disabled={isRunningDeletion}
                                    variant="destructive">
                                    {isRunningDeletion ? "Running..." : "Run Contract Deletion"}
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default AdminTools;