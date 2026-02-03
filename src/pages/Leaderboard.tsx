import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

interface LeaderboardRow {
  username: string;
  view_count: number;
  rank: number;
}

export default function Leaderboard() {
  const [data, setData] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);

   const { data, error } = await (supabase as any).rpc("get_creator_leaderboard");


    if (error) {
      console.error("RPC ERROR:", error);
      setError("Failed to load leaderboard");
    } else {
      setData((data ?? []) as LeaderboardRow[]);
    }

    setLoading(false);
  };

  const medal = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <div className="min-h-screen gradient-hero p-6">
      <div className="max-w-3xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-center mb-8"
        >
          Creator Leaderboard
        </motion.h1>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {loading && (
            <div className="p-6 text-center text-muted-foreground">
              Loading leaderboard...
            </div>
          )}

          {!loading && error && (
            <div className="p-6 text-center text-destructive">
              {error}
            </div>
          )}

          {!loading && !error && data.length === 0 && (
            <div className="p-6 text-center text-muted-foreground">
              No creators yet
            </div>
          )}

          {!loading && !error && data.length > 0 && (
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="p-4 text-left">Rank</th>
                  <th className="p-4 text-left">Creator</th>
                  <th className="p-4 text-right">Views</th>
                </tr>
              </thead>

              <tbody>
                {data.map((row, index) => (
                  <motion.tr
                    key={`${row.username}-${index}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-t border-border hover:bg-muted/40 transition"
                  >
                    <td className="p-4 font-semibold">
                      {medal(row.rank)}
                    </td>

                    <td className="p-4 font-medium">
                      {row.username}
                    </td>

                    <td className="p-4 text-right font-mono">
                      {row.view_count.toLocaleString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
