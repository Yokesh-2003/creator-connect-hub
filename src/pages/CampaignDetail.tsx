import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trophy, Calendar, Users, DollarSign, RefreshCw, ExternalLink, Medal } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { submitContent } from '@/lib/services/submissions';
import { refreshCampaignMetrics } from '@/lib/services/metrics';
import { useToast } from '@/hooks/use-toast';
import { FaTiktok, FaLinkedin } from 'react-icons/fa';

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [contentUrl, setContentUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (id) {
      loadCampaign();
    }
  }, [id, user, authLoading, navigate]);

  const loadCampaign = async () => {
    if (!id || !user) return;

    setLoading(true);

    // Load campaign
    const { data: campaignData } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', id)
      .single();

    setCampaign(campaignData);

    // Load leaderboard/submissions
    const { data: submissionsData } = await supabase
      .from('submissions')
      .select(`
        *,
        creator:profiles!submissions_creator_id_fkey(full_name, email),
        social_account:social_accounts(*),
        metrics:metrics(*)
      `)
      .eq('campaign_id', id)
      .eq('status', 'approved')
      .order('submitted_at', { ascending: false });

    // Sort by metrics for leaderboard
    const sorted = (submissionsData || []).map((sub: any) => {
      const latestMetrics = sub.metrics?.[sub.metrics.length - 1] || {};
      const score = campaignData?.campaign_type === 'leaderboard' 
        ? latestMetrics.views || 0 
        : latestMetrics.impressions || 0;
      return { ...sub, score };
    }).sort((a: any, b: any) => b.score - a.score);

    setSubmissions(sorted);

    // Load user's connected accounts for this platform
    const { data: accountsData } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('platform', campaignData?.platform)
      .eq('is_connected', true);

    setSocialAccounts(accountsData || []);
    if (accountsData && accountsData.length > 0) {
      setSelectedAccount(accountsData[0].id);
    }

    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!contentUrl.trim() || !selectedAccount || !id) {
      toast({
        title: 'Missing information',
        description: 'Please enter a content URL and select an account.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const contentType = campaign?.platform === 'linkedin' ? 'post' : 'video';
      const result = await submitContent(id, selectedAccount, contentUrl, contentType);

      if (result.success) {
        toast({
          title: 'Submission successful!',
          description: 'Your content has been submitted for review.',
        });
        setContentUrl('');
        loadCampaign();
      } else {
        toast({
          title: 'Submission failed',
          description: result.error || 'Failed to submit content',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Submission failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefreshMetrics = async () => {
    if (!id) return;
    setRefreshing(true);
    try {
      await refreshCampaignMetrics(id);
      await loadCampaign();
      toast({ title: 'Metrics refreshed', description: 'All metrics have been updated.' });
    } catch (error) {
      toast({
        title: 'Refresh failed',
        description: error instanceof Error ? error.message : 'Failed to refresh metrics',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
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

  const platformIcon = campaign.platform === 'tiktok' ? FaTiktok : FaLinkedin;
  const PlatformIcon = platformIcon;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-24 pb-12">
        {/* Campaign Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
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
            {socialAccounts.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Submit Content</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Submit Your Content</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Select Account</Label>
                      <select
                        className="w-full mt-2 px-3 py-2 border rounded-md"
                        value={selectedAccount}
                        onChange={(e) => setSelectedAccount(e.target.value)}
                      >
                        {socialAccounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.display_name || account.username || account.platform}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>Content URL</Label>
                      <Input
                        type="url"
                        placeholder={`Paste your ${campaign.platform} content URL here`}
                        value={contentUrl}
                        onChange={(e) => setContentUrl(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                      {submitting ? 'Submitting...' : 'Submit'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid md:grid-cols-4 gap-4">
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
                <div className="text-sm text-muted-foreground">Participants</div>
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
            <Card>
              <CardContent className="pt-6">
                <Button
                  variant="outline"
                  onClick={handleRefreshMetrics}
                  disabled={refreshing}
                  className="w-full"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh Metrics
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Leaderboard */}
        {campaign.campaign_type === 'leaderboard' && submissions.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {submissions.slice(0, 10).map((submission: any, index: number) => {
                  const latestMetrics = submission.metrics?.[submission.metrics.length - 1] || {};
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
                        <div className="flex-1">
                          <div className="font-semibold">{submission.creator?.full_name || 'Anonymous'}</div>
                          <div className="text-sm text-muted-foreground">
                            {latestMetrics.views?.toLocaleString() || 0} views
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{latestMetrics.views?.toLocaleString() || 0}</div>
                          <div className="text-xs text-muted-foreground">views</div>
                        </div>
                        <a
                          href={submission.content_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Submissions */}
        {submissions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>All Submissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submissions.map((submission: any) => {
                  const latestMetrics = submission.metrics?.[submission.metrics.length - 1] || {};
                  return (
                    <div key={submission.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{submission.creator?.full_name || 'Anonymous'}</h4>
                          <p className="text-sm text-muted-foreground">{submission.social_account?.username}</p>
                        </div>
                        <a
                          href={submission.content_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Views</div>
                          <div className="font-semibold">{latestMetrics.views?.toLocaleString() || 0}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Likes</div>
                          <div className="font-semibold">{latestMetrics.likes?.toLocaleString() || 0}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Comments</div>
                          <div className="font-semibold">{latestMetrics.comments?.toLocaleString() || 0}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Impressions</div>
                          <div className="font-semibold">{latestMetrics.impressions?.toLocaleString() || 0}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {submissions.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <p className="text-muted-foreground mb-4">No submissions yet. Be the first to participate!</p>
              {socialAccounts.length === 0 ? (
                <Button onClick={() => navigate('/dashboard')}>
                  Connect Your {campaign.platform === 'tiktok' ? 'TikTok' : 'LinkedIn'} Account
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">Use the "Submit Content" button above to participate.</p>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
