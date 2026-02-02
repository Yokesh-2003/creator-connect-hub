
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FaTiktok, FaLinkedin } from "react-icons/fa";
import { CheckCircle } from "lucide-react";
import { toast } from "react-hot-toast";

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
        toast.error("Campaign not found.");
        setError("Campaign not found.");
        setLoading(false);
        return;
      }
      const now = new Date();
      const startDate = new Date(campaignData.start_date);
      const endDate = new Date(campaignData.end_date);
      if (now < startDate || now > endDate) {
        toast.error("This campaign is not currently active.");
        setError("Campaign is not active.");
        setLoading(false);
        return;
      }
      setCampaign(campaignData);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to submit to a campaign.");
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
        const errorMessage = `Please connect your ${campaignData.platform} account to submit automatically.`;
        toast.error(errorMessage);
        setError(errorMessage);
        setLoading(false);
        return;
      }

      const socialAccount = socialAccounts[0];

      try {
        const { data, error: functionError } = await supabase.functions.invoke("fetch-user-posts", {
          body: { platform: campaignData.platform, socialAccountId: socialAccount.id, startDate: campaignData.start_date, endDate: campaignData.end_date },
        });

        if (functionError) {
          throw functionError;
        }

        setPosts(data.posts);
      } catch (e: any) {
        console.error("Content fetch error:", e);
        const errorMessage = "Failed to fetch your content automatically. Please submit a URL manually.";
        toast.error(errorMessage);
        setError(errorMessage);
      }

      setLoading(false);
    };

    fetchCampaignAndPosts();
  }, [id]);

  const handleManualSubmit = async () => {
    if (!manualUrl) {
      toast.error("Please enter a URL.");
      return;
    }

    const toastId = toast.loading("Submitting your link...");

    try {
      const { error } = await supabase.functions.invoke('submit-content', {
        body: {
          campaignId: id,
          url: manualUrl,
        },
      });

      if (error) throw error;

      toast.success("Submission successful!", { id: toastId });
      navigate(`/campaigns`);

    } catch (e: any) {
      toast.error(e.message || "Failed to submit. Please check the URL and try again.", { id: toastId });
    }
  };

  const handleSubmit = async () => {
    if (!selectedPost) {
        toast.error("Please select a post to submit.");
        return;
    }

    const toastId = toast.loading("Submitting your post...");

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            throw new Error("You must be logged in to submit.");
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

        if (submissionError) throw submissionError;

        toast.success("Post submitted successfully!", { id: toastId });
        navigate(`/campaigns`);

    } catch(e: any) {
        toast.error(e.message || "Failed to submit your post. Please try again.", { id: toastId });
    }
  };

  const PlatformIcon = campaign?.platform === 'tiktok' ? FaTiktok : FaLinkedin;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-24 pb-12">
        {loading ? (
          <p className="text-center">Loading campaign details...</p>
        ) : !campaign ? (
            <div className="text-center">
                <p className="text-red-500 mb-4">{error}</p>
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
                    className={`cursor-pointer transition-all ${selectedPost?.id === post.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
                    onClick={() => setSelectedPost(post)}
                  >
                    <CardContent className="p-4 relative">
                      {selectedPost?.id === post.id && (
                        <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1 z-10">
                          <CheckCircle className="w-5 h-5" />
                        </div>
                      )}
                      <div className="aspect-[9/16] bg-muted rounded-md mb-4 overflow-hidden">
                        <img src={post.thumbnail} alt={post.content} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground mb-2">
                          <PlatformIcon className="w-4 h-4 mr-2" />
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="font-semibold truncate text-sm">{post.content || "No caption"}</p>
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                          <span>Likes: {post.likes}</span>
                          <span>Comments: {post.comments}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <p className="text-muted-foreground">{error || "No eligible content was found automatically."}</p>
                    <p className="text-muted-foreground mb-4">You can submit a public post URL manually.</p>
                    <div className="flex justify-center mt-4">
                        <input
                        type="text"
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        placeholder={`Enter ${campaign.platform} post URL`}
                        className="p-2 border rounded-l-md sm:w-1/2 md:w-1/3"
                        />
                        <Button onClick={handleManualSubmit} className="rounded-r-md">
                          Submit Manually
                        </Button>
                    </div>
              </div>
            )}
            
            {posts.length > 0 && (
                <div className="mt-8 flex justify-end">
                    <Button onClick={handleSubmit} disabled={!selectedPost} size="lg">Submit Selected Post</Button>
                </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
