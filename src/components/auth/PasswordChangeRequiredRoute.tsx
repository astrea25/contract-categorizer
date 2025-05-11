// If still loading, don't render anything yet
// If user is not logged in, redirect to login
// If user needs to change password, redirect to first-time setup
// Use React Router's Navigate component instead of window.location for a cleaner redirect
// Otherwise, render the child routes
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const PasswordChangeRequiredRoute = () => {
    const {
        currentUser,
        loading,
        passwordChangeRequired
    } = useAuth();

    const location = useLocation();

    if (loading) {
        return null;
    }

    if (!currentUser) {
        window.location.href = "/login";
        return null;
    }

    if (passwordChangeRequired) {
        return <Navigate to="/first-time-setup" replace />;
    }

    return <Outlet />;
};