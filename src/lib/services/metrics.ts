import { supabase } from '@/lib/supabase';


export async function refreshCampaignMetrics(campaignId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: submissions, error: subsError } = await supabase
      .from('submissions')
      .select(`
        *,
        social_account:social_accounts(*),
        campaign:campaigns(*)
      `)
      .eq('campaign_id', campaignId)
      .eq('status', 'approved');

    if (subsError) {
      return { success: false, error: subsError.message };
    }

    if (!submissions || submissions.length === 0) {
      return { success: true };
    }

    for (const submission of submissions) {
      await refreshSubmissionMetrics(submission.id);
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}


export async function refreshSubmissionMetrics(submissionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: submission, error: subError } = await supabase
      .from('submissions')
      .select(`
        *,
        social_account:social_accounts(*),
        campaign:campaigns(*)
      `)
      .eq('id', submissionId)
      .single();

    if (subError || !submission) {
      return { success: false, error: 'Submission not found' };
    }

    const campaign = submission.campaign;
    const now = new Date();
    const endDate = new Date(campaign.end_date);
    const isLocked = now > endDate;

    const { data: latestMetrics } = await supabase
      .from('metrics')
      .select('*')
      .eq('submission_id', submissionId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (latestMetrics?.is_locked) {
      return { success: true }; 
    }

    let metrics: {
      views: number;
      likes: number;
      comments: number;
      shares: number;
      impressions: number;
    } | null = null;

    const platform = submission.social_account?.platform;
    const accessToken = submission.social_account?.access_token;
    const contentId = submission.content_id || submission.content_url;

    if (platform === 'tiktok' && accessToken && contentId) {
      metrics = await fetchTikTokMetrics(accessToken, contentId);
    } else if (platform === 'linkedin' && accessToken && contentId) {
      metrics = await fetchLinkedInMetrics(accessToken, contentId);
    }

    if (!metrics) {
      metrics = latestMetrics || {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        impressions: 0,
      };
    }

    const { error: metricsError } = await supabase.from('metrics').insert({
      submission_id: submissionId,
      views: metrics.views,
      likes: metrics.likes,
      comments: metrics.comments,
      shares: metrics.shares,
      impressions: metrics.impressions,
      engagement_rate: metrics.views > 0
        ? ((metrics.likes + metrics.comments + metrics.shares) / metrics.views) * 100
        : 0,
      is_locked: isLocked,
      locked_at: isLocked ? new Date().toISOString() : null,
    });

    if (metricsError) {
      return { success: false, error: metricsError.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}


async function fetchTikTokMetrics(accessToken: string, videoId: string): Promise<{
  views: number;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
}> {
  try {
    const response = await fetch(`https://open.tiktokapis.com/v2/research/video/query/?fields=view_count,like_count,comment_count,share_count`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: {
          and: [
            { operation: 'EQ', field_name: 'video_id', field_values: [videoId] },
          ],
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const video = data.data?.videos?.[0];
      return {
        views: video?.view_count || 0,
        likes: video?.like_count || 0,
        comments: video?.comment_count || 0,
        shares: video?.share_count || 0,
        impressions: video?.view_count || 0, 
      };
    }
  } catch (error) {
    console.error('Error fetching TikTok metrics:', error);
  }

  return { views: 0, likes: 0, comments: 0, shares: 0, impressions: 0 };
}

async function fetchLinkedInMetrics(accessToken: string, activityUrn: string): Promise<{
  views: number;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
}> {
  try {
    const response = await fetch(`https://api.linkedin.com/v2/socialActions/${activityUrn}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        views: data.views || 0,
        likes: data.likes || 0,
        comments: data.comments || 0,
        shares: data.shares || 0,
        impressions: data.impressions || data.views || 0,
      };
    }
  } catch (error) {
    console.error('Error fetching LinkedIn metrics:', error);
  }

  return { views: 0, likes: 0, comments: 0, shares: 0, impressions: 0 };
}
