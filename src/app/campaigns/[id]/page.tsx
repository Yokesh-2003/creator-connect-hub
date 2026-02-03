'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// --- HELPER FUNCTIONS ---
const getPlatformFromUrl = (url: string) => {
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.includes('linkedin.com')) return 'linkedin';
  return 'other';
};

const getVideoId = (url: string, platform: string) => {
  try {
    const urlObj = new URL(url);
    if (platform === 'tiktok') {
      const parts = urlObj.pathname.split('/');
      return parts[parts.length - 1];
    }
    if (platform === 'youtube') {
      if (urlObj.hostname === 'youtu.be') {
        return urlObj.pathname.slice(1);
      }
      return urlObj.searchParams.get('v');
    }
  } catch (e) {
    console.error('Error parsing URL:', e);
    return null;
  }
  return null;
};

// --- SUB-COMPONENTS ---

const SubmitBar = ({ campaignId, onNewSubmission }: { campaignId: string; onNewSubmission: () => void }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL.');
      return;
    }
    setLoading(true);
    const submissionToast = toast.loading('Submitting your link...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('You must be logged in to submit.');
      }

      const platform = getPlatformFromUrl(url);
      if (platform === 'other') {
        throw new Error('Invalid URL. Please submit a TikTok, YouTube, or LinkedIn URL.');
      }

      const { error } = await supabase.from('submissions').insert({
        campaign_id: campaignId,
        creator_id: user.id,
        post_url: url,
        platform: platform,
      });

      if (error) throw error;

      toast.success('Submission successful!', { id: submissionToast });
      setUrl('');
      onNewSubmission(); 
    } catch (e: any) {
      toast.error('Submission failed.', { id: submissionToast, description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 p-4 rounded-lg mb-6">
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Submit your link..."
          className="p-2 text-base border bg-input text-foreground rounded-md w-full"
          disabled={loading}
        />
        <button onClick={handleSubmit} className="px-6 py-2 bg-blue-600 text-white rounded-md" disabled={loading}>
          {loading ? 'Submitting...' : 'Submit'}
        </button>
      </div>
    </div>
  );
};

const VideoPlayer = ({ submission, onVisible }: { submission: any, onVisible: (id: string) => void }) => {
  const videoId = getVideoId(submission.post_url, submission.platform);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onVisible(submission.id);
        }
      },
      { threshold: 0.9 } 
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [submission.id, onVisible]);

  const renderContent = () => {
    switch (submission.platform) {
      case 'tiktok':
        return (
          <iframe
            key={submission.id}
            src={`https://www.tiktok.com/embed/${videoId}`}
            className="w-full h-full rounded-xl"
            allow="autoplay; fullscreen"
          />
        );
      case 'youtube':
        return (
          <iframe
            key={submission.id}
            src={`https://www.youtube.com/embed/${videoId}`}
            className="w-full h-full rounded-xl"
            allow="autoplay; fullscreen"
          />
        );
      case 'linkedin':
        return (
          <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-xl">
            <a href={submission.post_url} target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-blue-600 text-white rounded-md text-lg">
              View on LinkedIn
            </a>
          </div>
        );
      default:
        return <p>Unsupported platform</p>;
    }
  };

  return (
    <div ref={ref} className="h-screen snap-start flex items-center justify-center bg-black">
        <div className="w-[360px] h-[640px]">
            {renderContent()}
        </div>
    </div>
  );
};


const VideoFeed = ({ submissions, onVisible }: { submissions: any[], onVisible: (id: string) => void }) => {
  if (submissions.length === 0) {
    return (
      <div className="h-full bg-slate-900 rounded-lg flex items-center justify-center">
        <p className="text-white">No submissions yet. Be the first to submit!</p>
      </div>
    );
  }

  return (
    <div className="h-full snap-y snap-mandatory overflow-y-scroll rounded-lg bg-slate-900">
      {submissions.map((sub) => (
        <VideoPlayer key={sub.id} submission={sub} onVisible={onVisible} />
      ))}
    </div>
  );
};

const Leaderboard = ({ leaderboardData }: { leaderboardData: any[] }) => (
  <div className="h-full bg-slate-900 rounded-lg p-4">
    <h2 className="text-lg font-semibold text-white mb-4">Leaderboard</h2>
    <ul className="space-y-3">
      {leaderboardData.map((entry, index) => (
        <li key={entry.creator_id} className="flex justify-between items-center text-white bg-slate-800 p-2 rounded-md">
          <span>#{index + 1} {entry.creator_id.substring(0, 8)}...</span>
          <span className="font-bold">{entry.total_views} views</span>
        </li>
      ))}
    </ul>
  </div>
);

// --- MAIN PAGE COMPONENT ---
export default function CampaignPage() {
  const { id: campaignId } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const viewedThisSession = useRef(new Set());

  const fetchData = useCallback(async () => {
    if (!campaignId) return;

    // Fetch campaign details
    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError) throw new Error('Failed to fetch campaign details.');
    setCampaign(campaignData);

    // Fetch submissions
    const { data: submissionsData, error: submissionsError } = await supabase
      .from('submissions')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });
    
    if (submissionsError) throw new Error('Failed to fetch submissions.');
    setSubmissions(submissionsData || []);

    // Fetch leaderboard data
    const { data: leaderboard, error: leaderboardError } = await supabase.rpc('get_leaderboard', { campaign_id_param: campaignId });

    if (leaderboardError) throw new Error('Failed to fetch leaderboard.');
    setLeaderboardData(leaderboard || []);

  }, [campaignId]);

  useEffect(() => {
    setLoading(true);
    fetchData().catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, [fetchData]);

  const handleNewSubmission = () => {
    fetchData().catch(e => toast.error(e.message));
  };

  const handleImpression = useCallback(async (submissionId: string) => {
    if (viewedThisSession.current.has(submissionId)) {
        return;
    }

    viewedThisSession.current.add(submissionId);

    await supabase.rpc('increment_view_count', { submission_id_param: submissionId });
    
    // Optimistically update leaderboard, or refetch
    fetchData(); // For simplicity, refetching everything

  }, [fetchData]);

  if (loading) {
    return <div className="h-screen bg-slate-950 flex items-center justify-center text-white">Loading campaign...</div>;
  }

  if (!campaign) {
    return <div className="h-screen bg-slate-950 flex items-center justify-center text-white">Campaign not found.</div>;
  }

  return (
    <div className="h-screen bg-slate-950 p-6">
      {campaignId && <SubmitBar campaignId={campaignId} onNewSubmission={handleNewSubmission} />}
      <div className="grid grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
        <div className="col-span-2">
          <VideoFeed submissions={submissions} onVisible={handleImpression} />
        </div>
        <div className="col-span-1">
          <Leaderboard leaderboardData={leaderboardData} />
        </div>
      </div>
    </div>
  );
}
