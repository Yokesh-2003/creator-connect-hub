import { useState, useCallback } from 'react';
import { Platform, SocialPost } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export function useSocialPosts() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async (options: { platform: Platform; socialAccountId: string }) => {
    if (!options.platform || !options.socialAccountId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke('fetch-user-posts', {
        body: {
          platform: options.platform,
          socialAccountId: options.socialAccountId,
        },
      });

      if (funcError) throw new Error(funcError.message);

      const fetchedPosts = data.posts.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
      }));

      setPosts(fetchedPosts);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch posts.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { posts, isLoading, error, fetchPosts };
}