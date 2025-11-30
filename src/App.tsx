import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./pages/Auth";
import ProviderDashboard from "./pages/ProviderDashboard";
import PatientDashboard from "./pages/PatientDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NewCase from "./pages/NewCase";
import AdminReports from "./pages/AdminReports";
import NotFound from "./pages/NotFound";
import AdminQuickActions from "./pages/AdminQuickActions";
import PatientDetail from "./pages/PatientDetail";
import AdminUserManagement from "./pages/AdminUserManagement";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Auth />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/provider" element={<ProviderDashboard />} />
          <Route path="/provider/cases/new" element={<NewCase />} />
          <Route path="/provider/patient/:patientId" element={<PatientDetail />} />
          <Route path="/patient" element={<PatientDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/actions" element={<AdminQuickActions />} />
          <Route path="/admin/users" element={<AdminUserManagement />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
