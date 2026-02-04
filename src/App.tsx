import { Route, Routes } from "react-router-dom";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Campaigns from "@/pages/Campaigns";
import CampaignDetail from "@/pages/CampaignDetail";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";
import Leaderboard from "@/pages/Leaderboard";
import NotFound from "@/pages/NotFound";
import OAuthCallback from "@/pages/OAuthCallback";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/campaigns/:id" element={<CampaignDetail />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/auth/linkedin/callback" element={<OAuthCallback />} />
        <Route path="/auth/tiktok/callback" element={<OAuthCallback />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
