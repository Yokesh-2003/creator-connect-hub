import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { submitContent } from "@/lib/services/submissions";
import { PostFetcher } from "@/components/social/PostFetcher";
import { Navbar } from "@/components/layout/Navbar";
import type { SocialPost } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowLeft, Link2 } from "lucide-react";
import { FaTiktok, FaLinkedin } from "react-icons/fa";

export const SubmissionForm = ({
  onSubmissionComplete,
}: {
  onSubmissionComplete?: () => void;
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<{ id: string; title: string; platform: string } | null>(null);
  const [socialAccounts, setSocialAccounts] = useState<{ id: string; display_name?: string; username?: string; platform: string }[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }
    if (id && user) {
      loadCampaignAndAccounts();
    }
  }, [id, user, authLoading, navigate]);

  const loadCampaignAndAccounts = async () => {
    if (!id || !user) return;
    setPageLoading(true);
    try {
      const { data: campaignData } = await supabase
        .from("campaigns")
        .select("id, title, platform")
        .eq("id", id)
        .single();
      setCampaign(campaignData ?? null);

      if (campaignData?.platform) {
        const { data: accounts } = await supabase
          .from("social_accounts")
          .select("id, display_name, username, platform")
          .eq("user_id", user.id)
          .eq("platform", campaignData.platform)
          .eq("is_connected", true);
        setSocialAccounts(accounts ?? []);
        if (accounts?.length) {
          setSelectedAccountId(accounts[0].id);
        }
      }
    } finally {
      setPageLoading(false);
    }
  };

  const handleSelectionChange = (posts: SocialPost[]) => {
    setSelectedPost(posts.length > 0 ? posts[0] : null);
  };

  const handleSubmit = async () => {
    if (!id || !selectedAccountId || !selectedPost?.mediaUrl) {
      toast({
        title: "Select a post",
        description: "Choose one post from your account to submit.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const contentType = campaign?.platform === "linkedin" ? "post" : "video";
      const result = await submitContent(
        id,
        selectedAccountId,
        selectedPost.mediaUrl,
        contentType
      );

      if (result.success) {
        toast({
          title: "Submitted!",
          description: "Your content has been submitted for review.",
        });
        setSelectedPost(null);
        onSubmissionComplete?.();
        navigate(`/campaigns/${id}`);
      } else {
        toast({
          title: "Submission failed",
          description: result.error ?? "Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container pt-24 pb-12 flex justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Campaign not found.</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate("/campaigns")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to campaigns
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const platformIcon = campaign.platform === "tiktok" ? FaTiktok : FaLinkedin;
  const PlatformIcon = platformIcon;

  if (socialAccounts.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container pt-24 pb-12 flex justify-center">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  campaign.platform === "tiktok" ? "bg-[#ff0050]/10" : "bg-[#0077b5]/10"
                }`}>
                  <PlatformIcon className={`w-5 h-5 ${campaign.platform === "tiktok" ? "text-[#ff0050]" : "text-[#0077b5]"}`} />
                </div>
                Connect your account
              </CardTitle>
              <CardDescription>
                To submit content for this campaign, connect your{" "}
                {campaign.platform === "tiktok" ? "TikTok" : "LinkedIn"} account. Then you can pick a post from your profile to submit.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full" onClick={() => navigate("/dashboard")}>
                <Link2 className="h-4 w-4 mr-2" />
                Go to Dashboard & connect
              </Button>
              <Button variant="outline" className="w-full" onClick={() => navigate(`/campaigns/${id}`)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to campaign
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-24 pb-12 max-w-4xl">
        <Button
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2"
          onClick={() => navigate(`/campaigns/${id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to campaign
        </Button>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Submit your content</CardTitle>
            <CardDescription>
              Choose a post from your {campaign.platform === "tiktok" ? "TikTok" : "LinkedIn"} account to submit for this campaign.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {socialAccounts.length > 1 && (
              <div className="space-y-2">
                <Label>Account</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                >
                  {socialAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.display_name || acc.username || acc.platform}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Your posts</Label>
              <p className="text-sm text-muted-foreground">
                Select one post from your account to submit.
              </p>
              <PostFetcher
                platforms={[campaign.platform as "linkedin" | "tiktok"]}
                onSelectionChange={handleSelectionChange}
                maxSelection={1}
              />
            </div>

            {selectedPost && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <span className="text-muted-foreground">Selected: </span>
                <span className="line-clamp-1">{selectedPost.content}</span>
              </div>
            )}

            <Button
              className="w-full"
              disabled={!selectedPost || submitting}
              onClick={handleSubmit}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit this post"
              )}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
