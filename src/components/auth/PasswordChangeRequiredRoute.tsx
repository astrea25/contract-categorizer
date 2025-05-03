import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const PasswordChangeRequiredRoute = () => {
  const { currentUser, loading, passwordChangeRequired } = useAuth();
  const location = useLocation();

  // If still loading, don't render anything yet
  if (loading) {
    return null;
  }

  // If user is not logged in, redirect to login
  if (!currentUser) {
    console.log('PasswordChangeRequiredRoute: Redirecting to login');
    window.location.href = "/login";
    return null;
  }

  // If user needs to change password, redirect to first-time setup
  if (passwordChangeRequired) {
    console.log('PasswordChangeRequiredRoute: Redirecting to first-time setup');
    // Use React Router's Navigate component instead of window.location for a cleaner redirect
    return <Navigate to="/first-time-setup" replace />;
  }

  // Otherwise, render the child routes
  return <Outlet />;
};
