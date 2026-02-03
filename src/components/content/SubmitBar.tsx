
'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SubmitBarProps {
  campaignId: string;
  onNewSubmission: () => void;
}

export default function SubmitBar({ campaignId, onNewSubmission }: SubmitBarProps) {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!url) {
      toast.error('Please enter a URL to submit.');
      return;
    }

    setIsSubmitting(true);
    const submissionToast = toast.loading('Submitting your link...');

    try {
      const { error } = await supabase.functions.invoke('submit-content', {
        body: {
          campaign_id: campaignId,
          post_url: url,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Submission successful!', {
        id: submissionToast,
        description: 'Your submission is being processed and will appear shortly.',
      });
      setUrl('');
      onNewSubmission(); // Trigger a refresh of the campaign data
    } catch (e: any) {
      toast.error('Submission Failed', {
        id: submissionToast,
        description: e.message || 'Please check the URL and try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full max-w-2xl mx-auto items-center space-x-2 mb-4">
      <Input
        type="url"
        placeholder="Paste your TikTok or LinkedIn post URL here to enter the campaign"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        disabled={isSubmitting}
        className="bg-slate-800 border-slate-700 text-white"
      />
      <Button onClick={handleSubmit} disabled={isSubmitting || !url}>
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </Button>
    </div>
  );
}
