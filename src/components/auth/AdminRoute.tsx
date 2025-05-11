import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export const AdminRoute = () => {
    const {
        currentUser,
        isAdmin,
        loading,
        roleCheckLoading
    } = useAuth();

    if (loading || roleCheckLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Verifying permissions...</p>
                </div>
            </div>
        );
    }

    return currentUser && isAdmin ? <Outlet /> : <Navigate to="/" />;
};