import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
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

  if (loading) return <div className="p-6">Loading campaigns…</div>;

  if (error) return <div className="p-6 text-red-500">{error}</div>;

  if (campaigns.length === 0) {
    return <div className="p-6">No active campaigns right now.</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Active Campaigns</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((c) => (
          <div key={c.id} className="border rounded-lg p-5">
            <h2 className="text-lg font-semibold">{c.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {c.description}
            </p>

            <div className="mt-3 text-sm">
              <div><strong>Platform:</strong> {c.platform}</div>
              <div><strong>Reward:</strong> ${c.reward_value}</div>
              <div><strong>Ends:</strong> {new Date(c.end_date).toDateString()}</div>
            </div>

            {c.quote && (
              <blockquote className="mt-3 italic text-sm text-muted-foreground">
                “{c.quote}”
              </blockquote>
            )}

            {user ? (
              <button
                className="mt-4 w-full rounded bg-black text-white py-2 hover:opacity-90"
                onClick={() => {
                  console.log("Join campaign:", c.id);
                }}
              >
                Join Campaign
              </button>
            ) : (
              <button
                className="mt-4 w-full rounded border py-2"
                onClick={() => {
                  window.location.href = "/auth";
                }}
              >
                Sign in to Join
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
