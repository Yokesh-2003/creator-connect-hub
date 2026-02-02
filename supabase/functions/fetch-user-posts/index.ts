
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;

    const { platform, socialAccountId, campaignId } = await req.json();
    if (!platform || !socialAccountId || !campaignId) {
      return new Response(
        JSON.stringify({ error: "platform, socialAccountId, and campaignId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: account, error: accountError } = await supabaseAdmin
      .from("social_accounts")
      .select("access_token, platform_user_id, display_name, username")
      .eq("id", socialAccountId)
      .eq("user_id", user.id)
      .eq("is_connected", true)
      .single();

    if (accountError || !account?.access_token) {
        throw new Error("Social account not found or not connected.");
    }
    
    const { data: campaign, error: campaignError } = await supabaseAdmin
        .from('campaigns')
        .select('start_date, end_date')
        .eq('id', campaignId)
        .single();
        
    if(campaignError || !campaign) {
        throw new Error("Campaign not found.");
    }
    const campaignStartDate = new Date(campaign.start_date);
    const campaignEndDate = new Date(campaign.end_date);


    let posts: any[] = [];
    const authorName = account.display_name || account.username || "Creator";

    if (platform === "tiktok") {
        const tiktokApiUrl = 'https://open.tiktokapis.com/v2/video/list/?fields=id,create_time,cover_image_url,share_url,title,like_count,comment_count,share_count,view_count';
        
        const res = await fetch(tiktokApiUrl, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${account.access_token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ max_count: 20 })
        });
        
        if (!res.ok) {
            const errorBody = await res.json();
            console.error("TikTok API Error:", errorBody);
            throw new Error(`Failed to fetch TikTok videos: ${errorBody.error.message}`);
        }
        
        const { data } = await res.json();
        const userVideos = data?.videos ?? [];
        
        posts = userVideos
          .filter((v: any) => {
              const postDate = new Date(v.create_time * 1000);
              return postDate >= campaignStartDate && postDate <= campaignEndDate;
          })
          .map((v: any) => ({
            id: `tk-${v.id}`,
            platform: 'tiktok',
            type: 'video',
            content: v.title || 'TikTok Video',
            thumbnail: v.cover_image_url,
            mediaUrl: v.share_url,
            likes: v.like_count || 0,
            comments: v.comment_count || 0,
            shares: v.share_count || 0,
            views: v.view_count || 0,
            createdAt: new Date(v.create_time * 1000).toISOString(),
            author: { name: authorName, avatar: '' }
        }));

    } else if (platform === "linkedin") {
        const linkedinApiUrl = `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=urn:li:person:${account.platform_user_id}&count=20`;
        const res = await fetch(linkedinApiUrl, {
            headers: {
                Authorization: `Bearer ${account.access_token}`,
                "X-Restli-Protocol-Version": "2.0.0",
                'Content-Type': 'application/json'
            },
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error('LinkedIn API Error:', errText);
            throw new Error("Failed to fetch LinkedIn posts");
        }
        
        const json = await res.json();
        posts = (json?.elements ?? [])
            .filter((p: any) => p.firstPublishedAt && new Date(p.firstPublishedAt) >= campaignStartDate && new Date(p.firstPublishedAt) <= campaignEndDate)
            .map((p: any) => ({
                id: `li-${p.id}`,
                platform: "linkedin",
                type: "post",
                content: p.commentary || p.shareCommentary?.text || "",
                thumbnail: p.content?.share?.thumbnailUrl || p.content?.media?.thumbnails?.[0]?.url || 'https://static-exp1.licdn.com/sc/h/al2o9zrvru7aqj8e1x2rzsrca',
                mediaUrl: `https://www.linkedin.com/feed/update/${p.id}`,
                likes: 0, 
                comments: 0,
                shares: 0,
                views: 0,
                createdAt: new Date(p.firstPublishedAt).toISOString(),
                author: { name: authorName, avatar: "" },
        }));
    } else {
      throw new Error("Unsupported platform");
    }

    return new Response(JSON.stringify({ posts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
