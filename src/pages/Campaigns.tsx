
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import type { Campaign } from "@/types";

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  useEffect(() => {
    const fetchCampaigns = async () => {
      setLoading(true);
      setError(null);

      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("status", "active")
        .lte("start_date", today)
        .gte("end_date", today)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("SUPABASE ERROR 👉", error);
        setError(error.message);
        setCampaigns([]);
      } else {
        setCampaigns(data ?? []);
      }

      setLoading(false);
    };

    fetchCampaigns();
  }, []);

  const getPlatformClass = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'tiktok': return 'platform-tiktok';
      case 'linkedin': return 'platform-linkedin';
      case 'youtube': return 'platform-youtube';
      case 'instagram': return 'platform-instagram';
      default: return 'bg-primary';
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 pb-20 flex-1">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground">Active Campaigns</h1>
          <p className="text-muted-foreground mt-2">
            Join campaigns and start earning rewards for your content
          </p>
        </motion.div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {!loading && error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && campaigns.length === 0 && (
          <div className="text-center py-20">
            <div className="text-muted-foreground text-lg">No active campaigns right now.</div>
            <p className="text-sm text-muted-foreground mt-2">Check back later for new opportunities!</p>
          </div>
        )}

        {!loading && !error && campaigns.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-card border border-border rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300"
              >
                {/* Platform Badge Header */}
                <div className={`${getPlatformClass(campaign.platform)} px-4 py-3`}>
                  <span className="text-white font-semibold text-sm uppercase tracking-wide">
                    {campaign.platform}
                  </span>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h2 className="text-xl font-semibold text-card-foreground group-hover:text-primary transition-colors">
                    {campaign.title}
                  </h2>
                  
                  {campaign.description && (
                    <p className="text-muted-foreground text-sm mt-2 line-clamp-2">
                      {campaign.description}
                    </p>
                  )}

                  {/* Stats */}
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {campaign.budget && (
                      <div className="bg-secondary/50 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">Budget</div>
                        <div className="text-lg font-bold text-primary">${campaign.budget.toLocaleString()}</div>
                      </div>
                    )}
                    {campaign.cpm_rate && (
                      <div className="bg-secondary/50 rounded-lg p-3">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">CPM Rate</div>
                        <div className="text-lg font-bold text-accent">${campaign.cpm_rate}</div>
                      </div>
                    )}
                  </div>

                  {/* Dates */}
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Ends {new Date(campaign.end_date).toLocaleDateString()}</span>
                    <span className="px-2 py-1 bg-success/10 text-success rounded-full font-medium">
                      {campaign.status}
                    </span>
                  </div>

                  {/* CTA Button */}
            {user ? (
              <button
                className="mt-5 w-full gradient-primary text-primary-foreground font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity glow-primary"
                onClick={() => {
                  window.location.href = `/campaigns/${campaign.id}`;
                }}
              >
                      Join Campaign
                    </button>
                  ) : (
                    <button
                      className="mt-5 w-full border-2 border-primary text-primary font-semibold py-3 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => {
                        window.location.href = "/auth";
                      }}
                    >
                      Sign in to Join
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
