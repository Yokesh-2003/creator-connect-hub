import { useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createBrowserClient } from '@supabase/ssr';
import { toast } from 'sonner';

export interface ContentFetcherState {
  isLoading: boolean;
  error: string | null;
  content: any[];
  refetch: () => void;
}

interface CreatorContentFetcherProps {
  platform: 'tiktok' | 'linkedin';
  children: (fetcher: ContentFetcherState) => ReactNode;
}

const CreatorContentFetcher = ({ platform, children }: CreatorContentFetcherProps) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<any[]>([]);

  const supabase = createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
  );

  const fetchContent = useCallback(async () => {
    if (!user || !platform) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('fetch-user-posts', {
        body: { platform },
      });

      if (functionError) throw functionError;
      if (data.error) throw new Error(data.error);

      setContent(data.posts || []);
    } catch (e: any) {
      console.error("Failed to fetch creator content:", e);
      setError('Could not fetch your content. You can submit a URL manually.');
      toast.error(e.message || 'Failed to fetch content.');
    } finally {
      setIsLoading(false);
    }
  }, [user, platform, supabase]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  return <>{children({ isLoading, error, content, refetch: fetchContent })}</>;
};

export default CreatorContentFetcher;
