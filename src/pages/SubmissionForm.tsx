import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export const SubmissionForm = ({
  onSubmissionComplete,
}: {
  onSubmissionComplete?: () => void;
}) => {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [submitterName, setSubmitterName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const detectPlatform = (url: string): "linkedin" | "tiktok" | null => {
    if (url.includes("linkedin.com")) return "linkedin";
    if (url.includes("tiktok.com")) return "tiktok";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const platform = detectPlatform(url);
    if (!platform) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid LinkedIn or TikTok URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    let scrapeData: { viewCount?: number; likeCount?: number } | null = null;

    try {
      // 🔹 Try scraping metrics (optional)
      try {
        const { data, error } = await supabase.functions.invoke(
          "scrape-metrics",
          {
            body: { url },
          }
        );

        if (!error) {
          scrapeData = data;
        }
      } catch {
        console.warn("Scraping failed, continuing without metrics");
      }

      // ✅ INSERT INTO DATABASE (CORRECT COLUMN NAMES)
      const { error: insertError } = await supabase
        .from("submissions")
        .insert({
          url, 
          platform,
          submitter_name: submitterName,
          view_count: scrapeData?.viewCount ?? 0,
          like_count: scrapeData?.likeCount ?? 0,
        });

      if (insertError) {
        throw insertError;
      }

      toast({
        title: "Success!",
        description: "Your submission has been added to the leaderboard",
      });

      setUrl("");
      setSubmitterName("");
      onSubmissionComplete?.();
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Submit Your Content</CardTitle>
        <CardDescription>
          Share your LinkedIn or TikTok post to join the leaderboard
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Your Name</Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={submitterName}
              onChange={(e) => setSubmitterName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">Post URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://linkedin.com/posts/... or https://tiktok.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
