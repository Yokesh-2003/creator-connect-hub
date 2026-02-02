
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import CreatorContentFetcher from "@/components/content/CreatorContentFetcher";

export default function Submission() {
  const { campaignId } = useParams();
  const { user } = useAuth();
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if ((!selectedPost && !manualUrl) || !user || !campaignId) return;

    let submissionData = {
      campaign_id: campaignId,
      creator_id: user.id,
      content_url: "",
      content_platform: "",
      post_id: "",
    };

    if (selectedPost) {
      submissionData.content_url = selectedPost.url;
      submissionData.content_platform = selectedPost.platform;
      submissionData.post_id = selectedPost.id;
    } else {
      submissionData.content_url = manualUrl;
      // Basic validation for platform
      if (manualUrl.includes("tiktok.com")) {
        submissionData.content_platform = "tiktok";
      } else if (manualUrl.includes("linkedin.com")) {
        submissionData.content_platform = "linkedin";
      } else {
        setError("Invalid URL. Please submit a TikTok or LinkedIn URL.");
        return;
      }
      // We will need to fetch the post ID from the URL on the backend
    }

    try {
      const { error } = await supabase.from("submissions").insert([submissionData]);
      if (error) throw error;
      // Redirect to a success page or dashboard
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-24 pb-12 flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-4xl font-bold mb-2">Submit Your Content</h1>
          <p className="text-xl text-muted-foreground">
            Select a post to submit for this campaign, or submit a URL manually.
          </p>
        </motion.div>

        <div className="w-full max-w-4xl">
          <Tabs defaultValue="select">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="select">Select from your content</TabsTrigger>
              <TabsTrigger value="manual">Submit manually</TabsTrigger>
            </TabsList>
            <TabsContent value="select">
              <CreatorContentFetcher onSelectPost={setSelectedPost} />
            </TabsContent>
            <TabsContent value="manual">
              <div className="flex flex-col gap-4">
                <Input
                  type="url"
                  placeholder="Enter TikTok or LinkedIn post URL"
                  value={manualUrl}
                  onChange={(e) => setManualUrl(e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {error && <p className="text-red-500">{error}</p>}

        <div className="mt-8 w-full max-w-4xl flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={(!selectedPost && !manualUrl)}
          >
            Submit
          </Button>
        </div>
      </main>
    </div>
  );
}
