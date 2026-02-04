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
    let text: string | null = null;
    let thumbnail_url: string | null = null;

    if (platform === "linkedin") {
        const match = contentUrl.match(/activity[-/:](\\d+)/);
        const postId = match ? match[1] : null;

      if (postId) {
        const postUrn = `urn:li:activity:${postId}`;
        const projection = "(id,commentary,content(media(id,status,thumbnails~),article(source,thumbnail,title,description)))";
        
        const [postRes, socialActionsRes] = await Promise.all([
          fetch(
            `https://api.linkedin.com/v2/posts/${postUrn}?projection=${projection}`,
            {
              headers: {
                Authorization: `Bearer ${Deno.env.get("LINKEDIN_ACCESS_TOKEN")}`,
                "X-Restli-Protocol-Version": "2.0.0",
                "LinkedIn-Version": "202405",
              },
            }
          ),
          fetch(`https://api.linkedin.com/v2/socialActions/${postUrn}`, {
            headers: {
              Authorization: `Bearer ${Deno.env.get("LINKEDIN_ACCESS_TOKEN")}`,
            },
          }),
        ]);

        if (postRes.ok) {
          const postData = await postRes.json();
          text = postData?.commentary ?? null;

          if (postData?.content?.media?.thumbnails?.elements?.length > 0) {
            thumbnail_url = postData.content.media.thumbnails.elements.sort((a, b) => b.width - a.width)[0].url;
          } else if (postData?.content?.article?.thumbnail) {
            thumbnail_url = postData.content.article.thumbnail;
          }
        } else {
            console.error("LinkedIn Post API Error:", await postRes.text());
        }

        if (socialActionsRes.ok) {
          const socialData = await socialActionsRes.json();
          likes = socialData?.likesSummary?.totalLikes ?? 0;
        } else {
           console.error("LinkedIn Social Actions API Error:", await socialActionsRes.text());
        }
      }
    }

    await supabase
      .from("submissions")
      .update({
        view_count: views,
        like_count: likes,
        content_text: text,
        thumbnail_url: thumbnail_url,
      })
      .eq("id", submissionId);

    return new Response(
      JSON.stringify({ success: true, views, likes, text, thumbnail_url }),
      { headers: corsHeaders }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});