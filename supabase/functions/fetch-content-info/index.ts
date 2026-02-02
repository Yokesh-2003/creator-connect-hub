import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contentUrl, platform, accessToken } = await req.json();

    if (!contentUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Content URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let contentInfo = {
      username: null,
      displayName: null,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      contentId: null,
      thumbnail: null,
    };

    if (platform === 'tiktok') {
      const videoIdMatch = contentUrl.match(/\/video\/(\d+)/);
      contentInfo.contentId = videoIdMatch ? videoIdMatch[1] : null;

      // Fetch using oEmbed (no auth required)
      try {
        const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(contentUrl)}`;
        const oembedResponse = await fetch(oembedUrl);
        
        if (oembedResponse.ok) {
          const oembedData = await oembedResponse.json();
          contentInfo.username = oembedData.author_name || null;
          contentInfo.displayName = oembedData.author_name || null;
          contentInfo.thumbnail = oembedData.thumbnail_url || null;
        }
      } catch (e) {
        console.log('oEmbed failed:', e);
      }

      // Fetch metrics with TikTok API (if access token available)
      if (accessToken && contentInfo.contentId) {
        try {
          const response = await fetch(
            'https://open.tiktokapis.com/v2/video/query/?fields=view_count,like_count,comment_count,share_count',
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                filters: { video_ids: [contentInfo.contentId] },
              }),
            }
          );

          if (response.ok) {
            const data = await response.json();
            const video = data.data?.videos?.[0];
            if (video) {
              contentInfo.views = video.view_count || 0;
              contentInfo.likes = video.like_count || 0;
              contentInfo.comments = video.comment_count || 0;
              contentInfo.shares = video.share_count || 0;
            }
          }
        } catch (e) {
          console.log('TikTok API failed:', e);
        }
      }
    } else if (platform === 'linkedin') {
      const activityMatch = contentUrl.match(/activity-(\d+)/);
      contentInfo.contentId = activityMatch ? activityMatch[1] : null;

      if (accessToken && contentInfo.contentId) {
        try {
          const response = await fetch(
            `https://api.linkedin.com/v2/socialActions/urn:li:activity:${contentInfo.contentId}`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
          );

          if (response.ok) {
            const data = await response.json();
            contentInfo.views = data.viewsCount || 0;
            contentInfo.likes = data.likesCount || 0;
            contentInfo.comments = data.commentsCount || 0;
          }
        } catch (e) {
          console.log('LinkedIn API failed:', e);
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, data: contentInfo }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
