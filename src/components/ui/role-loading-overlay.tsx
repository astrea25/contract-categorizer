import React from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const RoleLoadingOverlay = () => {
    const {
        roleCheckLoading
    } = useAuth();

    if (!roleCheckLoading) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
            <div
                className="bg-card p-6 rounded-lg shadow-lg flex flex-col items-center space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="text-center">
                    <h3 className="font-medium text-lg">Loading user permissions</h3>
                    <p className="text-muted-foreground text-sm">Please wait while we verify your access...</p>
                </div>
            </div>
        </div>
    );
};

export default RoleLoadingOverlay;