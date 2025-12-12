import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import AppDashboard from "./pages/Index";
import ProductsPage from "./pages/ProductsPage";
import FeaturesPage from "./pages/products/FeaturesPage";
import AIPage from "./pages/products/AIPage";
import SecurityPage from "./pages/products/SecurityPage";
import IntegrationsPage from "./pages/products/IntegrationsPage";
import AnalyticsPage from "./pages/products/AnalyticsPage";
import MobilePage from "./pages/products/MobilePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/features" element={<FeaturesPage />} />
          <Route path="/products/ai" element={<AIPage />} />
          <Route path="/products/security" element={<SecurityPage />} />
          <Route path="/products/integrations" element={<IntegrationsPage />} />
          <Route path="/products/analytics" element={<AnalyticsPage />} />
          <Route path="/products/mobile" element={<MobilePage />} />
          <Route path="/app" element={<AppDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
