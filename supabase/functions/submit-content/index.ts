import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }

  const { content_url, campaign_id } = await req.json();

  // 1. Validate URL and determine platform
  let platform;
  if (content_url.includes("tiktok.com")) {
    platform = "tiktok";
  } else if (content_url.includes("linkedin.com")) {
    platform = "linkedin";
  } else {
    return new Response(JSON.stringify({ error: "Invalid URL. Please submit a TikTok or LinkedIn URL." }), { status: 400, headers: { "Content-Type": "application/json" } });
  }

  // 2. Extract post ID from URL (basic implementation)
  // This will need to be made more robust
  const postId = content_url.split("/").pop();

  // 3. Fetch campaign details to get start and end dates
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("start_date, end_date")
    .eq("id", campaign_id)
    .single();

  if (campaignError) {
    return new Response(JSON.stringify({ error: "Failed to fetch campaign details" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  // 4. Fetch content from platform API to validate
  // This is a placeholder and needs to be implemented with actual API calls
  let contentData;
  if (platform === "tiktok") {
    // TODO: Implement TikTok API call to fetch video data
    // and validate post date against campaign dates
  } else if (platform === "linkedin") {
    // TODO: Implement LinkedIn API call to fetch post data
    // and validate post date against campaign dates
  }

  // 5. Insert into submissions table
  const { data: submission, error: submissionError } = await supabase
    .from("submissions")
    .insert([
      {
        campaign_id: campaign_id,
        creator_id: user.id,
        content_url: content_url,
        content_platform: platform,
        post_id: postId,
        // other fields...
      },
    ])
    .single();

  if (submissionError) {
    return new Response(JSON.stringify({ error: "Failed to create submission" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  return new Response(JSON.stringify({ submission }), {
    headers: { "Content-Type": "application/json" },
  });
});
