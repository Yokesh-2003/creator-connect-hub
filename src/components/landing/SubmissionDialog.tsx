import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Eye, Heart, MessageCircle, Share2, User, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContentInfo {
  username: string | null;
  displayName: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  contentId: string | null;
  thumbnail: string | null;
}

interface SubmissionDialogProps {
  campaignId: string;
  platform: 'tiktok' | 'linkedin';
  socialAccounts: any[];
  onSuccess: () => void;
}

export function SubmissionDialog({ campaignId, platform, socialAccounts, onSuccess }: SubmissionDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(socialAccounts[0]?.id || '');
  const [contentUrl, setContentUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [contentInfo, setContentInfo] = useState<ContentInfo | null>(null);

  const handleFetchInfo = async () => {
    if (!contentUrl.trim()) return;

    setFetching(true);
    setContentInfo(null);

    try {
      const account = socialAccounts.find(a => a.id === selectedAccount);
      
      const { data, error } = await supabase.functions.invoke('fetch-content-info', {
        body: { contentUrl, platform, accessToken: account?.access_token },
      });

      if (data?.success) {
        setContentInfo(data.data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      toast({ title: 'Submitted successfully!' });
      setOpen(false);
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Join Campaign</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Your Content</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Select Account</Label>
            <select
              className="w-full mt-2 px-3 py-2 border rounded-md"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
            >
              {socialAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.display_name || account.username}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label>Content URL</Label>
            <div className="flex gap-2 mt-2">
              <Input
                type="url"
                placeholder="Paste your content URL..."
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
              />
              <Button variant="outline" onClick={handleFetchInfo} disabled={fetching}>
                {fetching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Fetch'}
              </Button>
            </div>
          </div>

          {contentInfo && (
            <Card className="bg-primary/5">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2 text-primary">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Content Found!</span>
                </div>

                {contentInfo.displayName && (
                  <div className="flex items-center gap-3">
                    {contentInfo.thumbnail && (
                      <img src={contentInfo.thumbnail} className="w-12 h-12 rounded-lg object-cover" />
                    )}
                    <p className="font-semibold">{contentInfo.displayName}</p>
                  </div>
                )}

                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-2 bg-background rounded-lg">
                    <Eye className="w-4 h-4 mx-auto mb-1" />
                    <p className="font-bold">{contentInfo.views.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Views</p>
                  </div>
                  <div className="text-center p-2 bg-background rounded-lg">
                    <Heart className="w-4 h-4 mx-auto mb-1 text-red-500" />
                    <p className="font-bold">{contentInfo.likes.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Likes</p>
                  </div>
                  <div className="text-center p-2 bg-background rounded-lg">
                    <MessageCircle className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                    <p className="font-bold">{contentInfo.comments.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Comments</p>
                  </div>
                  <div className="text-center p-2 bg-background rounded-lg">
                    <Share2 className="w-4 h-4 mx-auto mb-1 text-green-500" />
                    <p className="font-bold">{contentInfo.shares.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Shares</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Button onClick={handleSubmit} disabled={submitting} className="w-full">
            {submitting ? 'Submitting...' : 'Submit to Campaign'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
