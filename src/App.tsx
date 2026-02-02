import { Route, Routes } from "react-router-dom";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Settings from "@/pages/Settings";
import Campaigns from "@/pages/Campaigns";
import Submit from "@/pages/Submit";
import { AuthProvider } from "@/integrations/supabase/auth";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/campaigns/:id/submit" element={<Submit />} />
      </Routes>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
