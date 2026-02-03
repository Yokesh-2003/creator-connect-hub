import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContentFetcherState } from './CreatorContentFetcher';

interface SubmitBarProps {
  campaignId: string;
  platform: 'tiktok' | 'linkedin';
  onNewSubmission: (submission: any) => void;
  contentFetcher: ContentFetcherState;
}

export default function SubmitBar({ campaignId, platform, onNewSubmission, contentFetcher }: SubmitBarProps) {
  const [manualUrl, setManualUrl] = useState('');
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Determine initial state based on fetched content, but allow user to override
  const [showManual, setShowManual] = useState(!contentFetcher.content || contentFetcher.content.length === 0);

  const supabase = createBrowserClient(
    import.meta.env.VITE_SUPABASE_URL!,
    import.meta.env.VITE_SUPABASE_ANON_KEY!
  );

  // When content loads, if manual entry isn't already shown, switch to selector
  useEffect(() => {
    if (contentFetcher.content && contentFetcher.content.length > 0) {
        setShowManual(false);
    }
  }, [contentFetcher.content]);

  const hasContent = contentFetcher.content && contentFetcher.content.length > 0;

  const handleSubmit = async () => {
    let postUrl = manualUrl;

    if (!showManual && selectedContentId) {
      const selectedPost = contentFetcher.content.find(p => p.id === selectedContentId);
      postUrl = selectedPost?.url; // Use `url` as per the spec for submission
    }

    if (!postUrl) {
      toast.error('Please select a post or enter a URL.');
      return;
    }

    setIsSubmitting(true);
    const submissionToast = toast.loading('Submitting your post...');

    try {
      const { data, error } = await supabase.functions.invoke('submit-content', {
        body: {
          campaign_id: campaignId,
          post_url: postUrl,
        },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      toast.success('Submission successful!', {
        id: submissionToast,
        description: 'Your content will appear in the feed.',
      });
      
      // E. After Submission: Emit the new submission object
      onNewSubmission(data.submission);

      // Reset form state
      setManualUrl('');
      setSelectedContentId(null);
      if(hasContent) setShowManual(false);

    } catch (e: any) {
      toast.error('Submission Failed', {
        id: submissionToast,
        description: e.message || 'Please check the URL and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContentSelector = () => (
    <div className="flex w-full items-center space-x-2">
      <Select onValueChange={setSelectedContentId} value={selectedContentId || ''}>
        <SelectTrigger className="flex-1">
          <SelectValue placeholder="Select one of your eligible posts..." />
        </SelectTrigger>
        <SelectContent>
          {contentFetcher.content.map((post: any) => (
            <SelectItem key={post.id} value={post.id}>
              {post.title || 'Untitled Post'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleSubmit} disabled={isSubmitting || !selectedContentId}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </Button>
    </div>
  );

  const renderManualInput = () => (
    <div className="flex w-full items-center space-x-2">
        <Input
          type="url"
          placeholder={`Paste your ${platform} post URL here...`}
          value={manualUrl}
          onChange={(e) => setManualUrl(e.target.value)}
          disabled={isSubmitting}
        />
        <Button onClick={handleSubmit} disabled={isSubmitting || !manualUrl}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
    </div>
  );

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-card rounded-lg shadow">
        <div className="mb-2 text-sm text-muted-foreground">
            {contentFetcher.isLoading
            ? 'Loading your content...'
            : hasContent && !showManual
            ? 'Select a post to submit:'
            : `Submit your ${platform} post URL manually:`}
        </div>

        {hasContent && !showManual ? renderContentSelector() : renderManualInput()}

        {contentFetcher.error && !hasContent && (
            <p className="text-red-500 text-xs mt-2">
            Could not load your content. {contentFetcher.error} You can submit a URL manually.
            </p>
        )}

        <div className="text-center mt-2 flex justify-center items-center gap-4">
            {hasContent && (
                <Button variant="link" className="text-xs" onClick={() => setShowManual(!showManual)}>
                    {showManual ? 'Select from your posts' : 'Or submit a URL manually'}
                </Button>
            )}
            <Button variant="link" className="text-xs" onClick={contentFetcher.refetch}>
                Refresh content
            </Button>
        </div>
    </div>
  );
}
