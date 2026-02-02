import { useState, useEffect } from 'react';
import { Platform, SocialPost } from '@/types';
import { useSocialPosts } from '@/hooks/useSocialPosts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RefreshCw, Loader2, Heart, MessageCircle, Eye, Play } from 'lucide-react';

interface PostFetcherProps {
  platforms: Platform[];
  onSelectionChange: (selectedPosts: SocialPost[]) => void;
  maxSelection?: number;
  /** When set, fetches real posts from this OAuth-connected account */
  socialAccountId?: string;
}

export function PostFetcher({ platforms, onSelectionChange, maxSelection = 5, socialAccountId }: PostFetcherProps) {
  const { posts, isLoading, fetchPosts } = useSocialPosts();
  const [selectedPosts, setSelectedPosts] = useState<SocialPost[]>([]);
  const [activeTab, setActiveTab] = useState<Platform | 'all'>('all');
  const platformToFetch = activeTab === 'all' ? platforms[0] : activeTab;

  useEffect(() => {
    fetchPosts({
      platform: platformToFetch,
      socialAccountId: socialAccountId ?? undefined,
    });
  }, [socialAccountId, platformToFetch]);

  useEffect(() => {
    onSelectionChange(selectedPosts);
  }, [selectedPosts, onSelectionChange]);

  const handleSelectPost = (post: SocialPost) => {
    setSelectedPosts(prev => {
      const isSelected = prev.some(p => p.id === post.id);
      if (isSelected) return prev.filter(p => p.id !== post.id);
      if (prev.length >= maxSelection) return prev;
      return [...prev, post];
    });
  };

  const [previewPost, setPreviewPost] = useState<SocialPost | null>(null);

  const handleUseVideo = (post: SocialPost) => {
    // Ensure the post has a mediaUrl before selecting
    if (!post.mediaUrl) return;
    setSelectedPosts([post]);
    onSelectionChange([post]);
  };

  const handleTabChange = (tab: Platform | 'all') => {
    setActiveTab(tab);
    fetchPosts({ platform: tab === 'all' ? undefined : tab });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Select Content ({selectedPosts.length}/{maxSelection})</h3>
        <Button variant="outline" size="sm" onClick={() => fetchPosts({ platform: platformToFetch, socialAccountId })}
            disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Platform Tabs */}
      <div className="flex gap-2">
        {['all', ...platforms].map(tab => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTabChange(tab as Platform | 'all')}
          >
            {tab === 'all' ? 'All' : tab === 'linkedin' ? 'LinkedIn' : 'TikTok'}
          </Button>
        ))}
      </div>

      {/* Posts Grid */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {posts.map(post => {
            const isSelected = selectedPosts.some(p => p.id === post.id);
            return (
              <Card
                key={post.id}
                className={`cursor-pointer overflow-hidden transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}
                onClick={() => handleSelectPost(post)}
              >
                <div className="relative aspect-video bg-muted">
                  {post.thumbnail && <img src={post.thumbnail} alt="" className="w-full h-full object-cover" />}
                  {post.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <button
                        className="p-2 rounded-full bg-black/50 hover:bg-black/60"
                        onClick={(e) => { e.stopPropagation(); setPreviewPost(post); }}
                        aria-label="Play preview"
                      >
                        <Play className="h-8 w-8 text-white drop-shadow-lg" />
                      </button>
                    </div>
                  )}
                  <Badge className="absolute top-2 left-2">{post.platform}</Badge>
                  <div className="absolute bottom-2 right-2">
                    <Checkbox checked={isSelected} />
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm line-clamp-2">{post.content}</p>
                  {post.mediaUrl && (
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <a
                        href={post.mediaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary underline hover:text-primary/80"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Open video
                      </a>
                      <button
                        className="ml-auto text-xs px-2 py-1 rounded bg-primary text-white hover:opacity-90"
                        onClick={(e) => { e.stopPropagation(); handleUseVideo(post); }}
                      >
                        Use this video
                      </button>
                    </div>
                  )}
                  <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{post.likes}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{post.comments}</span>
                    {post.views != null && <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{post.views}</span>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Inline preview modal */}
      {previewPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewPost(null)}
        >
          <div className="w-full max-w-3xl bg-background rounded shadow-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-video bg-black">
              {previewPost.mediaUrl ? (
                // Use native video element when a direct media URL is available
                <video src={previewPost.mediaUrl} controls className="w-full h-full object-contain bg-black" />
              ) : (
                previewPost.thumbnail && <img src={previewPost.thumbnail} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="p-3 flex items-center justify-between">
              <div className="text-sm line-clamp-2">{previewPost.content}</div>
              <div className="flex items-center gap-2">
                <button className="text-sm px-3 py-1 rounded bg-primary text-white" onClick={() => { handleUseVideo(previewPost); setPreviewPost(null); }}>
                  Use this video
                </button>
                <button className="text-sm px-3 py-1 rounded border" onClick={() => setPreviewPost(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
