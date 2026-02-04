import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Sync TikTok Stats function booting up...");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: submissions, error: submissionsError } =
      await supabaseAdmin
        .from("submissions")
        .select("id, video_id, user_id")
        .eq("platform", "tiktok")
        .not("video_id", "is", null);

    if (submissionsError) throw submissionsError;

    console.log(`Found ${submissions.length} TikTok submissions`);

    for (const submission of submissions) {
      const { data: socialAccount } = await supabaseAdmin
        .from("social_accounts")
        .select("access_token")
        .eq("user_id", submission.user_id)
        .eq("platform", "tiktok")
        .single();

      if (!socialAccount?.access_token) {
        console.warn(
          `No TikTok account for user ${submission.user_id}, skipping`
        );
        continue;
      }

      const videoApiRes = await fetch(
        "https://open.tiktokapis.com/v2/video/query/?fields=view_count,like_count,comment_count,share_count",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${socialAccount.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filters: {
              video_ids: [submission.video_id],
            },
          }),
        }
      );

      if (!videoApiRes.ok) continue;

      const json = await videoApiRes.json();
      const videoStats = json?.data?.videos?.[0];
      if (!videoStats) continue;

      await supabaseAdmin
        .from("submissions")
        .update({
          view_count: videoStats.view_count ?? 0,
          like_count: videoStats.like_count ?? 0,
          comment_count: videoStats.comment_count ?? 0,
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", submission.id);

      console.log(`Updated stats for ${submission.video_id}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
