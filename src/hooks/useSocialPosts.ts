import { useState, useCallback } from 'react';
import { Platform, SocialPost } from '@/types';
import { mockLinkedInPosts, mockTikTokPosts } from '@/data/mockData';
import { supabase } from '@/integrations/supabase/client';

export function useSocialPosts() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async (options: { platform?: Platform; socialAccountId?: string } = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const { platform, socialAccountId } = options;

      // Fetch real posts from user's OAuth account when account is provided
      if (platform && socialAccountId) {
        console.debug('calling fetch-user-posts', { platform, socialAccountId });
        const { data, error: fnError } = await supabase.functions.invoke('fetch-user-posts', {
          body: { platform, socialAccountId },
        });
        console.debug('fetch-user-posts result', { data, fnError });

        if (!fnError && data?.posts && Array.isArray(data.posts)) {
          const parsed = (data.posts as unknown[]).map((p: Record<string, unknown>) => ({
            ...p,
            createdAt: p.createdAt ? new Date(p.createdAt as string) : new Date(),
          })) as SocialPost[];
          parsed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setPosts(parsed);
          return;
        }
        // If API fails (e.g. token expired, no videos), fall back to mock for better UX
        if (data?.error) {
          console.warn('fetch-user-posts:', data.error);
        }
      }

      // Mock / fallback: use local mock data
      await new Promise(resolve => setTimeout(resolve, 600));

      let fetchedPosts: SocialPost[] = [];
      if (!platform || platform === 'linkedin') {
        fetchedPosts = [...fetchedPosts, ...mockLinkedInPosts];
      }
      if (!platform || platform === 'tiktok') {
        fetchedPosts = [...fetchedPosts, ...mockTikTokPosts];
      }

      fetchedPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setPosts(fetchedPosts);
    } catch {
      setError('Failed to fetch posts.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { posts, isLoading, error, fetchPosts };
}
