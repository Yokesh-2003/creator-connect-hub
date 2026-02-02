
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FaTiktok, FaLinkedin } from "react-icons/fa";
import { CheckCircle, Eye } from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
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
        const errorMessage = "Failed to fetch your content automatically. You can submit a URL manually.";
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
          thumbnail_url: selectedPost.thumbnail,
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

  const PlatformIcon = campaign?.platform && platformIcons[campaign.platform];
  
  const formatViews = (views: number) => {
    if (views >= 1000000) return \`\${(views / 1000000).toFixed(1)}M\`;
    if (views >= 1000) return \`\${(views / 1000).toFixed(1)}K\`;
    return views;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Toaster position="top-center" />
      <main className="container pt-24 pb-32">
        {loading ? (
          <p className="text-center">Fetching your content...</p>
        ) : !campaign ? (
            <div className="text-center">
                <p className="text-red-500 mb-4">{error}</p>
            </div>
        ) : (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold mb-2">Submit to {campaign.title}</h1>
              <p className="text-lg text-muted-foreground">Select a post to submit for this campaign.</p>
            </div>
            
            {posts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {posts.map((post) => {
                  const isSelected = selectedPost?.id === post.id;
                  const PostPlatformIcon = platformIcons[post.platform];
                  return (
                    <div
                      key={post.id}
                      className={`relative rounded-lg overflow-hidden cursor-pointer transition-all duration-300 ${isSelected ? 'ring-4 ring-primary' : 'ring-0'}`}
                      onClick={() => setSelectedPost(post)}
                    >
                      <div className="aspect-[9/16] bg-muted">
                        <img src={post.thumbnail} alt="Post thumbnail" className="w-full h-full object-cover" />
                      </div>
                      {isSelected && (
                          <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1 z-10">
                            <CheckCircle className="w-5 h-5" />
                          </div>
                      )}
                      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-black/60 to-transparent"></div>
                       <div className="absolute top-2 left-2">
                         {PostPlatformIcon && <PostPlatformIcon className="w-5 h-5 text-white" />}
                       </div>
                      <div className="absolute bottom-2 left-2 flex items-center gap-2 text-white text-sm">
                        <Eye className="w-4 h-4"/>
                        <span>{formatViews(post.views)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-muted-foreground">{error || "No eligible content was found automatically."}</p>
                 <Accordion type="single" collapsible className="w-full max-w-md mx-auto mt-4">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Can't find your post?</AccordionTrigger>
                    <AccordionContent>
                       <p className="text-muted-foreground mb-4 text-sm">You can submit a public post URL manually.</p>
                       <div className="flex justify-center">
                           <input
                           type="text"
                           value={manualUrl}
                           onChange={(e) => setManualUrl(e.target.value)}
                           placeholder={\`Enter \${campaign.platform} post URL\`\}
                           className="p-2 border rounded-l-md sm:w-1/2 md:w-full"
                           />
                           <Button onClick={handleManualSubmit} className="rounded-r-md">
                             Submit
                           </Button>
                       </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}
            
            <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-4 border-t">
               <div className="container flex justify-end">
                  <Button onClick={handleSubmit} disabled={!selectedPost} size="lg">
                    Submit Selected Content
                  </Button>
               </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
