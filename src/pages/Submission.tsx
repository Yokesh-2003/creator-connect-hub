
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import CreatorContentFetcher from "@/components/content/CreatorContentFetcher";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import VideoPlayer from "@/components/content/VideoPlayer";

export default function Submission() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleManualSubmit = async () => {
    if (!manualUrl) {
      toast.error("URL is empty", { description: "Please provide a URL to submit." });
      return;
    }
    await handleSubmit(true);
  }

  const handlePickerSubmit = async () => {
    if (!selectedPost) {
      toast.error("No post selected", { description: "Please select a post to submit." });
      return;
    }
    await handleSubmit(false);
  }

  const handleSubmit = async (isManual: boolean) => {
    setIsSubmitting(true);
    const submissionToast = toast.loading("Submitting your content...");

    if (!campaignId) {
      toast.error("Error", { id: submissionToast, description: "Campaign ID is missing." });
      setIsSubmitting(false);
      return;
    }

    try {
      let body;
      if (isManual) {
        body = {
          campaign_id: campaignId,
          post_url: manualUrl
        };
      } else { // is Picker
        body = {
          campaign_id: campaignId,
          post_id: selectedPost.id,
          social_account_id: selectedPost.social_account_id,
          content_platform: selectedPost.platform
        };
      }

      const { error } = await supabase.functions.invoke('submit-content', {
        body,
      });

      if (error) {
        const errorMessage = error.context?.error_message || "An unexpected error occurred.";
        throw new Error(errorMessage);
      }

      toast.success("Submission Successful!", {
        id: submissionToast,
        description: "Your content has been submitted for review.",
      });
      setManualUrl("");
      setSelectedPost(null);

    } catch (err: any) {
      toast.error("Submission Failed", {
        id: submissionToast,
        description: err.message || "Please check your input and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const videoUrl = selectedPost?.content_url || manualUrl;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container pt-24 pb-12">
        <div className="w-full max-w-6xl mx-auto space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 text-center"
          >
            <h1 className="text-4xl font-bold mb-2">Submit to TikTok Dance Challenge</h1>
            <p className="text-xl text-muted-foreground">
              Select a post to preview and submit.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            <div className="flex items-center justify-center">
                <VideoPlayer url={videoUrl} />
            </div>

            <div className="space-y-6">
              <div>
                  <h3 className="text-lg font-semibold mb-3">Select from your content</h3>
                  <CreatorContentFetcher onSelectPost={setSelectedPost} selectedPost={selectedPost} />
                  <div className="mt-4 flex justify-end">
                      <Button onClick={handlePickerSubmit} disabled={isSubmitting || !selectedPost}>
                          {isSubmitting ? "Submitting..." : "Submit Selected Content"}
                      </Button>
                  </div>
              </div>

              <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                      <AccordionTrigger>Can’t find your post?</AccordionTrigger>
                      <AccordionContent>
                          <p className="mb-4 text-sm text-muted-foreground">
                              If your content doesn't appear, you can submit the URL manually. The preview will update.
                          </p>
                          <div className="flex w-full items-center space-x-2">
                              <Input
                                  type="url"
                                  placeholder="Enter TikTok or LinkedIn URL..."
                                  value={manualUrl}
                                  onChange={(e) => setManualUrl(e.target.value)}
                                  disabled={isSubmitting}
                              />
                              <Button onClick={handleManualSubmit} disabled={isSubmitting || !manualUrl}>
                                  {isSubmitting ? "..." : "Submit URL"}
                              </Button>
                          </div>
                      </AccordionContent>
                  </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
