import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Documents from "./pages/Documents";
import Login from "./pages/Login";
import ProductsPage from "./pages/ProductsPage";
import PricingPage from "./pages/PricingPage";
import FeaturesPage from "./pages/products/FeaturesPage";
import AIPage from "./pages/products/AIPage";
import SecurityPage from "./pages/products/SecurityPage";
import IntegrationsPage from "./pages/products/IntegrationsPage";
import AnalyticsPage from "./pages/products/AnalyticsPage";
import MobilePage from "./pages/products/MobilePage";
import ResourcesPage from "./pages/ResourcesPage";
import UserProfileSettings from "./pages/UserProfileSettings";
import Profile from "./pages/Profile";
import OrganizationSettings from "./pages/OrganizationSettings";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
        <Routes>
          <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/products/features" element={<FeaturesPage />} />
          <Route path="/products/ai" element={<AIPage />} />
          <Route path="/products/security" element={<SecurityPage />} />
          <Route path="/products/integrations" element={<IntegrationsPage />} />
          <Route path="/products/analytics" element={<AnalyticsPage />} />
          <Route path="/products/mobile" element={<MobilePage />} />
          <Route path="/resources" element={<ResourcesPage />} />
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/documents"
              element={
                <ProtectedRoute>
                  <Documents />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/settings"
              element={
                <ProtectedRoute>
                  <UserProfileSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/organization/settings"
              element={
                <ProtectedRoute>
                  <OrganizationSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/app/organization/members"
              element={
                <ProtectedRoute>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </TooltipProvider>
      </AuthProvider>
      </BrowserRouter>
  </QueryClientProvider>
);

export default App;
