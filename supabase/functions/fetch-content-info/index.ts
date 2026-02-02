import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { submissionId, contentUrl, platform } = await req.json();

    if (!submissionId || !contentUrl || !platform) {
      return new Response(
        JSON.stringify({ error: "submissionId, contentUrl, platform required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let views = 0;
    let likes = 0;

    /* ========= TIKTOK ========= */
    if (platform === "tiktok") {
      const match = contentUrl.match(/\/video\/(\d+)/);
      const videoId = match?.[1];

      if (videoId) {
        const res = await fetch(
          "https://open.tiktokapis.com/v2/video/query/?fields=view_count,like_count",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${Deno.env.get("TIKTOK_ACCESS_TOKEN")}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              filters: { video_ids: [videoId] },
            }),
          }
        );

        if (res.ok) {
          const json = await res.json();
          const video = json?.data?.videos?.[0];
          views = video?.view_count ?? 0;
          likes = video?.like_count ?? 0;
        }
      }
    }

    /* ========= LINKEDIN ========= */
    if (platform === "linkedin") {
      const match = contentUrl.match(/activity-(\d+)/);
      const activityId = match?.[1];

      if (activityId) {
        const res = await fetch(
          `https://api.linkedin.com/v2/socialActions/urn:li:activity:${activityId}`,
          {
            headers: {
              Authorization: `Bearer ${Deno.env.get("LINKEDIN_ACCESS_TOKEN")}`,
            },
          }
        );

        if (res.ok) {
          const json = await res.json();
          views = json?.viewsCount ?? 0;
          likes = json?.likesCount ?? 0;
        }
      }
    }

    /* ========= UPDATE BY ID (FIX) ========= */
    await supabase
      .from("submissions")
      .update({
        view_count: views,
        like_count: likes,
      })
      .eq("id", submissionId);

    return new Response(
      JSON.stringify({ success: true, views, likes }),
      { headers: corsHeaders }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
