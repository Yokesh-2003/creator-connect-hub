import { useState, useCallback } from 'react';
import { Platform, SocialPost } from '@/types';
import { mockLinkedInPosts, mockTikTokPosts } from '@/data/mockData';

export function useSocialPosts() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = useCallback(async (options: { platform?: Platform } = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate API call

      let fetchedPosts: SocialPost[] = [];
      if (!options.platform || options.platform === 'linkedin') {
        fetchedPosts = [...fetchedPosts, ...mockLinkedInPosts];
      }
      if (!options.platform || options.platform === 'tiktok') {
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
