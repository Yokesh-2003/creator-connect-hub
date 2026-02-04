import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface SubmitBarProps {
  campaignId: string;
  platform: 'tiktok' | 'linkedin';
  onNewSubmission: (submission: any) => void;
}

export default function SubmitBar({ campaignId, platform, onNewSubmission }: SubmitBarProps) {
  const [manualUrl, setManualUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const contentUrl = manualUrl.trim();

    if (!contentUrl) {
      toast.error('Please enter a URL.');
      return;
    }

    setIsSubmitting(true);
    const submissionToast = toast.loading('Submitting your post...');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('You must be logged in');
      }

      const { data, error } = await supabase.functions.invoke(
        'submit-content',
        {
          body: {
            campaign_id: campaignId,
            content_url: contentUrl,
            platform,
          },
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Submission successful!', {
        id: submissionToast,
      });

      onNewSubmission(data);
      setManualUrl('');

    } catch (e: any) {
      toast.error('Submission Failed', {
        id: submissionToast,
        description: e.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-card rounded-lg shadow">
        <div className="mb-2 text-sm text-muted-foreground">
            {`Submit your ${platform} post URL manually:`}
        </div>

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
    </div>
  );
}
