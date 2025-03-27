
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import Index from "./pages/Index";
import Contracts from "./pages/Contracts";
import ContractDetail from "./pages/ContractDetail";
import AcceptInvite from "./pages/AcceptInvite";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            
            <Route element={<PrivateRoute />}>
              <Route path="/" element={<Index />} />
              <Route path="/contracts" element={<Contracts />} />
              <Route path="/contract/:id" element={<ContractDetail />} />
              <Route path="/accept-invite/:inviteId" element={<AcceptInvite />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
