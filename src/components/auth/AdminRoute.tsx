import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { isUserAdmin } from "@/lib/data";

export const AdminRoute = () => {
  const { currentUser, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [checkingAdmin, setCheckingAdmin] = useState<boolean>(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (currentUser?.email) {
        const admin = await isUserAdmin(currentUser.email);
        setIsAdmin(admin);
      }
      setCheckingAdmin(false);
    };

    if (!loading && currentUser) {
      checkAdminStatus();
    } else {
      setCheckingAdmin(false);
    }
  }, [currentUser, loading]);

  if (loading || checkingAdmin) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return currentUser && isAdmin ? <Outlet /> : <Navigate to="/" />;
}; 