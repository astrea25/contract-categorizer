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