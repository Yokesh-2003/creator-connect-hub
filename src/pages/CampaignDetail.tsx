
import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/layout/Navbar';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';

import VideoPlayer from '@/components/content/VideoPlayer';
import Leaderboard from '@/components/content/Leaderboard';
import SubmitBar from '@/components/content/SubmitBar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown } from 'lucide-react';

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

    const { data: submissionsData, error: submissionsError } = await supabase
      .from('submissions')
      .select('*, profiles(id, full_name, avatar_url), metrics(views)')
      .eq('campaign_id', id)
      .eq('status', 'approved') // Only show approved submissions
      .order('created_at', { ascending: false });

    if (submissionsError) {
      toast.error('Could not load submissions.');
    } else {
      setSubmissions(submissionsData || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadCampaignData();
  }, [id]);
  
  // When new submissions are added, we want to see them immediately
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`campaign-${id}-submissions`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'submissions', filter: `campaign_id=eq.${id}` },
        (payload) => {
          // Add new submission to the top of the list
          setSubmissions(prev => [payload.new, ...prev]); 
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);


  const sortedSubmissions = useMemo(() => {
    if (!submissions) return [];
    // Sort by views, descending
    return [...submissions].sort((a, b) => (b.metrics[0]?.views || 0) - (a.metrics[0]?.views || 0));
  }, [submissions]);

  const handleSelectSubmission = (submission: any) => {
    const index = sortedSubmissions.findIndex(s => s.id === submission.id);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  };

  const handleScroll = (direction: 'up' | 'down') => {
    const nextIndex = direction === 'down' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < sortedSubmissions.length) {
      setCurrentIndex(nextIndex);
    }
  };

  const currentSubmission = sortedSubmissions[currentIndex];

  if (loading || authLoading || !campaign) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Skeleton className="w-full max-w-6xl h-[70vh]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />
      <main className="container pt-20 pb-12">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">{campaign.title}</h1>
          <p className="text-md text-slate-400 mt-1">{campaign.description}</p>
        </div>

        {user && <SubmitBar campaignId={id!} onNewSubmission={loadCampaignData} />}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 w-full max-w-7xl mx-auto mt-4">
          
          <div className="lg:col-span-2 relative h-[75vh] flex items-center justify-center">
            {sortedSubmissions.length > 0 && currentSubmission ? (
              <div className="relative w-full h-full flex items-center justify-center">
                <VideoPlayer url={currentSubmission.content_url} />
                
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-2">
                  <Button size="icon" variant="secondary" onClick={() => handleScroll('up')} disabled={currentIndex === 0}>
                    <ArrowUp className="w-5 h-5" />
                  </Button>
                  <Button size="icon" variant="secondary" onClick={() => handleScroll('down')} disabled={currentIndex === sortedSubmissions.length - 1}>
                    <ArrowDown className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 rounded-xl">
                <p className="text-slate-400">No submissions yet.</p>
                <p className='text-sm text-slate-500'>Be the first one to submit!</p>
              </div>
            )}
          </div>

          <div className="h-[75vh] overflow-y-auto">
            <Leaderboard submissions={sortedSubmissions} onSelectSubmission={handleSelectSubmission} />
          </div>
        </div>
      </main>
    </div>
  );
}
