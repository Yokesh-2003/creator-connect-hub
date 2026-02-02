import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  // ✅ CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    /* =======================
       PARSE BODY
    ======================= */
    const { contentUrl, platform } = await req.json();

    if (!contentUrl || !platform) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "contentUrl and platform are required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    /* =======================
       CREATE SUPABASE CLIENT
       (SERVICE ROLE)
    ======================= */
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    /* =======================
       AUTHENTICATE USER
    ======================= */
    const authHeader =
      req.headers.get("authorization") ??
      req.headers.get("Authorization");

    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(authHeader);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    /* =======================
       GET OAUTH IDENTITY
    ======================= */
    const { data: authUser } =
      await supabase.auth.admin.getUserById(user.id);

    const identity = authUser?.identities?.find(
      (i) => i.provider === platform
    );

    const accessToken = identity?.access_token ?? null;

    /* =======================
       METRICS OBJECT
    ======================= */
    const contentInfo = {
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      contentId: null as string | null,
    };

    /* =======================
       TIKTOK
    ======================= */
    if (platform === "tiktok") {
      const match = contentUrl.match(/\/video\/(\d+)/);
      contentInfo.contentId = match?.[1] ?? null;

      if (accessToken && contentInfo.contentId) {
        const res = await fetch(
          "https://open.tiktokapis.com/v2/video/query/?fields=view_count,like_count,comment_count,share_count",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              filters: {
                video_ids: [contentInfo.contentId],
              },
            }),
          }
        );

        if (res.ok) {
          const json = await res.json();
          const video = json?.data?.videos?.[0];
          if (video) {
            contentInfo.views = video.view_count ?? 0;
            contentInfo.likes = video.like_count ?? 0;
            contentInfo.comments = video.comment_count ?? 0;
            contentInfo.shares = video.share_count ?? 0;
          }
        }
      }
    }

    /* =======================
       LINKEDIN (LIMITED)
    ======================= */
    if (platform === "linkedin") {
      const match = contentUrl.match(/activity-(\d+)/);
      contentInfo.contentId = match?.[1] ?? null;

      if (accessToken && contentInfo.contentId) {
        const res = await fetch(
          `https://api.linkedin.com/v2/socialActions/urn:li:activity:${contentInfo.contentId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (res.ok) {
          const data = await res.json();
          contentInfo.likes = data.likesCount ?? 0;
          contentInfo.comments = data.commentsCount ?? 0;
          // LinkedIn does NOT reliably expose view count
        }
      }
    }

    /* =======================
       ✅ UPDATE DATABASE
    ======================= */
    await supabase
      .from("submissions")
      .update({
        view_count: contentInfo.views,
        like_count: contentInfo.likes,
        updated_at: new Date().toISOString(),
      })
      .eq("url", contentUrl);

    /* =======================
       RETURN RESPONSE
    ======================= */
    return new Response(
      JSON.stringify({
        success: true,
        data: contentInfo,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
