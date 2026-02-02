import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TIKTOK_API_URL = "https://open.tiktokapis.com/v2/video/list/";
const LINKEDIN_API_URL = "https://api.linkedin.com/v2/ugcPosts";

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

  const { data: socialAccounts, error: accountsError } = await supabase
    .from("social_accounts")
    .select("platform, access_token, platform_user_id")
    .eq("user_id", user.id)
    .in("platform", ["tiktok", "linkedin"]);

  if (accountsError) {
    return new Response(JSON.stringify({ error: "Failed to fetch social accounts" }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  const allContent = [];

  for (const account of socialAccounts) {
    if (account.platform === "tiktok") {
      try {
        const response = await fetch(TIKTOK_API_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${account.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "fields": "video.list"
          }),
        });

        if (response.ok) {
          const { data } = await response.json();
          if (data && data.videos) {
            const tiktokContent = data.videos.map(video => ({
              id: video.id,
              platform: 'tiktok',
              title: video.title,
              thumbnail: video.cover_image_url,
              url: video.share_url,
              metrics: {
                views: video.view_count,
                likes: video.like_count,
              }
            }));
            allContent.push(...tiktokContent);
          }
        }
      } catch (error) {
        console.error("Error fetching TikTok content:", error);
      }
    } else if (account.platform === "linkedin") {
      try {
        const response = await fetch(`${LINKEDIN_API_URL}?q=authors&authors=List(urn:li:person:${account.platform_user_id})`, {
          headers: {
            "Authorization": `Bearer ${account.access_token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const { elements } = await response.json();
          const linkedInContent = elements.map(post => ({
            id: post.id,
            platform: 'linkedin',
            text: post.specificContent['com.linkedin.ugc.ShareContent'].shareCommentary.text,
            url: `https://www.linkedin.com/feed/update/${post.id}`,
            metrics: {
              // LinkedIn API for content doesn't provide metrics directly in the ugcPosts response.
              // A separate call would be needed per post, which is inefficient.
              // For now, we'll leave this empty and fetch metrics on submission.
            }
          }));
          allContent.push(...linkedInContent);
        }
      } catch (error) {
        console.error("Error fetching LinkedIn content:", error);
      }
    }
  }

  return new Response(JSON.stringify({ content: allContent }), {
    headers: { "Content-Type": "application/json" },
  });
});
