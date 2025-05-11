import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import PageTransition from "@/components/layout/PageTransition";
import AuthNavbar from "@/components/layout/AuthNavbar";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

import {
    getSystemSettings,
    updateSystemSettings,
    SystemSettings,
    DEFAULT_SYSTEM_SETTINGS,
    processAutomaticContractDeletion,
} from "@/lib/data";

import { AlertTriangle } from "lucide-react";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const SystemSettingsPage = () => {
    const {
        currentUser,
        isAdmin
    } = useAuth();

    const navigate = useNavigate();
    const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [processingDeletion, setProcessingDeletion] = useState(false);
    const [isForceDeleteDialogOpen, setIsForceDeleteDialogOpen] = useState(false);

    useEffect(() => {
        if (!loading && currentUser && !isAdmin) {
            navigate("/");
        }
    }, [currentUser, isAdmin, loading, navigate]);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                setLoading(true);
                const systemSettings = await getSystemSettings();
                setSettings(systemSettings);
            } catch (error) {
                toast({
                    title: "Error",
                    description: "Failed to load system settings",
                    variant: "destructive"
                });
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleSaveSettings = async () => {
        if (!currentUser) {
            return;
        }

        try {
            setSaving(true);
            const retentionDays = Math.max(1, settings.archiveRetentionDays);

            await updateSystemSettings({
                archiveRetentionDays: retentionDays,
                autoDeleteEnabled: settings.autoDeleteEnabled
            }, {
                email: currentUser.email || "",
                displayName: currentUser.displayName
            });

            toast({
                title: "Settings Saved",
                description: "System settings have been updated successfully"
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to save system settings",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    const handleProcessDeletion = async () => {
        if (!currentUser) {
            return;
        }

        try {
            setProcessingDeletion(true);
            const deletedCount = await processAutomaticContractDeletion();

            toast({
                title: "Deletion Complete",
                description: `${deletedCount} archived contracts were permanently deleted`
            });

            window.location.reload();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to process contract deletion",
                variant: "destructive"
            });
        } finally {
            setProcessingDeletion(false);
        }
    };

    const handleForceDeleteAll = async () => {
        if (!currentUser) {
            return;
        }

        try {
            setProcessingDeletion(true);
            const deletedCount = await processAutomaticContractDeletion(true);

            toast({
                title: "Force Deletion Complete",
                description: `${deletedCount} archived contracts were permanently deleted`
            });

            setIsForceDeleteDialogOpen(false);
            window.location.reload();
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to process force deletion",
                variant: "destructive"
            });
        } finally {
            setProcessingDeletion(false);
        }
    };

    const handleRetentionDaysChange = (value: string) => {
        const numValue = parseInt(value, 10);

        if (!isNaN(numValue)) {
            setSettings({
                ...settings,
                archiveRetentionDays: numValue
            });
        } else if (value === "") {
            setSettings({
                ...settings,
                archiveRetentionDays: 0
            });
        }
    };

    const handleToggleAutoDelete = (checked: boolean) => {
        setSettings({
            ...settings,
            autoDeleteEnabled: checked
        });
    };

    return (
        <PageTransition>
            <AuthNavbar />
            <div className="container mx-auto py-6 space-y-6">
                <header className="space-y-2">
                    <h1 className="text-3xl font-bold">System Settings</h1>
                    <p className="text-muted-foreground">Configure system-wide settings and maintenance options
                                                                                  </p>
                </header>
                {loading ? (<Card>
                    <CardContent className="pt-6">
                        <p>Loading settings...</p>
                    </CardContent>
                </Card>) : (<>
                    <Card>
                        <CardHeader>
                            <CardTitle>Contract Archive Management</CardTitle>
                            <CardDescription>Configure how long archived contracts are retained before permanent deletion
                                                                                                                </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="auto-delete">Automatic Deletion
                                                                                                                                                          </Label>
                                        <p className="text-sm text-muted-foreground">Automatically delete archived contracts after the retention period
                                                                                                                                                          </p>
                                    </div>
                                    <Switch
                                        id="auto-delete"
                                        checked={settings.autoDeleteEnabled}
                                        onCheckedChange={handleToggleAutoDelete} />
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <Label htmlFor="retention-days">Retention Period (Days)</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            id="retention-days"
                                            type="number"
                                            min="1"
                                            value={settings.archiveRetentionDays}
                                            onChange={e => handleRetentionDaysChange(e.target.value)}
                                            disabled={!settings.autoDeleteEnabled}
                                            className="w-24" />
                                        <span className="text-sm text-muted-foreground">days</span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">Archived contracts will be permanently deleted after this many days
                                                                                                                                            </p>
                                </div>
                                <div className="pt-4 flex flex-wrap gap-4">
                                    <Button onClick={handleSaveSettings} disabled={saving}>
                                        {saving ? "Saving..." : "Save Settings"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={handleProcessDeletion}
                                        disabled={processingDeletion || !settings.autoDeleteEnabled}>
                                        {processingDeletion ? "Processing..." : "Run Deletion Process Now"}
                                    </Button>
                                    <AlertDialog open={isForceDeleteDialogOpen} onOpenChange={setIsForceDeleteDialogOpen}>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" disabled={processingDeletion}>Force Delete All Archived
                                                                                                                                                                        </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="flex items-center gap-2">
                                                    <AlertTriangle className="h-5 w-5 text-destructive" />Force Delete All Archived Contracts
                                                                                                                                                                                      </AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    <p className="mb-4">This will immediately and permanently delete ALL archived contracts, 
                                                                                                                                                                                                      regardless of when they were archived or the retention period.
                                                                                                                                                                                                    </p>
                                                    <p className="font-semibold text-destructive">This action cannot be undone. Are you sure you want to proceed?
                                                                                                                                                                                                    </p>
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    onClick={handleForceDeleteAll}
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                                    {processingDeletion ? "Processing..." : "Yes, Delete All Archived"}
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Retention Information</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <p className="text-sm">
                                    <strong>Current Status:</strong>{" "}
                                    {settings.autoDeleteEnabled ? `Archived contracts will be permanently deleted after ${settings.archiveRetentionDays} days` : "Automatic deletion of archived contracts is disabled"}
                                </p>
                                <p className="text-sm text-muted-foreground">Note: Permanently deleted contracts cannot be recovered. Make sure any important contract data 
                                                                                                                                is exported or stored elsewhere before the retention period expires.
                                                                                                                              </p>
                            </div>
                        </CardContent>
                    </Card>
                </>)}
            </div>
        </PageTransition>
    );
};

export default SystemSettingsPage;