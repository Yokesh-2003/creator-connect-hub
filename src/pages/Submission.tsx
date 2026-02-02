
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FaTiktok, FaLinkedin } from "react-icons/fa";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { SocialPost } from "@/types";
import { PostFetcher } from "@/components/social/PostFetcher";

export default function Submission() {
  const { campaignId } = useParams();
  const { user } = useAuth();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchPosts();
    }
  }, [user]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-user-posts");
      if (error) throw error;
      setPosts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedPost || !user || !campaignId) return;

    try {
      const { error } = await supabase.from("submissions").insert([
        {
          campaign_id: campaignId,
          user_id: user.id,
          platform: selectedPost.platform,
          platform_content_id: selectedPost.id,
          content_url: selectedPost.url,
          initial_metrics: selectedPost.metrics,
        },
      ]);
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
            Select a post to submit for this campaign.
          </p>
        </motion.div>

        {loading && <p>Loading your posts...</p>}
        {error && <p className="text-red-500">{error}</p>}

        <div className="w-full max-w-4xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Card
                key={post.id}
                className={`cursor-pointer ${
                  selectedPost?.id === post.id ? "border-primary" : ""
                }`}
                onClick={() => setSelectedPost(post)}
              >
                <CardContent className="p-4">
                  <PostFetcher post={post} />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mt-8 w-full max-w-4xl flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!selectedPost || loading}
          >
            Submit
          </Button>
        </div>
      </main>
    </div>
  );
}
