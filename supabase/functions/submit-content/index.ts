import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Missing or invalid authorization" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const jwt = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { campaignId, socialAccountId, contentUrl, contentType } = body || {};
    if (!campaignId || !socialAccountId || !contentUrl) {
      return new Response(JSON.stringify({ error: "campaignId, socialAccountId and contentUrl required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Verify campaign
    const { data: campaign } = await supabase.from("campaigns").select("*").eq("id", campaignId).single();
    if (!campaign) return new Response(JSON.stringify({ error: "Campaign not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Ensure campaign active
    const now = new Date();
    const startDate = new Date(campaign.start_date);
    const endDate = new Date(campaign.end_date);
    if (now < startDate || now > endDate) {
      return new Response(JSON.stringify({ error: "Campaign is not active" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch social account for this user
    const { data: account, error: accountError } = await supabase
      .from("social_accounts")
      .select("*")
      .eq("id", socialAccountId)
      .eq("user_id", user.id)
      .eq("is_connected", true)
      .single();

    if (accountError || !account || !account.access_token) {
      return new Response(JSON.stringify({ error: "Social account not found or not connected" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const platform = account.platform;

    // Extract platform content id when possible
    let platformContentId: string | null = null;
    if (platform === "tiktok") {
      const m = contentUrl.match(/\/video\/(\d+)/);
      platformContentId = m ? m[1] : null;
    } else if (platform === "linkedin") {
      // try several patterns
      let m = contentUrl.match(/activity-(\d+)/);
      if (!m) m = contentUrl.match(/activity:(\d+)/);
      if (!m) m = contentUrl.match(/urn:li:activity:(\d+)/);
      platformContentId = m ? m[1] : null;
    }

    // Ownership verification and metrics fetch
    let metrics = { views: 0, likes: 0, comments: 0, shares: 0, impressions: 0 };

    if (platform === "tiktok") {
      if (!platformContentId) {
        return new Response(JSON.stringify({ error: "Unable to parse TikTok content id from URL" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Use user's access token to list their videos and find the matching id
      const res = await fetch(
        "https://open.tiktokapis.com/v2/video/list/?fields=cover_image_url,id,title,create_time,view_count,like_count,comment_count,share_count,share_url,owner" ,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${account.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ max_count: 50 }),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error("TikTok list error:", res.status, errText);
        return new Response(JSON.stringify({ error: "Failed to verify TikTok content" , details: errText}), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const json = await res.json();
      const videos = json?.data?.videos ?? [];
      const found = videos.find((v: any) => String(v.id) === String(platformContentId));
      if (!found) {
        return new Response(JSON.stringify({ error: "Content not found in creator's TikTok account" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      metrics.views = found.view_count ?? 0;
      metrics.likes = found.like_count ?? 0;
      metrics.comments = found.comment_count ?? 0;
      metrics.shares = found.share_count ?? (found.share_url ? 0 : 0);

    } else if (platform === "linkedin") {
      // LinkedIn: list posts authored by the member and find matching id
      const memberId = account.platform_user_id;
      if (!memberId) {
        return new Response(JSON.stringify({ error: "LinkedIn platform_user_id not available" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Try to fetch UGC posts by author
      const ugcRes = await fetch(`https://api.linkedin.com/v2/ugcPosts?q=authors&authors=urn:li:person:${memberId}&count=50`, {
        headers: { Authorization: `Bearer ${account.access_token}` },
      });

      if (!ugcRes.ok) {
        const errText = await ugcRes.text();
        console.warn("LinkedIn ugcPosts fetch failed:", errText);
      }

      let found = null;
      if (ugcRes.ok) {
        const ugcJson = await ugcRes.json();
        const elements = ugcJson.elements || [];
        // LinkedIn UGC post URN is like urn:li:ugcPost:12345
        found = elements.find((e: any) => {
          const urn = e.id || e.entity || e["id"];
          if (!urn) return false;
          return String(urn).includes(platformContentId || "");
        });
      }

      // If not found in ugcPosts, try shares endpoint (older posts)
      if (!found) {
        const sharesRes = await fetch(`https://api.linkedin.com/v2/shares?q=owners&owners=urn:li:person:${memberId}&sharesPerOwner=50`, {
          headers: { Authorization: `Bearer ${account.access_token}` },
        });
        if (sharesRes.ok) {
          const sharesJson = await sharesRes.json();
          const elems = sharesJson.elements || [];
          found = elems.find((e: any) => {
            const urn = e.activity || e["id"] || e["urn"];
            if (!urn) return false;
            return String(urn).includes(platformContentId || "");
          });
        }
      }

      if (!found) {
        return new Response(JSON.stringify({ error: "Content not found in creator's LinkedIn account" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Try to fetch social action metrics for the activity URN
      try {
        // Attempt several possible URNs
        const possibleUrns = [];
        if (found.activity) possibleUrns.push(found.activity);
        if (found.id) possibleUrns.push(`urn:li:ugcPost:${found.id}`);
        if (found["urn"]) possibleUrns.push(found["urn"]);

        let sa = null;
        for (const urn of possibleUrns) {
          if (!urn) continue;
          const encoded = encodeURIComponent(urn);
          const saRes = await fetch(`https://api.linkedin.com/v2/socialActions/${encoded}`, {
            headers: { Authorization: `Bearer ${account.access_token}` },
          });
          if (!saRes.ok) continue;
          sa = await saRes.json();
          if (sa) break;
        }

        if (sa) {
          metrics.likes = sa["totalSocialActivityCounts"]?.likeCount ?? sa["likeCount"] ?? 0;
          metrics.comments = sa["totalSocialActivityCounts"]?.commentCount ?? sa["commentCount"] ?? 0;
          metrics.shares = sa["totalSocialActivityCounts"]?.shareCount ?? sa["shareCount"] ?? 0;
          metrics.impressions = 0;
          metrics.views = 0;
        }
      } catch (err) {
        console.warn("LinkedIn socialActions fetch failed:", err.message || err);
      }
    } else {
      return new Response(JSON.stringify({ error: "Unsupported platform" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Prevent duplicate submissions from same creator to this campaign
    const { data: existing } = await supabase
      .from("submissions")
      .select("id")
      .eq("campaign_id", campaignId)
      .eq("creator_id", user.id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "You have already submitted content to this campaign" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Insert submission
    const { data: submission, error: submissionError } = await supabase
      .from("submissions")
      .insert({
        campaign_id: campaignId,
        creator_id: user.id,
        social_account_id: socialAccountId,
        content_url: contentUrl,
        content_id: platformContentId,
        content_type: contentType || (platform === "tiktok" ? "video" : "post"),
        status: "pending",
      })
      .select()
      .single();

    if (submissionError) {
      return new Response(JSON.stringify({ error: submissionError.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Store metrics snapshot
    await supabase.from("metrics").insert({
      submission_id: submission.id,
      views: metrics.views || 0,
      likes: metrics.likes || 0,
      comments: metrics.comments || 0,
      shares: metrics.shares || 0,
      impressions: metrics.impressions || 0,
    });

    return new Response(JSON.stringify({ success: true, submissionId: submission.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("submit-content error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
