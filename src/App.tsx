import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import RoleLoadingOverlay from "@/components/ui/role-loading-overlay";
import Index from "./pages/Index";
import Contracts from "./pages/Contracts";
import ContractDetail from "./pages/ContractDetail";
// AcceptInvite import removed
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
// SignUp page removed
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import MakeAdmin from "./pages/MakeAdmin";
import Profile from "./pages/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RoleLoadingOverlay />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            {/* AcceptInvite route removed */}
            <Route path="/make-admin" element={<MakeAdmin />} />

            <Route element={<PrivateRoute />}>
              <Route path="/" element={<Index />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/contract/:id" element={<ContractDetail />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<Admin />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
