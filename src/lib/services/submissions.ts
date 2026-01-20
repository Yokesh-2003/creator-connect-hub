import { supabase } from '@/integrations/supabase/client';

/**
 * Submit content to a campaign
 */
export async function submitContent(
  campaignId: string,
  socialAccountId: string,
  contentUrl: string,
  contentType: 'video' | 'post' | 'reel' | 'short' = 'video'
): Promise<{ success: boolean; error?: string; submissionId?: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get campaign to validate
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return { success: false, error: 'Campaign not found' };
    }

    // Validate campaign is active
    const now = new Date();
    const startDate = new Date(campaign.start_date);
    const endDate = new Date(campaign.end_date);

    if (now < startDate || now > endDate) {
      return { success: false, error: 'Campaign is not currently active' };
    }

    // Validate platform matches
    const { data: socialAccount } = await supabase
      .from('social_accounts')
      .select('platform')
      .eq('id', socialAccountId)
      .eq('user_id', session.user.id)
      .single();

    if (!socialAccount || socialAccount.platform !== campaign.platform) {
      return { success: false, error: 'Social account platform does not match campaign platform' };
    }

    // Extract content ID from URL if possible
    let contentId: string | null = null;
    if (contentUrl.includes('tiktok.com')) {
      const match = contentUrl.match(/\/video\/(\d+)/);
      contentId = match ? match[1] : null;
    } else if (contentUrl.includes('linkedin.com')) {
      const match = contentUrl.match(/activity-(\d+)/);
      contentId = match ? match[1] : null;
    }

    // Check if user already submitted to this campaign
    const { data: existing } = await supabase
      .from('submissions')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('creator_id', session.user.id)
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'You have already submitted content to this campaign' };
    }

    // Create submission
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        campaign_id: campaignId,
        creator_id: session.user.id,
        social_account_id: socialAccountId,
        content_url: contentUrl,
        content_id: contentId,
        content_type: contentType,
        status: 'pending',
      })
      .select()
      .single();

    if (submissionError) {
      return { success: false, error: submissionError.message };
    }

    // Create initial metrics entry
    await supabase.from('metrics').insert({
      submission_id: submission.id,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      impressions: 0,
    });

    return { success: true, submissionId: submission.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

/**
 * Get user's submissions for a campaign
 */
export async function getUserSubmissions(campaignId?: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return [];

  let query = supabase
    .from('submissions')
    .select(`
      *,
      campaign:campaigns(*),
      social_account:social_accounts(*),
      metrics:metrics(*)
    `)
    .eq('creator_id', session.user.id)
    .order('submitted_at', { ascending: false });

  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
  }

  const { data } = await query;
  return data || [];
}
