import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );

  const { submission_id } = await req.json();

  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .select("id, content_platform, post_id, social_account_id")
    .eq("id", submission_id)
    .single();

  if (submissionError) {
    return new Response(JSON.stringify({ error: "Failed to fetch submission" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  const { data: socialAccount, error: accountError } = await supabase
    .from("social_accounts")
    .select("access_token")
    .eq("id", submission.social_account_id)
    .single();

  if (accountError) {
    return new Response(JSON.stringify({ error: "Failed to fetch social account" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  let metrics;
  if (submission.content_platform === "tiktok") {
    // TODO: Implement TikTok API call to fetch video metrics
  } else if (submission.content_platform === "linkedin") {
    // TODO: Implement LinkedIn API call to fetch post metrics
  }

  const { data: newMetrics, error: metricsError } = await supabase
    .from("metrics")
    .insert([
      {
        submission_id: submission.id,
        // metrics data...
      },
    ])
    .single();

  if (metricsError) {
    return new Response(JSON.stringify({ error: "Failed to insert metrics" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ metrics: newMetrics }), {
    headers: { "Content-Type": "application/json" },
  });
});
