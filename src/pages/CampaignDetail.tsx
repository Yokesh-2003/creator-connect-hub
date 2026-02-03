
import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/layout/Navbar';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';

import VideoPlayer from '@/components/content/VideoPlayer';
import Leaderboard from '@/components/content/Leaderboard';
import SubmitBar from '@/components/content/SubmitBar';
import CreatorContentFetcher from '@/components/content/CreatorContentFetcher';

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const supabase = createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
  );

  const loadCampaignData = async () => {
    if (!id) return;
    setLoading(true);

    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (campaignError || !campaignData) {
      toast.error('Campaign not found.');
      navigate('/campaigns');
      return;
    }
    setCampaign(campaignData);

    const { data: submissionData, error: submissionError } = await supabase
      .from('submissions')
      .select('*, profiles(username)')
      .eq('campaign_id', id)
      .order('view_count', { ascending: false })
      .order('created_at', { ascending: true });

    if (submissionError) {
      toast.error('Could not load submissions.');
    } else {
      setSubmissions(submissionData.map(s => ({...s, creator_name: s.profiles.username})));
    }
    setLoading(false);
  };


  useEffect(() => {
    loadCampaignData();
  }, [id]);

  const handleNewSubmission = (submission: any) => {
    setSubmissions(prev => [...prev, {...submission, profiles: {username: user?.user_metadata.user_name}}].sort((a,b) => b.view_count - a.view_count || a.creator_name.localeCompare(b.creator_name)));
    loadCampaignData();
  };

  const sortedSubmissions = useMemo(() => {
    return [...submissions].sort((a, b) => {
      if (b.view_count !== a.view_count) {
        return b.view_count - a.view_count;
      }
      return a.creator_name.localeCompare(b.creator_name);
    });
  }, [submissions]);

  if (loading || authLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-xl font-semibold">Loading...</div>
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
        <div className="w-full">
          {user && (
            <CreatorContentFetcher
              platform={campaign.platform}
              onSubmission={handleNewSubmission}
              campaignId={campaign.id}
            >
              {(fetcher) => (
                <SubmitBar
                  campaignId={campaign.id}
                  onNewSubmission={handleNewSubmission}
                  platform={campaign.platform}
                  contentFetcher={fetcher}
                />
              )}
            </CreatorContentFetcher>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
          <div className="md:col-span-2 h-[60vh] md:h-auto">
            {sortedSubmissions.length > 0 ? (
              <VideoPlayer
                submissions={sortedSubmissions}
                currentIndex={currentIndex}
                setCurrentIndex={setCurrentIndex}
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-muted rounded-lg">
                <p>No submissions yet.</p>
              </div>
            )}
          </div>
  
          <div className="h-[60vh] md:h-auto">
            <Leaderboard submissions={sortedSubmissions} />
          </div>
        </div>
      </main>
    </div>
  );
}
