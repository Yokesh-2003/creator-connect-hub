import { supabase } from '@/lib/supabase';


export async function submitContent(
  campaignId: string,
  socialAccountId: string,
  contentUrl: string,
  contentType: 'video' | 'post' | 'reel' | 'short' = 'video'
): Promise<{ success: boolean; error?: string; submissionId?: string }> {
  try {
    // Use a server-side function to verify ownership and capture metrics
    const { data, error } = await supabase.functions.invoke('submit-content', {
      body: { campaignId, socialAccountId, contentUrl, contentType },
    });

    if (error) return { success: false, error: error.message };
    if (data?.error) return { success: false, error: data.error };
    return { success: true, submissionId: data.submissionId };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}


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
