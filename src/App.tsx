import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { PasswordChangeRequiredRoute } from "@/components/auth/PasswordChangeRequiredRoute";
import RoleLoadingOverlay from "@/components/ui/role-loading-overlay";
import Index from "./pages/Index";
import Contracts from "./pages/Contracts";
import ContractDetail from "./pages/ContractDetail";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import MakeAdmin from "./pages/MakeAdmin";
import Profile from "./pages/Profile";
import SystemSettings from "./pages/SystemSettings";
import AdminTools from "./pages/AdminTools";
import FirstTimeSetup from "./pages/FirstTimeSetup";
import Inbox from "./pages/Inbox";
const queryClient = new QueryClient();

const App = () => (<QueryClientProvider client={queryClient}>
    <AuthProvider>
        <NotificationProvider>
            <TooltipProvider>
                {}
                <Toaster />
                {}
                <Sonner position="top-right" expand={false} closeButton={true} />
                <RoleLoadingOverlay />
                <BrowserRouter>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/first-time-setup" element={<FirstTimeSetup />} />
                        {}
                        <Route path="/make-admin" element={<MakeAdmin />} />
                        <Route element={<PrivateRoute />}>
                            <Route element={<PasswordChangeRequiredRoute />}>
                                <Route path="/" element={<Index />} />
                                <Route path="/contracts" element={<Contracts />} />
                                <Route path="/contract/:id" element={<ContractDetail />} />
                                <Route path="/profile" element={<Profile />} />
                                <Route path="/inbox" element={<Inbox />} />
                            </Route>
                        </Route>
                        <Route element={<AdminRoute />}>
                            <Route element={<PasswordChangeRequiredRoute />}>
                                <Route path="/admin" element={<Admin />} />
                                <Route path="/system-settings" element={<SystemSettings />} />
                                <Route path="/admin-tools" element={<AdminTools />} />
                            </Route>
                        </Route>
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </BrowserRouter>
            </TooltipProvider>
        </NotificationProvider>
    </AuthProvider>
</QueryClientProvider>);

export default App;