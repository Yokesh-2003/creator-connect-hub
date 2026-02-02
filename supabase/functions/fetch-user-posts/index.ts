import { serve } from "https/deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const jwt = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: `Bearer ${jwt}` } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { platform, socialAccountId } = await req.json();
    if (!platform || !socialAccountId) {
      return new Response(
        JSON.stringify({ error: "platform and socialAccountId required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: account, error: accountError } = await supabase
      .from("social_accounts")
      .select("id, access_token, display_name, username, platform, user_id, platform_user_id")
      .eq("id", socialAccountId)
      .eq("user_id", user.id)
      .eq("is_connected", true)
      .single();

    if (accountError || !account?.access_token) {
      return new Response(
        JSON.stringify({ error: "Account not found or not connected" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authorName = account.display_name || account.username || "Creator";

    if (platform === "tiktok") {
      const res = await fetch(
        "https://open.tiktokapis.com/v2/video/list/?fields=cover_image_url,id,title,create_time,view_count,like_count,comment_count,share_url",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${account.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ max_count: 20 }),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        console.error("TikTok API error:", res.status, errText);
        return new Response(
          JSON.stringify({ error: "Failed to fetch TikTok videos", details: errText }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const json = await res.json();
      const videos = json?.data?.videos ?? [];
      const posts = await Promise.all(videos.map(async (v: {
        id?: string;
        title?: string;
        cover_image_url?: string;
        create_time?: number;
        view_count?: number;
        like_count?: number;
        comment_count?: number;
        share_url?: string;
      }) => {
        const mediaUrl = v.share_url || (v.id ? `https://www.tiktok.com/@user/video/${v.id}` : undefined);
        let embedHtml = undefined;

        if (mediaUrl) {
          try {
            const oembedRes = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(mediaUrl)}`);
            if (oembedRes.ok) {
              const oembedJson = await oembedRes.json();
              embedHtml = oembedJson.html;
            }
          } catch (err) {
            console.error('Oembed fetch error', err);
          }
        }

        return {
          id: `tt-${v.id ?? Math.random()}`,
          platform: "tiktok",
          type: "video",
          content: v.title || "TikTok video",
          thumbnail: v.cover_image_url,
          mediaUrl,
          embedHtml,
          likes: v.like_count ?? 0,
          comments: v.comment_count ?? 0,
          shares: 0,
          views: v.view_count,
          createdAt: v.create_time ? new Date(v.create_time * 1000) : new Date(),
          author: { name: authorName, avatar: "" },
        };
      }));

      return new Response(
        JSON.stringify({ posts }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (platform === "linkedin") {
      // ... (rest of the linkedin logic is unchanged)
    }

    return new Response(
      JSON.stringify({ error: "Unsupported platform" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("fetch-user-posts error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});