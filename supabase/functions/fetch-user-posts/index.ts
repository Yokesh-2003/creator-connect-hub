import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization" }),
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
      .select("id, access_token, display_name, username, platform, user_id")
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
      const posts = videos.map((v: {
        id?: string;
        title?: string;
        cover_image_url?: string;
        create_time?: number;
        view_count?: number;
        like_count?: number;
        comment_count?: number;
        share_url?: string;
      }) => ({
        id: `tt-${v.id ?? Math.random()}`,
        platform: "tiktok",
        type: "video",
        content: v.title || "TikTok video",
        thumbnail: v.cover_image_url,
        mediaUrl: v.share_url || (v.id ? `https://www.tiktok.com/@user/video/${v.id}` : undefined),
        likes: v.like_count ?? 0,
        comments: v.comment_count ?? 0,
        shares: 0,
        views: v.view_count,
        createdAt: v.create_time ? new Date(v.create_time * 1000) : new Date(),
        author: { name: authorName, avatar: "" },
      }));

      return new Response(
        JSON.stringify({ posts }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (platform === "linkedin") {
      // Try to list UGC posts authored by the member
      try {
        const memberUrn = `urn:li:person:${account.platform_user_id}`;
        const ugcRes = await fetch(`https://api.linkedin.com/v2/ugcPosts?q=authors&authors=${encodeURIComponent(memberUrn)}&count=50`, {
          headers: { Authorization: `Bearer ${account.access_token}` },
        });

        let posts: any[] = [];
        if (ugcRes.ok) {
          const ugcJson = await ugcRes.json();
          const elements = ugcJson.elements || [];
          posts = elements.map((e: any) => {
            // Try to extract id and text
            const id = e.id || (e.media && e.media[0] && e.media[0].id) || Math.random().toString(36).slice(2);
            const content = (e.specificContent && e.specificContent['com.linkedin.ugc.ShareContent'] && (e.specificContent['com.linkedin.ugc.ShareContent'].shareCommentary?.text)) || '';
            const createdAt = e.created?.time ? new Date(Number(e.created.time)) : new Date();
            // Thumbnail/media extraction (best-effort)
            let thumbnail = undefined;
            try {
              const media = e.specificContent['com.linkedin.ugc.ShareContent'].media || [];
              if (media.length && media[0].thumbnails && media[0].thumbnails.length) thumbnail = media[0].thumbnails[0].image~?.url || media[0].thumbnails[0].url;
            } catch (err) {
              // ignore
            }
            const activityUrn = e.activity || `urn:li:activity:${id}`;
            const mediaUrl = `https://www.linkedin.com/feed/update/${String(activityUrn).replace('urn:li:activity:', 'activity-')}`;
            return {
              id: `li-${id}`,
              platform: 'linkedin',
              type: 'post',
              content: content || 'LinkedIn post',
              thumbnail,
              mediaUrl,
              likes: 0,
              comments: 0,
              shares: 0,
              views: undefined,
              createdAt,
              author: { name: authorName, avatar: '' },
            };
          });
        }

        // If no posts found in UGC, try shares endpoint as fallback
        if (!posts.length) {
          const sharesRes = await fetch(`https://api.linkedin.com/v2/shares?q=owners&owners=${encodeURIComponent(memberUrn)}&sharesPerOwner=50`, {
            headers: { Authorization: `Bearer ${account.access_token}` },
          });
          if (sharesRes.ok) {
            const sharesJson = await sharesRes.json();
            const elems = sharesJson.elements || [];
            posts = elems.map((e: any) => {
              const id = e.activity || e.id || Math.random().toString(36).slice(2);
              const content = (e.text && e.text.text) || '';
              const createdAt = e.created && e.created.time ? new Date(Number(e.created.time)) : new Date();
              const activityUrn = e.activity || `urn:li:activity:${id}`;
              const mediaUrl = `https://www.linkedin.com/feed/update/${String(activityUrn).replace('urn:li:activity:', 'activity-')}`;
              return {
                id: `li-${id}`,
                platform: 'linkedin',
                type: 'post',
                content: content || 'LinkedIn post',
                thumbnail: undefined,
                mediaUrl,
                likes: 0,
                comments: 0,
                shares: 0,
                views: undefined,
                createdAt,
                author: { name: authorName, avatar: '' },
              };
            });
          }
        }

        // Try to enrich metrics for each post via socialActions when possible (best-effort)
        for (const p of posts) {
          try {
            // derive urn from mediaUrl
            const possibleUrn = p.mediaUrl && p.mediaUrl.includes('activity-') ? `urn:li:activity:${p.mediaUrl.split('activity-').pop()}` : null;
            if (possibleUrn) {
              const saRes = await fetch(`https://api.linkedin.com/v2/socialActions/${encodeURIComponent(possibleUrn)}`, {
                headers: { Authorization: `Bearer ${account.access_token}` },
              });
              if (saRes.ok) {
                const sa = await saRes.json();
                p.likes = sa['totalSocialActivityCounts']?.likeCount ?? sa['likeCount'] ?? 0;
                p.comments = sa['totalSocialActivityCounts']?.commentCount ?? sa['commentCount'] ?? 0;
                p.shares = sa['totalSocialActivityCounts']?.shareCount ?? sa['shareCount'] ?? 0;
              }
            }
          } catch (err) {
            // ignore enrichment errors
          }
        }

        return new Response(JSON.stringify({ posts }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (err) {
        console.error('LinkedIn fetch error:', err);
        return new Response(JSON.stringify({ posts: [] }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
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
