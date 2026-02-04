import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
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
  
  const [showManual, setShowManual] = useState(!contentFetcher.content || contentFetcher.content.length === 0);

  useEffect(() => {
    if (contentFetcher.content && contentFetcher.content.length > 0) {
        setShowManual(false);
    }
  }, [contentFetcher.content]);

  const hasContent = contentFetcher.content && contentFetcher.content.length > 0;

  const handleSubmit = async () => {
    let contentUrl = manualUrl;

    if (!showManual && selectedContentId) {
      const selectedPost = contentFetcher.content.find(p => p.id === selectedContentId);
      contentUrl = selectedPost?.url;
    }

    if (!contentUrl) {
      toast.error('Please select a post or enter a URL.');
      return;
    }

    setIsSubmitting(true);
    const submissionToast = toast.loading('Submitting your post...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const res = await fetch(
        `${supabaseUrl}/functions/v1/submit-content`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "authorization": `Bearer ${session.access_token}`,
            "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({
            campaign_id: campaignId,
            content_url: contentUrl,
            platform: platform,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }

      const data = await res.json();

      if (data.error) throw new Error(data.error);

      toast.success('Submission successful!', {
        id: submissionToast,
        description: 'Your content will now be tracked.',
      });
      
      onNewSubmission(data);

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
