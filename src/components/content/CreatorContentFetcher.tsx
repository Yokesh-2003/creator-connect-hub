import { ReactNode, useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';

export interface ContentFetcherState {
  content: any[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

interface CreatorContentFetcherProps {
  platform: 'tiktok' | 'linkedin';
  children: (state: ContentFetcherState) => ReactNode;
}

export default function CreatorContentFetcher({ platform, children }: CreatorContentFetcherProps) {
  const { user } = useAuth();
  const [content, setContent] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = useCallback(async () => {
    if (!user) {
      setError("User not authenticated.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('fetch-user-posts', {
        body: { platform },
      });

      if (functionError) throw new Error(functionError.message);

      // Validate the response shape as per instructions
      if (data && Array.isArray(data.posts)) {
        setContent(data.posts);
      } else {
        console.warn('Invalid response shape from fetch-user-posts', data);
        setContent([]);
        throw new Error("Failed to fetch content. The API returned an unexpected format.");
      }

    } catch (e: any) {
      setError(e.message || "An unexpected error occurred while fetching your content.");
      setContent([]);
    } finally {
      setIsLoading(false);
    }
  }, [user, platform]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return <>{children({ content, isLoading, error, refetch: fetchContent })}</>;
}
