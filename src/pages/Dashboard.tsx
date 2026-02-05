
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FaTiktok, FaLinkedin, FaYoutube, FaInstagram } from 'react-icons/fa';
import { Link2, Eye, DollarSign, Trophy, Plus, RefreshCw, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { initiateTikTokOAuth, disconnectTikTok } from '@/lib/oauth/tiktok';
import { getUserSubmissions } from '@/lib/services/submissions';
import { refreshSubmissionMetrics } from '@/lib/services/metrics';
import { useToast } from '@/hooks/use-toast';

const platforms = [
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: FaTiktok,
    color: 'from-[#ff0050] to-[#00f2ea]',
    supported: true,
    requiresLogin: true,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: FaLinkedin,
    color: 'from-[#0077b5] to-[#00a0dc]',
    supported: true,
    requiresLogin: true,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: FaYoutube,
    color: 'from-[#ff0000] to-[#ff4444]',
    supported: false,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: FaInstagram,
    color: 'from-[#f09433] via-[#dc2743] to-[#bc1888]',
    supported: false,
  },
];

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [socialAccounts, setSocialAccounts] = useState<Record<string, any>>({});
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [stats, setStats] = useState({ views: 0, campaigns: 0, earnings: 0, accounts: 0 });
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;

    const handleTikTokCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const returnedState = params.get("state");
      const storedState = sessionStorage.getItem("tiktok_oauth_state");

      if (!code || !storedState || returnedState !== storedState) return;

      sessionStorage.removeItem("tiktok_oauth_state");

      const { error } = await supabase
        .from("social_accounts")
        .upsert(
          {
            user_id: user.id,
            platform: "tiktok",
            username: "Connected",
            is_connected: true,
          } as any,
          { onConflict: "user_id,platform" }
        );

      if (error) {
        console.error("TikTok upsert failed:", error);
        return;
      }

      await loadSocialAccounts();

      toast({
        title: "TikTok connected",
        description: "Your TikTok account was successfully connected",
      });

      window.history.replaceState({}, document.title, "/dashboard");
    };

    handleTikTokCallback();
  }, [user]);

  useEffect(() => {
    if (!loading && user) {
      loadSocialAccounts();
      loadSubmissions();
    }
  }, [loading, user]);

  const loadSocialAccounts = async () => {
    if (!user) return;

    setLoadingAccounts(true);

    const { data } = await supabase
      .from('social_accounts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_connected', true);

    const accountsMap: Record<string, any> = {};
    data?.forEach((account) => {
      accountsMap[account.platform] = account;
    });

    setSocialAccounts(accountsMap);
    setStats(prev => ({ ...prev, accounts: data?.length || 0 }));

    setLoadingAccounts(false);
  };

  const loadSubmissions = async () => {
    if (!user) return;

    const subs = await getUserSubmissions();
    setSubmissions(subs || []);

    // Calculate stats
    let totalViews = 0;
    const campaignIds = new Set<string>();
    subs?.forEach((sub: any) => {
      campaignIds.add(sub.campaign_id);
      const latestMetrics = sub.metrics?.[sub.metrics.length - 1];
      if (latestMetrics) {
        totalViews += latestMetrics.views || 0;
      }
    });

    setStats(prev => ({
      ...prev,
      views: totalViews,
      campaigns: campaignIds.size,
    }));
  };

  const initiateTikTokSandboxOAuth = () => {
    const state = crypto.randomUUID();
    sessionStorage.setItem("tiktok_oauth_state", state);

    const authUrl =
      "https://www.tiktok.com/v2/auth/authorize" +
      "?client_key=" + import.meta.env.VITE_TIKTOK_CLIENT_KEY +
      "&response_type=code" +
      "&scope=user.info.basic" +
      "&redirect_uri=" +
      encodeURIComponent(import.meta.env.VITE_TIKTOK_REDIRECT_URI) +
      "&state=" + state;

    window.location.href = authUrl;
  };

  const handleConnect = async (platform: string) => {
    if (platform === 'tiktok') {
      initiateTikTokSandboxOAuth();
      return;
    }

    if (platform === 'linkedin') {
      const state = crypto.randomUUID();
      sessionStorage.setItem("linkedin_oauth_state", state);

      const authUrl =
        "https://www.linkedin.com/oauth/v2/authorization" +
        "?response_type=code" +
        "&client_id=" + import.meta.env.VITE_LINKEDIN_CLIENT_ID +
        "&redirect_uri=" + encodeURIComponent(import.meta.env.VITE_LINKEDIN_REDIRECT_URI) +
        "&state=" + state +
        "&scope=" + encodeURIComponent("openid profile email");

      window.location.href = authUrl;
      return;
    }

    toast({
      title: 'Coming soon',
      description: `${platform} integration is coming soon.`,
    });
  };

  const handleDisconnect = async (platform: string) => {
    try {
      let result;
      if (platform === 'tiktok') {
        result = await disconnectTikTok();
      } else if (platform === 'linkedin') {
        if (user) {
            const { error } = await supabase
                .from('social_accounts')
                .delete()
                .eq('user_id', user.id)
                .eq('platform', 'linkedin');
            if (!error) {
                result = { success: true };
            } else {
                result = { success: false, error: error.message };
            }
        }
      } else {
        return;
      }

      if (result.success) {
        toast({ title: 'Account disconnected', description: `${platform} account has been disconnected.` });
        loadSocialAccounts();
      } else {
        toast({
          title: 'Disconnect failed',
          description: result.error || 'Failed to disconnect account',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Disconnect failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleRefreshMetrics = async () => {
    setRefreshing(true);
    try {
      for (const submission of submissions) {
        await refreshSubmissionMetrics(submission.id);
      }
      await loadSubmissions();
      toast({ title: 'Metrics refreshed', description: 'All submission metrics have been updated.' });
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Creator Dashboard</h1>
          <p className="text-muted-foreground">Connect your accounts and start earning</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: Eye, value: stats.views.toLocaleString(), label: 'Total Views', color: 'text-info' },
            { icon: Trophy, value: stats.campaigns.toString(), label: 'Campaigns Joined', color: 'text-warning' },
            { icon: DollarSign, value: `$${stats.earnings.toFixed(2)}`, label: 'Total Earnings', color: 'text-success' },
            { icon: Link2, value: stats.accounts.toString(), label: 'Connected Accounts', color: 'text-primary' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Connected Accounts */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="w-5 h-5" />
              Connected Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {platforms.map((platform) => {
                const account = socialAccounts[platform.id];
                const isConnected = !!account;
                return (
                  <div
                    key={platform.id}
                    className="p-4 rounded-xl border border-border hover:border-primary/50 transition-all"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center mb-3`}>
                      <platform.icon className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-semibold mb-1">{platform.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {isConnected ? account.username || 'Connected' : 'Not connected'}
                    </p>
                    <Button
                      size="sm"
                      className="w-full"
                      variant={isConnected ? 'outline' : 'default'}
                      disabled={loadingAccounts || !platform.supported}
                      onClick={() => isConnected ? handleDisconnect(platform.id) : handleConnect(platform.id)}
                    >
                      {isConnected ? 'Disconnect' : platform.supported ? 'Connect' : 'Coming Soon'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Active Submissions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>My Submissions</CardTitle>
            <div className="flex gap-2">
              {submissions.length > 0 && (
                <Button size="sm" variant="outline" onClick={handleRefreshMetrics} disabled={refreshing}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh Metrics
                </Button>
              )}
              <Button size="sm" onClick={() => navigate('/campaigns')}>
                <Plus className="w-4 h-4 mr-2" />
                Submit Content
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No submissions yet. Join a campaign and submit your content!</p>
                <Button variant="outline" className="mt-4" onClick={() => navigate('/campaigns')}>
                  Browse Campaigns
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission: any) => {
                  const latestMetrics = submission.metrics?.[submission.metrics.length - 1] || {};
                  return (
                    <div key={submission.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{submission.campaign?.title}</h4>
                          <p className="text-sm text-muted-foreground">{submission.campaign?.platform}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs ${
                          submission.status === 'approved' ? 'bg-success/20 text-success' :
                          submission.status === 'pending' ? 'bg-warning/20 text-warning' :
                          'bg-destructive/20 text-destructive'
                        }`}>
                          {submission.status}
                        </span>
                      </div>
                      <a
                        href={submission.content_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1 mb-3"
                      >
                        View Content <ExternalLink className="w-3 h-3" />
                      </a>
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
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
