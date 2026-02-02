
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { FaTiktok, FaLinkedin } from "react-icons/fa";
import { CheckCircle, Eye, Heart } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
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
  const { toast } = useToast();
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

      const { data: campaignData, error: campaignError } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

      if (campaignError || !campaignData) {
        toast({ variant: "destructive", title: "Error", description: "Campaign not found." });
        setError("Campaign not found.");
        setLoading(false);
        return;
      }
      setCampaign(campaignData);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Authentication required", description: "Please log in to submit content.", variant: "destructive" });
        navigate(`/auth?redirect=/campaigns/${campaignId}/submit`);
        return;
      }
      
      try {
        const { data, error: functionError } = await supabase.functions.invoke("fetch-user-posts");

        if (functionError) throw functionError;
        
        // Ensure data is an array before setting state
        if (Array.isArray(data)) {
          setPosts(data);
        } else {
          // Handle cases where the function returns a non-array payload
          console.warn("fetch-user-posts did not return an array:", data);
          setPosts([]);
        }

      } catch (e: any) {
        console.error("Content fetch error:", e);
        setError("Failed to fetch your content automatically.");
        toast({
            variant: "destructive",
            title: "Could not fetch content",
            description: "We couldn't load your posts automatically. You can try submitting a URL manually.",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignAndPosts();
  }, [campaignId, navigate, toast]);

  const handleSubmit = async () => {
    if (!selectedPost || !campaignId) {
      toast({ variant: "destructive", title: "Error", description: "Please select a post to submit." });
      return;
    }

    const submissionToast = toast({ title: "Submitting your post..." });

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

      submissionToast.update({ id: submissionToast.id, title: "Submission successful!", description: "Redirecting you to the dashboard." });
      navigate(`/dashboard`);

    } catch (e: any) {
      submissionToast.update({ id: submissionToast.id, variant: "destructive", title: "Submission Failed", description: e.message || "An unexpected error occurred." });
    }
  };
  
    const handleManualSubmit = async () => {
    if (!manualUrl) {
      toast({title: "Please enter a URL.", variant: "destructive"});
      return;
    }
    const submissionToast = toast({ title: "Submitting your link..." });
    try {
      const { error } = await supabase.functions.invoke('submit-content', { body: { campaign_id: campaignId, url: manualUrl } });
      if (error) throw error;
      submissionToast.update({id: submissionToast.id, title: "Submission successful!", description: "Your manual submission was received."});
      navigate(`/dashboard`);
    } catch (e: any) {
      submissionToast.update({id: submissionToast.id, title: "Failed to submit.", description: "Please check the URL and try again.", variant: "destructive"});
    }
  };

  const renderSkeletons = () => (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="aspect-[9/16] animate-pulse rounded-lg bg-muted"></div>
      ))}
    </div>
  );

  const renderContentSelector = () => (
    <div className="grid grid-cols-2 gap-4 pb-24 md:grid-cols-3 lg:grid-cols-4">
      {posts.map((post) => {
        const isSelected = selectedPost?.content_id === post.content_id;
        const PostPlatformIcon = platformIcons[post.platform];
        return (
          <div
            key={post.content_id}
            className={`relative cursor-pointer overflow-hidden rounded-lg transition-all duration-200 ${isSelected ? 'ring-4 ring-primary' : 'ring-0 ring-transparent'}`}
            onClick={() => setSelectedPost(post)}
          >
            <div className="aspect-[9/16] bg-muted">
              {post.thumbnail_url && <img src={post.thumbnail_url} alt="Post thumbnail" className="h-full w-full object-cover" />}
            </div>
            {isSelected && (
              <div className="absolute right-2 top-2 z-10 rounded-full bg-primary p-1 text-primary-foreground">
                <CheckCircle className="h-5 w-5" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
            {PostPlatformIcon && (
              <div className="absolute left-2 top-2 rounded-full bg-black/30 p-1.5 backdrop-blur-sm">
                <PostPlatformIcon className="h-4 w-4 text-white" />
              </div>
            )}
            <div className="absolute bottom-2 left-2 right-2 text-sm text-white">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{formatViews(post.views)}</span>
                {post.likes != null && (
                  <>
                    <span className="mx-1">·</span>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
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
    <div className="mx-auto max-w-lg rounded-lg border-2 border-dashed border-muted bg-background p-8 text-center">
      <h3 className="text-lg font-semibold text-foreground">No Content Found</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {error || "We couldn’t find any eligible posts from your connected accounts."}
      </p>
      <Accordion type="single" collapsible className="mt-6 w-full">
        <AccordionItem value="manual-submit">
          <AccordionTrigger className="text-sm">Can’t find your post?</AccordionTrigger>
          <AccordionContent>
            <p className="mb-4 text-left text-sm text-muted-foreground">
              If your content doesn't appear automatically, you can submit the public URL manually.
            </p>
            <div className="flex">
              <input
                type="text"
                value={manualUrl}
                onChange={(e) => setManualUrl(e.target.value)}
                placeholder={`Enter ${campaign?.platform || 'post'} URL`}
                className="w-full rounded-l-md border bg-transparent p-2 text-sm"
              />
              <Button onClick={handleManualSubmit} className="rounded-l-none rounded-r-md">
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
      <Toaster />
      <main className="container pb-32 pt-24">
        {campaign && (
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold">Submit to {campaign.title}</h1>
            <p className="text-lg text-muted-foreground">Select one of your eligible posts to submit.</p>
          </div>
        )}

        {loading ? renderSkeletons() : (posts.length > 0 ? renderContentSelector() : renderFallback())}
        
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background/80 p-4 backdrop-blur-sm">
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
