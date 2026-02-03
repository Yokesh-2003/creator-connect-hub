
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Calendar, Users, DollarSign, ExternalLink, Medal, List } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';
import { FaTiktok, FaLinkedin } from 'react-icons/fa';

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    if (id) {
      loadCampaign();
    }
  }, [id]);

  const loadCampaign = async () => {
    if (!id) return;
    setLoading(true);

    const { data: campaignData, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    if (campaignError || !campaignData) {
      toast.error('Error', { description: 'Campaign not found.' });
      navigate('/campaigns');
      return;
    }
    setCampaign(campaignData);

    const { data: submissionsData, error: submissionsError } = await supabase
      .from('submissions')
      .select(`
        id,
        status,
        content_url,
        submitted_at,
        creator:profiles(full_name, avatar_url),
        metrics(views, likes, comments, impressions)
      `)
      .eq('campaign_id', id)
      .order('submitted_at', { ascending: false });

    if (submissionsError) {
      toast.error('Error', { description: 'Could not load submissions.' });
      setLoading(false);
      return;
    }
    
    setSubmissions(submissionsData || []);
    
    // Separate logic for leaderboard (only approved submissions)
    const approvedSubmissions = submissionsData?.filter(s => s.status === 'approved') || [];
    const sortedLeaderboard = approvedSubmissions.map(sub => {
      const score = campaignData?.campaign_type === 'leaderboard' 
        ? sub.metrics?.[0]?.views || 0 
        : sub.metrics?.[0]?.impressions || 0;
      return { ...sub, score };
    }).sort((a, b) => b.score - a.score);
    setLeaderboard(sortedLeaderboard);
    
    setLoading(false);
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container pt-24 pb-12">
          <Card>
            <CardContent className="pt-6">
              <p>Campaign not found</p>
              <Button className="mt-4" onClick={() => navigate('/campaigns')}>Back to Campaigns</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const PlatformIcon = campaign.platform === 'tiktok' ? FaTiktok : FaLinkedin;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-24 pb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                  campaign.platform === 'tiktok' ? 'from-[#ff0050] to-[#00f2ea]' : 'from-[#0077b5] to-[#00a0dc]'
                } flex items-center justify-center`}>
                  <PlatformIcon className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-4xl font-bold">{campaign.title}</h1>
              </div>
              <p className="text-lg text-muted-foreground mb-4">{campaign.description}</p>
            </div>
            <Button onClick={() => navigate(`/campaigns/${id}/submit`)}>Submit Content</Button>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <Calendar className="w-5 h-5 text-muted-foreground mb-2" />
                <div className="text-sm text-muted-foreground">Campaign Period</div>
                <div className="font-semibold">
                  {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Users className="w-5 h-5 text-muted-foreground mb-2" />
                <div className="text-sm text-muted-foreground">Total Submissions</div>
                <div className="font-semibold">{submissions.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                {campaign.campaign_type === 'leaderboard' ? (
                  <>
                    <Trophy className="w-5 h-5 text-warning mb-2" />
                    <div className="text-sm text-muted-foreground">Prize Pool</div>
                    <div className="font-semibold">${campaign.budget?.toFixed(2) || '0.00'}</div>
                  </>
                ) : (
                  <>
                    <DollarSign className="w-5 h-5 text-success mb-2" />
                    <div className="text-sm text-muted-foreground">CPM Rate</div>
                    <div className="font-semibold">${campaign.cpm_rate?.toFixed(2) || '0.00'} per 1K</div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </motion.div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Leaderboard
            </CardTitle>
            <p className="text-sm text-muted-foreground">Top performing approved submissions. Ranked by views.</p>
          </CardHeader>
          <CardContent>
            {leaderboard.length > 0 ? (
              <div className="space-y-3">
                {leaderboard.slice(0, 10).map((submission: any, index: number) => {
                  const rank = index + 1;
                  return (
                    <motion.div
                      key={submission.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-lg border ${
                        rank === 1 ? 'border-warning bg-warning/5' :
                        rank === 2 ? 'border-border bg-muted/30' :
                        rank === 3 ? 'border-amber-300 bg-amber-50/50' :
                        'border-border'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                          rank === 1 ? 'bg-warning text-warning-foreground' :
                          rank === 2 ? 'bg-muted text-muted-foreground' :
                          rank === 3 ? 'bg-amber-200 text-amber-900' :
                          'bg-background border'
                        }`}>
                          {rank === 1 && <Medal className="w-6 h-6" />}
                          {rank !== 1 && rank}
                        </div>
                        <Avatar>
                          <AvatarImage src={submission.creator?.avatar_url} alt={submission.creator?.full_name} />
                          <AvatarFallback>{submission.creator?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-semibold">{submission.creator?.full_name || 'Anonymous'}</div>
                          <div className="text-sm text-muted-foreground">
                            {submission.score.toLocaleString()} views
                          </div>
                        </div>
                        <a href={submission.content_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Trophy className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No approved submissions yet</p>
                <p className="text-sm mt-1">Submit your content and get it approved to appear on the leaderboard.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <List className="w-5 h-5" />
              All Submissions
            </CardTitle>
             <p className="text-sm text-muted-foreground">All public submissions for this campaign, updated in real-time.</p>
          </CardHeader>
          <CardContent>
            {submissions.length > 0 ? (
              <div className="space-y-4">
                {submissions.map((submission: any) => (
                  <div key={submission.id} className="p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={submission.creator?.avatar_url} alt={submission.creator?.full_name} />
                          <AvatarFallback>{submission.creator?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{submission.creator?.full_name || 'Anonymous'}</h4>
                          <p className="text-xs text-muted-foreground">
                            Submitted on {new Date(submission.submitted_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <a
                        href={submission.content_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 text-sm"
                      >
                        View Post <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                  <List className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No submissions yet</p>
                  <p className="text-sm mt-1">Be the first to submit your content to this campaign.</p>
              </div>
            )}
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
