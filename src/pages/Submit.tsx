
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FaTiktok, FaLinkedin } from "react-icons/fa";
import { CheckCircle } from "lucide-react";

export default function Submit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState("");

  useEffect(() => {
    const fetchCampaignAndPosts = async () => {
      setLoading(true);
      const { data: campaignData, error: campaignError } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", id)
        .single();

      if (campaignError || !campaignData) {
        setError("Campaign not found.");
        setLoading(false);
        return;
      }
      const now = new Date();
      const startDate = new Date(campaignData.start_date);
      const endDate = new Date(campaignData.end_date);
      if (now < startDate || now > endDate) {
        setError("Campaign is not active.");
        setLoading(false);
        return;
      }
      setCampaign(campaignData);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("You must be logged in to submit to a campaign.");
        setLoading(false);
        return;
      }

      const { data: socialAccounts, error: accountsError } = await supabase
        .from('social_accounts')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('platform', campaignData.platform);

      if (accountsError || !socialAccounts || socialAccounts.length === 0) {
        setError(`You do not have a connected ${campaignData.platform} account.`);
        setLoading(false);
        return;
      }

      const socialAccount = socialAccounts[0];

      try {
        const { data, error: functionError } = await supabase.functions.invoke("fetch-user-posts", {
          body: { platform: campaignData.platform, socialAccountId: socialAccount.id },
        });

        if (functionError) {
          throw functionError;
        }

        setPosts(data.posts);
      } catch (e: any) {
        console.error("Content fetch error:", e);
        setError("Failed to fetch your content automatically. Please submit manually.");
      }

      setLoading(false);
    };

    fetchCampaignAndPosts();
  }, [id]);

  const handleManualSubmit = async () => {
    if (!manualUrl) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError("You must be logged in to submit.");
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('submit-content', {
        body: {
          campaignId: id,
          url: manualUrl,
        },
      });

      if (error) throw error;

      navigate(`/campaigns`);

    } catch (e: any) {
      setError(e.message || "Failed to submit manually. Please check the URL and try again.");
    }
  };

  const handleSubmit = async () => {
    if (!selectedPost) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        setError("You must be logged in to submit to a campaign.");
        return;
    }

    const { error: submissionError } = await supabase.from("submissions").insert({
      campaign_id: id,
      user_id: session.user.id,
      platform: campaign.platform,
      platform_content_id: selectedPost.id,
      content_url: selectedPost.mediaUrl,
      engagement_snapshot: {
        views: selectedPost.views,
        likes: selectedPost.likes,
        comments: selectedPost.comments,
      },
    });

    if (submissionError) {
      setError("Failed to submit your post. Please try again.");
    } else {
      navigate(`/campaigns`);
    }
  };

  const PlatformIcon = campaign?.platform === 'tiktok' ? FaTiktok : FaLinkedin;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-24 pb-12">
        {loading ? (
          <p>Loading...</p>
        ) : error && !posts.length ? (
            <div className="text-center">
                <p className="text-red-500 mb-4">{error}</p>
                <h2 className="text-2xl font-semibold mb-4">Submit Manually</h2>
                <div className="flex justify-center">
                    <input
                    type="text"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    placeholder="Enter post URL"
                    className="p-2 border rounded-l-md w-1/2"
                    />
                    <Button onClick={handleManualSubmit} className="rounded-r-md">
                    Submit
                    </Button>
                </div>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold mb-2">Submit to {campaign.title}</h1>
            <p className="text-lg text-muted-foreground mb-8">Select a post to submit for this campaign.</p>
            {posts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {posts.map((post) => (
                  <Card
                    key={post.id}
                    className={`cursor-pointer ${selectedPost?.id === post.id ? 'border-primary' : ''}`}
                    onClick={() => setSelectedPost(post)}
                  >
                    <CardContent className="p-4 relative">
                      {selectedPost?.id === post.id && (
                        <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      )}
                      <img src={post.thumbnail} alt={post.content} className="w-full h-48 object-cover rounded-md mb-4" />
                      <div className="flex items-center text-sm text-muted-foreground mb-2">
                          <PlatformIcon className="w-4 h-4 mr-2" />
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="font-semibold truncate">{post.content}</p>
                      <div className="flex justify-between text-sm mt-2">
                          <span>Likes: {post.likes}</span>
                          <span>Comments: {post.comments}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
                <div className="text-center">
                    <p>No content found automatically. You can submit a URL manually.</p>
                    <div className="flex justify-center mt-4">
                        <input
                        type="text"
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        placeholder="Enter post URL"
                        className="p-2 border rounded-l-md w-1/2"
                        />
                        <Button onClick={handleManualSubmit} className="rounded-r-md">
                        Submit
                        </Button>
                    </div>
              </div>
            )}
            <div className="mt-8 flex justify-end">
                <Button onClick={handleSubmit} disabled={!selectedPost}>Submit Selected Post</Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
