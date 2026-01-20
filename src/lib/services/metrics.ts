import { supabase } from '@/integrations/supabase/client';

/**
 * Refresh metrics for all submissions in a campaign
 */
export async function refreshCampaignMetrics(campaignId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get all submissions for this campaign
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

    // Refresh metrics for each submission
    for (const submission of submissions) {
      await refreshSubmissionMetrics(submission.id);
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Refresh metrics for a single submission
 */
export async function refreshSubmissionMetrics(submissionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get submission with social account
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

    // Check if metrics are locked (campaign ended)
    const campaign = submission.campaign;
    const now = new Date();
    const endDate = new Date(campaign.end_date);
    const isLocked = now > endDate;

    // Get latest metrics
    const { data: latestMetrics } = await supabase
      .from('metrics')
      .select('*')
      .eq('submission_id', submissionId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (latestMetrics?.is_locked) {
      return { success: true }; // Metrics already locked
    }

    // Fetch fresh metrics from platform API
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
      // If we can't fetch, use existing metrics or zeros
      metrics = latestMetrics || {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        impressions: 0,
      };
    }

    // Insert new metrics record
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

/**
 * Fetch metrics from TikTok API
 */
async function fetchTikTokMetrics(accessToken: string, videoId: string): Promise<{
  views: number;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
}> {
  try {
    // Note: TikTok API structure may vary
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
        impressions: video?.view_count || 0, // Use views as impressions for TikTok
      };
    }
  } catch (error) {
    console.error('Error fetching TikTok metrics:', error);
  }

  return { views: 0, likes: 0, comments: 0, shares: 0, impressions: 0 };
}

/**
 * Fetch metrics from LinkedIn API
 */
async function fetchLinkedInMetrics(accessToken: string, activityUrn: string): Promise<{
  views: number;
  likes: number;
  comments: number;
  shares: number;
  impressions: number;
}> {
  try {
    // LinkedIn API for post metrics
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
