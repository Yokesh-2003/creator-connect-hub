
import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { Navbar } from '@/components/layout/Navbar';
import VideoPlayer from '@/components/content/VideoPlayer';
import Leaderboard from '@/components/content/Leaderboard';
import SubmitBar from '@/components/content/SubmitBar';
import CreatorContentFetcher from '@/components/content/CreatorContentFetcher';
import { useAuth } from '@/lib/auth-context';

export default function CampaignDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user, loading: authLoading } = useAuth();
  const [campaign, setCampaign] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const loadCampaignData = useCallback(async () => {
    if (!id) return;

    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (campaignError || !campaignData) {
      toast.error('Campaign not found.');
      setLoading(false);
      router.push('/campaigns');
      return;
    }
    setCampaign(campaignData);

    // Using a generic RPC call to let the backend handle the query complexity
    const { data: submissionData, error: submissionError } = await supabase
        .rpc('get_campaign_submissions', { campaign_id_param: id });

    if (submissionError) {
      toast.error('Could not load submissions.');
    } else if (submissionData) {
      setSubmissions(submissionData);
    }

    setLoading(false);
  }, [id, supabase, router]);

  useEffect(() => {
    if (router.isReady) {
      setLoading(true);
      loadCampaignData();
    }
  }, [router.isReady, loadCampaignData]);

  const handleNewSubmission = (newSubmission: any) => {
     // Enrich the submission with client-side data for immediate UI update
     const enrichedSubmission = {
        ...newSubmission,
        creator_name: user?.user_metadata?.user_name || 'You',
        avatar_url: user?.user_metadata?.avatar_url,
        view_count: newSubmission.view_count || 0, // Ensure view_count is not null
    };
    setSubmissions(prev => [enrichedSubmission, ...prev]);
  };

  const sortedSubmissions = useMemo(() => {
    return [...submissions].sort((a, b) => {
      const viewsA = a.view_count || 0;
      const viewsB = b.view_count || 0;
      if (viewsB !== viewsA) {
        return viewsB - viewsA;
      }
      const nameA = a.creator_name || '';
      const nameB = b.creator_name || '';
      return nameA.localeCompare(nameB);
    });
  }, [submissions]);

  if (loading || authLoading || !router.isReady) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-xl font-semibold">Loading Campaign...</div>
        </main>
      </div>
    );
  }

  if (!campaign) {
    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Navbar />
            <main className="flex-1 flex items-center justify-center">
            <div className="text-xl font-semibold">Campaign not found.</div>
            </main>
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1 flex flex-col gap-4 p-4 md:p-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
          <p className="text-muted-foreground">{campaign.description}</p>
        </div>

        {user && campaign.platform && (
          <CreatorContentFetcher platform={campaign.platform}>
            {(fetcherState) => (
              <SubmitBar
                campaignId={campaign.id}
                platform={campaign.platform}
                onNewSubmission={handleNewSubmission}
                contentFetcher={fetcherState}
              />
            )}
          </CreatorContentFetcher>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
          <div className="md:col-span-2 h-[70vh] md:h-auto min-h-0">
            {sortedSubmissions.length > 0 ? (
              <VideoPlayer
                submissions={sortedSubmissions}
                currentIndex={currentIndex}
                setCurrentIndex={setCurrentIndex}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-muted rounded-lg">
                <p>Be the first to submit!</p>
              </div>
            )}
          </div>

          <div className="h-[70vh] md:h-auto min-h-0">
            <Leaderboard submissions={sortedSubmissions} />
          </div>
        </div>
      </main>
    </div>
  );
}
