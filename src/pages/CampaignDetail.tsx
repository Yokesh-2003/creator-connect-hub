import { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Navbar } from '@/components/layout/Navbar';
import VideoPlayer from '@/components/content/VideoPlayer';
import Leaderboard from '@/components/content/Leaderboard';
import SubmitBar from '@/components/content/SubmitBar';
import CreatorContentFetcher from '@/components/content/CreatorContentFetcher';
import { useAuth } from '@/lib/auth-context';

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [campaign, setCampaign] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const loadCampaignData = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (campaignError || !campaignData) {
      console.error(campaignError?.message || 'Campaign not found.');
      setCampaign(null);
      setLoading(false);
      return;
    }
    setCampaign(campaignData);

    const { data: submissionData, error: submissionError } = await supabase
      .from('submissions')
      .select('id, post_url, view_count, creator_name, created_at')
      .eq('campaign_id', id);

    if (submissionError) {
      console.error('Could not load submissions:', submissionError);
      setSubmissions([]);
    } else if (submissionData) {
      setSubmissions(submissionData);
    }

    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    if (id) {
        loadCampaignData();
    }
  }, [id, loadCampaignData]);

  const handleNewSubmission = (newSubmission: any) => {
    setSubmissions(prev => [newSubmission, ...prev]);
  };

  const sortedSubmissions = useMemo(() => {
    return [...submissions].sort(
      (a, b) =>
        (b.view_count || 0) - (a.view_count || 0) ||
        (a.creator_name || '').localeCompare(b.creator_name || '')
    );
  }, [submissions]);

  if (loading || authLoading) {
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
                <div className="text-xl font-semibold text-center">
                    <p>Campaign Not Found</p>
                    <p className="text-sm text-muted-foreground">This campaign may not exist or has been removed.</p>
                </div>
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
                <p className="text-muted-foreground">No submissions yet. Be the first!</p>
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
