
import { useState } from "react";
import { useParams } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import CreatorContentFetcher from "@/components/content/CreatorContentFetcher";
import { useToast } from "@/components/ui/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Submission() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleManualSubmit = async () => {
    if (!manualUrl) {
      toast({ variant: "destructive", title: "URL is empty", description: "Please provide a URL to submit." });
      return;
    }
    await handleSubmit(true);
  }

  const handlePickerSubmit = async () => {
    if (!selectedPost) {
      toast({ variant: "destructive", title: "No post selected", description: "Please select a post to submit." });
      return;
    }
    await handleSubmit(false);
  }

  const handleSubmit = async (isManual: boolean) => {
    setIsSubmitting(true);

    if (!campaignId) {
      toast({ variant: "destructive", title: "Error", description: "Campaign ID is missing." });
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

      toast({
        title: "Submission Successful!",
        description: "Your content has been submitted for review.",
      });
      setManualUrl("");
      setSelectedPost(null);

    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: err.message || "Please check your input and try again.",
      });
    } finally {
      setIsSubmitting(false);
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
          <h1 className="text-4xl font-bold mb-2">Submit to TikTok Dance Challenge</h1>
          <p className="text-xl text-muted-foreground">
            Select one of your eligible posts to submit.
          </p>
        </motion.div>

        <div className="w-full max-w-4xl space-y-8">
          <div>
            <CreatorContentFetcher onSelectPost={setSelectedPost} selectedPost={selectedPost} />
            <div className="mt-4 flex justify-end">
              <Button onClick={handlePickerSubmit} disabled={isSubmitting || !selectedPost}>
                {isSubmitting ? "Submitting..." : "Submit Selected Post"}
              </Button>
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Can't find your post?</AccordionTrigger>
              <AccordionContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  If your content doesn\'t appear automatically, you can submit the public URL manually.
                </p>
                <div className="flex w-full items-center space-x-2">
                  <Input
                    type="url"
                    placeholder="https://www.linkedin.com/posts/yokesh-v-2b293527b_r"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <Button onClick={handleManualSubmit} disabled={isSubmitting || !manualUrl}>
                    {isSubmitting ? "..." : "Submit"}
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </main>
    </div>
  );
}
