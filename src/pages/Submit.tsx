
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { FaTiktok, FaLinkedin } from "react-icons/fa";
import { CheckCircle, Eye, Heart } from "lucide-react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const platformIcons: Record<string, any> = {
  tiktok: FaTiktok,
  linkedin: FaLinkedin,
};

const formatViews = (views: number) => {
  if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
  if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
  return views;
};

export default function Submit() {
  const { id: campaignId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState("");

  useEffect(() => {
    const fetchCampaignAndPosts = async () => {
      if (!campaignId) return;
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Authentication required", { description: "Please log in to submit content." });
        navigate(`/auth?redirect=/campaigns/${campaignId}/submit`);
        setLoading(false);
        return;
      }

      const { data: campaignData, error: campaignError } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

      if (campaignError || !campaignData) {
        toast.error("Error", { description: "Campaign not found." });
        setError("Campaign not found.");
        setLoading(false);
        return;
      }
      setCampaign(campaignData);
      
      const now = new Date();
      const startDate = new Date(campaignData.start_date);
      const endDate = new Date(campaignData.end_date);
      if (now < startDate || now > endDate) {
        toast.error("Campaign Not Active", { description: "This campaign is not currently running." });
        setError("This campaign is not active.");
        setLoading(false);
        return;
      }

      const { data: socialAccounts, error: accountsError } = await supabase
        .from('social_accounts')
        .select('id, platform')
        .eq('user_id', session.user.id)
        .eq('platform', campaignData.platform);

      if (accountsError || !socialAccounts || !socialAccounts.length) {
        const errorMessage = `Please connect your ${campaignData.platform} account to submit content automatically.`;
        toast.error("Account Not Connected", { description: errorMessage });
        setError(errorMessage);
        setLoading(false);
        return;
      }
      const socialAccount = socialAccounts[0];

      try {
        const { data, error: functionError } = await supabase.functions.invoke("fetch-user-posts", {
          body: {
            platform: campaignData.platform,
            socialAccountId: socialAccount.id,
            campaignId: campaignId,
          },
        });
        
        console.log("Response from fetch-user-posts:", data);

        if (functionError) {
          throw functionError;
        }

        const userPosts = Array.isArray(data) ? data : data?.posts || [];
        setPosts(userPosts);

        if (userPosts.length === 0) {
          setError("We couldn’t find any eligible posts from your connected accounts.");
        }
      } catch (e: any) {
        console.error("Content fetch error:", e);
        setError("Failed to fetch your content automatically.");
        toast.error("Could Not Fetch Content", {
          description: "We couldn't load your posts automatically. You can try submitting a URL manually.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignAndPosts();
  }, [campaignId, navigate, supabase]);

  const handleSubmit = async () => {
    if (!selectedPost || !campaignId) {
      toast.error("Error", { description: "Please select a post to submit." });
      return;
    }

    const submissionToast = toast.loading("Submitting your post...");

    try {
      const { error } = await supabase.functions.invoke('submit-content', {
        body: {
          campaign_id: campaignId,
          content_id: selectedPost.content_id,
          content_url: selectedPost.content_url,
          platform: selectedPost.platform,
          thumbnail_url: selectedPost.thumbnail_url,
        }
      });

      if (error) throw error;

      toast.success("Submission successful!", { 
        description: "Redirecting you to the campaign.",
        id: submissionToast,
        onAutoClose: () => navigate(`/campaigns/${campaignId}`) 
      });

    } catch (e: any) {
      toast.error("Submission Failed", { 
        description: e.message || "An unexpected error occurred.",
        id: submissionToast
      });
    }
  };
  
  const renderSkeletons = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="aspect-[9/16] bg-muted animate-pulse rounded-lg"></div>
      ))}
    </div>
  );

  const renderContentSelector = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-24">
      {posts.map((post) => {
        const isSelected = selectedPost?.content_id === post.content_id;
        const PostPlatformIcon = platformIcons[post.platform];
        return (
          <div
            key={post.content_id}
            className={`relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${isSelected ? 'ring-4 ring-primary' : 'ring-0 ring-transparent'}`}
            onClick={() => setSelectedPost(post)}
          >
            <div className="aspect-[9/16] bg-muted">
              {post.thumbnail_url && <img src={post.thumbnail_url} alt="Post thumbnail" className="w-full h-full object-cover" />}
            </div>
            {isSelected && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1 z-10">
                <CheckCircle className="w-5 h-5" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
            {PostPlatformIcon && (
              <div className="absolute top-2 left-2 bg-black/30 backdrop-blur-sm rounded-full p-1.5">
                <PostPlatformIcon className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 right-2 text-white text-sm">
                <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span>{formatViews(post.views)}</span>
                    {post.likes != null && (
                        <>
                            <span className="mx-1">·</span>
                            <div className="flex items-center gap-1">
                                <Heart className="w-4 h-4" />
                                <span>{formatViews(post.likes)}</span>
                            </div>
                        </>
                    )}
                </div>
            </div>
          </div>
        );
      })}
    </div>
  );
  
  const renderFallback = () => (
    <div className="max-w-lg mx-auto text-center p-8 bg-background rounded-lg border-2 border-dashed border-muted">
      <h3 className="text-lg font-semibold text-foreground">No Content Found</h3>
      <p className="text-sm text-muted-foreground mt-2">
        {error}
      </p>
      <Accordion type="single" collapsible className="w-full mt-6">
        <AccordionItem value="manual-submit">
          <AccordionTrigger className="text-sm">Can’t find your post?</AccordionTrigger>
          <AccordionContent>
            <p className="text-sm text-muted-foreground mb-4 text-left">
              If your content doesn't appear automatically, you can submit the public URL manually.
            </p>
            <div className="flex">
              <input
                type="text"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder={`Enter ${campaign?.platform || 'post'} URL`}
                className="p-2 text-sm border bg-transparent rounded-l-md w-full"
              />
              <Button
                onClick={async () => {
                  if (!manualUrl) {
                    toast.error("Please enter a URL.");
                    return;
                  }
                  if (!campaignId) {
                    toast.error("Campaign not found.");
                    return;
                  }
                  const submissionToast = toast.loading("Submitting your link...");
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (!session) {
                      throw new Error('User not authenticated');
                    }

                    const response = await fetch(
                      `https://ihpjvegabepbbjydvxfe.supabase.co/functions/v1/submit-content`,
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          Authorization: `Bearer ${session.access_token}`,
                        },
                        body: JSON.stringify({
                          campaign_id: campaignId,
                          post_url: manualUrl,
                        }),
                      }
                    );

                    if (!response.ok) {
                      let errorMsg = `Request failed with status: ${response.status}`;
                      try {
                        const errorBody = await response.json();
                        errorMsg = errorBody.error || errorBody.message || JSON.stringify(errorBody);
                      } catch (e) {
                        errorMsg = response.statusText || 'An unknown error occurred.';
                      }
                      throw new Error(errorMsg);
                    }

                    toast.success("Submission successful!", {
                      id: submissionToast,
                      description: "Your manual submission was received.",
                      onAutoClose: () => navigate(`/campaigns/${campaignId}`)
                    });
                  } catch (e: any) {
                    console.error(e);
                    toast.error("Failed to submit.", {
                      id: submissionToast,
                      description: e.message || "Please check the URL and try again."
                    });
                  }
                }}
                className="rounded-l-none rounded-r-md"
              >
                Submit
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-24 pb-32">
        {campaign && (
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold mb-2">Submit to {campaign.title}</h1>
            <p className="text-lg text-muted-foreground">Select one of your eligible posts to submit.</p>
          </div>
        )}

        {loading ? renderSkeletons() : (posts.length > 0 ? renderContentSelector() : renderFallback())}
        
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-4 border-t">
          <div className="container flex justify-end">
            <Button onClick={handleSubmit} disabled={!selectedPost || loading} size="lg">
              Submit Selected Content
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
